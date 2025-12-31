/**
 * 2025 新年跨年直播合集
 * 同時觀看多個跨年直播頻道
 */

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
            const src = new URL(iframe.src);
            src.searchParams.set('mute', this.isMuted ? '1' : '0');
            iframe.src = src.toString();
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
        }

        if (e.key === 'f' && !e.target.matches('input, textarea')) {
            this.toggleFullscreen();
        }

        if (e.key === 'm' && !e.target.matches('input, textarea')) {
            this.toggleMuteAll();
        }
    }

    // Countdown to New Year
    startCountdown() {
        const updateCountdown = () => {
            const now = new Date();
            const newYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);

            // 如果已經過了今年的新年，計算到明年
            if (now.getMonth() === 0 && now.getDate() === 1 && now.getHours() < 1) {
                // 新年第一個小時內
                this.countdownTime.textContent = '🎉 新年快樂！';
                this.countdownDisplay.classList.add('celebration');
                this.triggerFireworks();
                return;
            }

            const diff = newYear - now;

            if (diff <= 0) {
                this.countdownTime.textContent = '🎉 新年快樂！';
                this.countdownDisplay.classList.add('celebration');
                this.triggerFireworks();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            this.countdownTime.textContent =
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // 最後 10 秒倒數特效
            if (diff <= 10000) {
                this.countdownDisplay.classList.add('celebration');
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // Fireworks effect
    triggerFireworks() {
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
        setInterval(() => {
            if (Math.random() > 0.7) {
                createFirework();
            }
        }, 500);
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
