/* ═══════════════════════════════════════════
   QUINIELA LUAN v2 — MOTOR PRINCIPAL (COMPLETO Y CORREGIDO)
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

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }

  _formatMatchDate(matchDate) {
    if (!matchDate) return 'Sin fecha';

    let date;

    if (typeof matchDate.toDate === 'function') {
      date = matchDate.toDate();
    } else {
      date = new Date(matchDate);
    }

    if (Number.isNaN(date.getTime())) return 'Fecha inválida';

    return date.toLocaleString('es-VE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /* ═══ TOAST ═══ */
  toast(msg, tipo = 'ok') {
    const t = document.getElementById('toast');
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

    const navBtn = document.getElementById(
      'nav-' + viewId.replace('view-', '')
    );

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
    document.getElementById('btn-login').addEventListener('click', () => this.login());
    document.getElementById('btn-register').addEventListener('click', () => this.register());

    document.getElementById('auth-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.login();
    });

    document.getElementById('pin-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.checkPin();
    });

    const roundAdminSel = document.getElementById('match-round');

    if (roundAdminSel) {
      roundAdminSel.addEventListener('change', () => this.updateAdminTeams());
    }
  }

  _toEmail(username) {
    return username
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '') + '@quinielaluan.app';
  }

  async login() {
    const u = document.getElementById('auth-username').value.trim();
    const p = document.getElementById('auth-password').value.trim();

    if (!u || !p) {
      this.toast('Completa usuario y contraseña', 'err');
      return;
    }

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

    if (!u || !p) {
      this.toast('Completa usuario y contraseña', 'err');
      return;
    }

    if (p.length < 6) {
      this.toast('Contraseña mínimo 6 caracteres', 'err');
      return;
    }

    try {
      const res = await auth.createUserWithEmailAndPassword(
        this._toEmail(u),
        p
      );

      await db.collection('users').doc(res.user.uid).set({
        username: u,
        points: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.toast('¡Registro exitoso!', 'ok');
      this.navigate('view-predictions');

    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        this.toast('Ese nombre ya existe', 'err');
      } else {
        this.toast('Error al registrarse', 'err');
      }
    }
  }

  async logout() {
    await auth.signOut();

    this.adminUnlocked = false;

    document.getElementById('user-display').textContent = 'Invitado';

    document.querySelectorAll('.view').forEach(el =>
      el.classList.remove('active')
    );

    document.getElementById('view-auth').classList.add('active');
  }

  /* ═══ ADMIN PIN ═══ */
  openAdmin() {
    if (!this.currentUser) {
      this.toast('Inicia sesión primero', 'err');
      return;
    }

    if (this.adminUnlocked) {
      this.enterAdmin();
      return;
    }

    document.getElementById('pin-overlay').classList.add('show');

    setTimeout(() => {
      document.getElementById('pin-input').focus();
    }, 100);
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

  /* ═══ QUINIELAS ═══ */
  renderLigaChips() {
    const box = document.getElementById('quiniela-ligas-chips');
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

    const chips = document.querySelectorAll(
      '#quiniela-ligas-chips .chip.selected'
    );

    const ligas = [...chips].map(c => c.dataset.liga);

    if (!name) {
      this.toast('Escribe un nombre para la quiniela', 'err');
      return;
    }

    if (ligas.length === 0) {
      this.toast('Selecciona al menos una liga', 'err');
      return;
    }

    try {
      await db.collection('quinielas').add({
        name,
        ligas,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.toast(`✓ Quiniela "${name}" creada`, 'ok');

      document.getElementById('new-quiniela-name').value = '';

      document
        .querySelectorAll('#quiniela-ligas-chips .chip')
        .forEach(c => c.classList.remove('selected'));

      await this.fillQuinielaSelect('match-quiniela');

    } catch (e) {
      this.toast('Error al crear quiniela', 'err');
      console.error(e);
    }
  }

  async loadQuinielas() {
    const snap = await db.collection('quinielas').get();

    this.quinielas = [];

    snap.forEach(d => {
      this.quinielas.push({
        id: d.id,
        ...d.data()
      });
    });

    return this.quinielas;
  }

  async fillQuinielaSelect(selectId) {
    await this.loadQuinielas();

    const sel = document.getElementById(selectId);
    const current = sel.value;

    sel.innerHTML = '';

    if (this.quinielas.length === 0) {
      sel.innerHTML = '<option value="">— Sin quinielas creadas —</option>';
      return;
    }

    this.quinielas.forEach(q => {
      const ligasTxt = q.ligas
        .map(l => LEAGUES[l]?.flag || '')
        .join(' ');

      sel.add(new Option(
        `${q.name} ${ligasTxt}`,
        q.id
      ));
    });

    if ([...sel.options].some(o => o.value === current)) {
      sel.value = current;
    }
  }

  getQuiniela(id) {
    return this.quinielas.find(q => q.id === id);
  }

  onQuinielaChange(prefix) {
    const quinielaId =
      document.getElementById(`${prefix}-select-quiniela`)?.value ||
      document.getElementById('match-quiniela')?.value;

    const q = this.getQuiniela(quinielaId);

    const ligaSelectId =
      prefix === 'match'
        ? 'match-liga'
        : `${prefix}-select-liga`;

    const ligaSel = document.getElementById(ligaSelectId);

    if (!ligaSel) return;

    const current = ligaSel.value;

    ligaSel.innerHTML = '';

    if (!q || !q.ligas || q.ligas.length === 0) {
      ligaSel.innerHTML =
        '<option value="">— Crea o elige una quiniela —</option>';
      return;
    }

    q.ligas.forEach(ligaKey => {
      const liga = LEAGUES[ligaKey];

      if (liga) {
        ligaSel.add(
          new Option(
            `${liga.flag} ${liga.name}`,
            ligaKey
          )
        );
      }
    });

    if ([...ligaSel.options].some(o => o.value === current)) {
      ligaSel.value = current;
    }

    if (prefix === 'match') {
      this.fillRoundSelect('match-round', 'match-liga');
      this.updateAdminTeams();
      this.loadAdminMatches();

    } else if (prefix === 'user') {
      this.fillRoundSelect(
        'user-select-round',
        'user-select-liga'
      );

      this.loadMatchesForUser();

    } else if (prefix === 'todos') {
      this.fillRoundSelect(
        'todos-select-round',
        'todos-select-liga'
      );

      this.loadTodos();
    }
  }

  /* ═══ JORNADAS ═══ */
  fillRoundSelect(selectId, ligaSelectId) {
    const liga = document.getElementById(ligaSelectId)?.value;
    const sel = document.getElementById(selectId);

    const current = sel.value;

    sel.innerHTML = '';

    if (!liga) {
      sel.innerHTML = '<option value="">—</option>';
      return;
    }

    getRoundsForLeague(liga).forEach(([val, label]) => {
      sel.add(new Option(label, val));
    });

    if ([...sel.options].some(o => o.value === current)) {
      sel.value = current;
    }
  }

  /* ═══ EQUIPOS EN ADMIN ═══ */
  async updateAdminTeams() {
    const quinielaId =
      document.getElementById('match-quiniela')?.value;

    const liga =
      document.getElementById('match-liga')?.value;

    const round =
      document.getElementById('match-round')?.value;

    const homeSel =
      document.getElementById('match-home');

    const awaySel =
      document.getElementById('match-away');

    if (!homeSel || !awaySel) return;

    const currentHome = homeSel.value;
    const currentAway = awaySel.value;

    homeSel.innerHTML =
      '<option value="">— Selecciona equipo —</option>';

    awaySel.innerHTML =
      '<option value="">— Selecciona equipo —</option>';

    if (!liga) return;

    const teams = LEAGUES[liga]?.teams || {};
    const usedTeams = new Set();

    if (quinielaId && liga && round) {
      try {
        const snap = await db.collection('matches')
          .where('quinielaId', '==', quinielaId)
          .where('liga', '==', liga)
          .where('round', '==', round)
          .get();

        snap.forEach(doc => {
          const m = doc.data();

          if (m.homeTeamId) usedTeams.add(m.homeTeamId);
          if (m.awayTeamId) usedTeams.add(m.awayTeamId);
        });

      } catch (e) {
        console.error(
          'Error al obtener equipos usados:',
          e
        );
      }
    }

    Object.entries(teams)
      .sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
      )
      .forEach(([k, t]) => {
        const isUsed = usedTeams.has(k);

        const text = isUsed
          ? `${t.flag} ${t.name} [Ya asignado]`
          : `${t.flag} ${t.name}`;

        const optHome = new Option(text, k);

        if (isUsed) {
          optHome.disabled = true;
          optHome.style.color = '#8b949e';
          optHome.style.opacity = '0.4';
        }

        homeSel.add(optHome);

        const optAway = new Option(text, k);

        if (isUsed) {
          optAway.disabled = true;
          optAway.style.color = '#8b949e';
          optAway.style.opacity = '0.4';
        }

        awaySel.add(optAway);
      });

    if (
      [...homeSel.options].some(
        o => o.value === currentHome && !o.disabled
      )
    ) {
      homeSel.value = currentHome;
    }

    if (
      [...awaySel.options].some(
        o => o.value === currentAway && !o.disabled
      )
    ) {
      awaySel.value = currentAway;
    }
  }

  /* ═══════════════════════════════════════════
     QUINIELA — CARGAR PARTIDOS PARA APOSTAR
  ═══════════════════════════════════════════ */
  async loadMatchesForUser() {
    if (!this.currentUser) return;

    const quinielaId =
      document.getElementById('user-select-quiniela').value;

    const liga =
      document.getElementById('user-select-liga').value;

    const round =
      document.getElementById('user-select-round').value;

    const container =
      document.getElementById('user-matches-list');

    if (!quinielaId || !liga || !round) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML =
      '<p style="text-align:center;color:var(--text-muted);padding:20px">Cargando...</p>';

    try {
      const snap = await db.collection('matches')
        .where('quinielaId', '==', quinielaId)
        .where('liga', '==', liga)
        .where('round', '==', round)
        .get();

      if (snap.empty) {
        container.innerHTML =
          '<div class="empty-state"><div class="big">📋</div>Sin partidos en esta jornada.</div>';
        return;
      }

      const predSnap = await db.collection('predictions')
        .where('userId', '==', this.currentUser.uid)
        .get();

      const myPreds = {};

      predSnap.forEach(d => {
        myPreds[d.data().matchId] = d.data();
      });

      container.innerHTML = '';

      const now = new Date();

      const matches = [];

      snap.forEach(docSnap => {
        matches.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      this._sortMatchesChronologically(matches);

      matches.forEach(m => {
        const home = getTeam(
          m.liga,
          m.homeTeamId
        );

        const away = getTeam(
          m.liga,
          m.awayTeamId
        );

        const matchTime = this._getMatchTime(
          m.matchDate
        );

        const locked =
          (
            matchTime !== Number.MAX_SAFE_INTEGER &&
            now.getTime() >= matchTime
          ) ||
          m.status === 'FINISHED';

        const pred = myPreds[m.id] || {};

        const card = document.createElement('div');
        card.className = 'match-card';

        let resultHtml = '';

        if (
          m.status === 'FINISHED' &&
          m.golesLocal !== null &&
          m.golesVisita !== undefined
        ) {
          resultHtml = `
            <div style="text-align:center;font-size:0.8rem;color:var(--text-muted)">
              Resultado oficial:
              <strong style="color:#fff">
                ${m.golesLocal} – ${m.golesVisita}
              </strong>
              · Ganó:
              <strong style="color:var(--gold-color)">
                ${m.ganador || '—'}
              </strong>
            </div>
          `;

          if (pred.calculado) {
            const cls =
              pred.pts >= 5
                ? 'badge-pts5'
                : pred.pts >= 3
                  ? 'badge-pts3'
                  : 'badge-pts0';

            resultHtml += `
              <div style="text-align:center;margin-top:4px">
                <span class="badge ${cls}">
                  Tu pronóstico: ${pred.pts} pts
                </span>
              </div>
            `;
          }
        }

        card.innerHTML = `
          <div class="match-header">
            <span>
              ${this._formatMatchDate(m.matchDate)}
            </span>

            <span class="badge ${
              locked
                ? 'badge-closed'
                : 'badge-open'
            }">
              ${locked ? 'Cerrado' : 'Abierto'}
            </span>
          </div>

          <div class="match-body">
            <div class="team-info">
              <span class="team-flag">${home.flag}</span>
              <span class="team-name">${home.name}</span>
            </div>

            <span style="color:var(--text-muted);font-size:1rem">
              vs
            </span>

            <div class="team-info">
              <span class="team-flag">${away.flag}</span>
              <span class="team-name">${away.name}</span>
            </div>
          </div>

          ${!locked ? `
            <div>
              <span class="winner-label">
                ¿Quién gana? (obligatorio)
              </span>

              <div class="winner-row" id="wrow-${m.id}">
                <button
                  class="winner-btn ${
                    pred.ganador === home.name
                      ? 'selected'
                      : ''
                  }"
                  onclick="app._selectWinner(
                    '${m.id}',
                    '${home.name}',
                    this
                  )"
                >
                  ${home.flag}<br>${home.name}
                </button>

                <button
                  class="winner-btn ${
                    pred.ganador === 'Empate'
                      ? 'selected'
                      : ''
                  }"
                  onclick="app._selectWinner(
                    '${m.id}',
                    'Empate',
                    this
                  )"
                >
                  🤝<br>Empate
                </button>

                <button
                  class="winner-btn ${
                    pred.ganador === away.name
                      ? 'selected'
                      : ''
                  }"
                  onclick="app._selectWinner(
                    '${m.id}',
                    '${away.name}',
                    this
                  )"
                >
                  ${away.flag}<br>${away.name}
                </button>
              </div>
            </div>

            <div>
              <span class="winner-label">
                Marcador exacto (opcional — +5 pts)
              </span>

              <div class="score-inputs">
                <input
                  type="number"
                  id="ph-${m.id}"
                  min="0"
                  max="20"
                  value="${pred.golesLocal ?? ''}"
                  placeholder="0"
                >

                <span style="color:var(--text-muted);font-size:1.2rem">
                  –
                </span>

                <input
                  type="number"
                  id="pa-${m.id}"
                  min="0"
                  max="20"
                  value="${pred.golesVisita ?? ''}"
                  placeholder="0"
                >
              </div>
            </div>

            <button
              onclick="app.savePrediction(
                '${m.id}',
                '${home.name}',
                '${away.name}'
              )"
            >
              Guardar pronóstico
            </button>

          ` : `
            <div style="font-size:0.8rem;color:var(--text-muted);text-align:center">
              ${
                pred.ganador
                  ? `Tu apuesta:
                    <strong style="color:#fff">
                      ${pred.ganador}
                    </strong>
                    ${
                      pred.golesLocal != null
                        ? ` · ${pred.golesLocal}–${pred.golesVisita}`
                        : ''
                    }`
                  : 'No apostaste en este partido'
              }
            </div>
          `}

          ${resultHtml}
        `;

        container.appendChild(card);
      });

    } catch (e) {
      container.innerHTML =
        '<div class="empty-state"><div class="big">⚠️</div>Error al cargar partidos.</div>';

      console.error(e);
    }
  }

  _selectWinner(matchId, team, btn) {
    const row =
      document.getElementById('wrow-' + matchId);

    row
      .querySelectorAll('.winner-btn')
      .forEach(b => b.classList.remove('selected'));

    btn.classList.add('selected');
    btn.dataset.selected = team;
  }

  _getWinner(matchId) {
    const row =
      document.getElementById('wrow-' + matchId);

    const sel =
      row?.querySelector('.winner-btn.selected');

    return sel
      ? sel.dataset.selected
      : null;
  }

  async savePrediction(
    matchId,
    homeName,
    awayName
  ) {
    if (!this.currentUser) {
      this.toast('Inicia sesión primero', 'err');
      return;
    }

    const ganador =
      this._getWinner(matchId);

    if (!ganador) {
      this.toast('Selecciona un ganador', 'err');
      return;
    }

    const gL =
      document.getElementById('ph-' + matchId).value;

    const gA =
      document.getElementById('pa-' + matchId).value;

    const data = {
      userId: this.currentUser.uid,
      username: this.currentUsername,
      matchId,
      homeName,
      awayName,
      ganador,
      golesLocal:
        gL !== '' ? parseInt(gL) : null,
      golesVisita:
        gA !== '' ? parseInt(gA) : null,
      pts: 0,
      calculado: false,
      updatedAt:
        firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('predictions')
        .doc(`${this.currentUser.uid}_${matchId}`)
        .set(data);

      this.toast('✓ Pronóstico guardado', 'ok');

    } catch (e) {
      this.toast('Error al guardar', 'err');
    }
  }

  /* ═══ MIS PRONÓSTICOS ═══ */
  async loadMyPredictions() {
    if (!this.currentUser) return;

    const quinielaId =
      document.getElementById(
        'mis-select-quiniela'
      ).value;

    const list =
      document.getElementById('mis-pred-list');

    const totalCard =
      document.getElementById('mis-total-card');

    if (!quinielaId) {
      list.innerHTML = '';
      totalCard.innerHTML = '';
      return;
    }

    list.innerHTML =
      '<p style="text-align:center;color:var(--text-muted);padding:20px">Cargando...</p>';

    try {
      const snap = await db.collection('predictions')
        .where('userId', '==', this.currentUser.uid)
        .get();

      let preds = [];

      snap.forEach(d => {
        preds.push({
          id: d.id,
          ...d.data()
        });
      });

      if (preds.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><div class="big">🎯</div>Sin pronósticos aún.</div>';

        totalCard.innerHTML = '';
        return;
      }

      const mSnap = await db.collection('matches')
        .where('quinielaId', '==', quinielaId)
        .get();

      const matchMap = {};

      mSnap.forEach(d => {
        matchMap[d.id] = {
          id: d.id,
          ...d.data()
        };
      });

      preds = preds.filter(
        p => matchMap[p.matchId]
      );

      preds.sort((a, b) => {
        const matchA = matchMap[a.matchId];
        const matchB = matchMap[b.matchId];

        const timeA = this._getMatchTime(
          matchA?.matchDate
        );

        const timeB = this._getMatchTime(
          matchB?.matchDate
        );

        return timeA - timeB;
      });

      if (preds.length === 0) {
        totalCard.innerHTML = '';

        list.innerHTML =
          '<div class="empty-state"><div class="big">🎯</div>Sin pronósticos en esta quiniela.</div>';

        return;
      }

      let total = 0;
      let calculados = 0;

      preds.forEach(p => {
        if (p.calculado) {
          total += p.pts || 0;
          calculados++;
        }
      });

      totalCard.innerHTML = `
        <div class="card"
          style="display:flex;justify-content:space-between;align-items:center">

          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase">
              Total acumulado
            </div>

            <div style="font-size:1.8rem;font-weight:700;color:var(--gold-color)">
              ${total} pts
            </div>
          </div>

          <div style="text-align:right">
            <div style="font-size:0.75rem;color:var(--text-muted)">
              Calculados
            </div>

            <div style="font-size:1.2rem;font-weight:600">
              ${calculados} / ${preds.length}
            </div>
          </div>

        </div>
      `;

      list.innerHTML = '';

      preds.forEach(p => {
        let ptsBadge;

        if (p.calculado) {
          const cls =
            p.pts >= 5
              ? 'badge-pts5'
              : p.pts >= 3
                ? 'badge-pts3'
                : 'badge-pts0';

          const label =
            p.pts >= 5
              ? '5 pts — Exacto 🎯'
              : p.pts >= 3
                ? '3 pts — Ganador ✓'
                : '0 pts — Falló ✗';

          ptsBadge =
            `<span class="badge ${cls}">${label}</span>`;

        } else {
          ptsBadge =
            `<span class="badge" style="background:rgba(139,148,158,0.15);color:var(--text-muted)">Pendiente</span>`;
        }

        const card =
          document.createElement('div');

        card.className = 'match-card';

        card.innerHTML = `
          <div style="font-weight:600">
            ${p.homeName} vs ${p.awayName}
          </div>

          <div class="pred-result-row">

            <div style="color:var(--text-muted)">
              Ganador:
              <strong style="color:#fff">
                ${p.ganador}
              </strong>

              ${
                p.golesLocal != null
                  ? ` · Marcador:
                    <strong style="color:#fff">
                      ${p.golesLocal}–${p.golesVisita}
                    </strong>`
                  : ''
              }
            </div>

            ${ptsBadge}

          </div>

          ${
            p.calculado && p.resultado
              ? `<div style="font-size:0.75rem;color:var(--text-muted)">
                  Resultado real:
                  ${p.resultado.golesLocal}–${p.resultado.golesVisita}
                  (${p.resultado.ganador})
                </div>`
              : ''
          }
        `;

        list.appendChild(card);
      });

    } catch (e) {
      list.innerHTML =
        '<div class="empty-state"><div class="big">⚠️</div>Error al cargar.</div>';

      console.error(e);
    }
  }

  /* ═══ RANKING ═══ */
  async loadRanking() {
    const quinielaId =
      document.getElementById(
        'ranking-select-quiniela'
      ).value;

    const tbody =
      document.getElementById('ranking-body');

    if (!quinielaId) {
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML =
      '<tr><td colspan="3" style="color:var(--text-muted)">Cargando...</td></tr>';

    try {
      const mSnap = await db.collection('matches')
        .where('quinielaId', '==', quinielaId)
        .get();

      const matchIds = new Set();

      mSnap.forEach(d =>
        matchIds.add(d.id)
      );

      if (matchIds.size === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" style="color:var(--text-muted)">Sin partidos en esta quiniela.</td></tr>';

        return;
      }

      const predSnap =
        await db.collection('predictions')
          .where('calculado', '==', true)
          .get();

      const scores = {};

      predSnap.forEach(d => {
        const p = d.data();

        if (!matchIds.has(p.matchId)) return;

        scores[p.username] =
          (scores[p.username] || 0) +
          (p.pts || 0);
      });

      const ranking =
        Object.entries(scores)
          .sort((a, b) => b[1] - a[1]);

      if (ranking.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" style="color:var(--text-muted)">Sin resultados calculados aún.</td></tr>';

        return;
      }

      tbody.innerHTML = '';

      ranking.forEach(([username, pts], i) => {
        const pos = i + 1;

        const medal =
          pos === 1
            ? '🥇'
            : pos === 2
              ? '🥈'
              : pos === 3
                ? '🥉'
                : pos;

        const tr =
          document.createElement('tr');

        tr.innerHTML =
          `<td>${medal}</td><td>${username}</td><td>${pts}</td>`;

        tbody.appendChild(tr);
      });

    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="color:var(--text-muted)">Error al cargar.</td></tr>';

      console.error(e);
    }
  }

  /* ═══ VER APUESTAS DE TODOS ═══ */
  async loadTodos() {
    if (!this.currentUser) return;

    const quinielaId =
      document.getElementById(
        'todos-select-quiniela'
      ).value;

    const liga =
      document.getElementById(
        'todos-select-liga'
      ).value;

    const round =
      document.getElementById(
        'todos-select-round'
      ).value;

    const lista =
      document.getElementById('todos-list');

    if (!quinielaId || !liga || !round) {
      lista.innerHTML = '';
      return;
    }

    lista.innerHTML =
      '<p style="text-align:center;color:var(--text-muted);padding:20px">Cargando...</p>';

    try {
      const snap = await db.collection('matches')
        .where('quinielaId', '==', quinielaId)
        .where('liga', '==', liga)
        .where('round', '==', round)
        .get();

      const partidos = [];
      const now = new Date();

      snap.forEach(d => {
        const m = {
          id: d.id,
          ...d.data()
        };

        const matchTime =
          this._getMatchTime(m.matchDate);

        const cerrado =
          (
            matchTime !== Number.MAX_SAFE_INTEGER &&
            now.getTime() >= matchTime
          ) ||
          m.status === 'FINISHED';

        if (cerrado) {
          partidos.push(m);
        }
      });

      if (partidos.length === 0) {
        lista.innerHTML =
          '<div class="empty-state"><div class="big">🔒</div>Los partidos de esta jornada aún no han iniciado.<br><span style="font-size:0.8rem">Las apuestas se revelan cuando comienza cada partido.</span></div>';

        return;
      }

      this._sortMatchesChronologically(partidos);

      lista.innerHTML = '';

      for (const m of partidos) {
        const home =
          getTeam(m.liga, m.homeTeamId);

        const away =
          getTeam(m.liga, m.awayTeamId);

        const pSnap =
          await db.collection('predictions')
            .where('matchId', '==', m.id)
            .get();

        const apuestas = [];

        pSnap.forEach(d =>
          apuestas.push(d.data())
        );

        apuestas.sort((a, b) =>
          (a.username || '')
            .localeCompare(b.username || '')
        );

        const card =
          document.createElement('div');

        card.className = 'match-card';

        let resultHtml = '';

        if (
          m.status === 'FINISHED' &&
          m.golesLocal != null
        ) {
          resultHtml = `
            <div style="text-align:center;font-size:0.8rem;padding:6px;background:rgba(241,224,90,0.08);border-radius:6px">
              ⚽ Resultado:
              <strong style="color:#fff">
                ${m.golesLocal}–${m.golesVisita}
              </strong>
              · Ganó:
              <strong style="color:var(--gold-color)">
                ${m.ganador}
              </strong>
            </div>
          `;
        }

        let filas = '';

        if (apuestas.length === 0) {
          filas =
            '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:8px">Sin apuestas registradas</div>';

        } else {
          apuestas.forEach(a => {
            let ptsBadge = '';

            if (a.calculado) {
              const cls =
                a.pts >= 5
                  ? 'badge-pts5'
                  : a.pts >= 3
                    ? 'badge-pts3'
                    : 'badge-pts0';

              ptsBadge =
                `<span class="badge ${cls}">${a.pts}pts</span>`;
            }

            const marcador =
              a.golesLocal != null
                ? `${a.golesLocal}–${a.golesVisita}`
                : '—';

            const esYo =
              a.userId === this.currentUser.uid
                ? 'background:rgba(46,160,67,0.08);border-radius:6px;'
                : '';

            filas += `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 4px;border-bottom:1px solid var(--border-color);${esYo}">

                <div>
                  <strong style="font-size:0.85rem">
                    ${a.username || '?'}
                  </strong>

                  ${
                    a.userId === this.currentUser.uid
                      ? '<span style="font-size:0.7rem;color:var(--accent-color);margin-left:4px">tú</span>'
                      : ''
                  }
                </div>

                <div style="text-align:right;font-size:0.8rem">
                  <div style="color:#fff;font-weight:600">
                    ${a.ganador}
                  </div>

                  <div style="color:var(--text-muted)">
                    ${marcador}
                  </div>
                </div>

                <div style="min-width:48px;text-align:right">
                  ${ptsBadge}
                </div>

              </div>
            `;
          });
        }

        card.innerHTML = `
          <div class="match-header">

            <span>
              ${home.flag} ${home.name}
              vs
              ${away.flag} ${away.name}
            </span>

            <span class="badge ${
              m.status === 'FINISHED'
                ? 'badge-pts5'
                : 'badge-closed'
            }">
              ${
                m.status === 'FINISHED'
                  ? 'Finalizado'
                  : 'En curso'
              }
            </span>

          </div>

          ${resultHtml}

          <div>
            ${filas}
          </div>
        `;

        lista.appendChild(card);
      }

    } catch (e) {
      lista.innerHTML =
        '<div class="empty-state"><div class="big">⚠️</div>Error al cargar.</div>';

      console.error(e);
    }
  }

  /* ═══ ADMIN — PUBLICAR PARTIDO (CORREGIDO CON TIMESTAMP) ═══ */
  async publishMatch() {
    const quinielaId =
      document.getElementById('match-quiniela').value;

    const liga =
      document.getElementById('match-liga').value;

    const round =
      document.getElementById('match-round').value;

    const homeTeamId =
      document.getElementById('match-home').value;

    const awayTeamId =
      document.getElementById('match-away').value;

    const matchDate =
      document.getElementById('match-date').value;

    if (!quinielaId) {
      this.toast('Selecciona una quiniela', 'err');
      return;
    }

    if (!liga || !round) {
      this.toast('Selecciona liga y jornada', 'err');
      return;
    }

    if (!homeTeamId || !awayTeamId) {
      this.toast('Selecciona ambos equipos', 'err');
      return;
    }

    if (homeTeamId === awayTeamId) {
      this.toast('Los equipos deben ser diferentes', 'err');
      return;
    }

    // Se convierte el input a un Timestamp nativo de Firestore
    const dateObj = matchDate ? new Date(matchDate) : null;
    const matchDateVal = (dateObj && !isNaN(dateObj.getTime())) 
      ? firebase.firestore.Timestamp.fromDate(dateObj) 
      : null;

    try {
      await db.collection('matches').add({
        quinielaId,
        liga,
        round,
        homeTeamId,
        awayTeamId,
        matchDate: matchDateVal,
        status: 'OPEN',
        golesLocal: null,
        golesVisita: null,
        ganador: null
      });

      this.toast('✓ Partido publicado', 'ok');

      await this.updateAdminTeams();
      this.loadAdminMatches();

    } catch (e) {
      this.toast('Error al publicar', 'err');
      console.error(e);
    }
  }

  /* ═══ CARGAR PARTIDOS EN ADMIN ═══ */
  async loadAdminMatches() {
    const quinielaId =
      document.getElementById(
        'match-quiniela'
      ).value;

    const liga =
      document.getElementById(
        'match-liga'
      ).value;

    const sel =
      document.getElementById(
        'admin-match-select'
      );

    const selMan =
      document.getElementById(
        'manual-match-select'
      );

    if (!quinielaId || !liga) {
      sel.innerHTML =
        '<option value="">— Elige quiniela y liga —</option>';

      selMan.innerHTML =
        '<option value="">— Elige quiniela y liga —</option>';

      return;
    }

    sel.innerHTML =
      '<option value="">Cargando...</option>';

    selMan.innerHTML =
      '<option value="">Cargando...</option>';

    try {
      const snap =
        await db.collection('matches')
          .where('quinielaId', '==', quinielaId)
          .where('liga', '==', liga)
          .get();

      sel.innerHTML =
        '<option value="">— Selecciona partido —</option>';

      selMan.innerHTML =
        '<option value="">— Selecciona partido —</option>';

      const adminMatches = [];

      snap.forEach(d => {
        adminMatches.push({
          id: d.id,
          ...d.data()
        });
      });

      this._sortMatchesChronologically(adminMatches);

      adminMatches.forEach(m => {
        const home =
          getTeam(m.liga, m.homeTeamId);

        const away =
          getTeam(m.liga, m.awayTeamId);

        const label =
          `${this._formatMatchDate(m.matchDate)} · ${m.round}: ${home.name} vs ${away.name}${m.status === 'FINISHED' ? ' ✓' : ''}`;

        const opt1 =
          new Option(label, m.id);

        sel.appendChild(opt1);

        const opt2 =
          new Option(label, m.id);

        opt2.dataset.home = home.name;
        opt2.dataset.away = away.name;

        selMan.appendChild(opt2);
      });

      selMan.onchange = () => {
        const chosen =
          selMan.options[
            selMan.selectedIndex
          ];

        const home =
          chosen.dataset.home || '';

        const away =
          chosen.dataset.away || '';

        const selG =
          document.getElementById(
            'manual-ganador'
          );

        selG.innerHTML =
          '<option value="">— Selecciona —</option>';

        if (home) {
          selG.add(
            new Option(home, home)
          );

          selG.add(
            new Option(
              'Empate',
              'Empate'
            )
          );

          selG.add(
            new Option(away, away)
          );
        }
      };

    } catch (e) {
      sel.innerHTML =
        '<option>Error al cargar</option>';

      selMan.innerHTML =
        '<option>Error al cargar</option>';

      console.error(e);
    }
  }

  /* ═══ GUARDAR RESULTADO OFICIAL ═══ */
  async saveOfficialResult() {
    const matchId =
      document.getElementById(
        'admin-match-select'
      ).value;

    const gL =
      document.getElementById(
        'admin-goles-local'
      ).value;

    const gV =
      document.getElementById(
        'admin-goles-visita'
      ).value;

    if (!matchId) {
      this.toast(
        'Selecciona un partido',
        'err'
      );
      return;
    }

    if (gL === '' || gV === '') {
      this.toast(
        'Ingresa el marcador completo',
        'err'
      );
      return;
    }

    const golesLocal =
      parseInt(gL);

    const golesVisita =
      parseInt(gV);

    const mDoc =
      await db.collection('matches')
        .doc(matchId)
        .get();

    if (!mDoc.exists) {
      this.toast(
        'Partido no encontrado',
        'err'
      );
      return;
    }

    const m = mDoc.data();

    const home =
      getTeam(
        m.liga,
        m.homeTeamId
      );

    const away =
      getTeam(
        m.liga,
        m.awayTeamId
      );

    let ganador;

    if (golesLocal > golesVisita) {
      ganador = home.name;
    } else if (golesVisita > golesLocal) {
      ganador = away.name;
    } else {
      ganador = 'Empate';
    }

    const resultado = {
      golesLocal,
      golesVisita,
      ganador
    };

    try {
      await db.collection('matches')
        .doc(matchId)
        .update({
          golesLocal,
          golesVisita,
          ganador,
          status: 'FINISHED'
        });

      const predSnap =
        await db.collection('predictions')
          .where('matchId', '==', matchId)
          .get();

      const batch =
        db.batch();

      predSnap.forEach(d => {
        const p = d.data();

        if (p.calculado) return;

        const acertoGanador =
          p.ganador === ganador;

        let pts = 0;

        if (acertoGanador) {
          const tieneMarcador =
            p.golesLocal != null &&
            p.golesVisita != null;

          pts =
            tieneMarcador &&
            p.golesLocal === golesLocal &&
            p.golesVisita === golesVisita
              ? 5
              : 3;
        }

        batch.update(
          d.ref,
          {
            pts,
            calculado: true,
            resultado
          }
        );
      });

      await batch.commit();

      this.toast(
        `✓ ${ganador} · ${golesLocal}–${golesVisita} · Puntos calculados`,
        'ok'
      );

      this.loadAdminMatches();

    } catch (e) {
      this.toast(
        'Error al guardar resultado',
        'err'
      );

      console.error(e);
    }
  }

  /* ═══ CARGA TARDÍA MANUAL ═══ */
  async saveManualPrediction() {
    const matchId =
      document.getElementById(
        'manual-match-select'
      ).value;

    const username =
      document.getElementById(
        'manual-username'
      ).value.trim();

    const ganador =
      document.getElementById(
        'manual-ganador'
      ).value;

    const gL =
      document.getElementById(
        'manual-goles-local'
      ).value;

    const gV =
      document.getElementById(
        'manual-goles-visita'
      ).value;

    if (!matchId) {
      this.toast(
        'Selecciona un partido',
        'err'
      );
      return;
    }

    if (!username) {
      this.toast(
        'Escribe el nombre del jugador',
        'err'
      );
      return;
    }

    if (!ganador) {
      this.toast(
        'Selecciona un ganador',
        'err'
      );
      return;
    }

    const chosen =
      document.getElementById(
        'manual-match-select'
      ).selectedOptions[0];

    const homeName =
      chosen.dataset.home || '';

    const awayName =
      chosen.dataset.away || '';

    try {
      const uSnap =
        await db.collection('users')
          .where(
            'username',
            '==',
            username
          )
          .get();

      if (uSnap.empty) {
        this.toast(
          `No existe el jugador "${username}"`,
          'err'
        );
        return;
      }

      const uid =
        uSnap.docs[0].id;

      await db.collection('predictions')
        .doc(`${uid}_${matchId}`)
        .set({
          userId: uid,
          username,
          matchId,
          homeName,
          awayName,
          ganador,
          golesLocal:
            gL !== ''
              ? parseInt(gL)
              : null,
          golesVisita:
            gV !== ''
              ? parseInt(gV)
              : null,
          pts: 0,
          calculado: false,
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      this.toast(
        `✓ Pronóstico de ${username} guardado`,
        'ok'
      );

      document.getElementById(
        'manual-username'
      ).value = '';

      document.getElementById(
        'manual-ganador'
      ).value = '';

      document.getElementById(
        'manual-goles-local'
      ).value = '';

      document.getElementById(
        'manual-goles-visita'
      ).value = '';

    } catch (e) {
      this.toast(
        'Error al guardar pronóstico manual',
        'err'
      );

      console.error(e);
    }
  }
}

/* ═══ INICIAR APP ═══ */
window.app = new QuinielaEngine();

auth.onAuthStateChanged(async user => {
  if (user) {
    window.app.currentUser = user;

    const uDoc =
      await db.collection('users')
        .doc(user.uid)
        .get();

    const username =
      uDoc.exists
        ? (
            uDoc.data().username ||
            'Usuario'
          )
        : 'Usuario';

    window.app.currentUsername = username;

    document.getElementById(
      'user-display'
    ).textContent = username;

  } else {
    window.app.currentUser = null;
    window.app.currentUsername = null;
    window.app.adminUnlocked = false;

    document.getElementById(
      'user-display'
    ).textContent = 'Invitado';
  }
});





