/**
 * CCDEZZ v12.0 - ULTIMATE STORAGE (IndexedDB)
 * Support file besar & banyak lagu tanpa limit 5MB
 */

// Konfigurasi Database (IndexedDB)
const dbName = "CCDezzStationDB";
const storeName = "songs";
let db;

// Inisialisasi Database saat Load
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
    }
};
request.onsuccess = (e) => {
    db = e.target.result;
    initApp();
};

let songDatabase = [];
let likedSongs = JSON.parse(localStorage.getItem('cc_liked')) || [];
let playlists = JSON.parse(localStorage.getItem('cc_playlists')) || {};
let currentTrackId = null;

const audioPlayer = document.getElementById('main-audio-player');
const M_KEY = "MTIzNA=="; // 1234

// --- AUTH ---
const checkMasterKey = () => {
    const input = document.getElementById('master-key').value;
    if (btoa(input) === M_KEY) {
        localStorage.setItem('cc_session', 'authorized');
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    } else { alert("WRONG KEY"); }
};

// --- LOAD DATA DARI INDEXEDDB ---
async function initApp() {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        songDatabase = getAll.result;
        renderTracks(songDatabase);
        updatePlaylistNav();
    };
}

// --- RENDERER ---
const renderTracks = (data, title = "Vibe Station") => {
    const list = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    viewTitle.innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks In Library`;
    
    if (data.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                    <i class="fas fa-compact-disc text-4xl text-gray-700 animate-spin-slow"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-400 mb-2 italic uppercase">Library Kosong</h3>
                <button onclick="openUploadModal()" class="btn-center-pulse bg-cyan-400 text-black font-black py-5 px-10 rounded-[2rem] uppercase text-xs tracking-widest mt-4">
                    Upload Musik
                </button>
            </div>`;
        return;
    }

    list.innerHTML = '';
    data.forEach(s => {
        const isPlaying = currentTrackId === s.id;
        const isLiked = likedSongs.includes(s.id);
        
        // Buat URL sementara untuk Audio & Cover agar bisa diputar
        const audioUrl = URL.createObjectURL(s.audioBlob);
        const coverUrl = s.coverBlob ? URL.createObjectURL(s.coverBlob) : 'assets/images/logo-ccdezz.jpg';

        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 md:p-5 hover:bg-white/5 rounded-[2rem] group transition-all ${isPlaying ? 'playing-now bg-cyan-400/5' : ''}">
                <div class="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 cursor-pointer" onclick="playSong(${s.id}, '${audioUrl}')">
                    <img src="${coverUrl}" class="w-full h-full rounded-2xl object-cover">
                    <div class="absolute inset-0 bg-cyan-400/80 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center justify-center rounded-2xl transition-all">
                        <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-black"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black text-white uppercase truncate tracking-tighter">${s.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase mt-1 tracking-widest">${isPlaying ? 'Playing Now' : 'Audio Track'}</p>
                </div>
                <div class="flex items-center gap-2 md:gap-5">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'text-red-500' : 'text-gray-800'} text-lg transition-all"><i class="fas fa-heart"></i></button>
                    <button onclick="deleteSong(${s.id})" class="text-gray-900 hover:text-red-500 transition-colors p-2"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
            </div>`;
    });
};

// --- ENGINE PLAY ---
const playSong = (id, audioUrl) => {
    currentTrackId = id;
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    renderTracks(songDatabase, document.getElementById('view-title').innerText);
};

// --- UPLOAD TANPA LIMIT (BLOB SYSTEM) ---
const processUpload = async () => {
    const audioFile = document.getElementById('file-audio').files[0];
    const coverFile = document.getElementById('file-cover').files[0];
    const name = document.getElementById('track-name').value;
    const btn = document.getElementById('upload-btn');

    if (!audioFile || !name) return alert("Isi Nama & Pilih Lagu!");

    btn.innerText = "Saving to Station...";
    btn.disabled = true;

    const newSong = {
        id: Date.now(),
        title: name,
        audioBlob: audioFile, // Simpan file asli (Blob)
        coverBlob: coverFile || null
    };

    // Simpan ke IndexedDB
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const addRequest = store.add(newSong);

    addRequest.onsuccess = () => {
        btn.innerText = "Add to Station";
        btn.disabled = false;
        document.getElementById('track-name').value = '';
        closeUploadModal();
        initApp(); // Refresh list
    };

    addRequest.onerror = () => {
        alert("Gagal simpan lagu! Memory penuh atau file bermasalah.");
        btn.disabled = false;
    };
};

// --- DELETE ---
const deleteSong = (id) => {
    if(confirm("Hapus lagu ini?")) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        store.delete(id).onsuccess = () => initApp();
    }
};

// --- OTHER FEATURES ---
function createNewPlaylist() {
    const n = prompt("Nama Playlist:");
    if(n) { playlists[n] = []; localStorage.setItem('cc_playlists', JSON.stringify(playlists)); updatePlaylistNav(); }
}

function updatePlaylistNav() {
    const d = document.getElementById('playlist-nav-list');
    d.innerHTML = '';
    Object.keys(playlists).forEach(p => {
        d.innerHTML += `<a class="nav-link flex items-center justify-between px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-tighter cursor-pointer"><span><i class="fas fa-music mr-3"></i>${p}</span></a>`;
    });
}

const logout = () => { localStorage.removeItem('cc_session'); location.reload(); };
const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Tracks");
const toggleLike = (id) => {
    const i = likedSongs.indexOf(id);
    i > -1 ? likedSongs.splice(i, 1) : likedSongs.push(id);
    localStorage.setItem('cc_liked', JSON.stringify(likedSongs));
    initApp();
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
    }
});
