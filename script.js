/**
 * バイオメトリック監視システム（動画連動版 + HP機能）
 * 動画の再生時間に完全連動して心拍数と呼吸数を監視・表示
 * HP機能追加版
 */
class BiometricMonitor {
  constructor() {
    // データ配列
    this.heartRateData = [];
    this.breathingData = [];
    this.timeLabels = [];

    // 設定定数
    this.MAX_DATA_POINTS = 30;
    this.UPDATE_INTERVAL = 1000; // ms
    this.BIG_BREATHING_STEPS = 3;

    // 監視状態
    this.isMonitoring = false;
    this.monitoringInterval = null;

    // チャート
    this.heartRateChart = null;
    this.breathingChart = null;

    // 動画連動状態
    this.videoState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0
    };

    // 呼吸制御
    this.breathingState = {
      bigInhaleActive: false,
      bigExhaleActive: false,
      bigInhaleStep: 0,
      bigExhaleStep: 0
    };

    // グラフ設定
    this.graphLimits = {
      heartRate: { min: 50, max: 120 },
      breathing: { min: 0, max: 30, inhaleMax: 28, exhaleMin: 5 }
    };

    // ハートHP関連
    this.maxHP = 80;
    this.currentHP = 68; // 初期HP
    this.hearts = [];

    this.init();
  }

  /**
   * HP機能の初期化
   */
  initHeartHP() {
    // ハートHPコンテナを作成
    const heartsContainer = document.createElement('div');
    heartsContainer.className = 'hearts-hp-container';
    heartsContainer.innerHTML = `
      <div class="hearts-display" id="heartsDisplay"></div>
      </div>
    `;

    // チャートセクションの最初に挿入
    const chartsSection = document.querySelector('.charts-section');
    if (chartsSection) {
      chartsSection.insertBefore(heartsContainer, chartsSection.firstChild);
    }

    // 8個のハートを作成
    const heartsDisplay = document.getElementById('heartsDisplay');
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.innerHTML = '♥';
      heartsDisplay.appendChild(heart);
      this.hearts.push(heart);
    }

    this.updateHeartDisplay();
  }

  /**
   * ハート表示の更新
   */
  updateHeartDisplay() {
    const totalHearts = 8;
    const hpPerHeart = this.maxHP / totalHearts; // 各ハートが担当するHP (10ずつ)

    this.hearts.forEach((heart, index) => {
      heart.className = 'heart'; // リセット

      // 各ハートの担当HP範囲を計算
      const heartMinHP = index * hpPerHeart;
      const heartMaxHP = (index + 1) * hpPerHeart;

      // このハートのHP範囲内での充填度を計算
      const heartHP = Math.min(this.currentHP - heartMinHP, hpPerHeart);
      const heartPercentage = heartHP / hpPerHeart;

      // 充填度に応じて色を決定
      if (heartPercentage >= 1.0) {
        heart.classList.add('heart-full');
      } else {
        heart.classList.add('heart-empty');
      }
    });

    // HP テキストを更新
    const hpElem = document.getElementById('currentHP');
    if (hpElem) {
      hpElem.textContent = Math.round(this.currentHP);
    }
  }

  /**
   * HPを更新するメソッド（心拍数に基づいて）
   */
  updateHP(heartRate) {
    // 心拍数に基づいてHPを調整
    if (heartRate >= 60 && heartRate <= 100) {
      // 正常範囲：HPを少し回復
      this.currentHP = Math.min(this.maxHP, this.currentHP + 0.5);
    } else if (heartRate > 100) {
      // 高い心拍数：HPを少し減少
      this.currentHP = Math.max(0, this.currentHP - 0.3);
    } else {
      // 低い心拍数：HPを少し減少
      this.currentHP = Math.max(0, this.currentHP - 0.2);
    }

    // ランダムな要素も追加（より動的に）
    const randomChange = (Math.random() - 0.5) * 0.1;
    this.currentHP = Math.max(0, Math.min(this.maxHP, this.currentHP + randomChange));

    this.updateHeartDisplay();
  }

  /**
   * HPを特定の値に設定するメソッド
   * @param {number} newHP - 設定したい新しいHPの値
   */
  setHP(newHP) {
    // HPが最大値を超えたり、0未満になったりしないようにclamp関数で制御
    this.currentHP = this.clamp(newHP, 0, this.maxHP);
    console.log(`HPが指定により ${this.currentHP} に設定されました。`);
    // 表示を即座に更新
    this.updateHeartDisplay();
  }

  /**
   * 初期化処理
   */
  init() {
    try {
      // HP表示の初期化を先に行う
      this.initHeartHP();

      this.initCharts();
      this.initEventListeners();
      this.updateStatusDisplay();
    } catch (error) {
      console.error('初期化エラー:', error);
      this.showError('システムの初期化に失敗しました');
    }
  }

  /**
   * チャートの初期化
   */
  initCharts() {
    const heartRateCanvas = document.getElementById('heartRateChart');
    const breathingCanvas = document.getElementById('breathingChart');

    if (!heartRateCanvas || !breathingCanvas) {
      throw new Error('チャート要素が見つかりません');
    }

    this.heartRateChart = new Chart(heartRateCanvas.getContext('2d'), {
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
      options: this.createChartOptions(
        this.graphLimits.heartRate.min,
        this.graphLimits.heartRate.max
      )
    });

    this.breathingChart = new Chart(breathingCanvas.getContext('2d'), {
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
      options: this.createChartOptions(
        this.graphLimits.breathing.min,
        this.graphLimits.breathing.max
      )
    });
  }

  /**
   * チャートオプションの生成
   * @param {number} min - Y軸最小値
   * @param {number} max - Y軸最大値
   * @returns {Object} チャートオプション
   */
  createChartOptions(min, max) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: min,
          max: max,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: '#666' },
          font: { size: 8 }
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: '#666' },
          font: { size: 8 },
        }
      },
      animation: { duration: 100 }
    };
  }

  /**
   * イベントリスナーの初期化
   */
  initEventListeners() {
    // クリーンアップ処理
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // ページ可視性の変更（タブ切り替えなど）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isMonitoring) {
        console.log('ページが非表示になりました - 監視を一時停止');
        this.pauseMonitoring();
      } else if (!document.hidden && this.videoState.isPlaying) {
        console.log('ページが表示されました - 監視を再開');
        this.resumeMonitoring();
      }
    });
  }

  /**
   * 状態表示の更新
   */
  updateStatusDisplay() {
    const statusElem = document.getElementById('monitoring-status');
    if (!statusElem) return;

    const video = document.getElementById('fixedVideo');
    const videoTime = video ? this.formatTime(video.currentTime) : '--:--';
    const videoDuration = video ? this.formatTime(video.duration || 0) : '--:--';

    let status = '';
    if (this.isMonitoring) {
      status = `🔴 監視中 (${videoTime} / ${videoDuration})`;
    } else if (this.videoState.isPlaying) {
      status = `⏸️ 一時停止中 (${videoTime} / ${videoDuration})`;
    } else {
      status = `⏹️ 待機中 (${videoTime} / ${videoDuration})`;
    }

    statusElem.textContent = status;
  }

  /**
   * 時間のフォーマット
   * @param {number} seconds - 秒数
   * @returns {string} mm:ss形式の文字列
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * バイオメトリックデータの生成
   * @returns {Object} 生成されたデータ
   */
  generateBiometricData() {
    const currentTime = Date.now();
    const videoTime = this.videoState.currentTime;

    const heartRate = this.generateHeartRate(currentTime, videoTime);
    const breathingRate = this.generateBreathingRate(currentTime, videoTime);

    return {
      heartRate: this.clamp(heartRate, this.graphLimits.heartRate.min, this.graphLimits.heartRate.max),
      breathingRate: this.clamp(breathingRate, this.graphLimits.breathing.min, this.graphLimits.breathing.max),
      timestamp: currentTime,
      videoTime: videoTime
    };
  }

  /**
   * 心拍数の生成（動画時間に連動）
   * @param {number} currentTime - 現在時刻
   * @param {number} videoTime - 動画時間
   * @returns {number} 心拍数
   */
  generateHeartRate(currentTime, videoTime) {
    const baseHeartRate = 72;
    let heartRateVariation = 15;

    // 動画時間に応じて心拍数の基準を調整
    let videoInfluence = 0;
    if (videoTime > 30) { // 30秒後から徐々に心拍数上昇（興奮）
      videoInfluence = Math.min((videoTime - 30) / 60, 1) * 10; // 最大10BPM上昇
    }

    return Math.round(
      baseHeartRate + videoInfluence +
      Math.sin(currentTime / 5000) * heartRateVariation +
      Math.sin(videoTime * 2) * 5 + // 動画時間に基づく変動
      (Math.random() - 0.5) * 8
    );
  }

  /**
   * 呼吸数の生成（動画時間に連動）
   * @param {number} currentTime - 現在時刻
   * @param {number} videoTime - 動画時間
   * @returns {number} 呼吸数
   */
  generateBreathingRate(currentTime, videoTime) {
    const { breathingState, BIG_BREATHING_STEPS, graphLimits } = this;

    // 大きな吸気中
    if (breathingState.bigInhaleActive) {
      breathingState.bigInhaleStep++;
      const progress = breathingState.bigInhaleStep / BIG_BREATHING_STEPS;
      const rate = 16 + Math.round((graphLimits.breathing.inhaleMax - 16) * progress);

      if (breathingState.bigInhaleStep >= BIG_BREATHING_STEPS) {
        breathingState.bigInhaleActive = false;
        breathingState.bigInhaleStep = 0;
      }

      return rate;
    }

    // 大きな呼気中
    if (breathingState.bigExhaleActive) {
      breathingState.bigExhaleStep++;
      const progress = breathingState.bigExhaleStep / BIG_BREATHING_STEPS;
      const rate = 16 - Math.round((16 - graphLimits.breathing.exhaleMin) * progress);

      if (breathingState.bigExhaleStep >= BIG_BREATHING_STEPS) {
        breathingState.bigExhaleActive = false;
        breathingState.bigExhaleStep = 0;
      }

      return rate;
    }

    // 通常の呼吸（動画時間に連動）
    const baseBreathingRate = 16;
    let breathingVariation = 3;

    // 動画進行に応じて呼吸パターンを変更
    let videoBreathingInfluence = 0;
    if (videoTime > 60) { // 1分後から呼吸が少し速くなる
      videoBreathingInfluence = Math.sin(videoTime / 10) * 2;
    }

    return Math.round(
      baseBreathingRate + videoBreathingInfluence +
      Math.sin(currentTime / 8000) * breathingVariation +
      Math.cos(videoTime * 1.5) * 2 + // 動画時間に基づく変動
      (Math.random() - 0.5) * 2
    );
  }

  /**
   * 値を指定範囲内に制限
   * @param {number} value - 値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @returns {number} 制限された値
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 現在時刻の文字列取得（動画時間付き）
   * @returns {string} 時刻文字列
   */
  getCurrentTimeString() {
    const realTime = new Date().toLocaleTimeString('ja-JP', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const videoTime = this.formatTime(this.videoState.currentTime);
    return `${realTime} (${videoTime})`;
  }

  /**
   * チャートの更新
   */
  updateCharts() {
    try {
      const data = this.generateBiometricData();
      const timeLabel = this.getCurrentTimeString();

      // video要素を取得
      const video = document.getElementById('fixedVideo');

      // データ追加
      this.heartRateData.push(data.heartRate);
      this.breathingData.push(data.breathingRate);
      this.timeLabels.push(this.formatTime(video ? video.currentTime : 0));

      // 古いデータの削除
      if (this.heartRateData.length > this.MAX_DATA_POINTS) {
        this.heartRateData.shift();
        this.breathingData.shift();
        this.timeLabels.shift();
      }

      // チャート更新
      if (this.heartRateChart) this.heartRateChart.update('none');
      if (this.breathingChart) this.breathingChart.update('none');

      this.updateCurrentValues(data);
      this.updateStatusDisplay();

      // HPを更新
      this.updateHP(data.heartRate);
    } catch (error) {
      console.error('チャート更新エラー:', error);
    }
  }

  /**
   * 現在値の表示更新
   * @param {Object} data - バイオメトリックデータ
   */
  updateCurrentValues(data) {
    const heartRateElem = document.getElementById('currentHeartRate');
    const breathingElem = document.getElementById('currentBreathing');

    if (heartRateElem) heartRateElem.textContent = data.heartRate;
    if (breathingElem) breathingElem.textContent = data.breathingRate;
  }

  /**
   * 監視開始（動画再生に連動）
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateCharts();
    }, this.UPDATE_INTERVAL);

    console.log(`監視を開始しました (動画時間: ${this.formatTime(this.videoState.currentTime)})`);
    this.updateStatusDisplay();
  }

  /**
   * 監視停止（動画停止に連動）
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log(`監視を停止しました (動画時間: ${this.formatTime(this.videoState.currentTime)})`);
    this.updateStatusDisplay();
  }

  /**
   * 監視一時停止
   */
  pauseMonitoring() {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
  }

  /**
   * 監視再開
   */
  resumeMonitoring() {
    if (!this.isMonitoring && this.videoState.isPlaying) {
      this.startMonitoring();
    }
  }

  /**
   * 動画状態の更新
   * @param {HTMLVideoElement} video - 動画要素
   */
  updateVideoState(video) {
    this.videoState = {
      isPlaying: !video.paused && !video.ended,
      currentTime: video.currentTime || 0,
      duration: video.duration || 0
    };
  }

  /**
   * 大きな吸気開始
   */
  startBigInhale() {
    console.log(`大きな吸気を開始 (動画時間: ${this.formatTime(this.videoState.currentTime)})`);
    this.breathingState.bigInhaleActive = true;
    this.breathingState.bigInhaleStep = 0;
  }

  /**
   * 大きな呼気開始
   */
  startBigExhale() {
    console.log(`大きな呼気を開始 (動画時間: ${this.formatTime(this.videoState.currentTime)})`);
    this.breathingState.bigExhaleActive = true;
    this.breathingState.bigExhaleStep = 0;
  }

  /**
   * エラー表示
   * @param {string} message - エラーメッセージ
   */
  showError(message) {
    const errorElem = document.getElementById('error-message');
    if (errorElem) {
      errorElem.textContent = message;
      errorElem.style.display = 'block';
    } else {
      console.error(message);
    }
  }

  /**
   * クリーンアップ処理
   */
  cleanup() {
    console.log('クリーンアップ処理を実行');
    this.stopMonitoring();

    // 動画URLのクリーンアップ
    const video = document.querySelector('video');
    if (video?.src && video.src.startsWith('blob:')) {
      URL.revokeObjectURL(video.src);
    }
  }
}

/**
 * カウントダウンタイマーの開始
 * @param {Date} targetDate - 目標日時
 */
function startCountdown(targetDate) {
  const timerElem = document.getElementById('countdown-timer');
  if (!timerElem) {
    console.error('カウントダウン要素が見つかりません');
    return;
  }

  let intervalId;

  function updateTimer() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      timerElem.textContent = 'カウントダウン終了';
      if (intervalId) clearInterval(intervalId);
      return;
    }

    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    timerElem.textContent = `起きる時間まであと ${minutes}:${seconds}`;
  }

  updateTimer();
  intervalId = setInterval(updateTimer, 1000);

  return intervalId;
}

/**
 * 動画イベントハンドラーの設定
 * @param {BiometricMonitor} monitor - バイオメトリックモニター
 * @param {Object} config - 設定
 */
function setupVideoHandlers(monitor, config) {
  const video = document.getElementById('fixedVideo');

  if (!video) {
    console.warn('動画要素が見つかりません');
    return;
  }

  let state = {
    messageShown: false,
    bigInhaleTriggered: false,
    bigExhaleTriggered: false,
    nextHpEventIndex: 0 // 次に処理するHPイベントのインデックス
  };

  // 動画準備完了
  video.addEventListener('loadedmetadata', () => {
    console.log(`動画読み込み完了: ${monitor.formatTime(video.duration)}`);
    monitor.updateVideoState(video);
  });

  // 動画再生開始
  video.addEventListener('play', () => {
    console.log(`動画再生開始 (時間: ${monitor.formatTime(video.currentTime)})`);
    monitor.updateVideoState(video);
    monitor.startMonitoring();
  });

  // 動画一時停止
  video.addEventListener('pause', () => {
    console.log(`動画一時停止 (時間: ${monitor.formatTime(video.currentTime)})`);
    monitor.updateVideoState(video);
    monitor.stopMonitoring();
  });

  // 動画終了
  video.addEventListener('ended', () => {
    console.log('動画終了');
    monitor.updateVideoState(video);
    monitor.stopMonitoring();
  });

  // 時間更新イベント（より頻繁な更新）
  video.addEventListener('timeupdate', () => {
    const currentTime = video.currentTime;
    monitor.updateVideoState(video);

    // HPイベントの処理ロジック
    if (config.hpEvents && state.nextHpEventIndex < config.hpEvents.length) {
      const nextEvent = config.hpEvents[state.nextHpEventIndex];

      // イベントの指定時間を過ぎたらHPを更新
      if (currentTime >= nextEvent.time) {
        monitor.setHP(nextEvent.value);
        state.nextHpEventIndex++; // 次のイベントへインデックスを進める
      }
    }

    // 大きな吸気トリガー
    if (!state.bigInhaleTriggered && currentTime >= config.bigInhaleTime) {
      monitor.startBigInhale();
      state.bigInhaleTriggered = true;
    }

    // 大きな呼気トリガー
    if (!state.bigExhaleTriggered && currentTime >= config.bigExhaleTime) {
      monitor.startBigExhale();
      state.bigExhaleTriggered = true;
    }
  });

  function createNotification(title, message, timestamp = "今", iconUrl = null) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = 'notification-container';

    const iconHTML = iconUrl
      ? `<img class="notification-icon" src="${iconUrl}" alt="icon">`
      : `<div class="notification-icon"></div>`;

    notification.innerHTML = `
    ${iconHTML}
    <div class="notification-body">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <div class="notification-timestamp">${timestamp}</div>
  `;
    container.appendChild(notification);

    // 5秒後に自動で消える
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // 例：ページ表示時に1件通知
  createNotification("ログイン通知", "お父さんがこの夢にログインしました。", "1分前", "father.png");

  // シーク時の状態リセット
  video.addEventListener('seeked', () => {
    const currentTime = video.currentTime;
    console.log(`動画シーク: ${monitor.formatTime(currentTime)}`);

    monitor.updateVideoState(video);

    // シークに対応したHPの再設定ロジック
    if (config.hpEvents) {
      let lastApplicableHP = null;
      let nextIndex = 0;
      for (let i = 0; i < config.hpEvents.length; i++) {
        const event = config.hpEvents[i];
        if (currentTime >= event.time) {
          lastApplicableHP = event.value;
          nextIndex = i + 1;
        } else {
          break; // 配列は時間順なので、ここでループを抜ける
        }
      }
      // 該当する過去のイベントがあればHPをその値に設定
      if (lastApplicableHP !== null) {
        monitor.setHP(lastApplicableHP);
      }
      // 次のイベントインデックスを更新
      state.nextHpEventIndex = nextIndex;
    }

    if (currentTime < config.bigInhaleTime) {
      state.bigInhaleTriggered = false;
    }

    if (currentTime < config.bigExhaleTime) {
      state.bigExhaleTriggered = false;
    }

    // 再生中の場合は監視を再開
    if (!video.paused && !video.ended) {
      monitor.startMonitoring();
    }
  });

  // 動画エラー処理
  video.addEventListener('error', (e) => {
    console.error('動画エラー:', e);
    monitor.stopMonitoring();
    monitor.showError('動画の読み込みに失敗しました');
  });

  // 動画の読み込み待機
  video.addEventListener('waiting', () => {
    console.log('動画バッファリング中...');
  });

  // 動画の読み込み再開
  video.addEventListener('playing', () => {
    console.log('動画バッファリング完了 - 再生再開');
  });
}

// DOMコンテンツ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  try {
    // バイオメトリックモニターの初期化
    window.biometricMonitor = new BiometricMonitor();

    // カウントダウン開始（10分後）
    const endTime = new Date(Date.now() + 10 * 60 * 1000);
    startCountdown(endTime);

    // 設定
    const config = {
      bigInhaleTime: 3,     // 大きな吸気の時間（秒）
      bigExhaleTime: 25,    // 大きな呼気の時間（秒）
      dangerTime: 2,        // 危険時間（秒）
      dangerDuration: 2,    // 危険時間の持続時間（秒）
      hpEvents: [
        // ここを動画に合わせて変える
        { time: 5, value: 40 },  // 5秒後にHPを40に
        { time: 15, value: 60 }, // 15秒後にHPを60に回復
        { time: 28, value: 30 }  // 28秒後にHPを30に
      ]
    };

    // 動画イベントハンドラーの設定
    setupVideoHandlers(window.biometricMonitor, config);

    console.log('動画連動バイオメトリックシステム（HP機能付き）の初期化が完了しました');

    // 初期状態表示の更新
    setTimeout(() => {
      window.biometricMonitor.updateStatusDisplay();
    }, 100);

  } catch (error) {
    console.error('初期化中にエラーが発生しました:', error);
  }
});
