#!/usr/bin/env bash
# Builds both copies of the app from www/:
#   web/        -> your copy   (Gym-plan-v11.1)
#   web-trial/  -> blank copy  (Gym-plan-blank), for friends to set up from scratch
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/make_web.py
python3 tools/make_trial.py
for f in web/index.html web-trial/index.html; do echo "$f: $(grep -o -m1 'const APP_VERSION="[0-9T][^"]*"' $f)"; done
