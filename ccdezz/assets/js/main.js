/**
 * CCDEZZ CORE v8.0 - UNIFIED PROFILE SAVE & FIXED AUDIO
 */

let songDatabase = JSON.parse(localStorage.getItem('cc_songs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('cc_liked')) || [];
let currentCropper = null;
let tempAvatarBase64 = null; // Menyimpan foto sementara sebelum disave

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

// --- 2. AUDIO ENGINE ---
const audioPlayer = document.getElementById('main-audio-player');

const playSong = (id) => {
    const song = songDatabase.find(s => s.id == id);
    if (!song) return;
    
    audioPlayer.src = song.src;
    audioPlayer.play().catch(e => alert("Error playing audio: " + e));
    console.log("Playing:", song.title);
};

// --- 3. PROFILE SYSTEM (FIXED & UNIFIED) ---
const initProfileUI = () => {
    const name = localStorage.getItem('cc_user_name') || "MASTER";
    const avatar = localStorage.getItem('cc_user_avatar');

    document.getElementById('user-name-sidebar').innerText = name;
    document.getElementById('edit-username').value = name;

    const containers = [
        document.getElementById('user-avatar-sidebar'),
        document.getElementById('profile-avatar-preview')
    ];

    containers.forEach(c => {
        if (avatar) {
            c.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover">`;
        } else {
            c.innerHTML = `<div class="w-full h-full bg-cyan-400 flex items-center justify-center text-black font-black uppercase">${name[0]}</div>`;
        }
    });
};

// Handle Foto Input (Belum menyimpan ke LocalStorage)
document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('crop-img');
            img.src = ev.target.result;
            document.getElementById('cropper-area').classList.remove('hidden');
            if (currentCropper) currentCropper.destroy();
            currentCropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    }
});

// Konfirmasi Crop (Belum menyimpan ke LocalStorage)
const confirmCrop = () => {
    if (!currentCropper) return;
    const canvas = currentCropper.getCroppedCanvas({ width: 250, height: 250 });
    tempAvatarBase64 = canvas.toDataURL(); // Simpan di variable dulu
    
    // Preview sementara di modal
    document.getElementById('profile-avatar-preview').innerHTML = `<img src="${tempAvatarBase64}" class="w-full h-full object-cover">`;
    
    document.getElementById('cropper-area').classList.add('hidden');
    currentCropper.destroy();
    currentCropper = null;
    alert("Photo confirmed! Click 'Save & Update' to apply changes.");
};

// Tombol Save Akhir (Nama + Foto)
const saveAllProfileData = () => {
    const newName = document.getElementById('edit-username').value.trim();
    
    if (!newName) return alert("Name cannot be empty!");

    // Simpan Nama
    localStorage.setItem('cc_user_name', newName);

    // Simpan Foto jika ada perubahan
    if (tempAvatarBase64) {
        localStorage.setItem('cc_user_avatar', tempAvatarBase64);
    }

    alert("Profile Updated Successfully!");
    location.reload(); // Refresh untuk update seluruh UI
};

// --- 4. DATA LOGIC ---
const processUpload = async () => {
    const audio = document.getElementById('file-audio').files[0];
    const cover = document.getElementById('file-cover').files[0];

    if (!audio) return alert("Please select an MP3 file!");

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
                    <p class="text-[9px] text-gray-600 uppercase">Local Storage Source</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="toggleLike(${s.id})" class="${isLiked ? 'liked' : 'text-gray-800'} transition active:scale-125"><i class="fas fa-heart"></i></button>
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
    if(confirm("Delete this track?")) {
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

const logout = () => { if(confirm("Clear all data and exit?")) { localStorage.clear(); location.reload(); } };
const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const openProfileModal = () => document.getElementById('profile-modal').classList.remove('hidden');
const closeProfileModal = () => {
    document.getElementById('profile-modal').classList.add('hidden');
    if(currentCropper) currentCropper.destroy();
    document.getElementById('cropper-area').classList.add('hidden');
};
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Liked Songs");

const initApp = () => {
    initProfileUI();
    renderTracks(songDatabase);
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cc_session') === 'authorized') {
        document.getElementById('auth-screen').classList.add('hidden');
        initApp();
    }
});
