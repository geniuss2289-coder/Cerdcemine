/* ===========================================================
   СЕРДЦЕ — анимации и интерактив
   =========================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- прицел вместо курсора ---------- */
  const reticle = document.querySelector('.reticle');
  if (reticle && !reduce) {
    const parts = reticle.querySelectorAll('i');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const el = e.target.closest('a, button, [role="button"]');
      reticle.classList.toggle('is-over', !!el);
    }, { passive: true });
    (function loop() {
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      parts.forEach(p => {
        p.style.setProperty('--x', x + 'px');
        p.style.setProperty('--y', y + 'px');
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- навигация при скролле ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- копирование IP ---------- */
  const toast = document.querySelector('.toast');
  let toastTimer;
  const copy = async (text) => {
    if (!toast) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast.textContent = 'IP ' + text + ' скопирован — вставляй в Minecraft';
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };
  document.querySelectorAll('[data-copy]').forEach((el) => {
    const go = () => copy(el.dataset.copy);
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  /* ---------- появление секций ---------- */
  const revealEls = document.querySelectorAll('[data-reveal], .steps li');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- счётчики ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const fmtCount = (n, el) => el.dataset.format === 'space' ? n.toLocaleString('ru-RU') : String(n);
  const runCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduce || target === 0) { el.textContent = fmtCount(target, el) + suffix; return; }
    const dur = 1400, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtCount(Math.round(target * eased), el) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(runCount);
  }

  /* ---------- табы правил ---------- */
  const tabs = [...document.querySelectorAll('.rule')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const select = (i, focus = false) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const map = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in map) {
        e.preventDefault();
        select((i + map[e.key] + tabs.length) % tabs.length, true);
      } else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  });

  /* ---------- реальный онлайн: 11 253 / 20 000, но живо ---------- */
  const onlineEl = document.querySelector('[data-online]');
  const SLOTS = 20000;
  const fmt = (n) => n.toLocaleString('ru-RU');
  let online = 11253, target = 11253;
  const paintOnline = () => {
    if (!onlineEl) return;
    const next = `<span class="num">${fmt(online)}</span><span class="slash"> / </span>${fmt(SLOTS)}`;
    if (onlineEl.innerHTML !== next) onlineEl.innerHTML = next;
  };
  if (onlineEl) {
    // цель плавно дрейфует: немного вверх, немного вниз
    const newTarget = () => {
      const drift = (Math.random() - 0.5) * 300;
      target = Math.round(Math.max(11100, Math.min(11450, 11253 + drift)));
    };
    newTarget();
    paintOnline();
    if (!reduce) {
      // каждые ~0.9 с шаг на 1–9 игроков в сторону цели — плавный счётчик
      setInterval(() => {
        if (online === target) return;
        const step = Math.sign(target - online) * (1 + Math.floor(Math.random() * 9));
        online = Math.abs(target - online) < Math.abs(step) ? target : online + step;
        paintOnline();
        const num = onlineEl.querySelector('.num');
        num?.classList.remove('is-up', 'is-down');
        void onlineEl.offsetWidth;
        num?.classList.add(step > 0 ? 'is-up' : 'is-down');
      }, 900);
      setInterval(newTarget, 8000);
      // редкий «всплеск»: мероприятие, стример зашёл
      setInterval(() => {
        if (Math.random() < 0.35) target = Math.min(12400, target + 60 + Math.floor(Math.random() * 120));
      }, 31000);
    } else {
      online = target;
      paintOnline();
    }
  }

  /* ---------- сцена: пиксельный мир ---------- */
  const canvas = document.getElementById('world');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // детерминированный псевдослучайный
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rand = (a, b) => a + rnd() * (b - a);

  let W = 0, H = 0, DPR = 1, P = 2; // P = размер пикселя
  let layers = [], terrain = [], clouds = [], stars = [], particles = [], creature = null;
  let t = 0, mx = 0, my = 0, smx = 0, smy = 0;

  const PAL = {
    grassTop: ['#6d9c3f', '#7aab48', '#5d8a35'],
    dirt: ['#7a5537', '#6a4a30', '#84603f'],
    stone: ['#6e6c72', '#5e5c63', '#7a7880', '#504f56'],
    ore: '#e3c06a',
    core: '#d6f24a',
    eye: '#d6f24a',
    leaf: ['#2f5a33', '#284d2c', '#37663b'],
    trunk: '#4b3524',
    cloud: 'rgba(214, 222, 245, 0.30)',
    lava: ['#ff7a2f', '#ff5533', '#e8421f'],
  };

  function build() {
    const rect = canvas.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    P = W < 640 ? 3 : 4;

    const cx = W * 0.66;              // центр «острова»
    const horizon = H * 0.7;          // уровень земли
    const islandR = Math.min(W * 0.4, H * 0.42);

    terrain = [];
    // верхний слой земли — волнистая линия
    for (let x = -20; x < W + 20; x += P) {
      const d = Math.abs(x - cx) / islandR;
      const edgeDrop = Math.max(0, d - 0.55) / 0.45;
      const wave = Math.sin(x * 0.021) * P * 2.2 + Math.sin(x * 0.007 + 2) * P * 4;
      const top = horizon + wave + edgeDrop * edgeDrop * H * 0.34 - P * 2;
      const depth = edgeDrop * edgeDrop * H * 0.42 + P * rand(3, 6);
      const col = [];
      for (let y = top; y < top + Math.min(depth, H - top); y += P) col.push(y);
      terrain.push({ x, top, col, grass: d < 0.62 });
    }

    // деревья
    const trees = [];
    for (let i = 0; i < 7; i++) {
      const tx = cx + (i / 6 - 0.5) * islandR * 1.55 + rand(-P * 3, P * 3);
      const d = Math.abs(tx - cx) / islandR;
      const edgeDrop = Math.max(0, d - 0.55) / 0.45;
      const y = horizon + Math.sin(tx * 0.021) * P * 2.2 + Math.sin(tx * 0.007 + 2) * P * 4 + edgeDrop * edgeDrop * H * 0.34 - P * 2;
      trees.push({ x: Math.round(tx / P) * P, y, h: rand(5, 10) * P });
    }
    terrain.trees = trees;

    // фоновые слои: обрыв за обрывом
    layers = [
      { depth: 0.15, color: '#2a2a4a', offset: H * 0.06 },
      { depth: 0.3, color: '#232342', offset: H * 0.02 },
    ].map(L => {
      const pts = [];
      for (let x = -20; x < W + 20; x += P) {
        pts.push({
          x,
          y: H * 0.62 + L.offset + Math.sin(x * 0.006 * (1 + L.depth)) * H * 0.05 + Math.sin(x * 0.017) * P * 2,
        });
      }
      return { ...L, pts };
    });

    // облака
    clouds = Array.from({ length: Math.max(3, Math.round(W / 360)) }, () => ({
      x: rand(-W * .2, W * 1.1),
      y: rand(H * 0.06, H * 0.42),
      w: rand(P * 14, P * 30),
      speed: rand(0.12, 0.4),
      rows: [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
      ],
    }));

    // звёзды
    stars = Array.from({ length: 90 }, () => ({
      x: rand(0, W), y: rand(0, H * 0.6),
      s: rnd() < .15 ? P : P / 2,
      ph: rand(0, Math.PI * 2),
    }));

    // существо в темноте
    creature = { x: cx - islandR * 0.15, y: horizon - P * 6, blink: 0, nextBlink: 2 + rnd() * 3 };

    particles = Array.from({ length: W < 640 ? 22 : 40 }, () => spawnParticle(true));
  }

  function spawnParticle(anywhere) {
    const cx = W * 0.66, horizon = H * 0.7;
    return {
      x: cx + rand(-W * .45, W * .45),
      y: anywhere ? rand(H * .3, H * .95) : horizon + rand(-H * .2, H * .3),
      s: rnd() < .2 ? P : P / 2,
      v: rand(.15, .6),
      drift: rand(-.15, .15),
      color: rnd() < .65 ? '#e8c67a' : '#ff8a4c',
      life: rand(4, 12), age: 0,
      ph: rand(0, 6.28),
    };
  }

  function px(x, y, s, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x / P) * P, Math.round(y / P) * P, s, s);
  }

  // блок земли с пиксельной текстурой
  function block(x, y, kind) {
    const noise = (x * 7 + y * 13 + ((x >> 2) ^ (y >> 2))) % 5;
    if (kind === 'grass') {
      px(x, y, P, PAL.grassTop[noise % 3]);
      px(x, y + P, P, PAL.dirt[noise % 3]);
    } else if (kind === 'dirt') {
      px(x, y, P, PAL.dirt[noise % 3]);
    } else {
      px(x, y, P, PAL.stone[noise % 4]);
    }
  }

  function drawStars() {
    stars.forEach(s => {
      const a = 0.25 + 0.55 * Math.max(0, Math.sin(t * 0.6 + s.ph));
      ctx.fillStyle = `rgba(220,228,255,${a})`;
      ctx.fillRect(s.x - smx * 0.3, s.y - smy * 0.3, s.s, s.s);
    });
  }

  function drawClouds() {
    clouds.forEach(c => {
      c.x += c.speed * (reduce ? 0 : 1);
      if (c.x > W * 1.2) c.x = -c.w * 2;
      const ox = c.x - smx * 1.4, oy = c.y - smy * 1.4;
      ctx.save();
      ctx.shadowColor = 'rgba(200,210,255,.25)';
      ctx.shadowBlur = 30;
      c.rows.forEach((row, ry) => row.forEach((on, rx) => {
        if (on) px(ox + rx * P * 3, oy + ry * P * 3, P * 3, PAL.cloud);
      }));
      ctx.restore();
    });
  }

  function drawLayers() {
    layers.forEach(L => {
      const ox = -smx * L.depth * 6;
      ctx.fillStyle = L.color;
      L.pts.forEach((p) => {
        const x = p.x + ox;
        ctx.fillRect(x, p.y, P, H - p.y);
      });
    });
  }

  function drawTerrain() {
    const ox = -smx * 3;
    terrain.forEach((col, i) => {
      const x = col.x + ox;
      const isEdge = Math.abs(x - W * .66) > Math.min(W * .38, H * .38);
      col.col.forEach((y, j) => {
        let kind = 'stone';
        if (j === 0 && col.grass) kind = 'grass';
        else if (j < 3 && col.grass) kind = 'dirt';
        else if (j < (isEdge ? 1 : 5)) kind = 'dirt';
        block(x, y, kind);
      });
      // руда в глубине
      if (i % 11 === 0 && col.col.length > 6) {
        const y = col.col[Math.min(col.col.length - 1, 4 + (i % 5))];
        px(x, y, P, PAL.ore);
        px(x - P, y, P / 2, 'rgba(227,192,106,.4)');
      }
    });

    // деревья
    (terrain.trees || []).forEach((tr) => {
      const x = tr.x + ox - smx * 3;
      for (let h = 1; h <= tr.h; h += P) px(x, tr.y - h, P, PAL.trunk);
      const top = tr.y - tr.h;
      for (let dy = -3; dy <= 2; dy++) {
        const w = 3 - Math.abs(dy + 1);
        for (let dx = -w; dx <= w; dx++) {
          if ((dx * 3 + dy * 7 + 20) % 11 === 0) continue;
          px(x + dx * P, top + dy * P, P, PAL.leaf[(dx + dy + 6) % 3]);
        }
      }
    });

    // кристалл-ядро в глубине, пульсирует
    const cxp = W * 0.66;
    const baseY = terrain.find(c => Math.abs(c.x - cxp) < P)?.top ?? H * 0.7;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    const diamond = [
      [0, -3], [1, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-2, -1], [-1, -2],
    ];
    ctx.save();
    ctx.shadowColor = `rgba(214,242,74,${0.4 + pulse * 0.5})`;
    ctx.shadowBlur = 18 + pulse * 18;
    diamond.forEach(([dx, dy]) => px(cxp + dx * P, baseY + P * 7 + dy * P, P, PAL.core));
    ctx.restore();
  }

  function drawCreature() {
    if (!creature) return;
    const x = creature.x - smx * 3;
    const y = creature.y + Math.sin(t * 1.1) * P * 0.5;
    // силуэт
    ctx.fillStyle = '#150f1e';
    px(x, y, P * 4, ctx.fillStyle);
    px(x + P * 5, y + P, P * 3, ctx.fillStyle);
    px(x - P * 2, y + P * 2, P * 2, ctx.fillStyle);

    creature.nextBlink -= 1 / 60;
    if (creature.nextBlink < 0) { creature.blink = 0.18; creature.nextBlink = 2.5 + Math.random() * 3.5; }
    const closed = creature.blink > 0;
    if (closed) creature.blink -= 1 / 60;
    ctx.save();
    ctx.shadowColor = PAL.eye;
    ctx.shadowBlur = 14;
    const eh = closed ? P * 0.4 : P * 1.2;
    ctx.fillStyle = PAL.eye;
    ctx.fillRect(x + P, y + P * 1.2, P * 1.2, eh);
    ctx.fillRect(x + P * 3 - P * 0.2, y + P * 1.2, P * 1.2, eh);
    ctx.restore();
  }

  function drawParticles(dt) {
    particles.forEach((p, i) => {
      p.age += dt;
      p.y -= p.v * 60 * dt * (reduce ? 0.2 : 1);
      p.x += Math.sin(t * 0.8 + p.ph) * p.drift * 60 * dt;
      const fade = Math.min(1, p.age / 1.2) * Math.max(0, 1 - p.age / p.life);
      if (p.age > p.life) { particles[i] = spawnParticle(false); return; }
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.globalAlpha = 1;
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) t += dt;
    smx += (mx - smx) * 0.05;
    smy += (my - smy) * 0.05;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawStars();
    drawClouds();
    drawLayers();
    drawTerrain();
    drawCreature();
    drawParticles(dt);
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', (e) => {
    mx = (e.clientX / innerWidth - .5) * 2;
    my = (e.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  build();
  requestAnimationFrame(frame);

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(build, 180);
  });
})();
