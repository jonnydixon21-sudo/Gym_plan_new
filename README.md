# Gym Plan (shared source)

This repo is the one place the app's code lives. Jonny and Defty both edit it here; every change to `main` is built and published to both live sites:

| Copy | Who it's for | Live link |
|---|---|---|
| Main | Jonny's own setup | https://jonnydixon21-sudo.github.io/Gym-plan-v11.1/ |
| Trial (blank) | Anyone setting up from scratch | https://jonnydixon21-sudo.github.io/Gym-plan-blank/ |

Everyone's data (workouts, meals, weights, settings) is stored on their own phone/browser, never in this repo, so code changes reach both of you but your data stays separate. Back up from Settings → Backup before big changes.

## Making a change with Claude

Open a Claude session with this repo attached and say what you want changed. Claude follows `CLAUDE.md`: it pulls the latest code, makes the change, runs the tests, and pushes to `main`, which publishes it. Both of you get the "update available" bar next time you open the app.

Two people changing things at once is fine; whoever pushes second just has the other's change pulled in first. If you're both changing the same screen on the same day, say so to each other.

## What's where

- `www/index.html` – the whole app (HTML, CSS and JavaScript in one file).
- `www/local-backend.js` – stores data on the device (IndexedDB).
- `assets/` – app icon (`icon-only.png`) and the rendered home-screen icons.
- `tools/build.sh` – builds `web/` (main) and `web-trial/` (blank copy).
- `tools/test.sh` – runs the test suite (Node + Playwright).
- `tools/publish.sh` – publishes by hand if the automatic publish isn't set up.
- `test/` – browser tests, one file per feature.
- `.github/workflows/publish.yml` – auto-publish on push to `main`.

## One-time setup for auto-publish (Jonny)

The live sites are in Jonny's two other repos, so the publish step needs a token that can write to them:

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
2. Repository access: only `Gym-plan-v11.1` and `Gym-plan-blank`. Permissions: Contents → Read and write. Set a long expiry.
3. In this repo: Settings → Secrets and variables → Actions → New repository secret, name `DEPLOY_TOKEN`, paste the token.

Until that's done, changes land here but only go live when Jonny's Claude session runs `tools/publish.sh`.
