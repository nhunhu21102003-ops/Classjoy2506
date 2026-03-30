import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_bCjtuPvQ2VvTQCMvaE2LZx-wGPIrsaM",
  authDomain: "classjoy-1002f.firebaseapp.com",
  projectId: "classjoy-1002f",
  storageBucket: "classjoy-1002f.firebasestorage.app",
  messagingSenderId: "598580384018",
  appId: "1:598580384018:web:bd967c01cf077db61d23cb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let classes = [];
let currentClassIndex = null;

// --- Firebase Sync ---
onValue(ref(db, 'classes/'), (snapshot) => {
    classes = snapshot.val() || [];
    if (currentClassIndex !== null) {
        renderStudents();
    } else {
        renderClasses();
    }
});

function syncData() {
    set(ref(db, 'classes/'), classes);
}

// --- Logic ---
const getRank = (pts, max) => {
    if (pts >= max) return { label: '⭐ ELITE ⭐', class: 'rank-max' };
    if (pts >= 5) return { label: 'ADVANCED', class: 'rank-3' };
    if (pts >= 3) return { label: 'INTERMEDIATE', class: 'rank-2' };
    return { label: 'BEGINNER', class: 'rank-1' };
};

function renderClasses() {
    const list = document.getElementById('class-list');
    list.innerHTML = '';
    classes.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${c.name}</h3><button onclick="window.openClass(${i})">Manage Class</button>`;
        list.appendChild(div);
    });
}

function renderStudents() {
    const list = document.getElementById('student-list');
    list.innerHTML = '';
    const currentClass = classes[currentClassIndex];
    
    currentClass.students?.forEach((s, i) => {
        const rank = getRank(s.points, currentClass.maxPoints);
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <span class="rank-tag ${rank.class}">${rank.label}</span>
            <div style="font-size: 2.5rem">☁️</div>
            <strong>${s.name}</strong>
            <p>Score: ${s.points}</p>
            <button onclick="window.modPoint(${i}, 1)">+</button>
            <button class="btn-danger" onclick="window.modPoint(${i}, -1)">-</button>
            <button style="display:block; width:100%; margin-top:10px; font-size:10px; background:#eee; color:#999" onclick="window.delStudent(${i})">Remove</button>
        `;
        list.appendChild(div);
    });
}

// --- Window Functions (For HTML access) ---
window.openClass = (i) => {
    currentClassIndex = i;
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('class-detail-screen').classList.remove('hidden');
    document.getElementById('current-class-title').innerText = classes[i].name;
    document.getElementById('max-points-input').value = classes[i].maxPoints;
    renderStudents();
};

window.modPoint = (sIdx, val) => {
    const student = classes[currentClassIndex].students[sIdx];
    const oldRank = getRank(student.points, classes[currentClassIndex].maxPoints).label;
    
    student.points = Math.max(0, student.points + val);
    const newRank = getRank(student.points, classes[currentClassIndex].maxPoints).label;

    if (newRank !== oldRank && val > 0) {
        document.getElementById('snd-level').play();
    } else {
        document.getElementById('snd-point').play();
    }
    syncData();
};

window.delStudent = (i) => {
    classes[currentClassIndex].students.splice(i, 1);
    syncData();
};

// --- Event Listeners ---
document.getElementById('login-btn').onclick = () => {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
};

document.getElementById('add-class-btn').onclick = () => {
    const name = document.getElementById('new-class-name').value;
    if (name) {
        classes.push({ name, maxPoints: 10, students: [] });
        document.getElementById('new-class-name').value = '';
        syncData();
    }
};

document.getElementById('add-student-btn').onclick = () => {
    const name = document.getElementById('new-student-name').value;
    if (name) {
        if(!classes[currentClassIndex].students) classes[currentClassIndex].students = [];
        classes[currentClassIndex].students.push({ name, points: 0 });
        document.getElementById('new-student-name').value = '';
        syncData();
    }
};

document.getElementById('back-btn').onclick = () => {
    currentClassIndex = null;
    document.getElementById('class-detail-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
};

document.getElementById('max-points-input').onchange = (e) => {
    classes[currentClassIndex].maxPoints = parseInt(e.target.value);
    syncData();
};

document.getElementById('delete-class-btn').onclick = () => {
    if(confirm("Delete this class?")) {
        classes.splice(currentClassIndex, 1);
        syncData();
        document.getElementById('back-btn').click();
    }
};

document.getElementById('logout-btn').onclick = () => location.reload();
