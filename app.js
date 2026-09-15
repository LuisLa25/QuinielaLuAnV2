/* ═══════════════════════════════════════════
   QUINIELA LUAN v2 — MOTOR PRINCIPAL (CON TECLADO DINÁMICO)
   ═══════════════════════════════════════════ */

/* ── FIREBASE CONFIG ── */
const firebaseConfig = {
  apiKey: "AIzaSyDff6f06jAPxmH8zL2bo3N0nPKGUf5109A",
  authDomain: "quinielaluan.firebaseapp.com",
  projectId: "quinielaluan",
  storageBucket: "quinielaluan.firebasestorage.app",
  messagingSenderId: "861747323783",
  appId: "1:861747323783:web:0f603b3c55570a4cb1a922"
};

const ADMIN_PIN = "252525";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ESTADO TEMPORAL PARA SELECCIÓN DINÁMICA DE GOLES */
const appState = {
  selectedWinner: {},
  winnerGoals: {}
};

class QuinielaEngine {
  constructor() {
    this.currentUser = null;
    this.currentUsername = null;
    this.adminUnlocked = false;
    this.quinielas = [];
    this._initListeners();
  }

  /* ═══ FECHA Y ORDEN CRONOLÓGICO ═══ */
  _getMatchTime(matchDate) {
    if (!matchDate) return Number.MAX_SAFE_INTEGER;
    if (typeof matchDate.toDate === 'function') {
      const date = matchDate.toDate();
      const time = date.getTime();
      return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
    }
    if (matchDate instanceof Date) {
      const time = matchDate.getTime();
      return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
    }
    const time = new Date(matchDate).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }

  _sortMatchesChronologically(matches) {
    return matches.sort((a, b) => {
      const timeA = this._getMatchTime(a.matchDate);
      const timeB = this._getMatchTime(b.matchDate);
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }

  _formatMatchDate(matchDate) {
    if (!matchDate) return 'Sin fecha';
    let date = typeof matchDate.toDate === 'function' ? matchDate.toDate() : new Date(matchDate);
    if (Number.isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-VE', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  /* ═══ TOAST ═══ */
  toast(msg, tipo = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + tipo;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.className = 'toast', 2800);
  }

  /* ═══ NAVEGACIÓN ═══ */
  navigate(viewId) {
    if (!this.currentUser && viewId !== 'view-auth') {
      this.toast('Inicia sesión primero', 'err');
      return;
    }
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');

    const navBtn = document.getElementById('nav-' + viewId.replace('view-', ''));
    if (navBtn) navBtn.classList.add('active');

    if (viewId === 'view-predictions') this.enterPredictions();
    if (viewId === 'view-mispred') this.enterMisPred();
    if (viewId === 'view-ranking') this.enterRanking();
    if (viewId === 'view-todos') this.enterTodos();
  }

  async enterPredictions() {
    await this.fillQuinielaSelect('user-select-quiniela');
    this.onQuinielaChange('user');
  }

  async enterMisPred() {
    await this.fillQuinielaSelect('mis-select-quiniela');
    this.loadMyPredictions();
  }

  async enterRanking() {
    await this.fillQuinielaSelect('ranking-select-quiniela');
    this.loadRanking();
  }

  async enterTodos() {
    await this.fillQuinielaSelect('todos-select-quiniela');
    this.onQuinielaChange('todos');
  }

  /* ═══ AUTH ═══ */
  _initListeners() {
    document.getElementById('btn-login')?.addEventListener('click', () => this.login());
    document.getElementById('btn-register')?.addEventListener('click', () => this.register());

    document.getElementById('auth-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.login();
    });

    document.getElementById('pin-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.checkPin();
    });

    const roundAdminSel = document.getElementById('match-round');
    if (roundAdminSel) {
      roundAdminSel.addEventListener('change', () => this.updateAdminTeams());
    }
  }

  _toEmail(username) {
    return username.toLowerCase().trim().replace(/[^a-z0-9]/g, '') + '@quinielaluan.app';
  }

  async login() {
    const u = document.getElementById('auth-username').value.trim();
    const p = document.getElementById('auth-password').value.trim();
    if (!u || !p) return this.toast('Completa usuario y contraseña', 'err');

    try {
      await auth.signInWithEmailAndPassword(this._toEmail(u), p);
      this.navigate('view-predictions');
    } catch (e) {
      this.toast('Usuario o contraseña incorrectos', 'err');
    }
  }

  async register() {
    const u = document.getElementById('auth-username').value.trim();
    const p = document.getElementById('auth-password').value.trim();
    if (!u || !p) return this.toast('Completa usuario y contraseña', 'err');
    if (p.length < 6) return this.toast('Contraseña mínimo 6 caracteres', 'err');

    try {
      const res = await auth.createUserWithEmailAndPassword(this._toEmail(u), p);
      await db.collection('users').doc(res.user.uid).set({
        username: u, points: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.toast('¡Registro exitoso!', 'ok');
      this.navigate('view-predictions');
    } catch (e) {
      this.toast(e.code === 'auth/email-already-in-use' ? 'Ese nombre ya existe' : 'Error al registrarse', 'err');
    }
  }

  async logout() {
    await auth.signOut();
    this.adminUnlocked = false;
    document.getElementById('user-display').textContent = 'Invitado';
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-auth').classList.add('active');
  }

  /* ═══ ADMIN PIN ═══ */
  openAdmin() {
    if (!this.currentUser) return this.toast('Inicia sesión primero', 'err');
    if (this.adminUnlocked) return this.enterAdmin();
    document.getElementById('pin-overlay').classList.add('show');
    setTimeout(() => document.getElementById('pin-input').focus(), 100);
  }

  closePin() {
    document.getElementById('pin-overlay').classList.remove('show');
    document.getElementById('pin-input').value = '';
  }

  checkPin() {
    if (document.getElementById('pin-input').value === ADMIN_PIN) {
      this.adminUnlocked = true;
      this.closePin();
      this.enterAdmin();
    } else {
      this.toast('PIN incorrecto', 'err');
      document.getElementById('pin-input').value = '';
    }
  }

  async enterAdmin() {
    this.navigate('view-admin');
    this.renderLigaChips();
    await this.fillQuinielaSelect('match-quiniela');
    this.onQuinielaChange('match');
  }

  /* ═══ QUINIELAS & SELECCIONES ═══ */
  renderLigaChips() {
    const box = document.getElementById('quiniela-ligas-chips');
    if (!box) return;
    box.innerHTML = '';
    Object.entries(LEAGUES).forEach(([key, liga]) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = `${liga.flag} ${liga.name}`;
      chip.dataset.liga = key;
      chip.onclick = () => chip.classList.toggle('selected');
      box.appendChild(chip);
    });
  }

  async createQuiniela() {
    const name = document.getElementById('new-quiniela-name').value.trim();
    const chips = document.querySelectorAll('#quiniela-ligas-chips .chip.selected');
    const ligas = [...chips].map(c => c.dataset.liga);

    if (!name) return this.toast('Escribe un nombre para la quiniela', 'err');
    if (ligas.length === 0) return this.toast('Selecciona al menos una liga', 'err');

    try {
      await db.collection('quinielas').add({ name, ligas, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      this.toast(`✓ Quiniela "${name}" creada`, 'ok');
      document.getElementById('new-quiniela-name').value = '';
      document.querySelectorAll('#quiniela-ligas-chips .chip').forEach(c => c.classList.remove('selected'));
      await this.fillQuinielaSelect('match-quiniela');
    } catch (e) {
      this.toast('Error al crear quiniela', 'err');
    }
  }

  async loadQuinielas() {
    const snap = await db.collection('quinielas').get();
    this.quinielas = [];
    snap.forEach(d => this.quinielas.push({ id: d.id, ...d.data() }));
    return this.quinielas;
  }

  async fillQuinielaSelect(selectId) {
    await this.loadQuinielas();
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';

    if (this.quinielas.length === 0) {
      sel.innerHTML = '<option value="">— Sin quinielas creadas —</option>';
      return;
    }
    this.quinielas.forEach(q => {
      const ligasTxt = q.ligas.map(l => LEAGUES[l]?.flag || '').join(' ');
      sel.add(new Option(`${q.name} ${ligasTxt}`, q.id));
    });
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }

  getQuiniela(id) {
    return this.quinielas.find(q => q.id === id);
  }

  onQuinielaChange(prefix) {
    const quinielaId = document.getElementById(`${prefix}-select-quiniela`)?.value || document.getElementById('match-quiniela')?.value;
    const q = this.getQuiniela(quinielaId);
    const ligaSelectId = prefix === 'match' ? 'match-liga' : `${prefix}-select-liga`;
    const ligaSel = document.getElementById(ligaSelectId);
    if (!ligaSel) return;

    const current = ligaSel.value;
    ligaSel.innerHTML = '';

    if (!q || !q.ligas || q.ligas.length === 0) {
      ligaSel.innerHTML = '<option value="">— Crea o elige una quiniela —</option>';
      return;
    }

    q.ligas.forEach(ligaKey => {
      const liga = LEAGUES[ligaKey];
      if (liga) ligaSel.add(new Option(`${liga.flag} ${liga.name}`, ligaKey));
    });

    if ([...ligaSel.options].some(o => o.value === current)) ligaSel.value = current;

    if (prefix === 'match') {
      this.fillRoundSelect('match-round', 'match-liga');
      this.updateAdminTeams();
      this.loadAdminMatches();
    } else if (prefix === 'user') {
      this.fillRoundSelect('user-select-round', 'user-select-liga');
      this.loadMatchesForUser();
    } else if (prefix === 'todos') {
      this.fillRoundSelect('todos-select-round', 'todos-select-liga');
      this.loadTodos();
    }
  }

  fillRoundSelect(selectId, ligaSelectId) {
    const liga = document.getElementById(ligaSelectId)?.value;
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    if (!liga) return sel.innerHTML = '<option value="">—</option>';

    getRoundsForLeague(liga).forEach(([val, label]) => sel.add(new Option(label, val)));
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }

  /* ═══ MOSTRAR PARTIDOS PARA APOSTAR (CON TECLADO TECLA A TECLA) ═══ */
  async loadMatchesForUser() {
    if (!this.currentUser) return;
    const quinielaId = document.getElementById('user-select-quiniela').value;
    const liga = document.getElementById('user-select-liga').value;
    const round = document.getElementById('user-select-round').value;
    const container = document.getElementById('user-matches-list');

    if (!quinielaId || !liga || !round) return container.innerHTML = '';

    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px">Cargando...</p>';

    try {
      // Ocultar automáticamente partidos con status FINISHED
      const snap = await db.collection('matches')
        .where('quinielaId', '==', quinielaId)
        .where('liga', '==', liga)
        .where('round', '==', round)
        .where('status', '==', 'OPEN')
        .get();

      if (snap.empty) {
        container.innerHTML = '<div class="empty-state"><div class="big">📋</div>Sin partidos disponibles en esta jornada.</div>';
        return;
      }

      const predSnap = await db.collection('predictions').where('userId', '==', this.currentUser.uid).get();
      const myPreds = {};
      predSnap.forEach(d => myPreds[d.data().matchId] = d.data());

      container.innerHTML = '';
      const now = new Date();
      const matches = [];

      snap.forEach(docSnap => matches.push({ id: docSnap.id, ...docSnap.data() }));
      this._sortMatchesChronologically(matches);

      matches.forEach(m => {
        const home = getTeam(m.liga, m.homeTeamId);
        const away = getTeam(m.liga, m.awayTeamId);
        const matchTime = this._getMatchTime(m.matchDate);
        const locked = (matchTime !== Number.MAX_SAFE_INTEGER && now.getTime() >= matchTime) || m.status === 'FINISHED';
        const pred = myPreds[m.id] || {};

        const card = document.createElement('div');
        card.className = 'match-card';

        card.innerHTML = `
          <div class="match-header">
            <span>${this._formatMatchDate(m.matchDate)}</span>
            <span class="badge ${locked ? 'badge-closed' : 'badge-open'}">${locked ? 'Cerrado' : 'Abierto'}</span>
          </div>

          <div class="match-body">
            <div class="team-info"><span class="team-flag">${home.flag}</span><span class="team-name">${home.name}</span></div>
            <span style="color:var(--text-muted);font-size:1rem">vs</span>
            <div class="team-info"><span class="team-flag">${away.flag}</span><span class="team-name">${away.name}</span></div>
          </div>

          ${!locked ? `
            <div>
              <span class="winner-label">¿Quién gana?</span>
              <div class="winner-row" id="wrow-${m.id}">
                <button class="winner-btn ${pred.ganador === home.name ? 'selected' : ''}"
                  onclick="selectWinnerUi('${m.id}', '${home.name}', '${home.name}', '${away.name}', this)">
                  ${home.flag}<br>${home.name}
                </button>
                <button class="winner-btn ${pred.ganador === 'Empate' ? 'selected' : ''}"
                  onclick="selectWinnerUi('${m.id}', 'Empate', '${home.name}', '${away.name}', this)">
                  🤝<br>Empate
                </button>
                <button class="winner-btn ${pred.ganador === away.name ? 'selected' : ''}"
                  onclick="selectWinnerUi('${m.id}', '${away.name}', '${home.name}', '${away.name}', this)">
                  ${away.flag}<br>${away.name}
                </button>
              </div>
            </div>

            <!-- Contenedor del selector numérico dinámico (0 al 7) -->
            <div id="goals-selector-${m.id}" style="margin-top:10px;text-align:center;">
              ${pred.ganador ? `<div style="font-size:0.8rem;color:var(--text-muted)">Predicción actual: <strong>${pred.ganador}</strong> (${pred.golesLocal ?? 0} - ${pred.golesVisita ?? 0})</div>` : ''}
            </div>
          ` : `
            <div style="font-size:0.8rem;color:var(--text-muted);text-align:center">
              ${pred.ganador ? `Tu apuesta: <strong style="color:#fff">${pred.ganador}</strong> (${pred.golesLocal}–${pred.golesVisita})` : 'No apostaste en este partido'}
            </div>
          `}
        `;
        container.appendChild(card);
      });

    } catch (e) {
      container.innerHTML = '<div class="empty-state"><div class="big">⚠️</div>Error al cargar partidos.</div>';
      console.error(e);
    }
  }

  /* ═══ ADMIN — PUBLICAR Y MODIFICAR ═══ */
  async updateAdminTeams() {
    const quinielaId = document.getElementById('match-quiniela')?.value;
    const liga = document.getElementById('match-liga')?.value;
    const round = document.getElementById('match-round')?.value;
    const homeSel = document.getElementById('match-home');
    const awaySel = document.getElementById('match-away');
    if (!homeSel || !awaySel) return;

    homeSel.innerHTML = '<option value="">— Selecciona equipo —</option>';
    awaySel.innerHTML = '<option value="">— Selecciona equipo —</option>';
    if (!liga) return;

    const teams = LEAGUES[liga]?.teams || {};
    const usedTeams = new Set();

    if (quinielaId && liga && round) {
      try {
        const snap = await db.collection('matches').where('quinielaId', '==', quinielaId).where('liga', '==', liga).where('round', '==', round).get();
        snap.forEach(doc => {
          const m = doc.data();
          if (m.homeTeamId) usedTeams.add(m.homeTeamId);
          if (m.awayTeamId) usedTeams.add(m.awayTeamId);
        });
      } catch (e) {}
    }

    Object.entries(teams).sort((a, b) => a[1].name.localeCompare(b[1].name)).forEach(([k, t]) => {
      const isUsed = usedTeams.has(k);
      const text = isUsed ? `${t.flag} ${t.name} [Ya asignado]` : `${t.flag} ${t.name}`;
      
      const optH = new Option(text, k); if (isUsed) optH.disabled = true; homeSel.add(optH);
      const optA = new Option(text, k); if (isUsed) optA.disabled = true; awaySel.add(optA);
    });
  }

  async publishMatch() {
    const quinielaId = document.getElementById('match-quiniela').value;
    const liga = document.getElementById('match-liga').value;
    const round = document.getElementById('match-round').value;
    const homeTeamId = document.getElementById('match-home').value;
    const awayTeamId = document.getElementById('match-away').value;
    const matchDate = document.getElementById('match-date').value;

    if (!quinielaId || !liga || !round || !homeTeamId || !awayTeamId) return this.toast('Completa los campos obligatorios', 'err');
    if (homeTeamId === awayTeamId) return this.toast('Los equipos deben ser diferentes', 'err');

    const dateObj = matchDate ? new Date(matchDate) : null;
    const matchDateVal = (dateObj && !isNaN(dateObj.getTime())) ? firebase.firestore.Timestamp.fromDate(dateObj) : null;

    try {
      await db.collection('matches').add({
        quinielaId, liga, round, homeTeamId, awayTeamId,
        matchDate: matchDateVal, status: 'OPEN', golesLocal: null, golesVisita: null, ganador: null
      });
      this.toast('✓ Partido publicado', 'ok');
      await this.updateAdminTeams();
      this.loadAdminMatches();
    } catch (e) {
      this.toast('Error al publicar', 'err');
    }
  }

  async loadAdminMatches() {
    const quinielaId = document.getElementById('match-quiniela').value;
    const liga = document.getElementById('match-liga').value;
    const sel = document.getElementById('admin-match-select');
    if (!quinielaId || !liga || !sel) return;

    sel.innerHTML = '<option value="">Cargando...</option>';

    try {
      const snap = await db.collection('matches').where('quinielaId', '==', quinielaId).where('liga', '==', liga).get();
      sel.innerHTML = '<option value="">— Selecciona partido —</option>';
      const adminMatches = [];
      snap.forEach(d => adminMatches.push({ id: d.id, ...d.data() }));
      this._sortMatchesChronologically(adminMatches);

      adminMatches.forEach(m => {
        const home = getTeam(m.liga, m.homeTeamId);
        const away = getTeam(m.liga, m.awayTeamId);
        sel.add(new Option(`${this._formatMatchDate(m.matchDate)} · ${m.round}: ${home.name} vs ${away.name}`, m.id));
      });
    } catch (e) {
      sel.innerHTML = '<option>Error al cargar</option>';
    }
  }
}

/* ═══════════════════════════════════════════
   LÓGICA TECLADO INTERACTIVO DE GOLES (0-7)
   ═══════════════════════════════════════════ */

function selectWinnerUi(matchId, choice, homeTeam, awayTeam, btnElement) {
  // Resaltar visualmente el botón seleccionado
  const parent = document.getElementById(`wrow-${matchId}`);
  if (parent) parent.querySelectorAll('.winner-btn').forEach(b => b.classList.remove('selected'));
  if (btnElement) btnElement.classList.add('selected');

  appState.selectedWinner[matchId] = choice;
  delete appState.winnerGoals[matchId];

  const container = document.getElementById(`goals-selector-${matchId}`);
  container.innerHTML = '';

  if (choice === 'Empate') {
    container.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted)">Goles del empate:</span>`;
    renderGoalButtons(container, matchId, 0, 7, (goals) => {
      savePredictionAuto(matchId, choice, goals, goals, homeTeam, awayTeam);
    });
  } else {
    container.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted)">Goles para ${choice}:</span>`;
    renderGoalButtons(container, matchId, 1, 7, (goalsWinner) => {
      appState.winnerGoals[matchId] = goalsWinner;

      // Si elige 1 gol, el perdedor tiene 0 automáticamente
      if (goalsWinner === 1) {
        const isHomeWinner = choice === homeTeam;
        const gLocal = isHomeWinner ? 1 : 0;
        const gVisita = isHomeWinner ? 0 : 1;
        savePredictionAuto(matchId, choice, gLocal, gVisita, homeTeam, awayTeam);
      } else {
        // Renderizar opciones para el perdedor (0 hasta N-1)
        renderLoserGoalSelector(matchId, choice, homeTeam, awayTeam, goalsWinner);
      }
    });
  }
}

function renderLoserGoalSelector(matchId, winnerChoice, homeTeam, awayTeam, goalsWinner) {
  const container = document.getElementById(`goals-selector-${matchId}`);
  const loserTeam = winnerChoice === homeTeam ? awayTeam : homeTeam;
  container.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted)">Goles para ${loserTeam}:</span>`;
  
  const maxLoserGoals = goalsWinner - 1;
  const isHomeWinner = winnerChoice === homeTeam;

  renderGoalButtons(container, matchId, 0, maxLoserGoals, (goalsLoser) => {
    const gLocal = isHomeWinner ? goalsWinner : goalsLoser;
    const gVisita = isHomeWinner ? goalsLoser : goalsWinner;
    savePredictionAuto(matchId, winnerChoice, gLocal, gVisita, homeTeam, awayTeam);
  });
}

function renderGoalButtons(container, matchId, min, max, onClickCallback) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-top:6px;justify-content:center;flex-wrap:wrap;';

  for (let i = min; i <= max; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.style.cssText = 'padding:8px 14px;border-radius:6px;border:1px solid var(--border-color, #333);background:#222;color:#fff;font-weight:bold;cursor:pointer;';
    
    btn.onclick = () => {
      row.querySelectorAll('button').forEach(b => b.style.background = '#222');
      btn.style.background = 'var(--accent-color, #2ea64e)';
      onClickCallback(i);
    };
    row.appendChild(btn);
  }
  container.appendChild(row);
}

async function savePredictionAuto(matchId, ganador, golesLocal, golesVisita, homeName, awayName) {
  if (!window.app.currentUser) return;

  try {
    await db.collection('predictions').doc(`${window.app.currentUser.uid}_${matchId}`).set({
      userId: window.app.currentUser.uid,
      username: window.app.currentUsername,
      matchId, homeName, awayName, ganador,
      golesLocal, golesVisita, pts: 0, calculado: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    window.app.toast(`✓ Pronóstico: ${ganador} (${golesLocal} - ${golesVisita})`, 'ok');
  } catch (e) {
    window.app.toast('Error al guardar pronóstico', 'err');
  }
}

/* ═══ INICIAR APP ═══ */
window.app = new QuinielaEngine();

auth.onAuthStateChanged(async user => {
  if (user) {
    window.app.currentUser = user;
    const uDoc = await db.collection('users').doc(user.uid).get();
    const username = uDoc.exists ? (uDoc.data().username || 'Usuario') : 'Usuario';
    window.app.currentUsername = username;
    document.getElementById('user-display').textContent = username;
  } else {
    window.app.currentUser = null;
    window.app.currentUsername = null;
    window.app.adminUnlocked = false;
    document.getElementById('user-display').textContent = 'Invitado';
  }
});




