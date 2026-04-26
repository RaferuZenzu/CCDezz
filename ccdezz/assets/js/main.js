/**
 * CCDEZZ CORE ENGINE v6.0 - RESPONSIVE & SECURE AUTH
 */

let songDatabase = JSON.parse(localStorage.getItem('ccdezz_songs')) || [];
let playlists = JSON.parse(localStorage.getItem('ccdezz_playlists')) || {};
let likedSongs = JSON.parse(localStorage.getItem('ccdezz_liked')) || [];
let isSignUpMode = false;
let cropper = null;
let tempCroppedAvatar = null;

// --- 1. AUTHENTICATION LOGIC ---
const togglePasswordVisibility = (id, el) => {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        el.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = "password";
        el.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

const toggleAuthMode = () => {
    isSignUpMode = !isSignUpMode;
    const signupFields = document.getElementById('signup-fields');
    const authBtn = document.getElementById('auth-btn');
    const authStatus = document.getElementById('auth-status');
    const switchText = document.getElementById('switch-text');
    const switchBtn = document.getElementById('auth-switch');

    signupFields.classList.toggle('hidden');
    
    if (isSignUpMode) {
        authBtn.innerText = "Create Account";
        authStatus.innerText = "Join the future of audio";
        switchText.innerText = "Already have an account?";
        switchBtn.innerText = "Sign In";
    } else {
        authBtn.innerText = "Sign In";
        authStatus.innerText = "Sign in to your station";
        switchText.innerText = "Don't have an account?";
        switchBtn.innerText = "Sign Up";
    }
};

const handleAuth = () => {
    const user = document.getElementById('auth-identifier').value.trim();
    const pass = document.getElementById('auth-password').value;
    const email = document.getElementById('reg-email').value.trim();

    if (!user || !pass) return alert("Please fill all fields!");

    if (isSignUpMode) {
        if (!email.includes('@')) return alert("Invalid email address!");
        localStorage.setItem('ccdezz_user', user);
        localStorage.setItem('ccdezz_pass', pass);
        localStorage.setItem('ccdezz_email', email);
        alert("Registration Successful! Please Login.");
        toggleAuthMode();
    } else {
        const savedUser = localStorage.getItem('ccdezz_user');
        const savedPass = localStorage.getItem('ccdezz_pass');
        
        if (user === savedUser && pass === savedPass) {
            localStorage.setItem('ccdezz_session', 'active');
            location.reload();
        } else {
            alert("Invalid Credentials! Did you register first?");
        }
    }
};

const logout = () => {
    localStorage.removeItem('ccdezz_session');
    location.reload();
};

// --- 2. CORE RENDERER (RESPONSIVE LIST) ---
const renderTracks = (data, title = "Vibe Station") => {
    const container = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    viewTitle.innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks`;
    
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = `<div class="text-center py-20 opacity-20 uppercase text-xs font-black tracking-widest">No music found in this station</div>`;
        return;
    }

    data.forEach((song) => {
        const isLiked = likedSongs.includes(song.id);
        container.innerHTML += `
            <div class="flex items-center gap-4 p-3 md:p-4 hover:bg-white/5 rounded-2xl group transition-all border border-transparent hover:border-white/10">
                <div class="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
                    <img src="${song.cover}" class="w-full h-full rounded-xl object-cover shadow-lg">
                    <button onclick="playSong('${song.id}')" class="absolute inset-0 bg-cyan-400/80 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition text-black">
                        <i class="fas fa-play text-sm"></i>
                    </button>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs md:text-sm font-bold text-white truncate uppercase tracking-tight">${song.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase font-medium mt-1">Local Library • HD Audio</p>
                </div>
                <div class="flex items-center gap-2 md:gap-4">
                    <button onclick="toggleLike(${song.id})" class="${isLiked ? 'liked' : 'text-gray-700'} text-sm md:text-base transition-transform active:scale-150">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="deleteSong(${song.id})" class="text-gray-800 hover:text-red-500 text-xs md:text-sm opacity-0 group-hover:opacity-100 transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
    });
};

// --- 3. UPLOAD & DATA ---
const processUpload = async () => {
    const audioFile = document.getElementById('file-audio').files[0];
    const coverFile = document.getElementById('file-cover').files[0];

    if (!audioFile) return alert("Select MP3 file first!");

    const newSong = {
        id: Date.now(),
        title: audioFile.name.replace(/\.[^/.]+$/, ""),
        src: await toBase64(audioFile),
        cover: coverFile ? await toBase64(coverFile) : 'assets/images/logo-ccdezz.jpg',
        date: new Date().toISOString()
    };

    songDatabase.push(newSong);
    saveData();
    renderTracks(songDatabase);
    closeUploadModal();
};

const toggleLike = (id) => {
    const idx = likedSongs.indexOf(id);
    idx > -1 ? likedSongs.splice(idx, 1) : likedSongs.push(id);
    saveData();
    // Refresh current view logic
    renderTracks(songDatabase); 
};

const deleteSong = (id) => {
    if (confirm("Delete this track forever?")) {
        songDatabase = songDatabase.filter(s => s.id !== id);
        likedSongs = likedSongs.filter(sid => sid !== id);
        saveData();
        renderTracks(songDatabase);
    }
};

// --- 4. PROFILE & AVATAR ---
const updateProfileUI = () => {
    const user = localStorage.getItem('ccdezz_user') || "Guest";
    const email = localStorage.getItem('ccdezz_email') || "member@ccdezz.com";
    const avatar = localStorage.getItem('ccdezz_avatar');

    document.getElementById('user-display-name').innerText = user;
    document.getElementById('user-display-email').innerText = "@" + user.toLowerCase();
    
    const containers = [
        document.getElementById('user-avatar-container'),
        document.getElementById('profile-preview-large')
    ];

    containers.forEach(c => {
        if (avatar) {
            c.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover">`;
        } else {
            c.innerHTML = `<div class="w-full h-full bg-cyan-400 flex items-center justify-center text-black font-black text-xl">${user[0]}</div>`;
        }
    });
};

document.getElementById('edit-avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('crop-preview');
            img.src = ev.target.result;
            document.getElementById('cropper-container').classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    }
});

const saveCroppedAvatar = () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 });
    localStorage.setItem('ccdezz_avatar', canvas.toDataURL());
    location.reload();
};

// --- UTILS ---
const saveData = () => {
    localStorage.setItem('ccdezz_songs', JSON.stringify(songDatabase));
    localStorage.setItem('ccdezz_liked', JSON.stringify(likedSongs));
    localStorage.setItem('ccdezz_playlists', JSON.stringify(playlists));
};

const toBase64 = f => new Promise(res => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(f);
});

const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const openProfileModal = () => {
    updateProfileUI();
    document.getElementById('profile-modal').classList.remove('hidden');
};
const closeProfileModal = () => document.getElementById('profile-modal').classList.add('hidden');
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Songs");

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('ccdezz_session') === 'active') {
        document.getElementById('auth-screen').classList.add('hidden');
        updateProfileUI();
        renderTracks(songDatabase);
    }
});
