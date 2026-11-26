# Instructions for Claude sessions working on this repo

Two people (Jonny = owner, Defty) edit this app with Claude. Pushing to `main` publishes to both live sites automatically (see README), so `main` must always be working.

## Every change
1. `git pull --rebase` before touching anything.
2. Edit `www/index.html` (and `www/local-backend.js` only if storage changes). Never edit `web/` or `web-trial/` – they're build output and git-ignored.
3. Bump `APP_VERSION` in `www/index.html` (format `"26 Nov 2026 (f)"`: today's date, then a letter for the nth release that day). This is what shows the "update available" bar. The trial build prefixes it with `Trial · ` automatically – don't touch that.
4. Add or update a test in `test/` for anything you change, and add new test names to `ALL` in `tools/test.sh`.
5. Run `tools/test.sh`. Only continue if it ends with `ALL n TESTS PASSED`. Never push failing code.
6. Commit with a plain-English message saying what changed for the user, then `git pull --rebase && git push`. If the rebase brings in someone else's change, rebuild and rerun the tests before pushing.
7. Check the "Publish app" run in Actions succeeded (`gh run list --workflow publish.yml -L 1`). If it warns that DEPLOY_TOKEN isn't set and you have push access to the deploy repos, run `tools/publish.sh "message"`. Pages can take a minute or two after that; if a Pages deploy fails with a 500, re-running it usually fixes it.

## Rules about the app
- The user's data lives only in their browser (localStorage key `gym-plan-v1` + IndexedDB). Changes must keep old saved data working – migrate, never wipe.
- The trial build (`tools/make_trial.py`) swaps in a blank setup, path-suffixed storage keys and `IS_TRIAL=true`. Anything only for the owner's own data must be skipped when `IS_TRIAL` is true.
- No external network resources (fonts, CDNs): the app must work offline. Fonts are embedded as base64.
- Phone first: test at 390px wide. Keep text readable at 100% zoom.
- Keep the user's existing training split, meals and targets untouched unless they ask; they're user data, not defaults.
- Ask before removing features or changing how existing numbers are calculated (calorie/macro maths, weight-trend pace, progression rules).

## Testing notes
- Tests are Playwright scripts against local servers: 8791 serves `www/`, 8793 `web/`, 8795 `web-trial/` (`tools/test.sh` starts them).
- Each test prints `PASS`/`FAIL` lines, an `errors: [...]` line (must be empty) and `FAILS n`.
- `BK=/path/backup.json` makes `macrofit`, `rebal` and `calendar` also run against a real backup.
- Screenshots go to `$SHOTS` (default `/tmp/gym-shots/`). Look at them for layout changes.
