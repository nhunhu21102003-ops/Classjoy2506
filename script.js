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

function getRank(points) {
    if (points >= 10) return { label: "🏆 MYTHIC", class: "rank-mythic" };
    if (points >= 5) return { label: "💎 DIAMOND", class: "rank-diamond" };
    if (points >= 3) return { label: "⭐ GOLD", class: "rank-gold" };
    return { label: "🌱 ROOKIE", class: "rank-rookie" };
}

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
        if (currentClassIndex !== null) renderStudents(); else renderDashboard();
    });
};

const syncData = () => set(ref(db, 'classes/'), classes);

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
        div.className = 'class-card'; // Dùng class mới để ra hình vuông
        div.innerHTML = `
            <div style="font-size: 3rem;">🏫</div>
            <h3>${c.name}</h3>
            <p>${c.students?.length || 0} Students</p>
        `;
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
        const rank = getRank(s.points);
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <span class="rank-badge ${rank.class}">${rank.label}</span>
            <div class="animal-icon">🐱</div>
            <br><strong>${s.name}</strong>
            <div class="point-controls">
                <button class="btn-minus" onclick="window.modPoint(${i}, -1)">-</button>
                <button class="btn-plus" onclick="window.modPoint(${i}, 1)">+</button>
            </div>
            <p style="font-weight:bold; color:var(--pink-hot)">Points: ${s.points}</p>
        `;
        list.appendChild(div);
    });
}

window.openClass = (i) => { currentClassIndex = i; loadData(); };

window.modPoint = (sIdx, val) => {
    const student = classes[currentClassIndex].students[sIdx];
    const oldRank = getRank(student.points).label;
    student.points = Math.max(0, student.points + val);
    const newRank = getRank(student.points).label;

    if (val > 0 && oldRank !== newRank) document.getElementById('snd-level').play();
    else document.getElementById('snd-point').play();

    syncData();
};

document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => { currentClassIndex = null; signOut(auth); };
document.getElementById('toggle-sidebar').onclick = () => document.getElementById('sidebar').classList.toggle('collapsed');

document.getElementById('add-class-btn').onclick = () => {
    const name = document.getElementById('new-class-name').value;
    if(name) { classes.push({name, students: []}); syncData(); document.getElementById('new-class-name').value=''; }
};

document.getElementById('add-student-btn').onclick = () => {
    const name = document.getElementById('new-student-name').value;
    if(name && currentClassIndex !== null) {
        if(!classes[currentClassIndex].students) classes[currentClassIndex].students = [];
        classes[currentClassIndex].students.push({name, points: 0});
        syncData();
        document.getElementById('new-student-name').value='';
    }
};

document.getElementById('delete-class-btn').onclick = () => {
    if(confirm("Delete class?")) { classes.splice(currentClassIndex, 1); currentClassIndex = null; syncData(); }
};
