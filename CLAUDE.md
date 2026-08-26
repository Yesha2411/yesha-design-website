# CLAUDE.md — Yesha Design Website

Working agreement for any AI assistant or collaborator editing this repository.
Read this before touching a file. `DESIGN.md` covers *why* the design is what it is;
this file covers *how* the code must behave.

---

## 1. What this is

A static, dependency-free portfolio for **Yesha Niranjan** (brand: **YES-HA**).
Plain HTML, CSS and vanilla JS. No build step, no framework, no npm install.
Deployed on Vercel from GitHub. Every page must work by opening it directly
from disk as well as from the server.

**Non-goal:** adding React, Tailwind, a bundler, or a CMS. If a task seems to need
one, propose it first — do not introduce it silently.

---

## 2. File map

```
/
├── index.html            Home
├── work.html             Works index — the six case studies
├── playground.html       Experiments
├── hot-takes.html        Writing            (awaiting content)
├── about.html            About              (awaiting content)
├── connect.html          Contact
├── ring.html  lucid.html  navigator.html
├── oac.html   philips.html  lead.html       Case studies
├── 404.html
├── vercel.json  robots.txt  sitemap.xml  site.webmanifest
├── project.json          Machine-readable map of the system (not used at runtime)
├── README.md  CLAUDE.md  .gitignore
└── assets/
    ├── css/
    │   ├── tokens.css      Variables ONLY. The single source of truth.
    │   ├── base.css        Reset, atmosphere, master nav, a11y floor.
    │   ├── case-study.css  The six case studies.
    │   ├── pages.css       Shared page helpers (.page-hero, .soon).
    │   ├── home.css        index.html only.
    │   ├── works.css       work.html + 404.html.
    │   ├── connect.css     connect.html only.
    │   └── playground.css  playground.html only.
    ├── js/
    │   ├── site.js         Nav, progress, TOC, media fallback, video facade.
    │   └── motion.js       Reveals, stagger, count-up, pointer magnetism.
    ├── images/             Project media, favicon, OG cover.
    └── animations/         Lottie / video / WebM, lazy-loaded per page.
```

---

## 3. The cascade contract

**This is the rule that was most often broken before, and it caused real bugs.**

Load order on every page is exactly:

```html
<link rel="stylesheet" href="assets/css/tokens.css">   <!-- 1. variables -->
<link rel="stylesheet" href="assets/css/base.css">     <!-- 2. reset + shell -->
<link rel="stylesheet" href="assets/css/PAGE.css">     <!-- 3. one page file -->
```

Three hard rules:

1. **Only `tokens.css` may define a custom property.** No page, no component, no
   inline block redefines `--bg`, `--line`, `--accent`, `--sidebar` or any other token.
   The previous build had three competing palettes and the home page rendered on the
   wrong background because a later stylesheet silently won the cascade.
2. **Never set `--sidebar` on `body`.** `base.css` zeroes it on `:root` at `≤900px`.
   Setting it on `body` outranks that and breaks mobile layout everywhere.
3. **No `<style>` blocks in HTML.** Page-specific CSS goes in its own file so it caches.
   If a page needs new CSS, add it to that page's stylesheet, not to `base.css`.

Selector discipline: prefer a single class. Avoid `!important` (the only permitted uses
are inside the `prefers-reduced-motion` block in `base.css`). Do not style bare element
selectors outside `base.css`.

---

## 4. Quality floor — non-negotiable on every change

Any page you touch must still satisfy all of these:

- **Keyboard** — `.skip-link` first in `<body>`; visible `:focus-visible` ring on every
  interactive element; mobile menu closes on `Escape` and returns focus to the button.
- **Reduced motion** — every animation collapses under
  `@media (prefers-reduced-motion: reduce)`. Content must never depend on a reveal
  firing to become visible.
- **Contrast** — body text uses `--text`, `--soft`, `--muted` or `--faint`. `--ghost` is
  decorative only and must never carry text. Do not introduce raw hex values.
- **Touch targets** — 44×44 minimum for anything tappable.
- **Semantics** — one `<h1>` per page, headings in order, `<main id="main">` present,
  `aria-current="page"` on the active nav item (set by `site.js`, do not hardcode),
  descriptive `alt` on every image, `aria-hidden="true"` on decorative arrows.
- **No dead links.** `href="#"` is a bug. If a destination does not exist yet, render a
  non-link element with an honest status label instead.

---

## 5. Performance rules

- **Case-study hero images**: `loading="eager" fetchpriority="high"`. They are the LCP element.
- **Every other image**: `loading="lazy"` plus `width`/`height` or an aspect-ratio box, so
  nothing shifts as it loads.
- **Third-party embeds are always facades.** Use `data-video-src` on a styled shell;
  `site.js` swaps in the iframe after `load` + idle, and never at all under
  reduced-motion or Data Saver. Do not put a raw autoplay `<iframe>` in the markup —
  it costs roughly a megabyte before first paint.
- Scripts are `defer`. Scroll handlers are `passive` and rAF-throttled.
- Prefer `.avif` → `.webp` → `.png/.jpg` and keep hero art under ~300KB.

---

## 6. Adding content

**A new case study:** copy the closest existing one, keep the `case-study.css` shell
intact, update `<title>`, description, canonical, OG tags, the sidebar
`master-context`, and the `.bottom-next` link on the neighbouring study so the chain
stays circular. Then add a row to `work.html` and a `<url>` to `sitemap.xml`.

**A new page:** copy `about.html` as the skeleton — it has the correct head, skip link,
progress rail, both navs, and `#main`. Add the link to both navs on *all* pages, and to
`sitemap.xml`.

**Images:** drop them into `assets/images/` using the exact filenames the HTML already
references. Until a file exists, `site.js` renders a labelled placeholder rather than a
broken icon, so a missing asset degrades quietly instead of looking unfinished.

---

## 7. Verification before commit

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Check, at minimum:

- [ ] 1440px and 390px on the pages you changed
- [ ] Zero console errors (image 404s are expected until media lands)
- [ ] Tab all the way through — focus is always visible, never trapped
- [ ] OS "reduce motion" on — page is fully readable, nothing animates
- [ ] Mobile menu opens, closes on link click, closes on `Escape`
- [ ] `grep -c 'href="#"' *.html` returns 0

---

## 8. Deploy

Push to `main`; Vercel builds automatically. There is no build command and no output
directory — it is a static root deploy.

`vercel.json` sets `cleanUrls: true`, so `/work.html` serves at `/work`. **Canonical
tags, `og:url` and `sitemap.xml` must therefore all be extensionless.** Internal
`href`s keep `.html` so local file previews still work; Vercel redirects them once.

When the custom domain goes live, update the domain in exactly four places:
`vercel.json` (if redirects reference it), `robots.txt`, `sitemap.xml`, and the
`SITE` constant used to regenerate canonical/OG tags across the HTML files.

---

## 9. Voice

Copy is design material. Sentence case. Active voice. Plain verbs. Be specific rather
than clever. Errors explain what happened and what to do next; empty states are an
invitation to act, not an apology. Never write "coming soon" as a full stop — always
pair it with somewhere to go.
