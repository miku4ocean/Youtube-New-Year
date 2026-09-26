/**
 * 新年跨年直播合集
 * 同時觀看多個跨年直播頻道
 */

// ── 可測純邏輯（不碰 DOM），供 test.mjs 用 node:vm 直接載入測試 ──
const NYLCore = {
    // URL Parsing：從各種 YouTube 網址格式或純 11 碼 ID 取出 videoId
    extractVideoId(url) {
        if (!url) return null;

        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    },

    // 依目前時間判斷倒數狀態
    // phase: 'countdown'（平常倒數）｜'final10'（最後 10 秒特效）｜'celebrate'（新年第一小時內）
    countdownState(now) {
        const year = now.getFullYear();

        // 新年第一個小時內：慶祝視窗
        if (now.getMonth() === 0 && now.getDate() === 1 && now.getHours() < 1) {
            return { phase: 'celebrate', targetYear: year, remainingMs: 0 };
        }

        const newYear = new Date(year + 1, 0, 1, 0, 0, 0);
        const diff = newYear - now;

        if (diff <= 0) {
            // 安全網：理論上不會發生（newYear 必為未來），保留以防時鐘異常
            return { phase: 'celebrate', targetYear: year + 1, remainingMs: 0 };
        }

        if (diff <= 10000) {
            return { phase: 'final10', targetYear: year + 1, remainingMs: diff };
        }

        return { phase: 'countdown', targetYear: year + 1, remainingMs: diff };
    },

    // 把毫秒數格式化成倒數文字：超過 24 小時顯示「N 天 HH:MM:SS」，否則「HH:MM:SS」
    formatCountdown(ms) {
        const safeMs = ms > 0 ? ms : 0;
        const totalSeconds = Math.floor(safeMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (n) => n.toString().padStart(2, '0');

        if (days > 0) {
            return `${days} 天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },

    // 判斷這個 keydown 事件是否該觸發快捷鍵（排除修飾鍵組合與輸入框中的按鍵）
    shouldHandleShortcut(e) {
        if (!e) return false;
        if (e.metaKey || e.ctrlKey || e.altKey) return false;

        const target = e.target;
        if (target) {
            if (typeof target.matches === 'function' &&
                target.matches('input, textarea, [contenteditable="true"]')) {
                return false;
            }
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return false;
            }
        }
        return true;
    }
};

if (typeof globalThis !== 'undefined') {
    globalThis.NYLCore = NYLCore;
}

class NewYearLivestreams {
    constructor() {
        // 固定的 20 個跨年直播網址
        this.videoUrls = [
            'https://www.youtube.com/watch?v=6Ekqt2eQWaM',
            'https://www.youtube.com/watch?v=INUlQU4XH7E',
            'https://www.youtube.com/watch?v=qfqPudgn-8A',
            'https://www.youtube.com/watch?v=fO69UoXVgUU',
            'https://www.youtube.com/watch?v=0TWaHr8zmBc',
            'https://www.youtube.com/watch?v=iwbYPtvjzzM',
            'https://www.youtube.com/watch?v=YuF_KbM01T4',
            'https://www.youtube.com/watch?v=qK1pilx16WA',
            'https://www.youtube.com/watch?v=Fua-K7Yjydw',
            'https://www.youtube.com/watch?v=QFdchnomk7o',
            'https://www.youtube.com/watch?v=_ePcCXyHDAk',
            'https://www.youtube.com/watch?v=LvebymzFc2I',
            'https://www.youtube.com/watch?v=6nV37uSsx1o',
            'https://www.youtube.com/watch?v=Ys76Vb8Bn1E',
            'https://www.youtube.com/watch?v=VnZ6x6m5VAc',
            'https://www.youtube.com/watch?v=DwNoUIspeHg',
            'https://www.youtube.com/watch?v=pg1pjLGN1us',
            'https://www.youtube.com/watch?v=9dGtcu2VKOQ',
            'https://www.youtube.com/watch?v=sKY2i69cenc',
            'https://www.youtube.com/watch?v=dE_A83eNQ7A'
        ];

        this.videoCount = this.videoUrls.length;
        this.isMuted = true; // 預設靜音
        this.isFullscreen = false;
        this.celebrationTriggered = false; // 防止 triggerFireworks() 每秒 tick 重複觸發
        this.fireworksIntervalId = null; // 追蹤煙火 interval，供跨年慶祝視窗結束後清除

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderVideoGrid();
        this.updateLoadedCount();
        this.startCountdown();
    }

    cacheElements() {
        this.videoGrid = document.getElementById('videoGrid');
        this.muteAllBtn = document.getElementById('muteAllBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.expandedOverlay = document.getElementById('expandedOverlay');
        this.expandedClose = document.getElementById('expandedClose');
        this.expandedVideo = document.getElementById('expandedVideo');
        this.loadedCount = document.getElementById('loadedCount');
        this.toastContainer = document.getElementById('toastContainer');
        this.countdownTime = document.getElementById('countdownTime');
        this.countdownLabel = document.getElementById('countdownLabel');
        this.countdownDisplay = document.getElementById('countdownDisplay');
        this.fireworksContainer = document.getElementById('fireworksContainer');
    }

    bindEvents() {
        // Toolbar actions
        this.muteAllBtn.addEventListener('click', () => this.toggleMuteAll());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Expanded video
        this.expandedClose.addEventListener('click', () => this.closeExpandedVideo());
        this.expandedOverlay.addEventListener('click', (e) => {
            if (e.target === this.expandedOverlay) this.closeExpandedVideo();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Fullscreen change
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    }

    // URL Parsing
    extractVideoId(url) {
        return NYLCore.extractVideoId(url);
    }

    getEmbedUrl(videoId) {
        if (!videoId) return null;
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0`;
    }

    // Video Grid
    renderVideoGrid() {
        this.videoGrid.innerHTML = '';
        this.videoGrid.className = 'video-grid';

        for (let i = 0; i < this.videoCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'video-cell';
            cell.dataset.index = i;

            const videoId = this.extractVideoId(this.videoUrls[i]);

            if (videoId) {
                cell.innerHTML = `
                    <span class="video-number">${i + 1}</span>
                    <button class="expand-btn" title="放大影片">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    </button>
                    <iframe
                        src="${this.getEmbedUrl(videoId)}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        loading="lazy"
                    ></iframe>
                `;

                cell.querySelector('.expand-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.expandVideo(videoId);
                });
            }

            this.videoGrid.appendChild(cell);
        }
    }


    // Expand Video
    expandVideo(videoId) {
        this.expandedVideo.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            ></iframe>
        `;
        this.expandedOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeExpandedVideo() {
        this.expandedOverlay.classList.remove('active');
        this.expandedVideo.innerHTML = '';
        document.body.style.overflow = '';
    }

    // Mute/Fullscreen
    toggleMuteAll() {
        this.isMuted = !this.isMuted;
        this.muteAllBtn.classList.toggle('muted', this.isMuted);

        const iframes = this.videoGrid.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            // 優先用 IFrame API 的 postMessage 下指令，不重新載入 iframe（跨年當下按 m 才不會全部黑屏重連）
            try {
                iframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: this.isMuted ? 'mute' : 'unMute', args: [] }),
                    'https://www.youtube.com'
                );
            } catch (err) {
                // 只有 postMessage 丟例外時才退回舊做法（改 src 觸發重新載入）
                try {
                    const fallbackUrl = new URL(iframe.src);
                    fallbackUrl.searchParams.set('mute', this.isMuted ? '1' : '0');
                    iframe.src = fallbackUrl.toString();
                } catch (fallbackErr) {
                    // 無法解析 src，放棄這個 iframe
                }
            }
        });

        this.showToast(this.isMuted ? '已全部靜音' : '已取消靜音', 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showToast('無法進入全螢幕模式', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    onFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        document.body.classList.toggle('fullscreen-mode', this.isFullscreen);
    }

    // Keyboard Shortcuts
    handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.expandedOverlay.classList.contains('active')) {
                this.closeExpandedVideo();
            }
            return;
        }

        // 真 bug：原本只檢查 e.key==='f'/'m'，Cmd+F／Ctrl+F 搜尋頁面、Cmd+M 也會被誤觸；
        // 大寫 F／M（開著 CapsLock）反而沒有反應。改用 shouldHandleShortcut 排除修飾鍵組合與
        // input／textarea／contenteditable，並用 toLowerCase() 讓大小寫都能觸發。
        if (!NYLCore.shouldHandleShortcut(e)) return;

        const key = e.key.toLowerCase();

        if (key === 'f') {
            this.toggleFullscreen();
        } else if (key === 'm') {
            this.toggleMuteAll();
        }
    }

    // Countdown to New Year
    startCountdown() {
        const updateCountdown = () => {
            const now = new Date();
            const state = NYLCore.countdownState(now);

            if (this.countdownLabel) {
                this.countdownLabel.textContent = `距離 ${state.targetYear}`;
            }

            if (state.phase === 'celebrate') {
                this.countdownTime.textContent = '🎉 新年快樂！';
                this.countdownDisplay.classList.add('celebration');
                this.triggerFireworks();
                return;
            }

            // 不在慶祝視窗內（例如跨年第一小時已過，進入下一年度倒數）：
            // 確保煙火 interval 已停止，並重置旗標供下次跨年使用
            this.stopFireworks();

            this.countdownTime.textContent = NYLCore.formatCountdown(state.remainingMs);

            if (state.phase === 'countdown') {
                // 修正：跨年後 celebration class 從未被移除，導致數字持續閃動（celebrationPulse）
                this.countdownDisplay.classList.remove('celebration');
            } else if (state.phase === 'final10') {
                // 最後 10 秒倒數特效
                this.countdownDisplay.classList.add('celebration');
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // Fireworks effect
    triggerFireworks() {
        // 每秒的 updateCountdown tick 在慶祝視窗內都會呼叫這裡，用旗標確保只真正啟動一次，
        // 避免無限堆積永不清除的 setInterval（R2 驗證發現：20 秒內堆積 19 個 interval）
        if (this.celebrationTriggered) return;
        this.celebrationTriggered = true;

        const colors = ['#ffd700', '#ff4757', '#00d4ff', '#ff6b81', '#ffffff'];

        const createFirework = () => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * (window.innerHeight * 0.6);

            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.boxShadow = `0 0 6px ${particle.style.background}`;

                const angle = (Math.PI * 2 / 20) * i;
                const velocity = 50 + Math.random() * 50;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;

                particle.style.setProperty('--tx', tx + 'px');
                particle.style.setProperty('--ty', ty + 'px');
                particle.style.animation = `fireworkParticle 1.5s ease-out forwards`;

                this.fireworksContainer.appendChild(particle);

                setTimeout(() => particle.remove(), 1500);
            }
        };

        // Create multiple fireworks
        for (let i = 0; i < 5; i++) {
            setTimeout(createFirework, i * 300);
        }

        // Continue fireworks for celebration
        this.fireworksIntervalId = setInterval(() => {
            if (Math.random() > 0.7) {
                createFirework();
            }
        }, 500);
    }

    // 停止煙火 interval（跨年慶祝視窗結束後呼叫），並重置旗標讓下次跨年可再次觸發
    stopFireworks() {
        if (this.fireworksIntervalId) {
            clearInterval(this.fireworksIntervalId);
            this.fireworksIntervalId = null;
        }
        this.celebrationTriggered = false;
    }

    // Helpers
    updateLoadedCount() {
        const count = this.videoUrls.filter(url => this.extractVideoId(url)).length;
        this.loadedCount.textContent = count;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add custom keyframe for firework particles
const style = document.createElement('style');
style.textContent = `
    @keyframes fireworkParticle {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NewYearLivestreams();
});
