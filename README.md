# SCALP

**A 60-second browser trading-floor reflex game.** Read the tape, go long or short, slam-close before it reverses — and don't get liquidated.

▶ **Play:** https://amudotcom-byte.github.io/scalp/

Built for the [Orynth Game Cup 2026 — Season 1](https://www.orynth.dev/cup).

## How to play
- **▲ / W** — go **LONG** (bet the price climbs)
- **▼ / S** — go **SHORT** (bet the price dives)
- **SPACE** — **FLATTEN** (close, lock in your P&L)
- **M** — mute / unmute

You're on 6x leverage. Chain green ticks to build your combo multiplier. Survive 60 seconds and bank the biggest book. Hit zero margin and you're **liquidated**. Everyone trades the same **daily seeded market**, so the leaderboard is fair.

## Tech
Single-file vanilla JS + HTML5 Canvas. No build step, no dependencies, no installs — opens and plays instantly in any modern browser. Web Audio chiptune SFX. Deterministic price engine (mulberry32 seeded on the UTC date).

*Made with AI assistance (Claude).*
