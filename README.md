# React Demo Lab

A polished React playground that showcases two production-ready UI interactions:

- **Character-by-character typing animation** – a reusable hook-driven typewriter effect with pause, caret control, and progress metadata.
- **Ant Design multi-select filtering** – a refined dataset filter featuring staged selections, ordered dropdown results, and contextual apply/select-all tooling.

The goal is to demonstrate real-world problem solving, thoughtful UX, and clean component architecture—perfect for walking a recruiter through how you think about front-end experiences.

---

## Highlights

- ⚡️ **Modern toolchain** – Vite + React 18 with the latest Node LTS (22.x) for instant-feedback development.
- 🧠 **Custom hooks & state orchestration** – examples of derived state, memoization, timers, and staged vs applied updates.
- 🎨 **Polished design system** – consistent styling, responsive layouts, and Ant Design theming without relying solely on defaults.
- ♿️ **Accessibility cues** – live-region announcements, keyboard-friendly interactions, and clear status messaging.
- 🧩 **Composable architecture** – each demo is isolated (`TextTypingDemo`, `MultiSelectFilterDemo`) and surfaced through a shared layout with side navigation.

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

> **Node requirement:** Vite 7 targets Node ≥ 20.19 or 22.12+. This project is configured and tested with Node 22.21.0.

---

## Project Tour

| Path | What it shows | Why it matters |
| --- | --- | --- |
| `src/App.jsx` | Ant Design layout with menu-driven routing | Highlights how to compose third-party UI kits with custom styling |
| `src/TextTypingDemo.jsx` & `.css` | Custom hook that types strings char-by-char with caret animations | Demonstrates hooks, timers, memoization, and accessible live regions |
| `src/MultiSelectFilterDemo.jsx` & `.css` | Ant Design `Select` enhanced with staged selections, dropdown actions, and sorted results | Showcases controlled components, optimistic UI affordances, and intricate UX logic |
| `src/index.css` | Base gradient, typography, and global theming | Ensures the entire experience feels cohesive and recruiter-ready |

---

## Implementation Notes

- **Typing hook** – `useCharacterTyping` exposes `typedText`, counts, and pause state. This can plug into any component that needs a typewriter effect.
- **Dropdown UX** – selections are stored in a `draft` state so users can queue changes, preview counts, and then commit with an **Apply** button. When nothing is selected the button flips to **Select all**.
- **Smart ordering** – the dropdown automatically lifts selected tags to the top (alphabetically) and keeps unselected tags alphabetized underneath, making large lists easier to scan.
- **Custom dropdown footer** – clear/apply controls render inside the Ant Design dropdown via `dropdownRender`, closing the menu after every action to keep focus on the task.
- **Theming** – both demos share a frosted-glass aesthetic with accessible color contrast and subtle motion to feel modern without overwhelming the content.

---
