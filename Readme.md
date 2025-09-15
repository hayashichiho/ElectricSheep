# ゆにこーんず

動画を見ながらリアルタイムで生体データ（心拍数・呼吸数）を監視できるWebアプリケーションです。

## ✨ 機能

- 📹 **動画再生**: 各種動画フォーマット対応（MP4、WebM、AVI等）
- ❤️ **心拍数監視**: リアルタイムグラフ表示（50-120 BPM）
- 🫁 **呼吸数監視**: リアルタイムグラフ表示（10-25 RPM）
- 📊 **データ可視化**: Chart.jsによる美しいグラフ
- 📱 **レスポンシブ対応**: モバイル・タブレット対応
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
├── index.html          # メインHTMLファイル
├── styles.css          # スタイルシート
├── script.js           # JavaScriptメインファイル
├── package.json        # npm設定
├── README.md           # このファイル
└── .gitignore          # Git除外設定
```

## 🛠️ 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm start` | 開発サーバー起動（live-server使用） |
| `npm run dev` | 開発モード（ファイル監視付き） |
| `npm run serve` | Python HTTP サーバーで起動 |

## 📖 使用方法

1. **動画選択**: 「動画を選択」ボタンで動画ファイルをアップロード
2. **監視開始**: 「監視開始」ボタンでリアルタイムデータ監視を開始
3. **データ表示**: 右側のグラフで心拍数・呼吸数を確認
4. **監視停止**: 「監視停止」ボタンで監視を終了

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
