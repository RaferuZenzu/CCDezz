/**
 * CCDEZZ CORE v9.0 - NO PROFILE VERSION
 */

let songDatabase = JSON.parse(localStorage.getItem('cc_songs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('cc_liked')) || [];
const audioPlayer = document.getElementById('main-audio-player');

// --- 1. MASTER KEY ACCESS ---
const M_KEY = "MTIzNA=="; // Default: 1234

const checkMasterKey = () => {
    const input = document.getElementById('master-key').value;
    if (btoa(input) === M_KEY) {
        localStorage.setItem('cc_session', 'authorized');
        document.getElementById('auth-screen').classList.add('hidden');
        renderTracks(songDatabase);
    } else {
        alert("ACCESS DENIED: Master Key Incorrect");
    }
};

// --- 2. MUSIC ENGINE ---
const playSong = (id) => {
    const song = songDatabase.find(s => s.id == id);
    if (!song) return;
    
    audioPlayer.src = song.src;
    audioPlayer.play()
        .then(() => console.log("Now playing:", song.title))
        .catch(err => {
            console.error("Playback error:", err);
            alert("Error: Browser blocked autoplay or file is corrupted.");
        });
};

// --- 3. TRACK RENDERER ---
const renderTracks = (data, title = "Vibe Station") => {
    const list = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    viewTitle.innerHTML = title.includes(" ") ? title.replace(" ", "<br>") : title;
    document.getElementById('track-count').innerText = `${data.length} Tracks In Library`;
    
    list.innerHTML = '';
    
    if (data.length === 0) {
        list.innerHTML = `
            <div class="py-20 text-center opacity-30">
                <i class="fas fa-compact-disc text-5xl mb-4 animate-spin-slow"></i>
                <p class="text-[10px] font-black uppercase tracking-[0.4em]">Library is Empty</p>
            </div>`;
        return;
    }

    data.forEach(s => {
        const isLiked = likedSongs.includes(s.id);
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl group transition-all border border-transparent hover:border-white/5">
                <div class="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 cursor-pointer shadow-xl" onclick="playSong(${s.id})">
                    <img src="${s.cover}" class="w-full h-full rounded-xl object-cover border border-white/5">
                    <div class="absolute inset-0 bg-cyan-400/90 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all duration-300">
                        <i class="fas fa-play text-black text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-black text-white uppercase truncate tracking-tight">${s.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase mt-1">Authorized Stream • Local Storage</p>
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'liked' : 'text-gray-800'} transition-transform active:scale-150">
                        <i class="fas fa-heart text-sm md:text-base"></i>
                    </button>
                    <button onclick="deleteSong(${s.id})" class="text-gray-900 group-hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <i class="fas fa-trash-alt text-xs md:text-sm"></i>
                    </button>
                </div>
            </div>`;
    });
};

// --- 4. UPLOAD LOGIC ---
const processUpload = async () => {
    const audio = document.getElementById('file-audio').files[0];
    const cover = document.getElementById('file-cover').files[0];
    const btn = document.getElementById('upload-btn');

    if (!audio) return alert("Please select an MP3 file!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
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
        
        // Reset Inputs
        document.getElementById('file-audio').value = '';
        document.getElementById('file-cover').value = '';
    } catch (err) {
        alert("Error processing file!");
    } finally {
        btn.innerText = "Save to Library";
        btn.disabled = false;
    }
};

const toggleLike = (id) => {
    const idx = likedSongs.indexOf(id);
    idx > -1 ? likedSongs.splice(idx, 1) : likedSongs.push(id);
    localStorage.setItem('cc_liked', JSON.stringify(likedSongs));
    renderTracks(songDatabase);
};

const deleteSong = (id) => {
    if(confirm("Permanently delete this track?")) {
        songDatabase = songDatabase.filter(s => s.id !== id);
        localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
        renderTracks(songDatabase);
    }
};

// --- UTILS ---
const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = e => rej(e);
    r.readAsDataURL(f);
});

const logout = () => {
    if(confirm("Lock station and clear session? (Data music tetap aman)")) {
        localStorage.removeItem('cc_session');
        location.reload();
    }
};

const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Tracks");

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
        renderTracks(songDatabase);
    }
});
