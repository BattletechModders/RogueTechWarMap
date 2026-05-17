# RogueTech War Map

An interactive, live-updating galaxy map for the [RogueTech](https://roguetech.fandom.com/wiki/RogueTech_Wiki) BattleTech mod. The map shows every star system in the Inner Sphere, coloured by the faction that currently controls it, with active player activity and special event indicators updated in real time from the RogueTech server.

**Live map:** [roguewar.org](https://roguewar.org)

---

## For developers

The app is a React + TypeScript single-page application built with Vite. The map canvas is rendered with [react-konva](https://konvajs.org/docs/react/).

### Prerequisites

- **Node 20+** — use [nvm](https://github.com/nvm-ws/nvm) (Linux/macOS) or [nvm-windows](https://github.com/coreybutler/nvm-windows). The repo includes an `.nvmrc`.
- **Yarn 1.x** — enable via `corepack enable`, then run `corepack yarn` to install.

### Getting started

```bash
git clone <repo-url>
cd RogueTechWarMap
nvm use          # switch to the project Node version
yarn install     # installs deps and registers git hooks
cp .env .env.local   # or just use .env directly — it's already set up for local dev
yarn dev         # starts Vite dev server at http://localhost:5173
```

> **Windows note:** if `yarn` fails to run in PowerShell, open an admin shell and run `Set-ExecutionPolicy RemoteSigned`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_BASE_URL` | Production only | Router basename and Vite `base` path. Must be set for `yarn build`. |
| `VITE_API_URL` | Optional | Backend API origin. Defaults to `https://roguewar.org`. |
| `VITE_ENABLE_STATE_TEST` | Optional | Enables dev-state injection for testing event visuals without a live API. Already set in `.env`. |

### Commands

| Command | Description |
|---|---|
| `yarn dev` | Start dev server with HMR |
| `yarn build` | Type-check + production build |
| `yarn lint` | Run ESLint |
| `yarn test` | Run unit tests (single pass) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests and generate a coverage report |
| `yarn bench` | Run performance benchmarks |

**Run a single test file:**
```bash
yarn test -- src/components/hooks/useGalaxyViewport.test.ts
```

### Git hooks

Hooks are managed by `simple-git-hooks` and registered automatically on `yarn install`.

- **pre-commit** — runs ESLint and validates any staged `.json` files
- **pre-push** — runs a full typecheck (`tsc --noEmit`) and the test suite

CI (GitHub Actions) enforces lint, typecheck, and coverage on every push and pull request to `main`.

---

## Contributing

1. **Branch off `main`.** Use a short descriptive name (`fix-tooltip-overflow`, `feat-system-flash`).
2. **Keep PRs focused.** One concern per PR makes review easier and reduces the chance of merge conflicts on a fast-moving canvas.
3. **Tests for logic, not markup.** Hooks, selectors, helpers, and interaction utilities should be covered. UI integration tests are welcome but not required for every change.
4. **The pre-push hook is the bar.** If `tsc` and `yarn test` pass locally, CI will pass.
5. Open a PR against `main` with a description of what changed and why.
