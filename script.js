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
let activeSectionId = 'home';

function showSection(sectionId, options = {}) {
    activeSectionId = sectionId;

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

    updatePlayerDockPlacement();
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

function isMobileLayout() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function getPlayerDockWindow() {
    return document.getElementById('playerDockWindow');
}

function getPlayerDockContent() {
    return document.getElementById('playerDockContent');
}

function getHomePlayerSlot() {
    return document.getElementById('homePlayerSlot');
}

function getRetroPlayerBox() {
    return document.getElementById('retroPlayerBox');
}

function updatePlayerDockPlacement() {
    const playerBox = getRetroPlayerBox();
    const homeSlot = getHomePlayerSlot();
    const dockWindow = getPlayerDockWindow();
    const dockContent = getPlayerDockContent();
    const audioEl = document.getElementById('retroAudio');

    if (!playerBox || !homeSlot || !dockWindow || !dockContent || !audioEl) {
        return;
    }

    const shouldDock = activeSectionId !== 'home' && !audioEl.paused && Boolean(audioEl.src);

    if (shouldDock) {
        dockWindow.style.display = 'flex';
        dockWindow.classList.remove('closed', 'minimized');
        dockWindow.setAttribute('aria-hidden', 'false');

        if (playerBox.parentElement !== dockContent) {
            dockContent.appendChild(playerBox);
        }
    } else {
        dockWindow.classList.remove('minimized', 'maximized');
        dockWindow.style.display = 'none';
        dockWindow.setAttribute('aria-hidden', 'true');

        if (playerBox.parentElement !== homeSlot) {
            homeSlot.appendChild(playerBox);
        }
    }
}

function minimizePlayerDock() {
    const dockWindow = getPlayerDockWindow();
    if (!dockWindow) {
        return;
    }

    dockWindow.classList.remove('closed', 'maximized');
    dockWindow.classList.add('minimized');
    dockWindow.style.display = 'none';
    updatePlayerDockPlacement();
    playSound('click');
}

function maximizePlayerDock() {
    const dockWindow = getPlayerDockWindow();
    if (!dockWindow) {
        return;
    }

    dockWindow.classList.toggle('maximized');
    playSound('click');
}

function closePlayerDock() {
    const dockWindow = getPlayerDockWindow();
    const audioEl = document.getElementById('retroAudio');
    if (!dockWindow) {
        return;
    }

    // Stop the music and clear when closing
    if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.src = '';
    }

    dockWindow.classList.remove('minimized', 'maximized');
    dockWindow.style.display = 'none';
    dockWindow.setAttribute('aria-hidden', 'true');
    playSound('click');
}

// Window dragging and resizing functionality
let draggedWindow = null;
let resizedWindow = null;
let resizeCorner = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartLeft = 0;
let resizeStartTop = 0;

function makeWindowDraggable(windowEl, titleBarEl) {
    if (!titleBarEl) return;

    titleBarEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('.title-btn')) return;

        draggedWindow = windowEl;
        dragOffsetX = e.clientX - windowEl.getBoundingClientRect().left;
        dragOffsetY = e.clientY - windowEl.getBoundingClientRect().top;

        windowEl.style.position = 'fixed';
        windowEl.classList.remove('maximized');
    });
}

function makeWindowResizable(windowEl, resizeHandleEl, corner = 'br') {
    if (!resizeHandleEl) return;

    resizeHandleEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        resizedWindow = windowEl;
        resizeCorner = corner;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        resizeStartWidth = windowEl.offsetWidth;
        resizeStartHeight = windowEl.offsetHeight;
        resizeStartLeft = windowEl.getBoundingClientRect().left;
        resizeStartTop = windowEl.getBoundingClientRect().top;

        windowEl.classList.remove('maximized');
    });
}

document.addEventListener('mousemove', (e) => {
    if (draggedWindow) {
        draggedWindow.style.left = (e.clientX - dragOffsetX) + 'px';
        draggedWindow.style.top = (e.clientY - dragOffsetY) + 'px';
        draggedWindow.style.right = 'auto';
        draggedWindow.style.bottom = 'auto';
        draggedWindow.style.transform = 'none';
    }

    if (resizedWindow) {
        const deltaX = e.clientX - resizeStartX;
        const deltaY = e.clientY - resizeStartY;
        
        if (resizeCorner === 'br') {
            // Bottom-right: resize width/height, don't move
            const newWidth = resizeStartWidth + deltaX;
            const newHeight = resizeStartHeight + deltaY;
            resizedWindow.style.width = Math.max(300, newWidth) + 'px';
            resizedWindow.style.height = Math.max(200, newHeight) + 'px';
        } else if (resizeCorner === 'bl') {
            // Bottom-left: resize width from left, height down
            const newWidth = resizeStartWidth - deltaX;
            const newHeight = resizeStartHeight + deltaY;
            resizedWindow.style.width = Math.max(300, newWidth) + 'px';
            resizedWindow.style.height = Math.max(200, newHeight) + 'px';
            resizedWindow.style.left = (resizeStartLeft + deltaX) + 'px';
        } else if (resizeCorner === 'tr') {
            // Top-right: resize width right, height up
            const newWidth = resizeStartWidth + deltaX;
            const newHeight = resizeStartHeight - deltaY;
            resizedWindow.style.width = Math.max(300, newWidth) + 'px';
            resizedWindow.style.height = Math.max(200, newHeight) + 'px';
            resizedWindow.style.top = (resizeStartTop + deltaY) + 'px';
        } else if (resizeCorner === 'tl') {
            // Top-left: resize width/height from both corners
            const newWidth = resizeStartWidth - deltaX;
            const newHeight = resizeStartHeight - deltaY;
            resizedWindow.style.width = Math.max(300, newWidth) + 'px';
            resizedWindow.style.height = Math.max(200, newHeight) + 'px';
            resizedWindow.style.left = (resizeStartLeft + deltaX) + 'px';
            resizedWindow.style.top = (resizeStartTop + deltaY) + 'px';
        }
    }
});

document.addEventListener('mouseup', () => {
    draggedWindow = null;
    resizedWindow = null;
    resizeCorner = null;
});

const lyricsTracks = [
    {
        title: 'Enough',
        subtitle: 'Track 01',
        source: 'audio/01. Enough.mp3',
        lyrics: 'Lyrics coming soon.\n\nIf you want, I can add the full text here next.'
    },
    {
        title: 'Do Something About It',
        subtitle: 'Track 02',
        source: 'audio/02. Do Something About It.mp3',
        lyrics: 'Lyrics coming soon.\n\nWe can drop in the lyrics for this song whenever you want.'
    },
    {
        title: 'Ruin',
        subtitle: 'Track 03',
        source: 'audio/03. Ruin.mp3',
        lyrics: 'Lyrics coming soon.\n\nThis popup will hold the full lyrics once you paste them in.'
    },
    {
        title: 'Hannah',
        subtitle: 'Track 04',
        source: 'audio/04. Hannah.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: 'Noise',
        subtitle: 'Track 05',
        source: 'audio/05. Noise.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: 'Yet',
        subtitle: 'Track 06',
        source: 'audio/06. Yet.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: "Don't Worry Darling",
        subtitle: 'Track 07',
        source: 'audio/07. Don_t Worry Darling.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: 'Candor',
        subtitle: 'Track 08',
        source: 'audio/08. Candor.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: 'Hate To Break It To You',
        subtitle: 'Track 09',
        source: 'audio/09. Hate To Break It To You.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: 'Resurrectionist',
        subtitle: 'Track 10',
        source: 'audio/10. Resurrectionist.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: '1408',
        subtitle: 'Track 11',
        source: 'audio/11. 1408.mp3',
        lyrics: 'Lyrics coming soon.'
    },
    {
        title: "In Case I Don't See You",
        subtitle: 'Track 12',
        source: 'audio/12. In Case I Don_t See You.mp3',
        lyrics: 'Lyrics coming soon.'
    }
];

function renderLyricsSection() {
    const grid = document.getElementById('lyricsGrid');
    if (!grid) {
        return;
    }

    grid.innerHTML = '';

    lyricsTracks.forEach((track, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lyrics-song-btn';
        button.textContent = `${track.title}`;
        button.addEventListener('click', () => openLyricsWindow(index));
        grid.appendChild(button);
    });
}

function openLyricsWindow(trackIndex) {
    const track = lyricsTracks[trackIndex];
    const lyricsWindow = document.getElementById('lyricsWindow');
    const lyricsTitle = document.getElementById('lyricsWindowTitle');
    const lyricsContent = document.getElementById('lyricsWindowContent');

    if (!track || !lyricsWindow || !lyricsTitle || !lyricsContent) {
        return;
    }

    lyricsTitle.textContent = `${track.title} - Lyrics`;
    lyricsContent.innerHTML = `
        <div class="lyrics-meta">
            <h3>${track.title}</h3>
            <p><strong>${track.subtitle}</strong></p>
            <pre style="white-space: pre-wrap; font-family: inherit; margin-top: 8px;">${track.lyrics}</pre>
        </div>
        <div class="lyrics-actions">
            <button type="button" class="btn-small" onclick="loadLyricsSong(${trackIndex})">Play Song</button>
            <button type="button" class="btn-small" onclick="closeLyricsWindow()">Close</button>
        </div>
    `;

    lyricsWindow.style.display = 'flex';
    lyricsWindow.classList.remove('closed', 'minimized');
    lyricsWindow.classList.add('open');
    lyricsWindow.setAttribute('aria-hidden', 'false');
    playSound('click');
}

function loadLyricsSong(trackIndex) {
    const audioEl = document.getElementById('retroAudio');
    const trackSelect = document.getElementById('retroTrackSelect');
    const track = lyricsTracks[trackIndex];

    if (!audioEl || !track) {
        return;
    }

    if (trackSelect) {
        trackSelect.value = String(trackIndex);
    }

    audioEl.src = track.source;
    audioEl.play().catch(() => {});
    playSound('click');
}

function minimizeLyricsWindow() {
    const lyricsWindow = document.getElementById('lyricsWindow');
    if (!lyricsWindow) {
        return;
    }
    lyricsWindow.classList.remove('closed');
    lyricsWindow.classList.add('minimized');
    playSound('click');
}

function maximizeLyricsWindow() {
    const lyricsWindow = document.getElementById('lyricsWindow');
    if (!lyricsWindow) {
        return;
    }
    lyricsWindow.classList.toggle('maximized');
    playSound('click');
}

function closeLyricsWindow() {
    const lyricsWindow = document.getElementById('lyricsWindow');
    if (!lyricsWindow) {
        return;
    }
    lyricsWindow.classList.remove('minimized');
    lyricsWindow.classList.add('closed');
    lyricsWindow.style.display = 'none';
    lyricsWindow.setAttribute('aria-hidden', 'true');
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

    const tracks = lyricsTracks;

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
        audioEl.src = track.source;

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

        updatePlayerDockPlacement();
    });

    audioEl.addEventListener('pause', () => {
        updatePlayerDockPlacement();
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
function handleHashNavigation() {
    const sectionId = location.hash.replace('#', '') || 'home';
    showSection(sectionId, { skipSound: true });
}

document.addEventListener('hashchange', handleHashNavigation);

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button, .nav-link, .social-links a, .menu-bar span, .playlist li');
    buttons.forEach(button => {
        if (!button.hasAttribute('onclick') || !button.getAttribute('onclick').includes('playSound')) {
            button.addEventListener('click', (e) => {
                playSound('click');
            });
        }
    });
    
    // Initialize the active section from the URL hash.
    handleHashNavigation();
    renderLyricsSection();
    updateMaximizeButtonIcon();
    setupRetroVisualizer();
    updatePlayerDockPlacement();

    // Enable dragging and resizing for windows
    const lyricsWindow = document.getElementById('lyricsWindow');
    const lyricsWindowTitleBar = document.getElementById('lyricsWindowTitleBar');
    const lyricsWindowResizeBL = document.getElementById('lyricsWindowResizeBL');
    const lyricsWindowResize = document.getElementById('lyricsWindowResize');
    const playerDockWindow = document.getElementById('playerDockWindow');
    const playerDockTitleBar = document.getElementById('playerDockTitleBar');
    const playerDockResizeBL = document.getElementById('playerDockResizeBL');
    const playerDockResize = document.getElementById('playerDockResize');

    if (lyricsWindow && lyricsWindowTitleBar) {
        makeWindowDraggable(lyricsWindow, lyricsWindowTitleBar);
    }
    if (lyricsWindow && lyricsWindowResizeBL) {
        makeWindowResizable(lyricsWindow, lyricsWindowResizeBL, 'bl');
    }
    if (lyricsWindow && lyricsWindowResize) {
        makeWindowResizable(lyricsWindow, lyricsWindowResize, 'br');
    }
    if (playerDockWindow && playerDockTitleBar) {
        makeWindowDraggable(playerDockWindow, playerDockTitleBar);
    }
    if (playerDockWindow && playerDockResizeBL) {
        makeWindowResizable(playerDockWindow, playerDockResizeBL, 'bl');
    }
    if (playerDockWindow && playerDockResize) {
        makeWindowResizable(playerDockWindow, playerDockResize, 'br');
    }
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