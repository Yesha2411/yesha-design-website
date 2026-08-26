/* ===========================================================
   YES-HA — MOTION
   Scroll reveals, staggered entrances, count-ups, pointer
   magnetism. Every effect is opt-out under reduced-motion.
   =========================================================== */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window;

  const targets = document.querySelectorAll(
    '[data-reveal],.cs-section,.pull-quote,.impact-grid,.section-img,.img-placeholder,.method-grid,.persona-grid,.finding-list,.process-strip'
  );

  if (!io || reduce) {
    targets.forEach(n => n.classList.add('reveal', 'visible'));
  } else {
    targets.forEach(n => n.classList.add('reveal'));
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      /* stagger direct children so grids assemble rather than pop */
      const kids = e.target.children;
      if (kids.length > 1 && kids.length < 13 && e.target.matches('.impact-grid,.method-grid,.persona-grid,.finding-list,.process-strip')) {
        [...kids].forEach((k, i) => { k.style.transition = 'opacity .5s var(--ease), transform .5s var(--ease)'; k.style.transitionDelay = (i * 55) + 'ms'; });
      }
      obs.unobserve(e.target);
    }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(n => obs.observe(n));
  }

  /* --- Count-up on impact numbers -------------------------- */
  document.querySelectorAll('[data-target]').forEach(el => {
    const end = parseFloat(el.dataset.target);
    if (!Number.isFinite(end)) return;
    if (reduce || !io) { el.textContent = end; return; }
    const suffix = el.dataset.suffix || '';
    const run = () => {
      const t0 = performance.now(), dur = 900;
      const tick = t => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(); o.disconnect(); } }), { threshold: .5 });
    o.observe(el);
  });

  /* --- Pointer magnetism on cards --------------------------
     Fine pointers only. 1.6deg max — enough to feel alive,
     small enough that text never blurs. --------------------- */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    document.querySelectorAll('[data-tilt],.card,.project-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(1400px) rotateX(${y * -1.6}deg) rotateY(${x * 1.6}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
})();
