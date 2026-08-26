# YES-HA — Yesha Design Website

Static portfolio site. Plain HTML, CSS and vanilla JavaScript — no framework, no build
step, no dependencies. Deployed on Vercel from GitHub.

**Live:** _pending — update this line once the domain is attached._

---

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works. You can also open `index.html` directly from disk — every
internal link uses relative `.html` paths so file-based previews work too.

---

## Ship it

**First deploy**

```bash
git init
git add .
git commit -m "Yesha design website — initial build"
git branch -M main
git remote add origin https://github.com/<you>/yesha-design-website.git
git push -u origin main
```

Then in Vercel: **Add New → Project → import the repo**. Framework preset **Other**,
build command **empty**, output directory **empty**. It is a static root deploy —
`vercel.json` handles the rest.

**After that**, every push to `main` deploys automatically. Pull requests get preview URLs.

**When the custom domain is attached**, update it in three files:

- `robots.txt` — the `Sitemap:` line
- `sitemap.xml` — every `<loc>`
- all `*.html` — `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`

---

## Structure

```
index.html          Home
work.html           Works index — six case studies
playground.html     Experiments
hot-takes.html      Writing
about.html          About
connect.html        Contact
ring / lucid / navigator / oac / philips / lead .html    Case studies
404.html

assets/css/         tokens → base → one page stylesheet (order matters)
assets/js/          site.js (nav, progress, TOC, media) · motion.js (reveals, counters)
assets/images/      project media, favicon, OG cover
assets/animations/  Lottie / video / WebM, lazy-loaded per page
```

`CLAUDE.md` is the working agreement — the cascade contract, quality floor, and the
rules for adding pages or case studies. Read it before editing.

---

## Design system in one paragraph

One token file (`assets/css/tokens.css`) owns every colour, size and duration. The
surface is near-black `#09090a` with a hairline grid; the accent is Signal Lime
`#dafe20`, reserved strictly for system state — availability, scroll progress, focus
rings, and a single primary CTA per page. Type is Geist, set very tight at display
sizes (`-0.065em`) against very open uppercase micro-labels — that contrast is the
signature. Motion is a layer, never a dependency: everything collapses under
`prefers-reduced-motion` and no content depends on an animation firing to be readable.

---

## Still outstanding

- [ ] **Project images.** `assets/images/` is empty. Referenced filenames:
      `img-ring.png`, `img-lucid.png`, `lucid-1.avif` … `lucid-5.avif`, `lucid-4.webp`,
      `img-navigator.webp`, `img-sensei.webp`, `img-philips.jpg`, `img-lead.png`.
      Until a file lands, `site.js` renders a labelled placeholder instead of a broken icon.
- [ ] **OG cover** — `assets/images/og-cover.png`, 1200×630. Currently referenced but missing,
      so shared links fall back to a plain card.
- [ ] **Touch icons** — `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- [ ] **About page content** — currently an honest in-progress route with working navigation.
- [ ] **Hot Takes content** — same.
- [ ] **Playground write-ups** — six experiments are listed but have no detail pages yet,
      so the cards are non-link elements rather than dead links.
- [ ] **Custom domain** + canonical URL sweep.

---

## Quality floor

Every page ships with: a skip link, visible keyboard focus, `prefers-reduced-motion`
support, AA-contrast text, 44px touch targets, one `<h1>`, a `<main id="main">` landmark,
`aria-current` on the active nav item, and zero dead links. Third-party embeds load as
facades after first paint so they never compete for LCP.
