# Animation assets

Lottie, video, GIF/WebM and SVG motion studies live here so they can be lazy-loaded
per page rather than shipped globally.

Shared scroll reveals, staggering, count-ups and pointer magnetism live in
`assets/js/motion.js` — keep behaviour there and media here.

Anything added must respect `prefers-reduced-motion`: check the flag before playing,
and never let content depend on an animation completing to become readable.
