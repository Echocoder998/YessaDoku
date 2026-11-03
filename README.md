# YessaDoku

A phone-first puzzle for someone who likes Uno, Sudoku, and a little chaos. Every card has a number (1–6) and a color (red, yellow, green, blue). The numbers follow Sudoku. The colors follow three extra rules. Wilds opt out of color entirely.

Anyone with the deployed link can open the game. Keep that URL private — the secret note is only hidden behind a puzzle count, not a password.

## Run it locally

```bash
npm install
npm run dev
```

The dev server listens on port 8080. `npm test` runs the game-logic tests (solver, generator, validator) plus the workspace checks. `npm run build` produces the Vercel build.

## Make it hers

Edit one file: [`src/config/personal.ts`](src/config/personal.ts).

| Field | What it changes |
| --- | --- |
| `herName` | The home-screen greeting: “Hi {name}!” |
| `secretUnlockAt` | How many solved puzzles unlock the secret note |
| `secretMessage` | The note itself |
| `winMessages` | Lines chosen at random on the win screen |

Optional photo: save a picture as `src/assets/secret.jpg` (that folder, **not** `public/`). It shows next to the secret note once the note unlocks. If the file is missing, the note is just words. Restart the dev server after adding the photo so the bundler picks it up.

Progress, settings, streaks, and the in-progress puzzle live in `localStorage` on her phone. There is no account and no server save.

## Deploy to Vercel

This app is a TanStack Start (React, TypeScript, Tailwind, Vite) project already set up for Vercel.

1. Push the repo to GitHub (private).
2. Import it in Vercel. Framework preset: Vite, or the default if the project is detected. Build command: `npm run build`. Output is handled by the Vite/Nitro config already in the repo — don’t add a custom output directory unless the build tells you to.
3. Deploy. Open the URL yourself before sending it.
4. Send her the link. Don’t post it publicly if the secret note should stay between you.

`npm run build` must succeed before you deploy. After a successful deploy, the site is an installable PWA (add it to the home screen from the browser).
