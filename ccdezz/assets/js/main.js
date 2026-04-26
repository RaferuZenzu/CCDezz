/**
 * CCDEZZ CORE ENGINE v5.0 - NO URL VERSION
 */

let songDatabase = JSON.parse(localStorage.getItem('ccdezz_songs')) || [];
let playlists = JSON.parse(localStorage.getItem('ccdezz_playlists')) || {};
let likedSongs = JSON.parse(localStorage.getItem('ccdezz_liked')) || [];
let isSignUpMode = false;
let tempCroppedAvatar = null;
let cropper = null;

// --- 1. AUTH & SESSION ---
const handleAuth = () => {
    const iden = document.getElementById('auth-identifier').value.trim();
    const pass = document.getElementById('auth-password').value;
    
    if (isSignUpMode) {
        if(!iden || !pass) return alert("Isi data lengkap!");
        localStorage.setItem('ccdezz_user', iden);
        localStorage.setItem('ccdezz_email', document.getElementById('reg-email').value || iden + "@mail.com");
        localStorage.setItem('ccdezz_pass', pass);
        alert("Pendaftaran Berhasil! Silakan Login.");
        toggleAuthMode();
    } else {
        const savedUser = localStorage.getItem('ccdezz_user');
        const savedPass = localStorage.getItem('ccdezz_pass');
        if (iden === savedUser && pass === savedPass) {
            localStorage.setItem('ccdezz_session', 'active');
            location.reload();
        } else {
            alert("Data Login Salah!");
        }
    }
};

const toggleAuthMode = () => {
    isSignUpMode = !isSignUpMode;
    document.getElementById('signup-fields').classList.toggle('hidden');
    document.getElementById('auth-btn').innerText = isSignUpMode ? "Register Now" : "Sign In";
    document.getElementById('auth-status').innerText = isSignUpMode ? "Buat akun stasiun barumu" : "Masuk ke stasiun musikmu";
};

// --- 2. UPLOAD LOGIC (MP3 LOKAL SAJA) ---
const processUpload = async () => {
    const audioFile = document.getElementById('file-audio').files[0];
    const coverFile = document.getElementById('file-cover').files[0];

    if (!audioFile) return alert("Pilih file MP3 terlebih dahulu!");

    let newSong = {
        id: Date.now(),
        title: audioFile.name.replace(/\.[^/.]+$/, ""),
        src: await toBase64(audioFile),
        cover: coverFile ? await toBase64(coverFile) : 'assets/images/logo-ccdezz.jpg',
        date: new Date().toLocaleDateString()
    };

    songDatabase.push(newSong);
    saveData();
    renderTracks(songDatabase);
    closeUploadModal();
};

// --- 3. PLAYLIST SYSTEM (DENGAN FITUR HAPUS) ---
const createPlaylist = () => {
    const name = prompt("Masukkan Nama Playlist:");
    if (name) {
        const cleanName = name.trim();
        if(playlists[cleanName]) return alert("Nama playlist sudah ada!");
        playlists[cleanName] = [];
        saveData();
        renderPlaylistNav();
    }
};

const deletePlaylist = (name) => {
    if(confirm(`Hapus playlist "${name}"?`)) {
        delete playlists[name];
        saveData();
        renderPlaylistNav();
        renderTracks(songDatabase); // Kembali ke beranda
    }
};

const toggleLike = (id) => {
    const index = likedSongs.indexOf(id);
    if (index > -1) likedSongs.splice(index, 1);
    else likedSongs.push(id);
    saveData();
    renderTracks(songDatabase);
};

const deleteSong = (id) => {
    if(confirm("Hapus lagu ini secara permanen?")) {
        songDatabase = songDatabase.filter(s => s.id !== id);
        likedSongs = likedSongs.filter(sid => sid !== id);
        // Hapus juga dari semua playlist
        Object.keys(playlists).forEach(key => {
            playlists[key] = playlists[key].filter(sid => sid !== id);
        });
        saveData();
        renderTracks(songDatabase);
    }
};

// --- 4. DINAMIS RENDERERS ---
const renderTracks = (data, title = "Vibe Station") => {
    const container = document.getElementById('master-track-list');
    const viewTitle = document.getElementById('view-title');
    
    // Animasi judul dinamis
    viewTitle.style.opacity = 0;
    setTimeout(() => {
        viewTitle.innerHTML = title.replace(" ", "<br>");
        viewTitle.style.opacity = 1;
    }, 200);

    document.getElementById('track-count').innerText = `${data.length} Tracks In Library`;
    container.innerHTML = '';

    if(data.length === 0) {
        container.innerHTML = `<p class="text-gray-600 text-center py-10 text-xs italic uppercase tracking-widest">Tidak ada lagu ditemukan</p>`;
    }

    data.forEach((song) => {
        const isLiked = likedSongs.includes(song.id);
        container.innerHTML += `
            <div class="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl group transition-all duration-300 border border-transparent hover:border-white/5">
                <div class="relative w-12 h-12 flex-shrink-0">
                    <img src="${song.cover}" class="w-full h-full rounded-lg object-cover shadow-lg">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition">
                        <i class="fas fa-play text-white text-xs"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold uppercase text-white truncate">${song.title}</p>
                    <p class="text-[9px] text-gray-500 uppercase tracking-tighter">Local Storage • CCDEZZ Engine</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleLike(${song.id})" class="${isLiked ? 'liked' : 'text-gray-700'} hover:scale-125 transition">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="deleteSong(${song.id})" class="text-gray-800 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
    });
};

const renderPlaylistNav = () => {
    const nav = document.getElementById('playlist-nav');
    nav.innerHTML = '';
    Object.keys(playlists).forEach(name => {
        nav.innerHTML += `
            <div class="flex items-center group px-2">
                <a onclick="renderTracks(getPlaylistData('${name}'), '${name}')" class="nav-link flex-1 flex items-center gap-4 px-4 py-3 text-xs text-gray-400 capitalize rounded-l-lg">
                    <i class="fas fa-list-ul text-[10px]"></i> ${name}
                </a>
                <button onclick="deletePlaylist('${name}')" class="bg-transparent text-gray-700 hover:text-red-500 p-3 rounded-r-lg opacity-0 group-hover:opacity-100 transition">
                    <i class="fas fa-times"></i>
                </button>
            </div>`;
    });
};

// --- 5. PROFILE & IMAGE PROCESSING ---
const updateProfileUI = () => {
    const user = localStorage.getItem('ccdezz_user') || "Guest User";
    const email = localStorage.getItem('ccdezz_email') || "guest@ccdezz.com";
    const avatar = localStorage.getItem('ccdezz_user_avatar');

    document.getElementById('user-display-name').innerText = user;
    document.getElementById('user-display-email').innerText = "@" + email.split('@')[0];

    const container = document.getElementById('user-avatar-container');
    if (avatar) {
        container.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover">`;
    } else {
        container.innerHTML = `<div class="avatar-circle w-full h-full bg-cyan-400 text-black text-xs">${user.charAt(0)}</div>`;
    }
};

document.getElementById('edit-avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('crop-preview');
            img.src = ev.target.result;
            document.getElementById('cropper-container').classList.remove('hidden');
            if(cropper) cropper.destroy();
            cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    }
});

const saveCroppedAvatar = () => {
    if(!cropper) return;
    tempCroppedAvatar = cropper.getCroppedCanvas({width:200, height:200}).toDataURL();
    alert("Foto berhasil diproses! Klik Update Profil untuk menyimpan.");
    document.getElementById('cropper-container').classList.add('hidden');
};

const saveProfile = () => {
    const name = document.getElementById('edit-username').value;
    if(name) localStorage.setItem('ccdezz_user', name);
    if(tempCroppedAvatar) localStorage.setItem('ccdezz_user_avatar', tempCroppedAvatar);
    location.reload();
};

const deleteAccount = () => {
    if(confirm("PERINGATAN: Menghapus akun akan membersihkan SEMUA data lagu dan playlist Anda. Lanjutkan?")) {
        localStorage.clear();
        location.reload();
    }
};

// --- UTILS ---
const saveData = () => {
    localStorage.setItem('ccdezz_songs', JSON.stringify(songDatabase));
    localStorage.setItem('ccdezz_playlists', JSON.stringify(playlists));
    localStorage.setItem('ccdezz_liked', JSON.stringify(likedSongs));
};

const toBase64 = f => new Promise(res => { 
    const r = new FileReader(); 
    r.onload = () => res(r.result); 
    r.readAsDataURL(f); 
});

const getPlaylistData = name => songDatabase.filter(s => playlists[name].includes(s.id));
const renderLiked = () => renderTracks(songDatabase.filter(s => likedSongs.includes(s.id)), "Songs Liked");

const openUploadModal = () => document.getElementById('upload-modal').classList.remove('hidden');
const closeUploadModal = () => document.getElementById('upload-modal').classList.add('hidden');
const openProfileModal = () => document.getElementById('profile-modal').classList.remove('hidden');
const closeProfileModal = () => {
    document.getElementById('profile-modal').classList.add('hidden');
    if(cropper) cropper.destroy();
    document.getElementById('cropper-container').classList.add('hidden');
};

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('ccdezz_session') === 'active') {
        document.getElementById('auth-screen').classList.add('hidden');
        updateProfileUI();
        renderTracks(songDatabase);
        renderPlaylistNav();
    }
});