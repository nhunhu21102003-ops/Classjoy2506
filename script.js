import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_bCjtuPvQ2VvTQCMvaE2LZx-wGPIrsaM",
  authDomain: "classjoy-1002f.firebaseapp.com",
  databaseURL: "https://classjoy-1002f-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "classjoy-1002f",
  storageBucket: "classjoy-1002f.firebasestorage.app",
  messagingSenderId: "598580384018",
  appId: "1:598580384018:web:bd967c01cf077db61d23cb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let classes = [];
let currentClassIndex = null;
const animalIcons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐣', '🐧', '🦄', '🐝', '🦒'];

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        document.getElementById('toggle-sidebar').classList.remove('hidden');
        document.getElementById('user-info').innerText = `Teacher: ${user.displayName.split(' ')[0]} 🎀`;
        loadData();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-layout').classList.add('hidden');
        document.getElementById('toggle-sidebar').classList.add('hidden');
    }
});

const loadData = () => {
    onValue(ref(db, 'classes/'), (snapshot) => {
        classes = snapshot.val() || [];
        renderSidebar();
        currentClassIndex !== null ? renderStudents() : renderDashboard();
    });
};

const syncData = () => set(ref(db, 'classes/'), classes);

function getRankInfo(points) {
    if (points >= 10) return { label: "🏆 Mythic", class: "rank-3" };
    if (points >= 5) return { label: "💎 Diamond", class: "rank-2" };
    if (points >= 3) return { label: "⭐ Gold", class: "rank-1" };
    return { label: "🌱 Rookie", class: "rank-0" };
}

function renderSidebar() {
    const sideList = document.getElementById('sidebar-class-list');
    sideList.innerHTML = '';
    classes.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = `nav-item ${currentClassIndex === i ? 'active' : ''}`;
        div.innerText = `🐾 ${c.name}`;
        div.onclick = () => window.openClass(i);
        sideList.appendChild(div);
    });
}

function renderDashboard() {
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('class-detail-screen').classList.add('hidden');
    const list = document.getElementById('class-list');
    list.innerHTML = '';
    classes.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'card-heavy';
        div.style.cursor = 'pointer';
        div.innerHTML = `<h3>${c.name}</h3><p>${c.students?.length || 0} Students</p>`;
        div.onclick = () => window.openClass(i);
        list.appendChild(div);
    });
}

function renderStudents() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('class-detail-screen').classList.remove('hidden');
    const list = document.getElementById('student-list');
    list.innerHTML = '';
    const currentClass = classes[currentClassIndex];
    document.getElementById('current-class-title').innerText = currentClass.name;

    currentClass.students?.forEach((s, i) => {
        const rank = getRankInfo(s.points);
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <span class="rank-badge ${rank.class}">${rank.label}</span>
            <div class="animal-icon">${getAnimalIcon(s.name)}</div>
            <br><strong>${s.name}</strong>
            <div class="point-controls">
                <button class="btn-minus" onclick="window.modPoint(${i}, -1)">-</button>
                <button class="btn-plus" onclick="window.modPoint(${i}, 1)">+</button>
            </div>
            <p style="font-weight:bold; color:var(--pink-hot)">Points: ${s.points}</p>
            <button onclick="window.delStudent(${i})" style="background:none; color:#aaa; box-shadow:none; margin-top:10px; font-size:10px; border:none; cursor:pointer;">Remove</button>
        `;
        list.appendChild(div);
    });
}

const getAnimalIcon = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return animalIcons[Math.abs(hash) % animalIcons.length];
};

window.openClass = (i) => { currentClassIndex = i; loadData(); };

window.modPoint = (sIdx, val) => {
    const student = classes[currentClassIndex].students[sIdx];
    const oldPoints = student.points;
    student.points = Math.max(0, student.points + val);
    
    // Kiểm tra thăng bậc để phát âm thanh đặc biệt
    if (val > 0 && 
       ((oldPoints < 3 && student.points >= 3) || 
        (oldPoints < 5 && student.points >= 5) || 
        (oldPoints < 10 && student.points >= 10))) {
        document.getElementById('snd-level').play();
    } else {
        document.getElementById('snd-point').play();
    }
    syncData();
};

window.delStudent = (i) => { if(confirm("Remove student?")) { classes[currentClassIndex].students.splice(i, 1); syncData(); } };

document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => { currentClassIndex = null; signOut(auth); };
document.getElementById('toggle-sidebar').onclick = () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
};

document.getElementById('add-class-btn').onclick = () => {
    const nameInput = document.getElementById('new-class-name');
    if(nameInput.value) { 
        classes.push({name: nameInput.value, maxPoints: 10, students: []}); 
        syncData(); 
        nameInput.value=''; 
    }
};

document.getElementById('add-student-btn').onclick = () => {
    const nameInput = document.getElementById('new-student-name');
    if(nameInput.value && currentClassIndex !== null) { 
        if(!classes[currentClassIndex].students) classes[currentClassIndex].students = [];
        classes[currentClassIndex].students.push({name: nameInput.value, points: 0}); 
        syncData(); 
        nameInput.value=''; 
    }
};

document.getElementById('delete-class-btn').onclick = () => {
    if(confirm("Delete class?")) { classes.splice(currentClassIndex, 1); currentClassIndex = null; syncData(); }
};
