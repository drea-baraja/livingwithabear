// Windows 97 Sound Effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const now = audioContext.currentTime;
    
    if (type === 'click') {
        // Classic Windows click sound
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
}

// Section Navigation
function showSection(sectionId, options = {}) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        selectedSection.classList.add('active');
    }
    
    // Update nav link active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    if (!options.skipSound) {
        playSound('click');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('sidebarToggle');
    const collapsed = sidebar.classList.toggle('collapsed');
    btn.textContent = collapsed ? '▶' : '◀';
    btn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    playSound('click');
}

function openMainWindow(sectionId = 'home') {
    const mainWindow = document.getElementById('mainWindow');
    const wasHidden = mainWindow.classList.contains('closed') || mainWindow.classList.contains('minimized');

    mainWindow.classList.remove('closed', 'minimized');
    mainWindow.style.display = 'flex';

    if (sectionId) {
        showSection(sectionId, { skipSound: true });
    }

    updateMaximizeButtonIcon();

    if (wasHidden) {
        playSound('click');
    }
}

function updateMaximizeButtonIcon() {
    const mainWindow = document.getElementById('mainWindow');
    const maximizeBtn = document.querySelector('.maximize-btn');

    if (!maximizeBtn || !mainWindow) {
        return;
    }

    maximizeBtn.textContent = mainWindow.classList.contains('maximized') ? '❐' : '□';
}

// Window Controls
function minimizeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    mainWindow.classList.remove('closed');
    mainWindow.classList.add('minimized');
    playSound('click');
}

function maximizeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    mainWindow.classList.toggle('maximized');
    updateMaximizeButtonIcon();
    playSound('click');
}

function closeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    mainWindow.classList.remove('minimized');
    mainWindow.classList.add('closed');
    playSound('click');
}

function setupRetroVisualizer() {
    const audioEl = document.getElementById('retroAudio');
    const trackSelect = document.getElementById('retroTrackSelect');
    const prevTrackBtn = document.getElementById('retroPrevTrackBtn');
    const nextTrackBtn = document.getElementById('retroNextTrackBtn');
    const presetBtn = document.getElementById('visualPresetBtn');
    const nowPlaying = document.getElementById('retroNowPlaying');
    const canvas = document.getElementById('retroVisualizer');

    if (!audioEl || !trackSelect || !prevTrackBtn || !nextTrackBtn || !presetBtn || !nowPlaying || !canvas) {
        return;
    }

    const tracks = [
        { title: 'Enough',                  src: 'audio/01. Enough.mp3' },
        { title: 'Do Something About It',   src: 'audio/02. Do Something About It.mp3' },
        { title: 'Ruin',                    src: 'audio/03. Ruin.mp3' },
        { title: 'Hannah',                  src: 'audio/04. Hannah.mp3' },
        { title: 'Noise',                   src: 'audio/05. Noise.mp3' },
        { title: 'Yet',                     src: 'audio/06. Yet.mp3' },
        { title: "Don't Worry Darling",     src: "audio/07. Don_t Worry Darling.mp3" },
        { title: 'Candor',                  src: 'audio/08. Candor.mp3' },
        { title: 'Hate To Break It To You', src: 'audio/09. Hate To Break It To You.mp3' },
        { title: 'Resurrectionist',         src: 'audio/10. Resurrectionist.mp3' },
        { title: '1408',                    src: 'audio/11. 1408.mp3' },
        { title: "In Case I Don't See You", src: "audio/12. In Case I Don_t See You.mp3" }
    ];

    let currentTrackIndex = 0;

    const ctx = canvas.getContext('2d');
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    const source = audioContext.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const waveData = new Uint8Array(analyser.fftSize);
    const presets = ['Spectrum', 'Wave', 'Dots'];
    let presetIndex = 1;

    function loadTrack(index, autoplay = false) {
        currentTrackIndex = (index + tracks.length) % tracks.length;
        const track = tracks[currentTrackIndex];

        trackSelect.value = String(currentTrackIndex);
        nowPlaying.textContent = `Now loaded: ${track.title}`;
        audioEl.src = track.src;

        if (autoplay) {
            audioEl.play().catch(() => {});
        }
    }

    function drawSpectrum(width, height) {
        const bars = freqData.length;
        const barWidth = width / bars;
        for (let i = 0; i < bars; i++) {
            const value = freqData[i] / 255;
            const barHeight = value * height;
            const hue = 130 - (i / bars) * 70;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(i * barWidth, height - barHeight, Math.max(1, barWidth - 1), barHeight);
        }
    }

    function drawWave(width, height) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#5dffeb';
        const sliceWidth = width / waveData.length;
        for (let i = 0; i < waveData.length; i++) {
            const v = waveData[i] / 128.0;
            const y = (v * height) / 2;
            const x = i * sliceWidth;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    function drawDots(width, height, t) {
        const step = 6;
        for (let i = 0; i < freqData.length; i += step) {
            const value = freqData[i] / 255;
            const x = (i / freqData.length) * width;
            const y = (0.5 + Math.sin(t * 0.003 + i * 0.2) * value * 0.45) * height;
            const r = 1 + value * 4;
            ctx.fillStyle = `rgba(0, 255, 156, ${0.4 + value * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function render(time) {
        const width = canvas.width;
        const height = canvas.height;

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(waveData);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        if (presets[presetIndex] === 'Spectrum') {
            drawSpectrum(width, height);
        } else if (presets[presetIndex] === 'Wave') {
            drawWave(width, height);
        } else {
            drawDots(width, height, time || 0);
        }

        requestAnimationFrame(render);
    }

    presetBtn.addEventListener('click', () => {
        presetIndex = (presetIndex + 1) % presets.length;
        presetBtn.textContent = 'CHANGE VISUAL';
        playSound('click');
    });

    tracks.forEach((track, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = track.title;
        trackSelect.appendChild(option);
    });

    trackSelect.addEventListener('change', () => {
        loadTrack(Number(trackSelect.value), true);
    });

    prevTrackBtn.addEventListener('click', () => {
        loadTrack(currentTrackIndex - 1, true);
        playSound('click');
    });

    nextTrackBtn.addEventListener('click', () => {
        loadTrack(currentTrackIndex + 1, true);
        playSound('click');
    });

    audioEl.addEventListener('ended', () => {
        loadTrack(currentTrackIndex + 1, true);
    });

    audioEl.addEventListener('play', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
    });

    loadTrack(0, false);

    render(0);
}

// Music Player
let isPlaying = false;
let currentProgress = 0;
let progressInterval;

function togglePlay() {
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');
    
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
    
    if (isPlaying) {
        playSound('click');
        progressInterval = setInterval(() => {
            currentProgress += 0.5;
            if (currentProgress > 100) currentProgress = 0;
            progress.style.width = currentProgress + '%';
        }, 100);
    } else {
        clearInterval(progressInterval);
        playSound('click');
    }
}

function toggleMute() {
    playSound('click');
    alert('Mute toggled!');
}

// Form Submission
function submitForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    playSound('click');
    
    // Simple validation and feedback
    if (name && email && subject && message) {
        alert(`Thanks for reaching out, ${name}!\n\nWe've received your message and will get back to you soon at ${email}.`);
        document.getElementById('contactForm').reset();
    } else {
        alert('Please fill in all fields!');
    }
}

// Add click sounds to buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button, .nav-link, .social-links a, .menu-bar span, .playlist li');
    buttons.forEach(button => {
        if (!button.hasAttribute('onclick') || !button.getAttribute('onclick').includes('playSound')) {
            button.addEventListener('click', (e) => {
                playSound('click');
            });
        }
    });
    
    // Initialize with home section visible
    showSection('home', { skipSound: true });
    updateMaximizeButtonIcon();
    setupRetroVisualizer();
});

// Update time on taskbar
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.querySelector('.taskbar-time').textContent = `${hours}:${minutes}`;
}

setInterval(updateTime, 1000);
updateTime();