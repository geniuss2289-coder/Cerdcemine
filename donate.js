/* ===========================================================
   ДОНАТ — лягушки, звук, выбор привилегии, сундук
   =========================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- плеер кваканья (синтез, без аудиофайлов) ---------- */
  let ac = null;
  const ensureAudio = () => {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };

  // квак: короткий гудящий тон с формантами, два раза
  function croak(pitch = 150) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.connect(ctx.destination);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 6;
    lp.connect(out);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.22);
    osc.connect(lp);

    const trem = ctx.createOscillator();
    trem.type = 'square';
    trem.frequency.value = 28 + Math.random() * 8;
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.5;
    trem.connect(tremGain).connect(out.gain);

    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(0.22, now + 0.02);
    out.gain.setValueAtTime(0.22, now + 0.16);
    out.gain.linearRampToValueAtTime(0.0001, now + 0.24);

    osc.start(now); osc.stop(now + 0.26);
    trem.start(now); trem.stop(now + 0.26);

    // второй «квак» через паузу
    setTimeout(() => {
      const t = ctx.currentTime;
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass'; f2.frequency.value = 800; f2.Q.value = 5;
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(pitch * 0.92, t);
      o2.frequency.exponentialRampToValueAtTime(pitch * 0.6, t + 0.18);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g2.gain.linearRampToValueAtTime(0.0001, t + 0.2);
      o2.connect(f2).connect(g2).connect(ctx.destination);
      o2.start(t); o2.stop(t + 0.22);
    }, 280);
  }

  const PITCH = { low: 120, mid: 155, high: 195, gold: 230 };

  /* ---------- микро-анимации лягушек: волна «квак-квак» в карточках ---------- */
  document.querySelectorAll('[data-frog]').forEach((card) => {
    card.addEventListener('click', () => {
      croak(PITCH[card.dataset.croak] || 150);
      card.classList.remove('is-happy');
      void card.offsetWidth;
      card.classList.add('is-happy');
    });
  });

  /* ---------- маскот: прыжок, поворот, квак ---------- */
  const mascotStage = document.getElementById('mascotStage');
  if (mascotStage) {
    mascotStage.style.cursor = 'pointer';
    const jump = () => {
      croak(mascotStage.dataset.variant === 'warm' ? 190 : 165);
      mascotStage.classList.remove('is-jump');
      void mascotStage.offsetWidth;
      mascotStage.classList.add('is-jump');
      setTimeout(() => mascotStage.classList.remove('is-jump'), 1000);
    };
    mascotStage.addEventListener('click', jump);
    mascotStage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); }
    });
  }

  /* ---------- выбор привилегии ---------- */
  const RANKS = [
    { name: 'Головастик', price: 0, accent: '#8fd3e8', bar: 18 },
    { name: 'Аксолотль', price: 150, accent: '#f08fc4', bar: 42 },
    { name: 'Жаба', price: 390, accent: '#d6f24a', bar: 66 },
    { name: 'Стрекоза', price: 790, accent: '#ffb65e', bar: 100 },
  ];
  const cardEls = [...document.querySelectorAll('[data-rank-card]')];
  const rankEl = document.querySelector('[data-rank]');
  const noteEl = document.querySelector('[data-rank-note]');
  const barEl = document.querySelector('[data-rank-bar]');
  const stepEl = document.querySelector('[data-rank-step]');
  const money = (n) => n.toLocaleString('ru-RU') + ' ₽/мес';

  const pickRank = (card) => {
    const idx = cardEls.indexOf(card);
    const rank = RANKS[idx];
    if (!rank) return;
    cardEls.forEach(c => c.classList.remove('is-active'));
    card.classList.add('is-active');

    rankEl.textContent = rank.name;
    rankEl.style.color = rank.accent;
    barEl.style.width = rank.bar + '%';
    barEl.style.background = `linear-gradient(90deg, ${rank.accent}, #e8c67a)`;

    if (rank.price === 0) {
      noteEl.textContent = 'Базовый доступ. Можно выбрать привилегию ниже.';
      stepEl.textContent = 'до Аксолотля осталось ' + money(150);
    } else if (idx === RANKS.length - 1) {
      noteEl.textContent = 'Максимальная привилегия. Спасибо, что топите за сервер.';
      stepEl.textContent = 'выше некуда — только по дружбе';
    } else {
      const next = RANKS[idx + 1];
      noteEl.textContent = 'Выбрано: ' + rank.name + ', ' + money(rank.price) + '.';
      stepEl.textContent = 'до ' + next.name + ' осталось ' + money(next.price - rank.price);
    }

    const btn = card.querySelector('[data-pick]');
    cardEls.forEach(c => { const b = c.querySelector('[data-pick]'); if (b) b.textContent = b === btn ? 'Выбрано' : 'Выбрать'; });
  };

  cardEls.forEach(card => card.querySelector('[data-pick]').addEventListener('click', () => {
    pickRank(card);
    croak(180 + cardEls.indexOf(card) * 18);
  }));

  /* ---------- сундук ---------- */
  const rewards = [
    { t: 'Пиксельный стикер‑лягушка', s: 'Клеится в чат командой /frog. Живёт 7 дней.' },
    { t: '30 минут двойного опыта', s: 'Работает только вне PvP и на арене не считается.' },
    { t: 'Скин «Умеренная лягушка»', s: 'На 3 дня в инвентаре скинов. Потом выцветает.' },
    { t: '250 болотных монет', s: 'Монеты внутренней экономики. Тратить можно на рынке.' },
    { t: 'Скидка 10% на привилегию', s: 'Действует 24 часа на любую привилегию.' },
    { t: 'Лягушка‑спутник на день', s: 'Прыгает рядом и квакает, когда вы умираете.' },
    { t: 'Пусто', s: 'В сундуке был только мох. Правда, красивый.' },
    { t: 'Сон об аксолотле', s: 'Редкий анимационный титул на профиле. Есть у 4% игроков.' },
  ];
  const chest = document.getElementById('chestBtn');
  const chestOut = document.getElementById('chestResult');
  const KEY = 'serdce-chest';
  const today = new Date().toISOString().slice(0, 10);

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const save = read();

  const renderReward = (r, again) => {
    chestOut.innerHTML = '';
    const t = document.createElement('p');
    t.className = 'chest-reward';
    t.textContent = r.t;
    const s = document.createElement('p');
    s.className = 'chest-sub';
    s.textContent = r.s;
    chestOut.append(t, s);
    if (again) {
      const b = document.createElement('button');
      b.className = 'chest-again';
      b.textContent = 'демо: открыть ещё раз завтра';
      b.addEventListener('click', () => { write({}); paintChest(); chestOut.innerHTML = '<p class="chest-idle">Сундук посвежел. Можно снова.</p>'; });
      chestOut.append(b);
    }
  };

  const paintChest = () => {
    const state = read();
    if (state.day === today && state.reward != null) {
      chest.disabled = true;
      chest.querySelector('.chest-hint').textContent = 'Завтра в 00:00 — снова';
      renderReward(rewards[state.reward], true);
    } else {
      chest.disabled = false;
      chest.querySelector('.chest-hint').textContent = 'Открыть · бесплатно раз в день';
      chestOut.innerHTML = '<p class="chest-idle">Сегодня ещё не открывали. Сундук подрагивает.</p>';
    }
  };

  if (chest) {
    paintChest();
    chest.addEventListener('click', () => {
      const state = read();
      if (state.day === today && state.reward != null) return;
      chest.classList.add('is-open');
      croak(200);
      setTimeout(() => {
        const i = Math.floor(Math.random() * rewards.length);
        write({ day: today, reward: i });
        paintChest();
        chestOut.querySelector('.chest-reward')?.animate(
          [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 600, easing: 'cubic-bezier(.22,.9,.24,1)' }
        );
      }, 380);
    });
  }

  /* ---------- болото на фоне героя ---------- */
  const canvas = document.getElementById('swamp');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, P = 4;
  let drops = [], pads = [], fireflies = [], t = 0, last = performance.now();

  function build() {
    const rect = canvas.parentElement.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    P = W < 640 ? 3 : 4;
    drops = Array.from({ length: W < 640 ? 70 : 170 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      len: (2 + Math.floor(Math.random() * 4)) * P,
      v: 0.3 + Math.random() * 0.6,
    }));
    pads = Array.from({ length: 6 }, () => ({
      x: W * (0.55 + Math.random() * 0.4),
      y: H * (0.62 + Math.random() * 0.36),
      w: (3 + Math.floor(Math.random() * 3)) * P,
      ph: Math.random() * 6,
    }));
    fireflies = Array.from({ length: 18 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5,
    }));
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) t += dt;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // дождь — только в верхней половине, чтобы не мешать тексту
    ctx.fillStyle = 'rgba(160, 200, 170, 0.09)';
    drops.forEach(d => {
      if (!reduce) { d.y += d.v * 200 * dt; if (d.y > H) { d.y = -d.len; d.x = Math.random() * W; } }
      ctx.fillRect(Math.round(d.x / P) * P, Math.round(d.y / P) * P, P / 2, d.len);
    });

    // кувшинки
    pads.forEach(p => {
      const ox = reduce ? 0 : Math.sin(t * 0.4 + p.ph) * P;
      const x = Math.round((p.x + ox) / P) * P, y = Math.round(p.y / P) * P;
      ctx.fillStyle = '#2c5535';
      ctx.fillRect(x, y, p.w * P, p.w * P);
      ctx.fillStyle = '#3d6e45';
      ctx.fillRect(x + P, y + P, p.w * P - 2 * P, p.w * P - 2 * P);
      ctx.fillStyle = '#0c1410';
      ctx.fillRect(x + p.w * P - 2 * P, y + p.w * P - 2 * P, P, P);
    });

    // светлячки
    ctx.fillStyle = 'rgba(214, 242, 150, 1)';
    fireflies.forEach(f => {
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * f.sp * 2 + f.ph));
      const x = f.x + Math.sin(t * f.sp + f.ph) * 18;
      const y = f.y + Math.cos(t * f.sp * 0.7 + f.ph) * 12;
      ctx.globalAlpha = a;
      ctx.fillRect(x, y, P / 2, P / 2);
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 200); });
})();
