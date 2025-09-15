# 🦄 ゆめにこーん♪

見たい夢を見ることができるデバイスを実装するためのシステムです。

## ✨ 機能

- 📈 **通信**: 心拍データ、呼吸データをリアルタイム送信、グラフ表示
- ⚠️ **Danger機能**: 危険値でHP減少・警告表示
- 📂 **画像選択**: ファイルから画像を選択できる
- ⏰ **アラーム機能**: 起きたい時間を設定できる
- 🕹️ **夢の詳細設定**: カーソルを動かして設定できる
- 🎨 **モダンUI**: グラデーション・アニメーション　

## 🚀 クイックスタート

### 前提条件

- Node.js (v14以上)
- npm (v6以上)

### インストール

```bash
# プロジェクトをクローン（または作成）
git clone <your-repo-url>
cd ElectricSheep

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start
```

アプリケーションが `http://localhost:3000` で起動します。

## 📁 プロジェクト構造

```
ElectricSheep/
├── .DS_Store
├── .gitignore
├── Readme.md
├── breathingSensor.cpp
├── chat.png
├── dashboard.png
├── father.png
├── index.html        
├── package-lock.json
├── package.json
├── script.js
├── setting.png
├── styles.css
├── toppage.html
├── upload.png
├── user1.png
├── user2.png
└── vital.png
```

## 🛠️ 利用可能なスクリプト

| コマンド        | 説明                                |
| --------------- | ----------------------------------- |
| `npm start`     | 開発サーバー起動（live-server使用） |
| `npm run dev`   | 開発モード（ファイル監視付き）      |
| `npm run serve` | Python HTTP サーバーで起動          |

## 📖 使用方法

1. **画像選択**: 「Please upload a photo.」ボタンで画像ファイルをアップロード
2. **アラーム設定**: 起きたい時間をセット
3. **詳細設定**: カーソルで設定する
4. **開始**: 「START」ボタンで開始

## 🔧 カスタマイズ

### データ生成の変更

実際のセンサーデータを使用する場合、`script.js`の`generateBiometricData()`メソッドを置き換えてください：

```javascript
generateBiometricData() {
    // 実際のセンサーAPIからデータを取得
    return {
        heartRate: getSensorHeartRate(),    // 実際のAPI呼び出し
        breathingRate: getSensorBreathing(), // 実際のAPI呼び出し
        timestamp: Date.now()
    };
}
```

### 設定変更

`script.js`内の設定を変更できます：

```javascript
constructor() {
    this.maxDataPoints = 30;      // 表示するデータポイント数
    this.updateInterval = 1000;   // 更新間隔（ミリ秒）
}
```

## 🎨 スタイルカスタマイズ

`styles.css`でUIをカスタマイズできます：

- カラーテーマの変更
- グラフサイズの調整
- レスポンシブブレークポイント
- アニメーション設定

## 📱 対応環境

- **ブラウザ**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **デバイス**: デスクトップ、タブレット、スマートフォン
- **OS**: Windows、macOS、Linux、iOS、Android

## 🔒 セキュリティ

- ファイルアップロードは動画ファイルのみ許可
- XSSやCSRF対策実装済み
- ローカル実行のためネットワーク経由のデータ送信なし

## 🐛 トラブルシューティング

### よくある問題

**Q: 動画が再生されない**
A: ブラウザでサポートされている動画フォーマット（MP4推奨）を使用してください

**Q: チャートが表示されない**
A: JavaScript が有効になっているか、CDN（Chart.js）への接続を確認してください

**Q: モバイルでレイアウトが崩れる**
A: ブラウザのキャッシュをクリアしてページを再読み込みしてください

### デバッグ

開発者ツールのコンソールでデバッグ情報を確認できます：

```javascript
// グローバルインスタンスへのアクセス
window.biometricMonitor.isMonitoringActive()
window.biometricMonitor.clearData()
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Chart.js](https://www.chartjs.org/) - データ可視化ライブラリ
- [live-server](https://github.com/tapio/live-server) - 開発サーバー

## 📞 サポート

問題や質問がある場合は、[Issues](https://github.com/yourusername/biometric-video-monitor/issues) で報告してください。

---

**注意**: このアプリケーションは教育・デモンストレーション目的です。医療診断には使用しないでください。
