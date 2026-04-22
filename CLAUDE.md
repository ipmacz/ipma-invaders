# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

This is a static web app with no build step. Open `index.html` directly in a browser, or serve it locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Deployed on Vercel; `package.json` exists only for the `@vercel/analytics` dependency, which is loaded via CDN in production.

## Architecture

Five vanilla JS files loaded in order via `<script>` tags in `index.html`:

1. **`i18n.js`** — Loaded first. Defines `I18N` string tables (EN/CZ), `currentLang`, and `t(key)` / `setLanguage(lang)`. Every other file can call `t()` and `currentLang` freely.

2. **`competences.js`** — Defines `COMPETENCES` (all 29 IPMA ICB4 competences), `AREA_CONFIG` (hits, points, color, size per area), and `ROUNDS` (10 hand-authored rounds + procedural generator for round 11+). Exports `getCompetenceById(id)`, `getCompetenceName(comp)`, `getRoundConfig(roundIndex)`.

3. **`game.js`** — `Game` class (pure canvas game engine). Manages the game loop (`requestAnimationFrame`), grid movement (Space Invaders–style), bullets, enemy bullets, collision detection, particles, and rendering. Communicates upward exclusively via callback properties: `onRoundComplete`, `onGameOver`, `onScoreChange`, `onLivesChange`, `onFreezeChange`, `onTargetUpdate`, `onAmmoChange`.

4. **`app.js`** — Screen controller (IIFE). Owns screen transitions (`showScreen(name)`), all DOM event bindings, HUD updates, leaderboard (localStorage `ipma_leaderboard`), and score sharing. Creates `new Game(canvas, gender)` and wires up all callbacks.

5. **`styles.css`** — All styling. `.screen` elements are hidden by default; `.screen.active` makes them visible. Mobile layout adds `.is-mobile` to `<body>` for on-screen controls.

## Key Design Patterns

**Screen system**: One `<div class="screen">` per view; `showScreen(name)` removes `active` from all and adds it to the target. Screens: `menu`, `character`, `tutorial`, `game`, `stats`, `gameover`, `leaderboard`.

**Game ↔ App boundary**: `Game` never touches DOM directly (except `showPointPopup` which appends a floating div to `#screen-game`). All state flows out via callbacks set by `app.js`.

**Competence targeting**: Each round in `ROUNDS` has a `competences` array (what appears) and a `targets` subset (what must be shot). Non-targets are distractors — shooting them costs 50 points. Letting a non-target pass gives +15 points.

**Grid movement**: All competences share a single `gridOriginX/Y` offset applied to their stored `gridOffsetX/Y`. When any competence hits a wall, the entire grid reverses direction and queues a 30px drop.

**Internationalization**: All UI strings go through `t(key)`. Static HTML elements use `data-i18n="key"` attributes; `setLanguage()` re-renders them all. Competence names are stored as `{en, cz}` properties on each competence object.

**Persistence**: `localStorage` keys — `ipma_lang`, `ipma_nickname`, `ipma_leaderboard`, `ipma_tutorial_shown`.

## Adding Content

- **New competence**: Add to `COMPETENCES` array in `competences.js` with `{id, area, en, cz}`. Must also add its `id` to relevant `ROUNDS` entries.
- **New round**: Add an entry to `ROUNDS` with `{competences, targets, speed, enemyFireRate}`. Speed is px/frame-unit (1.0 ≈ comfortable); `enemyFireRate` is ms between enemy shots.
- **New language**: Add a key to `I18N` in `i18n.js` and a button in the `lang-switcher` div in `index.html`. Add `{langCode: 'translation'}` to each competence object.
- **New UI string**: Add the key to both `I18N.en` and `I18N.cz`, use `t('key')` in JS or `data-i18n="key"` in HTML.
