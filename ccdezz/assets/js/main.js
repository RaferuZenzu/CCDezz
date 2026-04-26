/**
 * CCDEZZ CORE v9.0 - FOCUS: STABLE MP3 PLAYER & NO AVATAR
 */

let songDatabase = JSON.parse(localStorage.getItem('cc_songs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('cc_liked')) || [];
const audioEngine = document.getElementById('audio-engine');
const M_KEY = "MTIzNA=="; // Default: 1234

// --- 1. SECURITY ---
const checkMasterKey = () => {
    const input = document.getElementById('master-key').value;
    if (btoa(input) === M_KEY) {
        localStorage.setItem('cc_session', 'authorized');
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    } else {
        alert("ACCESS DENIED");
    }
};

// --- 2. MUSIC PLAYER ENGINE ---
const playSong = (id) => {
    const song = songDatabase.find(s => s.id == id);
    if (!song) return;

    // Set Audio & Player UI
    audioEngine.src = song.src;
    document.getElementById('player-title').innerText = song.title;
    document.getElementById('player-cover').src = song.cover;
    
    // Show Player Bar
    const playerBar = document.getElementById('player-bar');
    playerBar.classList.remove('player-hide');
    playerBar.classList.add('player-show');

    audioEngine.play();
    updatePlayIcon(true);
};

const togglePlay = () => {
    if (audioEngine.paused) {
        audioEngine.play();
        updatePlayIcon(true);
    } else {
        audioEngine.pause();
        updatePlayIcon(false);
    }
};

const updatePlayIcon = (isPlaying) => {
    const btn = document.getElementById('play-btn');
    btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play ml-1"></i>';
};

const closePlayer = () => {
    audioEngine.pause();
    document.getElementById('player-bar').classList.replace('player-show', 'player-hide');
};

// --- 3. PROFILE & NAME ---
const initProfile = () => {
    const name = localStorage.getItem('cc_user_name') || "MASTER";
    document.getElementById('user-name-sidebar').innerText = name;
    document.getElementById('edit-username').value = name;
    document.getElementById('user-avatar-initial').innerText = name.charAt(0).toUpperCase();
};

const updateNameOnly = () => {
    const newName = document.getElementById('edit-username').value.trim();
    if (newName) {
        localStorage.setItem('cc_user_name', newName);
        alert("Name Updated!");
        location.reload();
    }
};

// --- 4. DATA LOGIC ---
const processUpload = async () => {
    const audio = document.getElementById('file-audio').files[0];
    const cover = document.getElementById('file-cover').files[0];

    if (!audio) return alert("MP3 File Required!");

    const song = {
        id: Date.now(),
        title: audio.name.replace(/\.[^/.]+$/, ""),
        src: await toBase64(audio),
        cover: cover ? await toBase64(cover) : 'assets/images/logo-ccdezz.jpg'
    };

    songDatabase.push(song);
    localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
    renderTracks(songDatabase);
    closeUploadModal();
};

const renderTracks = (data, title = "Vibe Station") => {
    const list = document.getElementById('master-track-list');
    document.getElementById('view-title').innerHTML = title.replace(" ", "<br>");
    document.getElementById('track-count').innerText = `${data.length} Tracks`;
    
    list.innerHTML = '';
    data.forEach(s => {
        const isLiked = likedSongs.includes(s.id);
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl group transition border border-transparent hover:border-white/5">
                <div class="relative w-12 h-12 flex-shrink-0 cursor-pointer" onclick="playSong(${s.id})">
                    <img src="${s.cover}" class="w-full h-full rounded-lg object-cover">
                    <div class="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition">
                        <i class="fas fa-play text-black text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-white uppercase truncate">${s.title}</p>
                    <p class="text-[9px] text-gray-600 uppercase">Authorized Access Only</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'liked' : 'text-gray-800'} transition active:scale-150"><i class="fas fa-heart"></i></button>
                    <button onclick="deleteSong(${s.id})" class="text-gray-900 group-hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    });
};

const toggleLike = (id) => {
    const idx = likedSongs.indexOf(id);
    idx > -1 ? likedSongs.splice(idx, 1) : likedSongs.push(id);
    localStorage.setItem('cc_liked', JSON.stringify(likedSongs));
    renderTracks(songDatabase);
};

const deleteSong = (id) => {
    if(confirm("Delete permanently?")) {
        songDatabase = songDatabase.filter(s => s.id !== id);
        localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
        renderTracks(songDatabase);
    }
};

// --- UTILS ---
const toBase64 = f => new Promise(res => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(f);
});

const logout = () => { if(confirm("Reset everything?")) { localStorage.clear(); location.reload(); } };
const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const openProfileModal = () => document.getElementById('profile-modal').classList.remove('hidden');
const closeProfileModal = () => document.getElementById('profile-modal').classList.add('hidden');
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Songs");

const initApp = () => {
    initProfile();
    renderTracks(songDatabase);
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    }
});
