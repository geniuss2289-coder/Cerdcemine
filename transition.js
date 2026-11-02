/* Переход между страницами — «прыжок лягушки».
   Снимает кадр уходящей страницы через встроенный html2canvas (../vendor/shot.js)
   и растворяет его в болотный туман. Без библиотеки — просто приседание в туман. */
(() => {
  const KEY = 'serdce-page-transition';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const html = document.documentElement;
  sessionStorage.removeItem(KEY);   // «вход» раздаётся только при переходе по ссылке

  /* ---------- слой перехода ---------- */
  const layer = document.createElement('div');
  layer.className = 'transition';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <div class="tr-shape"></div>
    <div class="tr-ripple"></div>`;
  document.body.appendChild(layer);

  const takeShot = () => {
    if (!window.html2canvas) return Promise.resolve('');
    return window.html2canvas(document.body, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: Math.min(1, 1100 / innerWidth),
      useCORS: true,
      logging: false,
      ignoreElements: (el) =>
        el.classList?.contains('transition') ||
        el.classList?.contains('tr-shot') ||
        el.classList?.contains('reticle') ||
        el.classList?.contains('toast') ||
        el.tagName === 'CANVAS',
    }).then((c) => c.toDataURL('image/jpeg', 0.72)).catch(() => '');
  };

  /* ---------- уход ---------- */
  let leaving = false;
  const leave = async (href) => {
    if (leaving) return;
    leaving = true;
    sessionStorage.setItem(KEY, 'in');

    setTimeout(() => { location.href = href; }, 2600);   // страховка
    const libReady = window.html2canvas ? Promise.resolve() : new Promise(r => setTimeout(r, 450));
    await libReady;
    const shot = reduce ? '' : await takeShot();

    if (shot) {
      // снимок уходит в туман — так же, как ушёл бы сам мир
      const shotEl = document.createElement('img');
      shotEl.className = 'tr-shot';
      shotEl.alt = '';
      shotEl.style.left = `-${scrollX}px`;
      shotEl.style.top = `-${scrollY}px`;
      shotEl.src = shot;
      document.body.appendChild(shotEl);
      requestAnimationFrame(() => shotEl.classList.add('is-out'));
      await new Promise(r => setTimeout(r, 260));
    }

    html.classList.add('is-leaving');
    // лягушка из nav прыгает в центр экрана, пока мир уходит в туман
    if (!reduce) {
      const link = document.querySelector('.nav-donate-frog svg') || document.querySelector('.nav-donate svg');
      if (link) {
        const r = link.getBoundingClientRect();
        const fly = link.cloneNode(true);
        fly.className = 'tr-fly';
        fly.style.left = r.left + 'px';
        fly.style.top = r.top + 'px';
        fly.style.width = r.width + 'px';
        fly.style.height = r.height + 'px';
        fly.style.setProperty('--dx', (innerWidth / 2 - r.left - r.width / 2) + 'px');
        fly.style.setProperty('--dy', (innerHeight * .48 - r.top) + 'px');
        document.body.appendChild(fly);
      }
    }
    await new Promise(r => setTimeout(r, reduce ? 60 : 560));
    location.href = href;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/.test(href)) return;
    let u;
    try { u = new URL(href, location.href); } catch { return; }
    if (u.origin !== location.origin) return;                       // внешние — как есть
    if (u.pathname === location.pathname && u.search === location.search) return; // якоря/то же место
    e.preventDefault();
    leave(href);
  });

  /* история браузера (назад/вперёд) — страница возвращается без тумана */
  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      html.classList.remove('is-leaving', 'is-arriving', 'is-revealed');
      document.querySelector('.tr-shot')?.remove();
    }
  });

  /* ---------- вход ---------- */
  if (sessionStorage.getItem(KEY)) {
    sessionStorage.removeItem(KEY);
    html.classList.add('is-arriving');
    layer.classList.add('is-live');
    const reveal = () => {
      html.classList.add('is-revealed');
      setTimeout(() => {
        html.classList.remove('is-arriving', 'is-revealed');
        layer.classList.remove('is-live');
      }, 850);
    };
    // ждём шрифты и первый кадр, чтобы туман расходился на готовую страницу
    const ready = document.fonts?.ready || Promise.resolve();
    Promise.race([ready, new Promise(r => setTimeout(r, 700))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(reveal)));
  } else {
    layer.remove();
  }
})();
