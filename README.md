# Escape Room Crafter

A design and organization tool for building physical escape rooms. Track a
portfolio of rooms, each with its own puzzle chain, prop/inventory list,
zone-by-zone layout, and build task board.

## Live app

**https://foreverfun-bit.github.io/Escaperoomcrafter/**

Open that link on a phone, tablet, or desktop. It's an installable PWA: on
iPad/iPhone use Safari's Share → **Add to Home Screen**; on Android/Chrome
use the browser menu → **Install app** (or the install icon in the address
bar). Once installed it opens full-screen with its own icon.

**Sign in to sync across devices.** Create an account (email + password) and
your rooms, puzzles, props, layout, and brainstorm boards sync automatically
between every device you sign into — laptop, tablet, phone. Data is stored in
a Supabase database, private to your account (row-level security scopes every
row to its owner). The app still keeps a local offline cache, so it keeps
working (read-only) without a connection and catches back up once you're back
online. Use the **Backup** button in the header any time to export/import a
JSON snapshot as an extra safety net.

> This version requires network access to sync, so it's no longer published
> as a Claude Artifact (Artifacts block outbound network calls) — the GitHub
> Pages link above is the one place to use it.

## Features

- **Rooms** — a portfolio dashboard of every room you're building, with
  status, difficulty, and progress at a glance.
- **Puzzles & clues** — puzzle type, solution, escalating hints, and
  `depends on` links so you can see how puzzles chain together (and what
  each one unlocks).
- **Props & inventory** — items to source or build, quantity, cost, sourcing
  status, and which puzzle(s) each one belongs to. Running budget total.
- **Room layout & flow** — ordered zones representing the physical path
  players take, with puzzles placed into each zone.
- **Build tasks & timeline** — a To Do / In Progress / Done board with due
  dates, priority, and category, optionally linked to a puzzle or prop.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Build for production

```bash
npm run build
npm run preview
```

The `dist/` folder is a static site — deploy it anywhere that serves static
files (Vercel, Netlify, GitHub Pages, etc.).
