/**
 * CCDEZZ v11.0 - FULL DYNAMIC RESPONSIVE
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
    } else { alert("WRONG KEY"); }
};

// --- INITIALIZE ---
function initApp() {
    renderTracks(songDatabase);
    updatePlaylistNav();
}

// --- RENDERER (Dinamis untuk HP & Desktop) ---
const renderTracks = (data, title = "Vibe Station") => {
    const list = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    viewTitle.innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks In Library`;
    
    // Tampilan Jika Kosong (TOMBOL DI TENGAH)
    if (data.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                    <i class="fas fa-compact-disc text-4xl text-gray-700 animate-spin-slow"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-400 mb-2 italic uppercase">Belum ada lagu, Rafri</h3>
                <p class="text-gray-600 text-[10px] uppercase tracking-[0.3em] mb-10">Upload musik favoritmu sekarang</p>
                
                <button onclick="openUploadModal()" class="btn-center-pulse flex items-center gap-4 bg-cyan-400 text-black font-black py-5 px-10 rounded-[2rem] uppercase text-xs tracking-widest hover:scale-105 transition-all">
                    <i class="fas fa-cloud-upload-alt text-xl"></i>
                    Upload Sekarang
                </button>
            </div>`;
        return;
    }

    list.innerHTML = '';
    data.forEach(s => {
        const isPlaying = currentTrackId === s.id;
        const isLiked = likedSongs.includes(s.id);
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 md:p-5 hover:bg-white/5 rounded-[2rem] group transition-all ${isPlaying ? 'playing-now bg-cyan-400/5' : ''}">
                <div class="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 cursor-pointer" onclick="playSong(${s.id}, ${JSON.stringify(data).replace(/"/g, '&quot;')})">
                    <img src="${s.cover || 'https://via.placeholder.com/150/020617/00F2FF?text=CC'}" class="w-full h-full rounded-2xl object-cover">
                    <div class="absolute inset-0 bg-cyan-400/80 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center justify-center rounded-2xl transition-all">
                        <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-black"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black text-white uppercase truncate tracking-tighter">${s.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase mt-1 tracking-widest">${isPlaying ? 'Playing Now' : 'Audio Track'}</p>
                </div>
                <div class="flex items-center gap-2 md:gap-5">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'text-red-500' : 'text-gray-800'} text-lg active:scale-150 transition-all"><i class="fas fa-heart"></i></button>
                    <button onclick="deleteSong(${s.id})" class="text-gray-900 hover:text-red-500 transition-colors p-2"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
            </div>`;
    });
};

// --- ENGINE ---
const playSong = (id, list) => {
    const song = songDatabase.find(s => s.id == id);
    if (!song) return;
    currentTrackId = id;
    audioPlayer.src = song.src;
    audioPlayer.play();
    renderTracks(list, document.getElementById('view-title').innerText);
};

// --- UPLOAD LOGIC ---
const processUpload = async () => {
    const audio = document.getElementById('file-audio').files[0];
    const cover = document.getElementById('file-cover').files[0];
    const name = document.getElementById('track-name').value;
    const btn = document.getElementById('upload-btn');

    if (!audio || !name) return alert("Isi Nama & File Audio!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const song = {
            id: Date.now(),
            title: name,
            src: await toBase64(audio),
            cover: cover ? await toBase64(cover) : null
        };
        songDatabase.push(song);
        localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
        renderTracks(songDatabase);
        closeUploadModal();
    } catch (e) { alert("Gagal Encode File!"); }
    finally { btn.innerText = "Add to Station"; btn.disabled = false; }
};

// --- HELPERS ---
const toBase64 = f => new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(f);
});

function createNewPlaylist() {
    const n = prompt("Nama Playlist:");
    if(n) { playlists[n] = []; localStorage.setItem('cc_playlists', JSON.stringify(playlists)); updatePlaylistNav(); }
}

function updatePlaylistNav() {
    const d = document.getElementById('playlist-nav-list');
    d.innerHTML = '';
    Object.keys(playlists).forEach(p => {
        d.innerHTML += `<a onclick="renderPlaylist('${p}')" class="nav-link flex items-center justify-between px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-tighter cursor-pointer"><span><i class="fas fa-music mr-3"></i>${p}</span></a>`;
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
        initApp();
    }
});
