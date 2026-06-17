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
function showSection(sectionId) {
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
    
    playSound('click');
}

// Window Controls
function minimizeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    mainWindow.style.transform = 'translateY(100vh)';
    mainWindow.style.transition = 'transform 0.3s';
    playSound('click');
}

function maximizeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    if (mainWindow.style.maxWidth === '95%') {
        mainWindow.style.maxWidth = '100%';
        mainWindow.style.maxHeight = '100vh';
        mainWindow.style.borderRadius = '0';
    } else {
        mainWindow.style.maxWidth = '95%';
        mainWindow.style.maxHeight = 'calc(100% - 48px)';
    }
    playSound('click');
}

function closeWindow() {
    const mainWindow = document.getElementById('mainWindow');
    mainWindow.style.opacity = '0';
    mainWindow.style.transition = 'opacity 0.3s';
    playSound('click');
    setTimeout(() => {
        mainWindow.style.display = 'none';
    }, 300);
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
    showSection('home');
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