# React Demo Lab

A polished React playground that showcases three production-ready UI interactions:

- **Character-by-character typing animation** - reusable hook-driven typewriter effect with pause control and progress metadata.
- **Ant Design multi-select filtering** - a refined dataset filter with staged selections, ordered dropdown results, and contextual apply/select-all tooling.
- **Geocode lookup dashboard** - an OpenCage-powered location search that surfaces lat/lng pairs, confidence scoring, static map previews, and JSON exports.
- **Reverse geocode explorer** - feed latitude/longitude and instantly retrieve the closest place, timezone info, and downloadable audit logs.

The goal is to demonstrate real-world problem solving, thoughtful UX, and clean component architecture-perfect for walking a recruiter through how you think about front-end experiences.

---

## Highlights

- **Modern toolchain** - Vite + React 19 with Node 22.x for instant-feedback development.
- **Custom hooks & state orchestration** - derived state, memoization, timers, and staged vs. applied updates.
- **Polished design system** - consistent styling, responsive layouts, and Ant Design theming without default-heavy visuals.
- **Accessibility cues** - live-region announcements, keyboard-friendly interactions, and clear status messaging.
- **Composable architecture** - each demo (`TextTypingDemo`, `MultiSelectFilterDemo`, `GeocodeSearchDemo`, `ReverseGeocodeDemo`) is isolated and surfaced through a shared layout with side navigation.
- **API storytelling** - the geocode experiences highlight graceful network states, optimistic UI, helpers for third-party REST calls, and one-click JSON exports for both forward and reverse lookups.

---

## Quick Start

```bash
# Install dependencies
npm install

# Launch the dev server with hot reload
npm run dev

# Build for production (Vite)
npm run build
```

Open `http://localhost:5173` and use the left-side navigation to switch between demos.

> **Node requirement:** Vite 7 targets Node 20.19+ or 22.12+. This project is configured and tested with Node 22.21.0.

### Geocoding API setup

The location search demo reads `VITE_GEOCODE_API_KEY`. Create a `.env` file in the project root with:

```bash
VITE_GEOCODE_API_KEY=3cc0da9c1e894f958d2cfa165abd83a9
```

The provided key is also baked in as a fallback so the example works out of the box, but using your own key keeps you in control of quotas.

---

## Project Tour

| Path | What it shows | Why it matters |
| --- | --- | --- |
| `src/App.jsx` | Ant Design layout with menu-driven routing | Shows how to orchestrate third-party UI kits with custom styling |
| `src/TextTypingDemo.jsx` & `.css` | Custom hook that types strings char-by-char with caret animations | Demonstrates hooks, timers, memoization, and accessible live regions |
| `src/MultiSelectFilterDemo.jsx` & `.css` | Ant Design `Select` with staged selections, dropdown actions, and sorted results | Highlights controlled components, optimistic UI, and intricate UX logic |
| `src/GeocodeSearchDemo.jsx` & `.css` | Geocode search with OpenCage, static map previews, and resilient status handling | Demonstrates API orchestration, abortable fetches, skeleton states, and data normalization |
| `src/ReverseGeocodeDemo.jsx` & `.css` | Reverse geocode lookup that converts coordinates to nearby addresses with JSON export | Highlights numeric validation, preset coordinates, shared map rendering, and download flows |
| `src/index.css` | Base gradient, typography, and global theming | Ensures the entire experience feels cohesive and recruiter-ready |

---

## Implementation Notes

- **Typing hook** - `useCharacterTyping` exposes `typedText`, counts, and pause state. Drop it into any component that needs a typewriter effect.
- **Dropdown UX** - selections are staged so users can queue changes, preview counts, and commit with an **Apply** button (or invert with **Select all**).
- **Smart ordering** - dropdown results keep selected tags lifted and alphabetized, while unselected items stay sorted underneath.
- **Custom dropdown footer** - clear/apply controls render inside the Ant Design dropdown via `dropdownRender`, closing the menu after every action.
- **Geocoding UX** - the lookup forms debounce short inputs, abort in-flight requests, visualize loading/empty/success states, and enrich payloads with human-friendly labels plus static map snapshots for both forward and reverse modes.
- **Theming** - all demos share a frosted-glass aesthetic with accessible color contrast and subtle motion to feel modern without overwhelming the content.

---
