/**
 * バイオメトリクス監視アプリケーション
 * 動画再生と生体データ（心拍数・呼吸数）のリアルタイム監視
 */
class BiometricMonitor {
  constructor() {
    // データ配列
    this.heartRateData = [];
    this.breathingData = [];
    this.timeLabels = [];

    // 設定
    this.maxDataPoints = 30;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.updateInterval = 1000; // ミリ秒

    // Chart.jsインスタンス
    this.heartRateChart = null;
    this.breathingChart = null;

    // 初期化
    this.init();
  }

  /**
   * アプリケーションの初期化
   */
  init() {
    this.initCharts();
    this.initEventListeners();
    this.initUI();
  }

  /**
   * Chart.jsチャートの初期化
   */
  initCharts() {
    this.createHeartRateChart();
    this.createBreathingChart();
  }

  /**
   * 心拍数チャートの作成
   */
  createHeartRateChart() {
    const ctx = document.getElementById('heartRateChart').getContext('2d');

    this.heartRateChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.timeLabels,
        datasets: [{
          label: '心拍数 (BPM)',
          data: this.heartRateData,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#e74c3c',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: this.getChartOptions(50, 120)
    });
  }

  /**
   * 呼吸数チャートの作成
   */
  createBreathingChart() {
    const ctx = document.getElementById('breathingChart').getContext('2d');

    this.breathingChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.timeLabels,
        datasets: [{
          label: '呼吸数 (RPM)',
          data: this.breathingData,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: this.getChartOptions(10, 25)
    });
  }

  /**
   * チャート共通オプションの取得
   * @param {number} min - Y軸最小値
   * @param {number} max - Y軸最大値
   * @returns {Object} チャートオプション
   */
  getChartOptions(min, max) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: min,
          max: max,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#666'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#666'
          }
        }
      },
      animation: {
        duration: 200
      }
    };
  }

  /**
   * イベントリスナーの設定
   */
  initEventListeners() {
    // 動画ファイル選択
    document.getElementById('videoInput').addEventListener('change', (e) => {
      this.handleVideoUpload(e.target.files[0]);
    });

    // 監視開始ボタン
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startMonitoring();
    });

    // 監視停止ボタン
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopMonitoring();
    });

    // ページ離脱時の処理
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * UI初期化
   */
  initUI() {
    // 初期状態では停止ボタンを無効化
    document.getElementById('stopBtn').style.opacity = '0.6';
  }

  /**
   * 動画ファイルのアップロード処理
   * @param {File} file - 動画ファイル
   */
  handleVideoUpload(file) {
    if (!file) return;

    // ファイル形式チェック
    if (!file.type.startsWith('video/')) {
      alert('動画ファイルを選択してください。');
      return;
    }

    this.loadVideo(file);
  }

  /**
   * 動画の読み込み
   * @param {File} file - 動画ファイル
   */
  loadVideo(file) {
    const videoContainer = document.getElementById('videoContainer');
    const existingVideo = videoContainer.querySelector('video');

    // 既存の動画があれば削除
    if (existingVideo) {
      URL.revokeObjectURL(existingVideo.src);
      existingVideo.remove();
    }

    // 新しい動画要素を作成
    const video = document.createElement('video');
    video.controls = true;
    video.src = URL.createObjectURL(file);
    video.preload = 'metadata';

    // エラーハンドリング
    video.addEventListener('error', (e) => {
      console.error('動画読み込みエラー:', e);
      alert('動画の読み込みに失敗しました。');
    });

    // 動画読み込み完了時の処理
    video.addEventListener('loadedmetadata', () => {
      console.log('動画読み込み完了:', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    });

    videoContainer.innerHTML = '';
    videoContainer.appendChild(video);
  }

  /**
   * 疑似生体データの生成
   * @returns {Object} 生成されたデータ
   */
  generateBiometricData() {
    const currentTime = Date.now();

    // 心拍数（60-100 BPMの範囲で自然な変動）
    const baseHeartRate = 72;
    const heartRateVariation = 15;
    const heartRate = Math.round(
      baseHeartRate +
      Math.sin(currentTime / 5000) * heartRateVariation +
      (Math.random() - 0.5) * 8
    );

    // 呼吸数（12-20 RPMの範囲で自然な変動）
    const baseBreathingRate = 16;
    const breathingVariation = 3;
    const breathingRate = Math.round(
      baseBreathingRate +
      Math.sin(currentTime / 8000) * breathingVariation +
      (Math.random() - 0.5) * 2
    );

    return {
      heartRate: Math.max(50, Math.min(120, heartRate)),
      breathingRate: Math.max(10, Math.min(25, breathingRate)),
      timestamp: currentTime
    };
  }

  /**
   * 現在時刻の文字列取得
   * @returns {string} フォーマットされた時刻
   */
  getCurrentTimeString() {
    return new Date().toLocaleTimeString('ja-JP', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * チャートとUIの更新
   */
  updateCharts() {
    const data = this.generateBiometricData();
    const timeLabel = this.getCurrentTimeString();

    // データ配列に追加
    this.heartRateData.push(data.heartRate);
    this.breathingData.push(data.breathingRate);
    this.timeLabels.push(timeLabel);

    // 最大データポイント数を超えた場合、古いデータを削除
    if (this.heartRateData.length > this.maxDataPoints) {
      this.heartRateData.shift();
      this.breathingData.shift();
      this.timeLabels.shift();
    }

    // チャートを更新（アニメーションなし）
    this.heartRateChart.update('none');
    this.breathingChart.update('none');

    // 現在の値を表示
    this.updateCurrentValues(data);

    // ログ出力（デバッグ用）
    console.log(`更新: 心拍数=${data.heartRate}, 呼吸数=${data.breathingRate}`);
  }

  /**
   * 現在値の表示更新
   * @param {Object} data - 生体データ
   */
  updateCurrentValues(data) {
    document.getElementById('currentHeartRate').textContent = data.heartRate;
    document.getElementById('currentBreathing').textContent = data.breathingRate;
  }

  /**
   * 監視開始
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.warn('すでに監視中です。');
      return;
    }

    this.isMonitoring = true;
    this.updateButtonStates();

    // データ更新間隔でチャートを更新
    this.monitoringInterval = setInterval(() => {
      this.updateCharts();
    }, this.updateInterval);

    console.log('監視を開始しました。');
  }

  /**
   * 監視停止
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.warn('監視は開始されていません。');
      return;
    }

    this.isMonitoring = false;
    this.updateButtonStates();

    // インターバルをクリア
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('監視を停止しました。');
  }

  /**
   * ボタン状態の更新
   */
  updateButtonStates() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (this.isMonitoring) {
      startBtn.style.opacity = '0.6';
      stopBtn.style.opacity = '1';
    } else {
      startBtn.style.opacity = '1';
      stopBtn.style.opacity = '0.6';
    }
  }

  /**
   * データのクリア
   */
  clearData() {
    this.heartRateData.length = 0;
    this.breathingData.length = 0;
    this.timeLabels.length = 0;

    if (this.heartRateChart) {
      this.heartRateChart.update();
    }
    if (this.breathingChart) {
      this.breathingChart.update();
    }

    console.log('データをクリアしました。');
  }

  /**
   * リソースの解放
   */
  cleanup() {
    this.stopMonitoring();

    // 動画のObjectURLを解放
    const video = document.querySelector('video');
    if (video && video.src) {
      URL.revokeObjectURL(video.src);
    }

    console.log('リソースを解放しました。');
  }

  /**
   * 監視状態の取得
   * @returns {boolean} 監視中かどうか
   */
  isMonitoringActive() {
    return this.isMonitoring;
  }

  /**
   * 設定の更新
   * @param {Object} config - 設定オブジェクト
   */
  updateConfig(config) {
    if (config.maxDataPoints) {
      this.maxDataPoints = config.maxDataPoints;
    }
    if (config.updateInterval) {
      this.updateInterval = config.updateInterval;

      // 監視中なら再起動
      if (this.isMonitoring) {
        this.stopMonitoring();
        this.startMonitoring();
      }
    }

    console.log('設定を更新しました:', config);
  }
}

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('バイオメトリクス監視アプリを初期化中...');

  try {
    // グローバルインスタンスとして作成（デバッグ用）
    window.biometricMonitor = new BiometricMonitor();
    console.log('アプリケーションの初期化が完了しました。');
  } catch (error) {
    console.error('初期化エラー:', error);
    alert('アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
  }
});

/**
 * エラーハンドリング
 */
window.addEventListener('error', (event) => {
  console.error('JavaScriptエラー:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

/**
 * 未処理のPromise拒否をキャッチ
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('未処理のPromise拒否:', event.reason);
  event.preventDefault();
});
