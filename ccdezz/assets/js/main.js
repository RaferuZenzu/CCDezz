/**
 * CCDEZZ CORE v10.0 - PLAYLIST & NAMING UPDATE
 */

let songDatabase = JSON.parse(localStorage.getItem('cc_songs')) || [];
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
    } else {
        alert("ACCESS DENIED");
    }
};

// --- CORE APP ---
function initApp() {
    renderTracks(songDatabase);
    updatePlaylistNav();
}

// --- MUSIC ENGINE ---
const playSong = (id) => {
    const song = songDatabase.find(s => s.id == id);
    if (!song) return;
    
    currentTrackId = id;
    audioPlayer.src = song.src;
    audioPlayer.play();
    renderTracks(currentPlayingList, currentViewTitle); // Refresh UI to show playing state
};

// AUTO-PLAY NEXT
audioPlayer.onended = () => {
    const currentIndex = currentPlayingList.findIndex(s => s.id === currentTrackId);
    if (currentIndex > -1 && currentIndex < currentPlayingList.length - 1) {
        playSong(currentPlayingList[currentIndex + 1].id);
    }
};

// --- RENDERER ---
let currentPlayingList = [];
let currentViewTitle = "";

const renderTracks = (data, title = "Vibe Station") => {
    currentPlayingList = data;
    currentViewTitle = title;
    
    const list = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    viewTitle.innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks`;
    
    list.innerHTML = '';
    
    if (data.length === 0) {
        list.innerHTML = `<div class="py-20 text-center opacity-20 uppercase font-black text-[10px] tracking-widest">Empty Library</div>`;
        return;
    }

    data.forEach(s => {
        const isLiked = likedSongs.includes(s.id);
        const isPlaying = currentTrackId === s.id;
        
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl group transition-all ${isPlaying ? 'playing-now' : ''}">
                <div class="relative w-12 h-12 flex-shrink-0 cursor-pointer" onclick="playSong(${s.id})">
                    <img src="${s.cover || 'https://via.placeholder.com/150/020617/00F2FF?text=MUSIC'}" class="w-full h-full rounded-xl object-cover border border-white/5">
                    <div class="absolute inset-0 bg-cyan-400/80 ${isPlaying ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all">
                        <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-black text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-black text-white uppercase truncate">${s.title}</h4>
                    <p class="text-[8px] text-gray-500 uppercase mt-1 tracking-widest">${isPlaying ? 'Now Playing' : 'Ready to Play'}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'liked' : 'text-gray-800'} transition-transform active:scale-150">
                        <i class="fas fa-heart text-xs"></i>
                    </button>
                    <button onclick="deleteSong(${s.id})" class="text-gray-900 group-hover:text-red-500 transition-colors">
                        <i class="fas fa-trash-alt text-[10px]"></i>
                    </button>
                </div>
            </div>`;
    });
};

// --- UPLOAD ---
const processUpload = async () => {
    const audioFile = document.getElementById('file-audio').files[0];
    const coverFile = document.getElementById('file-cover').files[0];
    const trackName = document.getElementById('track-name').value;
    const btn = document.getElementById('upload-btn');

    if (!audioFile || !trackName) return alert("Track Name and Audio File are required!");

    btn.innerText = "Encoding...";
    btn.disabled = true;

    try {
        const song = {
            id: Date.now(),
            title: trackName,
            src: await toBase64(audioFile),
            cover: coverFile ? await toBase64(coverFile) : null
        };

        songDatabase.push(song);
        localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
        
        renderTracks(songDatabase);
        closeUploadModal();
        
        // Reset
        document.getElementById('track-name').value = '';
        document.getElementById('file-audio').value = '';
        document.getElementById('file-cover').value = '';
    } catch (err) {
        alert("Upload failed!");
    } finally {
        btn.innerText = "Save Track";
        btn.disabled = false;
    }
};

// --- PLAYLIST LOGIC ---
function createNewPlaylist() {
    const name = prompt("Playlist Name:");
    if (name) {
        playlists[name] = [];
        localStorage.setItem('cc_playlists', JSON.stringify(playlists));
        updatePlaylistNav();
    }
}

function updatePlaylistNav() {
    const nav = document.getElementById('playlist-nav-list');
    nav.innerHTML = '';
    Object.keys(playlists).forEach(name => {
        nav.innerHTML += `
            <div class="flex items-center justify-between group px-5 py-2">
                <a onclick="renderPlaylist('${name}')" class="text-sm font-bold text-gray-400 hover:text-cyan-400 cursor-pointer transition flex-1 truncate uppercase tracking-tighter">
                    <i class="fas fa-list-ul mr-3 text-[10px]"></i> ${name}
                </a>
                <button onclick="deletePlaylist('${name}')" class="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition ml-2">
                    <i class="fas fa-times text-[10px]"></i>
                </button>
            </div>`;
    });
}

function renderPlaylist(name) {
    const playlistSongs = songDatabase.filter(s => playlists[name].includes(s.id));
    renderTracks(playlistSongs, name);
}

function deletePlaylist(name) {
    if(confirm(`Delete playlist "${name}"?`)) {
        delete playlists[name];
        localStorage.setItem('cc_playlists', JSON.stringify(playlists));
        updatePlaylistNav();
        renderTracks(songDatabase);
    }
}

// --- UTILS ---
const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(f);
});

const toggleLike = (id) => {
    const idx = likedSongs.indexOf(id);
    idx > -1 ? likedSongs.splice(idx, 1) : likedSongs.push(id);
    localStorage.setItem('cc_liked', JSON.stringify(likedSongs));
    renderTracks(currentPlayingList, currentViewTitle);
};

const deleteSong = (id) => {
    if(confirm("Delete this track?")) {
        songDatabase = songDatabase.filter(s => s.id !== id);
        localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
        renderTracks(songDatabase);
    }
};

const logout = () => { localStorage.removeItem('cc_session'); location.reload(); };
const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Tracks");

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    }
});
