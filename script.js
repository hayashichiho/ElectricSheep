class BiometricMonitor {
  constructor() {
    this.heartRateData = [];
    this.breathingData = [];
    this.timeLabels = [];
    this.maxDataPoints = 30;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.updateInterval = 1000;
    this.heartRateChart = null;
    this.breathingChart = null;
    this.nextBigInhale = false;
    this.nextBigExhale = false;
    this.bigInhaleActive = false;
    this.bigExhaleActive = false;
    this.bigInhaleStep = 0;
    this.bigExhaleStep = 0;
    this.bigBreathingStep = 2;
    this.graphMin = 0;
    this.graphMax = 30;
    this.inhaleMax = 28;
    this.exhaleMin = 5;
    this.init();
  }

  init() {
    this.initCharts();
    this.initEventListeners();
    this.initUI();
  }

  initCharts() {
    this.heartRateChart = new Chart(
      document.getElementById('heartRateChart').getContext('2d'),
      {
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
      }
    );
    this.breathingChart = new Chart(
      document.getElementById('breathingChart').getContext('2d'),
      {
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
        options: this.getChartOptions(this.graphMin, this.graphMax)
      }
    );
  }

  getChartOptions(min, max) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: false,
          min: min,
          max: max,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: '#666' }
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: '#666' }
        }
      },
      animation: { duration: 200 }
    };
  }

  initEventListeners() {
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startMonitoring();
    });
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopMonitoring();
    });
    document.getElementById('bigInhale').addEventListener('click', () => {
      this.startBigInhale();
    });
    document.getElementById('bigExhale').addEventListener('click', () => {
      this.startBigExhale();
    });

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  initUI() {
    // 停止ボタンを無効化、開始ボタンを有効化
    this.setButtonState('startBtn', true);
    this.setButtonState('stopBtn', false);
  }

  setButtonState(btnId, enabled) {
    const btn = document.getElementById(btnId);
    if (enabled) {
      btn.classList.add('btn-enabled');
      btn.classList.remove('btn-disabled');
      btn.disabled = false;
    } else {
      btn.classList.add('btn-disabled');
      btn.classList.remove('btn-enabled');
      btn.disabled = true;
    }
  }


  generateBiometricData() {
    const currentTime = Date.now();
    const baseHeartRate = 72;
    const heartRateVariation = 15;
    const heartRate = Math.round(
      baseHeartRate +
      Math.sin(currentTime / 5000) * heartRateVariation +
      (Math.random() - 0.5) * 8
    );
    let breathingRate;

    // bigInhale: inhaleMaxまで5ステップで徐々に上げる
    if (this.bigInhaleActive) {
      this.bigInhaleStep++;
      breathingRate = 16 + Math.round((this.inhaleMax - 16) * (this.bigInhaleStep / this.bigBreathingStep));
      if (this.bigInhaleStep >= this.bigBreathingStep) {
        this.bigInhaleActive = false;
        this.bigInhaleStep = 0;
      }
    }
    // bigExhale: this.exhaleMinまで5ステップで徐々に下げる
    else if (this.bigExhaleActive) {
      this.bigExhaleStep++;
      breathingRate = 16 - Math.round((16 - this.exhaleMin) * (this.bigExhaleStep / this.bigBreathingStep));
      if (this.bigExhaleStep >= this.bigBreathingStep) {
        this.bigExhaleActive = false;
        this.bigExhaleStep = 0;
      }
    }
    // 通常時
    else {
      const baseBreathingRate = 16;
      const breathingVariation = 3;
      breathingRate = Math.round(
        baseBreathingRate +
        Math.sin(currentTime / 800) * breathingVariation +
        (Math.random() - 0.5) * 2
      );
    }

    return {
      heartRate: Math.max(50, Math.min(120, heartRate)),
      breathingRate: Math.max(0, Math.min(28, breathingRate)),
      timestamp: currentTime
    };
  }

  getCurrentTimeString() {
    return new Date().toLocaleTimeString('ja-JP', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  updateCharts() {
    const data = this.generateBiometricData();
    const timeLabel = this.getCurrentTimeString();
    this.heartRateData.push(data.heartRate);
    this.breathingData.push(data.breathingRate);
    this.timeLabels.push(timeLabel);
    if (this.heartRateData.length > this.maxDataPoints) {
      this.heartRateData.shift();
      this.breathingData.shift();
      this.timeLabels.shift();
    }
    this.heartRateChart.update('none');
    this.breathingChart.update('none');
    this.updateCurrentValues(data);
  }

  updateCurrentValues(data) {
    document.getElementById('currentHeartRate').textContent = data.heartRate;
    document.getElementById('currentBreathing').textContent = data.breathingRate;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.setButtonState('startBtn', false);
    this.setButtonState('stopBtn', true);
    this.monitoringInterval = setInterval(() => {
      this.updateCharts();
    }, this.updateInterval);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;
    this.setButtonState('startBtn', true);
    this.setButtonState('stopBtn', false);
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  startBigInhale() {
    this.bigInhaleActive = true;
    this.bigInhaleStep = 0;
  }
  startBigExhale() {
    this.bigExhaleActive = true;
    this.bigExhaleStep = 0;
  }

  cleanup() {
    this.stopMonitoring();
    const video = document.querySelector('video');
    if (video && video.src) {
      URL.revokeObjectURL(video.src);
    }
  }
}

function startCountdown(targetDate) {
  const timerElem = document.getElementById('countdown-timer');
  function update() {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) {
      timerElem.textContent = 'カウントダウン終了';
      clearInterval(intervalId);
      return;
    }
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    timerElem.textContent = `起きる時間まであと ${m}:${s}`;
  }
  update();
  const intervalId = setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  window.biometricMonitor = new BiometricMonitor();

  // カウントダウン
  const end = new Date(Date.now() + 10 * 60 * 1000);
  startCountdown(end);

  // --- 友達が来る時間（秒） ---
  const friendTime = 3; // 例: 3秒後
  const friendName = "たろう"; // 例: たろう

  const video = document.getElementById('fixedVideo');
  const messageElem = document.getElementById('friend-message');
  let messageShown = false;

  if (video) {
    video.addEventListener('timeupdate', () => {
      if (!messageShown && video.currentTime >= friendTime) {
        messageElem.textContent = `${friendName}が遊びに来たよ`;
        messageElem.classList.add('active');
        messageShown = true;
      }
    });
    // 動画を巻き戻した場合はメッセージを消す
    video.addEventListener('seeked', () => {
      if (video.currentTime < friendTime) {
        messageElem.textContent = '';
        messageElem.classList.remove('active');
        messageShown = false;
      }
    });
  }
});
