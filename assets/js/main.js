/**
 * CCDEZZ v14.0 - FULL SPOTIFY EXPERIENCE
 */

const dbName = "CCDezzDB_V14";
const storeName = "songs";
let db, songDatabase = [], currentQueue = [], currentIdx = -1;

const audio = document.getElementById('main-audio-player');
const playerBar = document.getElementById('player-bar');
const playerPage = document.getElementById('player-page');

// --- DATABASE ENGINE ---
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

// --- UI RENDERER ---
function renderTracks(data, title = "Vibe Station") {
    const list = document.getElementById('master-track-list');
    document.getElementById('view-title').innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks Library`;

    if (data.length === 0) {
        list.innerHTML = `<div class="text-center py-20 text-gray-600 font-black uppercase tracking-widest italic">Belum ada lagu, Rafri!</div>`;
        return;
    }

    list.innerHTML = '';
    data.forEach((s, index) => {
        const isPlaying = currentQueue[currentIdx]?.id === s.id;
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.5rem] group cursor-pointer transition mb-2 ${isPlaying ? 'playing-now' : ''}" onclick="playFromList(${index}, ${JSON.stringify(data.map(i => i.id))})">
                <div class="relative w-12 h-12 flex-shrink-0">
                    <img src="${s.coverBlob ? URL.createObjectURL(s.coverBlob) : 'assets/images/logo-ccdezz.jpg'}" class="w-full h-full rounded-lg object-cover">
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition">
                        <i class="fas ${isPlaying && !audio.paused ? 'fa-pause' : 'fa-play'} text-white text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black text-white truncate uppercase tracking-tighter">${s.title}</h4>
                    <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">${isPlaying ? 'Now Playing' : 'CCDEZZ Track'}</p>
                </div>
                <button onclick="event.stopPropagation(); deleteSong(${s.id})" class="btn-delete p-3 text-lg hover:scale-125 transition">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>`;
    });
}

// --- PLAYER CONTROLLER ---
function playFromList(index, idList) {
    currentQueue = songDatabase.filter(s => idList.includes(s.id));
    currentIdx = index;
    loadAndPlay();
}

function loadAndPlay() {
    const song = currentQueue[currentIdx];
    if (!song) return;

    // Show Player Bar
    playerBar.classList.remove('translate-y-full');
    
    // Update Information
    const titleEls = [document.getElementById('p-title'), document.getElementById('full-p-title')];
    const coverEls = [document.getElementById('p-cover'), document.getElementById('full-p-cover')];
    
    const coverUrl = song.coverBlob ? URL.createObjectURL(song.coverBlob) : 'assets/images/logo-ccdezz.jpg';
    
    titleEls.forEach(el => el.innerText = song.title);
    coverEls.forEach(el => el.src = coverUrl);
    
    // Play Audio
    audio.src = URL.createObjectURL(song.audioBlob);
    audio.play();
    updatePlayIcons(true);
    renderTracks(songDatabase, document.getElementById('view-title').innerText.replace('<br>', ' '));
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        updatePlayIcons(true);
    } else {
        audio.pause();
        updatePlayIcons(false);
    }
}

function updatePlayIcons(isPlaying) {
    const icons = ['main-play-btn', 'mob-play-btn', 'full-play-btn'];
    icons.forEach(id => {
        const el = document.getElementById(id);
        el.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play ml-1"></i>';
    });
}

function nextSong() {
    if (currentQueue.length === 0) return;
    currentIdx = (currentIdx + 1) % currentQueue.length;
    loadAndPlay();
}

function prevSong() {
    if (currentQueue.length === 0) return;
    currentIdx = (currentIdx - 1 + currentQueue.length) % currentQueue.length;
    loadAndPlay();
}

// --- SLIDER & VOLUME ---
audio.ontimeupdate = () => {
    const cur = audio.currentTime;
    const dur = audio.duration;
    if (dur) {
        const perc = (cur / dur) * 100;
        document.getElementById('p-slider').value = perc;
        document.getElementById('full-p-slider').value = perc;
        
        document.getElementById('p-time-cur').innerText = formatTime(cur);
        document.getElementById('full-time-cur').innerText = formatTime(cur);
        document.getElementById('p-time-dur').innerText = formatTime(dur);
        document.getElementById('full-time-dur').innerText = formatTime(dur);
    }
};

const handleSeek = (e) => {
    const time = (e.target.value / 100) * audio.duration;
    audio.currentTime = time;
};

document.getElementById('p-slider').oninput = handleSeek;
document.getElementById('full-p-slider').oninput = handleSeek;
document.getElementById('volume-slider').oninput = (e) => audio.volume = e.target.value;

audio.onended = () => nextSong();

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

// --- NAVIGATION ---
function togglePlayerPage(show) {
    if (show) playerPage.classList.add('active');
    else playerPage.classList.remove('active');
}

// --- UPLOAD LOGIC ---
async function processUpload() {
    const aFile = document.getElementById('file-audio').files[0];
    const cFile = document.getElementById('file-cover').files[0];
    const name = document.getElementById('track-name').value;
    const btn = document.getElementById('upload-btn');

    if (!aFile || !name) return alert("Track Title & Audio File Required!");

    btn.innerText = "Processing Data...";
    btn.disabled = true;

    const newTrack = { id: Date.now(), title: name, audioBlob: aFile, coverBlob: cFile || null };
    const transaction = db.transaction([storeName], "readwrite");
    transaction.objectStore(storeName).add(newTrack).onsuccess = () => {
        btn.innerText = "Success!";
        setTimeout(() => {
            btn.innerText = "Add Music";
            btn.disabled = false;
            closeUploadModal();
            initApp();
        }, 1000);
    };
}

// --- CORE SYSTEM ---
function checkMasterKey() {
    if (btoa(document.getElementById('master-key').value) === "MTIzNA==") {
        localStorage.setItem('cc_session', 'authorized');
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    } else alert("INVALID ACCESS");
}

function deleteSong(id) {
    if (confirm("Delete this masterpiece from your library?")) {
        const trans = db.transaction([storeName], "readwrite");
        trans.objectStore(storeName).delete(id).onsuccess = () => initApp();
    }
}

const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const logout = () => { localStorage.removeItem('cc_session'); location.reload(); };

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
    }
});
