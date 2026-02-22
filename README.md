# Sudoku

A Sudoku web app built with **Nx** and **Angular**, using the public **Sugoku** API for puzzle generation and **Firebase Realtime Database** for multiplayer mode.

Live preview: https://sudoku-e6897.web.app/

## Tech stack

- Angular: `19.2.0`
- Nx: `20.5.1`
- Node.js: `20.x`
- Package manager: `npm`

## External API (Sugoku)

This app uses the **Sugoku** API hosted at `https://sugoku.onrender.com/` for board generation, validation, and solving.

Because the API is hosted on a Render free tier instance, the service can “sleep” when idle. The first request after inactivity may take **up to ~50 seconds** (cold start).

## Getting started locally

### Installation

```bash
git clone https://github.com/tintin12342/sudoku.git
cd sudoku
npm ci
```

### Startup
After a successful installation
```bash
npx nx serve sudoku
```

### Tests
Run unit tests with Jest:
```bash
npx nx run-many --target=test --all
```
Run linting:
```bash
npx nx run-many --target=lint --all
```

### Build

Create a production build of the Sudoku app:

```bash
npx nx build sudoku --configuration=production
```