import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_bCjtuPvQ2VvTQCMvaE2LZx-wGPIrsaM",
  authDomain: "classjoy-1002f.firebaseapp.com",
  // DÒNG NÀY SỬA LỖI REGION SINGAPORE CỦA BẠN:
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
    const authScreen = document.getElementById('auth-screen');
    const appLayout = document.getElementById('app-layout');
    if (user) {
        authScreen.classList.add('hidden');
        appLayout.classList.remove('hidden');
        document.getElementById('user-info').innerText = `Teacher: ${user.displayName.split(' ')[0]} 🎀`;
        loadData();
    } else {
        authScreen.classList.remove('hidden');
        appLayout.classList.add('hidden');
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
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <div class="animal-icon">${getAnimalIcon(s.name)}</div>
            <br><strong>${s.name}</strong>
            <p>Score: ${s.points}</p>
            <div class="point-controls">
                <button class="btn-minus" onclick="window.modPoint(${i}, -1)">-</button>
                <button class="btn-plus" onclick="window.modPoint(${i}, 1)">+</button>
            </div>
            <button onclick="window.delStudent(${i})" style="background:none; color:#aaa; box-shadow:none; margin-top:10px; font-size:10px;">Remove</button>
        `;
        list.appendChild(div);
    });
}

const getAnimalIcon = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return animalIcons[Math.abs(hash) % animalIcons.length];
};

window.openClass = (i) => { currentClassIndex = i; renderSidebar(); renderStudents(); };

window.modPoint = (sIdx, val) => {
    const student = classes[currentClassIndex].students[sIdx];
    student.points = Math.max(0, student.points + val);
    const sound = (val > 0) ? 'snd-level' : 'snd-point';
    document.getElementById(sound).play();
    syncData();
};

window.delStudent = (i) => { if(confirm("Remove?")) { classes[currentClassIndex].students.splice(i, 1); syncData(); } };

// Gán sự kiện cho nút bấm
document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => { currentClassIndex = null; signOut(auth); };
document.getElementById('add-class-btn').onclick = () => {
    const name = document.getElementById('new-class-name').value;
    if(name) { classes.push({name, maxPoints: 10, students: []}); syncData(); document.getElementById('new-class-name').value=''; }
};
document.getElementById('add-student-btn').onclick = () => {
    const name = document.getElementById('new-student-name').value;
    if(name) { 
        if(!classes[currentClassIndex].students) classes[currentClassIndex].students = [];
        classes[currentClassIndex].students.push({name, points: 0}); 
        syncData(); 
        document.getElementById('new-student-name').value=''; 
    }
};
document.getElementById('delete-class-btn').onclick = () => {
    if(confirm("Delete class?")) { classes.splice(currentClassIndex, 1); currentClassIndex = null; syncData(); }
};
