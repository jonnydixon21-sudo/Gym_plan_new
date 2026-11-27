#!/usr/bin/env bash
# Runs the whole test suite (needs Node + Playwright with Chromium).
#   tools/test.sh            all tests
#   tools/test.sh summary f3 just those tests
# Exits non-zero if anything fails. Screenshots go to $SHOTS (default /tmp/gym-shots/).
set -uo pipefail
cd "$(dirname "$0")/.."
export SHOTS="${SHOTS:-/tmp/gym-shots/}"; mkdir -p "$SHOTS"
bash tools/build.sh >/dev/null || { echo "BUILD FAILED"; exit 1; }
serve(){ curl -s -o /dev/null "http://localhost:$1/index.html" || { setsid nohup python3 -m http.server "$1" --directory "$2" >/dev/null 2>&1 & sleep 1; }; }
serve 8791 www; serve 8793 web; serve 8795 web-trial
ALL="smoke trsections onemeal mfix coachtg myprefs flow prep sg edit features plan run newfood twins rmmeal today_sync2 barcode settings v13 notes shop supps once meals_check zoom nav analytics bodymap session importx colours extras rota2 weektot plan3 daily setflags batchA batchB profile splitvol inout pvmus swap2 rugby restalert todayadd summary exac splitdetail rename dropset edauto pace macrofit calendar rebal autoadj swapfix sugkg trialupd trialmeals f3 adjust offline vol2 fitstuck nutnav hubs lats wback whatsnew xadjust glance"
LIST="${*:-$ALL}"; bad=0; n=0
for t in $LIST; do n=$((n+1))
  out=$(timeout 150 node "test/$t.js" 2>&1); code=$?
  probs=$(printf '%s\n' "$out" | grep -E '^FAIL |FAILS:? *[1-9]|Timeout|Error:|^(errors|ERRORS|ERR):? *\[[^]]' | head -5)
  if [ $code -ne 0 ] || [ -n "$probs" ]; then bad=$((bad+1)); echo "✗ $t"; printf '%s\n' "${probs:-exit code $code}" | sed 's/^/    /' | cut -c1-240
  else echo "✓ $t"; fi
done
echo; if [ $bad -eq 0 ]; then echo "ALL $n TESTS PASSED"; else echo "$bad of $n TESTS FAILED"; exit 1; fi
