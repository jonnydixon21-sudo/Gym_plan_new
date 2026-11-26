#!/usr/bin/env bash
# Publishes the built app to the two live sites (needs push access to both repos):
#   web/       -> jonnydixon21-sudo/Gym-plan-v11.1  https://jonnydixon21-sudo.github.io/Gym-plan-v11.1/
#   web-trial/ -> jonnydixon21-sudo/Gym-plan-blank  https://jonnydixon21-sudo.github.io/Gym-plan-blank/
# Normally you don't need this: pushing to main publishes automatically (see .github/workflows/publish.yml).
# Run tools/test.sh first. Usage: tools/publish.sh "what changed"
set -euo pipefail
cd "$(dirname "$0")/.."
MSG="${1:-Update app}"
bash tools/build.sh
mkdir -p .deploy
for pair in "web:Gym-plan-v11.1" "web-trial:Gym-plan-blank"; do
  src="${pair%%:*}"; repo="${pair#*:}"; dir=".deploy/$repo"
  if [ -d "$dir/.git" ]; then git -C "$dir" pull -q --ff-only; else git clone -q "https://github.com/jonnydixon21-sudo/$repo.git" "$dir"; fi
  cp "$src"/* "$dir"/
  if [ -z "$(git -C "$dir" status --porcelain)" ]; then echo "$repo: already up to date"; continue; fi
  git -C "$dir" add -A && git -C "$dir" commit -q -m "$MSG" && git -C "$dir" push -q origin HEAD
  echo "$repo: published $(git -C "$dir" rev-parse --short HEAD)"
done
