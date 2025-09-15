/**
 * @file M5Atom_Pulse_Web_Server_StaticIP.ino
 * @brief M5ATOM
 * LiteをWi-Fi(iPhoneテザリング)に接続し、固定IPアドレスのWebサーバーとしてパルスセンサーの値を公開するスケッチ
 * * [機能]
 * 1. M5ATOMをiPhoneのテザリングに接続します（固定IPアドレス: 172.20.10.10）。
 * 2. Webサーバーを起動し、IPアドレスに直接アクセスすると、心拍数をJSON形式で返します。
 * * [安定化のための修正]
 * - 移動平均フィルターを追加し、値の急な変動を抑えてグラフを滑らかにします。
 * - センサーからデータが来ない場合も、最後に取得した値を維持して出力し続けます。
 * - 心拍を検知するたびに、本体のLEDが赤く点灯します。
 * * [接続]
 * - パルスセンサー: G22(RX), G19(TX)
 */

#include <M5Atom.h>
#include <WebServer.h>
#include <WiFi.h>

// --- Wi-Fi設定 (ご自身の環境に合わせて変更してください) ---
const char* ssid = "iPhoneU";       // iPhoneのSSID
const char* password = "12345678";  // iPhoneのパスワード

// --- グローバル変数 ---
WebServer server(80);     // Webサーバー (ポート80)
#define DELIMITCODE 0x0a  // パルスセンサーの区切り文字

volatile int plsrate = 0;  // センサーから直接計算した最新の心拍数(bpm)

// --- 移動平均フィルターのための設定 ---
const int NUM_SAMPLES = 5;         // 平均化するサンプル数 (5個のデータの平均を取る)
int readings[NUM_SAMPLES];         // 過去の心拍数データを保存する配列
int readIndex = 0;                 // 配列の現在の位置を示すインデックス
long total = 0;                    // データの合計値
volatile int averagedPlsrate = 0;  // 平均化された心拍数(bpm)

// --- LED点灯制御のための変数 ---
bool isLedOn = false;            // LEDが現在点灯しているかどうかの状態
unsigned long ledOnTime = 0;     // LEDが点灯した時刻
const long ledOnDuration = 100;  // LEDの点灯時間 (100ミリ秒)

/**
 * @brief 起動時に一度だけ実行される初期設定
 */
void setup() {
    // M5ATOMの初期化 (USBシリアルとLEDを有効化)
    M5.begin(true, false, true);
    M5.dis.drawpix(0, 0xffa500);  // 起動中はLEDをオレンジに点灯

    // USBシリアル通信の開始
    Serial.begin(115200);
    Serial.println("M5ATOM Simple Pulse Web Server Booting...");

    // パルスセンサー用のシリアルポート(Serial2)を初期化 (RX=22, TX=19)
    Serial2.begin(19200, SERIAL_8N1, 22, 19);
    Serial2.print("@OF30");
    Serial2.write(0x0a);
    Serial2.print("@RG2");
    Serial2.write(0x0a);
    Serial2.print("@MD11");
    Serial2.write(0x0a);

    // 移動平均用の配列を0で初期化します
    for (int i = 0; i < NUM_SAMPLES; i++) {
        readings[i] = 0;
    }

    // Wi-Fi接続
    connectToWiFi();

    // Webサーバーのハンドラ設定
    server.on("/", handleData);
    server.onNotFound(handleNotFound);

    server.begin();
    Serial.println("HTTP server started");
    M5.dis.drawpix(0, 0x00ff00);  // 準備完了でLEDを緑に点灯
}

/**
 * @brief メインループ (繰り返し実行)
 */
void loop() {
    server.handleClient();

    // パルスセンサーからのシリアルデータを受信・処理する
    if (Serial2.available() > 0) {
        String strInput = Serial2.readStringUntil(DELIMITCODE);
        Serial.print("Data from Pulse Sensor: ");
        Serial.println(strInput);

        if (strInput.length() > 0 && strInput[0] == '#') {
            // --- ここから追加 ---
            // 心拍を検知したのでLEDを赤く点灯させ、状態を記録
            M5.dis.drawpix(0, 0xff0000);  // LEDを赤色に点灯
            isLedOn = true;
            ledOnTime = millis();
            // --- ここまで追加 ---

            strInput[0] = ' ';
            if (strInput[1] != '-') {
                int val = strInput.toInt();
                if (val > 0) {
                    plsrate = 60000 / val;

                    // --- 移動平均の計算 ---
                    total = total - readings[readIndex];  // 配列内の一番古いデータを合計から引く
                    readings[readIndex] = plsrate;        // 新しいデータを配列に保存する
                    total = total + readings[readIndex];  // 新しいデータを合計に足す
                    readIndex = readIndex + 1;            // 配列のインデックスを次に進める

                    // インデックスが配列の最後に到達したら、最初に戻す
                    if (readIndex >= NUM_SAMPLES) {
                        readIndex = 0;
                    }

                    // 平均値を計算して、Webで表示する用の変数に格納する
                    averagedPlsrate = total / NUM_SAMPLES;
                }
            }
        }
    }

    // --- ここから追加 ---
    // LEDが点灯しており、かつ指定した時間が経過していたらLEDを消灯する
    if (isLedOn && (millis() - ledOnTime > ledOnDuration)) {
        M5.dis.drawpix(0, 0x000000);  // LEDを消灯
        isLedOn = false;
    }
    // --- ここまで追加 ---

    // M5Atomの内部状態を更新（ボタン入力などに必要）
    M5.update();
}

/**
 * @brief Wi-Fiに接続する
 */
void connectToWiFi() {
    IPAddress local_IP(172, 20, 10, 10);
    IPAddress gateway(172, 20, 10, 1);
    IPAddress subnet(255, 255, 255, 240);

    Serial.println("Configuring static IP address for iPhone Hotspot...");
    if (!WiFi.config(local_IP, gateway, subnet)) {
        Serial.println("STA Failed to configure");
    }

    Serial.print("Connecting to ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        if (millis() - startTime > 20000) {
            Serial.println("\nFailed to connect to WiFi. Restarting...");
            M5.dis.drawpix(0, 0xff0000);
            delay(1000);
            ESP.restart();
        }
    }

    Serial.println("\nWiFi connected!");
    Serial.println("========================================");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println("Access the IP address directly to get sensor readings.");
    Serial.println("========================================");
}

/**
 * @brief ルートパス ("/") にアクセスがあったときにJSONを返す
 */
void handleData() {
    String json = "{\n";
    // 生の心拍数ではなく、平均化された安定した値を返す
    json += "  \"pulse_rate_bpm\": " + String(averagedPlsrate) + "\n";
    json += "}";

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    server.sendHeader("Pragma", "no-cache");
    server.sendHeader("Expires", "-1");

    server.send(200, "application/json", json);
}

/**
 * @brief 定義されていないパスにアクセスがあった場合
 */
void handleNotFound() {
    server.send(404, "text/plain", "404: Not Found.");
}
