/* ===========================================================
   YES-HA — SITE
   Navigation, scroll progress, TOC sync, media fallbacks.
   Runs on every page. Fails silently, never blocks paint.
   =========================================================== */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Mark the current page in both navs ------------------ */
  const here = location.pathname.split('/').pop() || 'index.html';
  let matched = false;
  document.querySelectorAll('.master-nav a, .mobile-panel a').forEach(a => {
    const target = (a.getAttribute('href') || '').split('/').pop();
    if (target === here || target.replace('.html', '') === here.replace('.html', '')) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('active');
      matched = true;
    }
  });
  /* A case study is not its own nav item — it lives under Works.
     Announce the section so the marker and the screen reader agree. */
  if (!matched && document.body.classList.contains('case-page')) {
    document.querySelectorAll('.master-nav a.active, .mobile-panel a.active').forEach(a => a.setAttribute('aria-current', 'true'));
  }

  /* --- Mobile menu ----------------------------------------- */
  const btn = document.querySelector('[data-mobile-menu]');
  const panel = document.querySelector('[data-mobile-panel]');
  if (btn && panel) {
    const setOpen = open => {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) { setOpen(false); btn.focus(); } });
  }

  /* --- Scroll progress rail -------------------------------- */
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    let ticking = false;
    const update = () => {
      const d = document.documentElement;
      const max = d.scrollHeight - d.clientHeight;
      bar.style.width = (max > 0 ? (d.scrollTop / max) * 100 : 0) + '%';
      ticking = false;
    };
    update();
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* --- Missing media -> labelled placeholder ---------------
     Case-study art lives in assets/images/. Until a file is
     dropped in, show what is expected rather than a broken
     icon, so the page still reads as finished. ------------- */
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      const name = (img.getAttribute('src') || '').split('/').pop();
      const ph = document.createElement('div');
      ph.className = 'asset-placeholder';
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', img.alt || ('Image pending: ' + name));
      ph.innerHTML = '<span>Media placeholder<br>' + name + '</span>';
      img.replaceWith(ph);
    }, { once: true });
  });

  /* --- Case-study TOC sync --------------------------------- */
  const sections = [...document.querySelectorAll('.cs-section[id]')];
  if (sections.length && 'IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.toc-link')];
    const pills = [...document.querySelectorAll('.mobile-toc-pill')];
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const hash = '#' + e.target.id;
      [...links, ...pills].forEach(l => {
        const on = l.getAttribute('href') === hash;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
      const pill = pills.find(p => p.getAttribute('href') === hash);
      if (pill && !reduce) pill.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }), { rootMargin: '-18% 0px -68% 0px', threshold: .01 });
    sections.forEach(s => obs.observe(s));
  }

  /* --- Deferred video facade -------------------------------
     The hero embed costs ~1MB and blocks LCP if it loads on
     paint. Swap the poster for the iframe on first intent. -- */
  document.querySelectorAll('[data-video-src]').forEach(shell => {
    const load = () => {
      if (shell.dataset.loaded) return;
      shell.dataset.loaded = '1';
      const f = document.createElement('iframe');
      f.src = shell.dataset.videoSrc;
      f.title = shell.dataset.videoTitle || 'Featured video';
      f.loading = 'lazy';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      shell.replaceChildren(f);
    };
    shell.addEventListener('click', load);
    shell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); } });

    /* Auto-play ambiently, but only once the page has finished
       painting and the main thread is idle — otherwise the embed
       competes with the hero for LCP. Press still loads instantly.
       Data Saver and reduced-motion opt out entirely. */
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!reduce && !saveData) {
      const arm = () => {
        const go = () => {
          if (!('IntersectionObserver' in window)) return load();
          new IntersectionObserver((es, o) => es.forEach(e => {
            if (e.isIntersecting) { load(); o.disconnect(); }
          }), { rootMargin: '200px' }).observe(shell);
        };
        'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200);
      };
      document.readyState === 'complete' ? arm() : addEventListener('load', arm, { once: true });
    }
  });
})();

/* --- Hero portrait reel ------------------------------------
   Loops while the hero is on screen (starts after the page has
   painted, pauses when scrolled away). Pause / Play is always
   available and a manual pause sticks. Reduced motion and Data
   Saver never autoplay: they get the finished-portrait still. */
(() => {
  const v = document.querySelector('[data-reel]');
  if (!v) return;
  const btn = document.querySelector('[data-reel-toggle]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !!(navigator.connection && navigator.connection.saveData);
  let userPaused = still, inView = false;
  const showStill = () => { if (!v.poster) v.poster = v.dataset.poster; };
  const play = () => { v.preload = 'auto'; v.play().catch(() => { showStill(); sync(); }); };

  const sync = () => {
    if (!btn) return;
    const word = v.paused ? 'Play' : 'Pause';
    btn.textContent = word;
    btn.setAttribute('aria-label', word + ' portrait animation');
  };
  ['play', 'pause'].forEach(e => v.addEventListener(e, sync));

  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      userPaused = !v.paused;
      userPaused ? v.pause() : play();
    });
    sync();
  }

  if (still) return showStill();

  const start = () => {
    if (!('IntersectionObserver' in window)) return play();
    new IntersectionObserver(es => es.forEach(e => {
      inView = e.isIntersecting;
      if (inView && !userPaused) play();
      else if (!inView && !v.paused) v.pause();
    }), { threshold: .4 }).observe(v);
  };
  const arm = () => 'requestIdleCallback' in window
    ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300);
  document.readyState === 'complete' ? arm() : addEventListener('load', arm, { once: true });
})();
