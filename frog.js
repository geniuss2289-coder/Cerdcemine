/* ===========================================================
   Генератор лягушки в стиле Minecraft из сетки 11 × 9.
   B/T/F/L/R — грани блока, s — пятна, e/p — глаз, m — рот,
   b — живот/хребет, f — лапы.
   =========================================================== */
(() => {
  const MAP = {
    B: 'px-b', T: 'px-t', F: 'px-f', L: 'px-l', R: 'px-r',
    s: 'px-s', e: 'px-e', p: 'px-p', m: 'px-m', b: 'px-belly', f: 'px-feet',
  };

  const GRID = [
    '..ss...ss..',              // 0 глаза-бугры, тёмный контур
    '.ssBs.ssBs.',              // 1 объём глаза с боковым оттенком
    '.sepe.ssepe',              // 2 сами глаза: светлое кольцо и зрачок у морды
    'BBBBBBBBBBB',              // 3 широкая спина — «макушка»
    'TTTTTTTTTTT',              // 4 светлый переход
    'sLRFFFFFFFm',              // 5 бока, морда справа, линия рта
    'bFFFFFFFFFm',              // 6 светлая маска лица
    'bBsBBLBBBsB',              // 7 хребет вдоль спины
    'FfFFfFFfFFf',              // 8 задние лапы
  ];

  const build = (el) => {
    el.textContent = '';
    const frag = document.createDocumentFragment();
    GRID.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '.' || !MAP[ch]) return;
        const d = document.createElement('div');
        d.className = MAP[ch];
        d.style.left = `calc(${c} * var(--px))`;
        d.style.top = `calc(${r} * var(--px))`;
        frag.appendChild(d);
      });
    });
    el.appendChild(frag);
  };

  const run = () => document.querySelectorAll('.mc-frog').forEach((el) => {
    if (!el.dataset.built) { build(el); el.dataset.built = '1'; }
    el.dataset.variant = el.dataset.variant || el.closest('[data-variant]')?.dataset.variant || 'temperate';
  });

  run();
  document.addEventListener('DOMContentLoaded', run);
})();
