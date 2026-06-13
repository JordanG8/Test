# 🦊🔥 FOXFIRE

A Firefox-inspired endless flight game built with Three.js, designed mobile-first.

Fly the fox through a low-poly twilight canyon. Thread golden rings, hoover up embers,
dodge the smog shards — and keep your flame from going out.

## Play

Open `index.html` in any modern browser, or serve the folder statically:

```bash
npx serve .
```

Everything is a single self-contained HTML file (Three.js loads from CDN).

## Controls

| Platform | Steer | Boost | Pause |
|---|---|---|---|
| Mobile | drag anywhere (virtual joystick) or tilt (enable in menu) | hold 🔥 button or second finger | ⏸ button |
| Desktop | WASD / arrow keys | Shift or Space | P / Esc |

## Features

- Procedural fox ship with particle flame tail and flame-swoosh wings
- Endless procedurally generated low-poly canyon terrain with vertex-color shading
- Rings (combo multiplier), magnetic embers, smog shard obstacles
- Flame meter survival mechanic — embers and rings refuel it, boosting burns it
- Drifting day/night palette cycle, sky-dome shader, sun, starfield, fog
- Fully synthesized WebAudio sound: engine hum, pickups, boost whoosh, hits
- Haptic feedback, screen shake, hit flash, boost FOV kick and vignette
- Adaptive resolution scaling for weaker phones, safe-area-aware HUD
- Local high score, share button, pause/auto-pause, attract-mode title screen
