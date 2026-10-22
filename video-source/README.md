# OmniPi launch film source

The 21-second [launch film](../brag.mp4) was rendered from `composition/index.html` with HyperFrames. The visual brief and storyboard are included here.

The soundtrack is original and generated with Python's standard library:

```sh
python3 composition/generate_score.py
```

With HyperFrames available, run its `lint`, `inspect`, and `render` commands against `composition/`. The composition uses a CDN copy of GSAP; local rendering needs network access for that script unless the runtime caches it. The delivered MP4 and poster are at the repository root.
