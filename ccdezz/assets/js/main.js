/**
 * CCDEZZ CORE v8.0 - FINAL STABLE
 */

let songDatabase = JSON.parse(localStorage.getItem('cc_songs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('cc_liked')) || [];
let currentCropper = null;
const audioPlayer = document.getElementById('main-audio-player');

// --- 1. MASTER ACCESS ---
const MASTER_HASH = "MTIzNA=="; // Base64 dari '1234'

const checkMasterKey = () => {
    const val = document.getElementById('master-key').value;
    if (btoa(val) === MASTER_HASH) {
        localStorage.setItem('cc_auth', 'true');
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    } else {
        alert("WRONG KEY!");
    }
};

// --- 2. PROFILE ENGINE (REPAIRED) ---
const initProfile = () => {
    // Ambil nama dari localStorage, jika kosong pakai 'MASTER'
    const name = localStorage.getItem('cc_name') || "MASTER";
    const avatar = localStorage.getItem('cc_avatar');

    // Update semua elemen nama di UI
    document.getElementById('user-name-sidebar').innerText = name;
    document.getElementById('edit-username').value = name;

    const containers = [
        document.getElementById('user-avatar-sidebar'),
        document.getElementById('profile-avatar-large')
    ];

    containers.forEach(c => {
        if (avatar) {
            c.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover">`;
        } else {
            c.innerHTML = `<div class="w-full h-full bg-cyan-400 flex items-center justify-center text-black font-black text-xl">${name[0]}</div>`;
        }
    });
};

const saveProfile = () => {
    const inputName = document.getElementById('edit-username').value.trim();
    if (inputName) {
        localStorage.setItem('cc_name', inputName); // Simpan nama baru
        initProfile(); // Refresh UI profile
        alert("Master Profile Updated!");
        closeModal('profile-modal');
    }
};

document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('crop-img');
            img.src = ev.target.result;
            document.getElementById('cropper-wrap').classList.remove('hidden');
            if (currentCropper) currentCropper.destroy();
            currentCropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    }
});

const applyCrop = () => {
    if (!currentCropper) return;
    const canvas = currentCropper.getCroppedCanvas({ width: 256, height: 256 });
    localStorage.setItem('cc_avatar', canvas.toDataURL());
    document.getElementById('cropper-wrap').classList.add('hidden');
    initProfile();
};

// --- 3. AUDIO ENGINE ---
const playSong = (id) => {
    const song = songDatabase.find(s => s.id == id);
    if (song) {
        audioPlayer.src = song.src;
        audioPlayer.play().catch(e => alert("Click again to play!"));
        console.log("Playing:", song.title);
    }
};

// --- 4. DATA ENGINE ---
const processUpload = async () => {
    const audioF = document.getElementById('file-audio').files[0];
    const coverF = document.getElementById('file-cover').files[0];

    if (!audioF) return alert("Select MP3!");

    const newSong = {
        id: Date.now(),
        title: audioF.name.replace(/\.[^/.]+$/, ""),
        src: await toBase64(audioF),
        cover: coverF ? await toBase64(coverF) : 'assets/images/logo-ccdezz.jpg'
    };

    songDatabase.push(newSong);
    localStorage.setItem('cc_songs', JSON.stringify(songDatabase));
    renderTracks(songDatabase);
    closeModal('upload-modal');
};

const renderTracks = (data, title = "Vibe Station") => {
    const list = document.getElementById('master-track-list');
    document.getElementById('view-title').innerHTML = title.replace(" ", "<br>");
    document.getElementById('track-count').innerText = `${data.length} TRACKS`;
    
    list.innerHTML = '';
    data.forEach(s => {
        const isLiked = likedSongs.includes(s.id);
        list.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl group transition">
                <div class="relative w-12 h-12 flex-shrink-0 cursor-pointer" onclick="playSong(${s.id})">
                    <img src="${s.cover}" class="w-full h-full rounded-lg object-cover shadow-lg">
                    <div class="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition text-black">
                        <i class="fas fa-play text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-white uppercase truncate">${s.title}</p>
                    <p class="text-[9px] text-gray-500 font-bold">STATION_MEDIA_AUTH</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'liked' : 'text-gray-800'} transition"><i class="fas fa-heart"></i></button>
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
    if(confirm("Delete Track?")) {
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

const openModal = (id) => document.getElementById(id).classList.remove('hidden');
const closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
    if(currentCropper) currentCropper.destroy();
};

const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Songs");

const logout = () => {
    if(confirm("WIPE ALL DATA?")) {
        localStorage.clear();
        location.reload();
    }
};

const initApp = () => {
    initProfile();
    renderTracks(songDatabase);
};

// --- LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_auth') === 'true') {
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    }
});
