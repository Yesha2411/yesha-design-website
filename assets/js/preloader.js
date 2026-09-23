/* ===========================================================
   YES-HA — PRELOADER (home page only)
   Boot sequence for every direct arrival at the home page: a
   "Consequence-First" protocol that counts 0 → 100, types a
   status line at each milestone, holds on 100, then lifts to
   reveal the page.

   Wired in index.html with three pieces:
   1. An inline gate in <head> decides BEFORE first paint whether
      the sequence plays and adds .yn-pl-on + .yn-pl-lock to
      <html>. It plays on a typed URL, bookmark, outside link or
      refresh; it skips when the visitor comes from another page
      of this site, on back/forward, and under reduced motion.
      ?boot in the URL always forces it (handy for testing).
   2. <div id="yn-preloader" class="yn-pl"></div> right after
      the skip link. Hidden unless .yn-pl-on is present.
   3. This file, deferred, before site.js. It builds the
      overlay, runs the count, and cleans up.

   Styles: "PRELOADER" section at the end of home.css. Colour:
   --pl-accent in tokens.css. Copy and timing: CONFIG below.

   Page scripts can wait for the reveal:
     if (window.ynPreloaderDone) go();
     else addEventListener('yn:preloader-complete', go, { once: true });
   Elements using .reveal are held automatically while
   .yn-pl-lock is on <html>, then animate in as the overlay fades.
   =========================================================== */
(() => {
  'use strict';

  /* --- CONFIG: timing and copy ----------------------------- */
  const CONFIG = {
    duration: 6000,           // ms for the count to travel 0 → 100
    holdAfterComplete: 750,   // ms to hold on 100% before lifting
    typeSpeed: 7,             // ms per character as a status line types in
    label: 'Consequence-first protocol',
    initialStatus: 'Initializing: Secure Boot Sequence...',
    milestones: [             // `at` = the percentage that triggers each line
      { at: 25, text: 'Deploying: Risk-Informed Design...' },
      { at: 55, text: 'Injecting: Consequence-First Architecture...' },
      { at: 80, text: 'Establishing: Human-in-the-Loop (HITL) UX...' }
    ],
    finalStatus: 'Verified: Human Judgment Retained.', // null = keep the 80% line
    waitForWindowLoad: true,  // park at 99% until images have loaded…
    maxWait: 9000             // …but never longer than this (ms)
  };

  const root = document.documentElement;
  const el = document.getElementById('yn-preloader');
  if (!el || window.__ynPreloaderInit) return;
  window.__ynPreloaderInit = true;

  /* Elements made inert behind the overlay, restored on exit */
  const inerted = [];

  /* Tell the page the overlay is out of the way */
  const announceDone = () => {
    if (window.ynPreloaderDone) return;
    window.ynPreloaderDone = true;
    inerted.forEach(n => { n.inert = false; });
    root.classList.remove('yn-pl-lock');
    dispatchEvent(new CustomEvent('yn:preloader-complete'));
  };

  const removeOverlay = () => {
    el.remove();
    root.classList.remove('yn-pl-on');
  };

  /* The gate decided not to play (in-site navigation, back/forward, reduced motion) */
  if (!root.classList.contains('yn-pl-on')) {
    removeOverlay();
    announceDone();
    return;
  }

  try {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- Build the overlay --------------------------------- */
    el.innerHTML = `
      <div class="yn-pl__glow" data-pl="glow" aria-hidden="true"></div>
      <div class="yn-pl__meta yn-pl__meta--tl" aria-hidden="true"><span class="yn-pl__brand">YES-HA</span><span>/</span><span>Sys.Boot</span></div>
      <div class="yn-pl__meta yn-pl__meta--tr" aria-hidden="true"><span>SID</span><span class="yn-pl__val" data-pl="sid"></span></div>
      <div class="yn-pl__core">
        <div class="yn-pl__frame" aria-hidden="true"></div>
        <div class="yn-pl__label" aria-hidden="true"></div>
        <div class="yn-pl__pct" aria-hidden="true"><span data-pl="digits"><span class="yn-pl__ghost">00</span>0</span><span class="yn-pl__unit">%</span></div>
        <div class="yn-pl__track" data-pl="track" role="progressbar" aria-label="Loading site" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="yn-pl__fill" data-pl="fill"></div><div class="yn-pl__head" data-pl="head"></div>
        </div>
        <div class="yn-pl__status" aria-hidden="true"><span class="yn-pl__prompt">&gt;</span><span data-pl="status"></span><span class="yn-pl__cursor"></span></div>
        <div class="yn-pl__sr" data-pl="live" role="status" aria-live="polite"></div>
      </div>
      <div class="yn-pl__meta yn-pl__meta--bl">
        <button type="button" class="yn-pl__skip" data-pl="skip" aria-label="Human override: skip intro"><span class="yn-pl__led" aria-hidden="true"></span>Human override<span class="yn-pl__key" aria-hidden="true">Esc</span></button>
      </div>
      <div class="yn-pl__meta yn-pl__meta--br" aria-hidden="true"><span>T+</span><span class="yn-pl__val" data-pl="clock">00.00</span><span>s</span></div>`;

    const q = name => el.querySelector(`[data-pl="${name}"]`);
    const ui = {
      glow: q('glow'), sid: q('sid'), digits: q('digits'), track: q('track'),
      fill: q('fill'), head: q('head'), status: q('status'), live: q('live'),
      skip: q('skip'), clock: q('clock')
    };
    el.querySelector('.yn-pl__label').textContent = CONFIG.label;

    /* Decorative session ID, e.g. 7F3A-91C2 */
    const hex = n => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    ui.sid.textContent = `${hex(4)}-${hex(4)}`;

    /* Milestone ticks on the progress line */
    const milestones = CONFIG.milestones.slice().sort((a, b) => a.at - b.at);
    const ticks = milestones.map(m => {
      const t = document.createElement('span');
      t.className = 'yn-pl__tick';
      t.style.left = `${m.at}%`;
      ui.track.appendChild(t);
      return t;
    });

    /* Everything behind the overlay is inert, so Tab can't wander into hidden content */
    [...document.body.children].forEach(n => {
      if (n !== el && n.tagName !== 'SCRIPT' && !n.inert) { n.inert = true; inerted.push(n); }
    });

    /* --- Easing -----------------------------------------------
       Half linear, half ease-in-out: starts and settles gently but
       keeps the middle steady so each status line gets fair screen
       time. At 6s the lines land at ≈1.9s, 3.2s and 4.4s. */
    const ease = t => 0.5 * t + 0.5 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    /* --- Rendering helpers ------------------------------------ */
    const escapeHTML = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    /* Escape, and keep hyphenated terms whole ("Human-in-the-Loop") */
    const safeText = s => escapeHTML(s).replace(/\S*-\S*/g, w => `<span class="yn-pl__nb">${w}</span>`);

    /* 7 → dimmed "00" + "7": fixed 3-digit width */
    const renderDigits = n => {
      const s = String(n);
      const ghosts = '000'.slice(s.length);
      ui.digits.innerHTML = (ghosts ? `<span class="yn-pl__ghost">${ghosts}</span>` : '') + s;
    };

    /* "Verb: object" — verb emphasised, trailing noise while typing */
    const NOISE = '01<>/\\|=+*#%&_';
    const paintStatus = (text, shown, noiseLen) => {
      const cut = text.indexOf(':') + 1;
      const visible = text.slice(0, shown);
      let noise = '';
      for (let i = 0; i < noiseLen; i++) noise += NOISE.charAt(Math.floor(Math.random() * NOISE.length));
      ui.status.innerHTML =
        `<span class="yn-pl__verb">${safeText(visible.slice(0, cut))}</span>` +
        `<span class="yn-pl__obj">${safeText(visible.slice(cut))}</span>` +
        `<span class="yn-pl__noise">${escapeHTML(noise)}</span>`;
    };

    /* Types a line in; screen readers get it once, clean */
    let typeToken = 0;
    const setStatus = text => {
      ui.live.textContent = text;
      const token = ++typeToken;
      if (reduce) { paintStatus(text, text.length, 0); return; }
      const t0 = performance.now();
      const dur = Math.max(200, text.length * CONFIG.typeSpeed);
      const step = now => {
        if (token !== typeToken) return;
        const k = Math.min((now - t0) / dur, 1);
        const shown = Math.round(k * text.length);
        paintStatus(text, shown, k < 1 ? Math.min(3, text.length - shown) : 0);
        if (k < 1) requestAnimationFrame(step);
      };
      step(t0);
    };

    /* --- State ------------------------------------------------ */
    const startTime = performance.now();
    let pageReady = !CONFIG.waitForWindowLoad || document.readyState === 'complete';
    let lastPct = -1, stage = -1, skipped = false, finished = false;

    if (!pageReady) addEventListener('load', () => { pageReady = true; }, { once: true });
    const maxWaitTimer = setTimeout(() => { pageReady = true; }, CONFIG.maxWait);

    const updateStage = pct => {
      let next = -1;
      milestones.forEach((m, i) => { if (pct >= m.at) next = i; });
      if (next === stage) return;
      stage = next;
      ticks.forEach((t, i) => t.classList.toggle('is-lit', i <= stage));
      if (stage >= 0) setStatus(milestones[stage].text);
    };

    /* --- Main loop -------------------------------------------- */
    const frame = now => {
      if (finished) return;
      const elapsed = now - startTime;
      let p = skipped ? 1 : ease(Math.min(elapsed / CONFIG.duration, 1));
      if (!pageReady && !skipped) p = Math.min(p, 0.99);   // park at 99% until loaded

      ui.fill.style.transform = `scaleX(${p.toFixed(4)})`;
      ui.head.style.left = `${(p * 100).toFixed(2)}%`;
      ui.glow.style.opacity = (0.25 + p * 0.75).toFixed(3);

      const pct = Math.floor(p * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        renderDigits(pct);
        ui.track.setAttribute('aria-valuenow', String(pct));
        updateStage(pct);
      }
      ui.clock.textContent = `0${(elapsed / 1000).toFixed(2)}`.slice(-5);

      if (p >= 1) { finished = true; complete(); return; }
      requestAnimationFrame(frame);
    };

    /* --- 100% → hold → lift → remove --------------------------- */
    const onKey = e => { if (e.key === 'Escape') skip(); };
    const skip = () => { if (!finished) skipped = true; };

    const exit = () => {
      removeEventListener('keydown', onKey);
      el.classList.add('is-exiting');
      announceDone();                                  // page reveals start as the overlay fades
      const fade = parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0;
      setTimeout(removeOverlay, fade + 60);
    };

    const complete = () => {
      clearTimeout(maxWaitTimer);
      el.classList.add('is-complete');
      if (CONFIG.finalStatus) setStatus(CONFIG.finalStatus);
      setTimeout(exit, skipped ? 200 : CONFIG.holdAfterComplete);
    };

    ui.skip.addEventListener('click', skip);
    addEventListener('keydown', onKey);

    /* --- Go --------------------------------------------------- */
    setStatus(CONFIG.initialStatus);
    requestAnimationFrame(frame);

  } catch (err) {
    /* Never let the intro block the site */
    console.error('[preloader]', err);
    removeOverlay();
    announceDone();
  }
})();
