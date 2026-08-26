# Images

Drop project media here using the **exact filenames already referenced in the HTML**.
Files appear automatically — no code change needed.

## Required

| File | Used by |
|---|---|
| `img-ring.png` | ring.html hero |
| `img-lucid.png` | lucid.html hero |
| `lucid-1.avif` … `lucid-3.avif`, `lucid-4.webp`, `lucid-5.avif` | lucid.html sections |
| `img-navigator.webp` | navigator.html hero |
| `img-sensei.webp` | oac.html hero |
| `img-philips.jpg` | philips.html hero |
| `img-lead.png` | lead.html hero |
| `og-cover.png` (1200×630) | social preview, all pages |
| `apple-touch-icon.png` (180×180) | iOS home screen |
| `icon-192.png`, `icon-512.png` | web manifest |

`favicon.svg` is already here.

## Rules

- Prefer `.avif` → `.webp` → `.png`/`.jpg`. Keep hero art under ~300KB.
- Case-study heroes are the LCP element: `loading="eager" fetchpriority="high"`.
- Everything else: `loading="lazy"` with width/height or an aspect-ratio box.
- Until a file exists, `site.js` renders a labelled placeholder rather than a broken icon.
