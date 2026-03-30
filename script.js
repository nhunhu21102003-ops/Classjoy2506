import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let classes = [];
let currentClassIndex = null;
const animalIcons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐣', '🐧', '🦄', '🐝', '🦒'];

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        document.getElementById('user-info').innerText = `👩‍🏫 ${user.displayName || 'Teacher'}`;
        loadData();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }
});

const loadData = () => {
    onValue(ref(db, 'classes/'), (snapshot) => {
        classes = snapshot.val() || [];
        currentClassIndex !== null ? renderStudents() : renderClasses();
    });
};

const syncData = () => set(ref(db, 'classes/'), classes);

const getAnimalIcon = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return animalIcons[Math.abs(hash) % animalIcons.length];
};

const getRank = (pts, max) => {
    if (pts >= max) return { label: '👑 ELITE 👑', class: 'rank-max' };
    if (pts >= 5) return { label: 'ADVANCED 💎', class: 'rank-3' };
    if (pts >= 3) return { label: 'INTERMEDIATE ⭐', class: 'rank-2' };
    return { label: 'BEGINNER 🌱', class: 'rank-1' };
};

function renderClasses() {
    const list = document.getElementById('class-list');
    list.innerHTML = '';
    classes.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'card-heavy';
        div.style.cursor = 'pointer';
        div.innerHTML = `<h3>${c.name}</h3><p>${c.students ? c.students.length : 0} Students</p><button onclick="window.openClass(${i})">Enter Class 📂</button>`;
        div.onclick = (e) => { if(e.target.tagName !== 'BUTTON') window.openClass(i); };
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
            <div class="animal-icon">${getAnimalIcon(s.name)}</div>
            <br><strong style="font-size:1.2rem">${s.name}</strong>
            <p style="font-size:1.1rem; color:var(--pink-hot)">Points: ${s.points}</p>
            <div class="point-controls">
                <button onclick="window.modPoint(${i}, 1)" style="font-size:1.2rem; width:50px">+</button>
                <button class="btn-danger" onclick="window.modPoint(${i}, -1)" style="font-size:1.2rem; width:50px">-</button>
            </div>
            <button class="btn-remove" onclick="window.delStudent(${i})" style="background:none; color:var(--pink-mid); border:1px dashed var(--pink-mid); box-shadow:none; margin-top:10px; width:100%">Remove</button>
        `;
        list.appendChild(div);
    });
}

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
    if (newRank !== oldRank && val > 0) document.getElementById('snd-level').play();
    else if (val !== 0) document.getElementById('snd-point').play();
    syncData();
};

window.delStudent = (i) => { if(confirm("Remove student?")) { classes[currentClassIndex].students.splice(i, 1); syncData(); } };

document.getElementById('google-login-btn').onclick = () => {
    signInWithPopup(auth, provider).catch(err => alert("Google Login Failed: " + err.message));
};

document.getElementById('login-btn').onclick = () => {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

document.getElementById('add-class-btn').onclick = () => {
    const name = document.getElementById('new-class-name').value;
    if (name) { classes.push({ name, maxPoints: 10, students: [] }); document.getElementById('new-class-name').value = ''; syncData(); }
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
    classes[currentClassIndex].maxPoints = parseInt(e.target.value) || 10;
    syncData();
};

document.getElementById('delete-class-btn').onclick = () => {
    if(confirm("Delete entire class?")) { classes.splice(currentClassIndex, 1); syncData(); document.getElementById('back-btn').click(); }
};
