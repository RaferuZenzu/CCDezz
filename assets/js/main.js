/**
 * CCDEZZ v13.0 - ULTIMATE SPOTIFY ENGINE
 * Features: IndexedDB, Progress Bar, Volume Control, Next/Prev
 */

const dbName = "CCDezzStationDB";
const storeName = "songs";
let db, songDatabase = [], currentQueue = [], currentIdx = -1;

// Audio Elements
const audio = document.getElementById('main-audio-player');
const playBtn = document.getElementById('play-btn');
const progress = document.getElementById('progress-range');
const volume = document.getElementById('volume-range');
const playerBar = document.getElementById('player-bar');

// --- DATABASE INIT ---
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "id" });
};
request.onsuccess = (e) => { db = e.target.result; initApp(); };

async function initApp() {
    const transaction = db.transaction([storeName], "readonly");
    const getAll = transaction.objectStore(storeName).getAll();
    getAll.onsuccess = () => {
        songDatabase = getAll.result;
        renderTracks(songDatabase);
    };
}

// --- RENDERER ---
function renderTracks(data, title = "Vibe Station") {
    const list = document.getElementById('master-track-list');
    document.getElementById('view-title').innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks In Library`;

    if (data.length === 0) {
        list.innerHTML = `<div class="text-center py-20"><button onclick="openUploadModal()" class="bg-cyan-400 text-black font-black py-4 px-8 rounded-full uppercase text-xs">Upload First Song</button></div>`;
        return;
    }

    list.innerHTML = '';
    data.forEach((s, index) => {
        const isPlaying = currentQueue[currentIdx]?.id === s.id;
        list.innerHTML += `
            <div class="flex items-center gap-4 p-3 md:p-4 hover:bg-white/5 rounded-2xl group cursor-pointer transition ${isPlaying ? 'playing-now' : ''}" onclick="playFromList(${index}, ${JSON.stringify(data.map(i => i.id))})">
                <div class="relative w-12 h-12 flex-shrink-0">
                    <img src="${s.coverBlob ? URL.createObjectURL(s.coverBlob) : 'assets/images/logo-ccdezz.jpg'}" class="w-full h-full rounded-lg object-cover">
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <i class="fas fa-play text-white text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate uppercase">${s.title}</h4>
                    <p class="text-[10px] text-gray-500 uppercase">Track #${index + 1}</p>
                </div>
                <button onclick="event.stopPropagation(); deleteSong(${s.id})" class="text-gray-700 hover:text-red-500 p-2"><i class="fas fa-trash"></i></button>
            </div>`;
    });
}

// --- PLAYER ENGINE ---
function playFromList(index, idList) {
    currentQueue = songDatabase.filter(s => idList.includes(s.id));
    currentIdx = index;
    loadAndPlay();
}

function loadAndPlay() {
    const song = currentQueue[currentIdx];
    if (!song) return;

    // Tampilkan Player Bar
    playerBar.classList.remove('translate-y-full');
    
    // Update UI Player
    document.getElementById('p-title').innerText = song.title;
    document.getElementById('p-cover').src = song.coverBlob ? URL.createObjectURL(song.coverBlob) : 'assets/images/logo-ccdezz.jpg';
    
    // Play Audio
    audio.src = URL.createObjectURL(song.audioBlob);
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause text-xl"></i>';
    renderTracks(songDatabase, document.getElementById('view-title').innerText.replace('<br>', ' '));
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause text-xl"></i>';
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play text-xl"></i>';
    }
}

function nextSong() {
    currentIdx = (currentIdx + 1) % currentQueue.length;
    loadAndPlay();
}

function prevSong() {
    currentIdx = (currentIdx - 1 + currentQueue.length) % currentQueue.length;
    loadAndPlay();
}

// --- AUDIO EVENTS ---
audio.ontimeupdate = () => {
    const cur = audio.currentTime;
    const dur = audio.duration;
    if (dur) {
        progress.value = (cur / dur) * 100;
        document.getElementById('time-current').innerText = formatTime(cur);
        document.getElementById('time-total').innerText = formatTime(dur);
    }
};

progress.oninput = () => {
    const time = (progress.value / 100) * audio.duration;
    audio.currentTime = time;
};

volume.oninput = () => {
    audio.volume = volume.value;
};

audio.onended = () => nextSong();

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

// --- UPLOAD LOGIC ---
async function processUpload() {
    const aFile = document.getElementById('file-audio').files[0];
    const cFile = document.getElementById('file-cover').files[0];
    const name = document.getElementById('track-name').value;
    const btn = document.getElementById('upload-btn');

    if (!aFile || !name) return alert("Wajib isi nama dan file audio!");

    btn.innerText = "Encrypting...";
    btn.disabled = true;

    const newTrack = { id: Date.now(), title: name, audioBlob: aFile, coverBlob: cFile || null };
    const transaction = db.transaction([storeName], "readwrite");
    transaction.objectStore(storeName).add(newTrack).onsuccess = () => {
        btn.innerText = "Success!";
        setTimeout(() => {
            btn.innerText = "Add to Station";
            btn.disabled = false;
            closeUploadModal();
            initApp();
        }, 1000);
    };
}

// --- HELPERS ---
const checkMasterKey = () => {
    if (btoa(document.getElementById('master-key').value) === "MTIzNA==") {
        localStorage.setItem('cc_session', 'authorized');
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    } else alert("WRONG KEY");
};

const deleteSong = (id) => {
    if (confirm("Delete this track?")) {
        const trans = db.transaction([storeName], "readwrite");
        trans.objectStore(storeName).delete(id).onsuccess = () => initApp();
    }
};

const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const logout = () => { localStorage.removeItem('cc_session'); location.reload(); };

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') document.getElementById('auth-screen').classList.add('hidden');
});
