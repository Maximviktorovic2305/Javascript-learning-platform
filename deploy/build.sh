#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
sha="${1:?Commit required}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 1
app=/home/max/jslab
release="$app/releases/$sha"
digest="${2-}"
[[ -z "$digest" || "$digest" =~ ^[0-9a-f]{64}$ ]] || exit 1
export PATH=/home/max/.nvm/versions/node/v24.22.1/bin:/usr/bin:/bin
export NEXT_TELEMETRY_DISABLED=1 NUXT_TELEMETRY_DISABLED=1
export npm_config_cache="$app/build-cache/npm"
mkdir -p "$app/releases" "$app/runtime"
exec 9>"$app/deploy.lock"
flock 9
if [[ -f "$app/runtime/$sha/ready" ]]; then printf 'Native runtime already built: %s\n' "$sha"; exit 0; fi
test ! -L "$app/runtime/$sha"
git -C "$app/repo" fetch origin main
if [[ ! -d "$release" ]]; then git -C "$app/repo" worktree add --detach "$release" "$sha"; fi
cd "$release"
test "$(git rev-parse HEAD)" = "$sha"
if [[ -n "$digest" ]]; then
  archive="$app/incoming/$sha.tar.gz"
  test -f "$archive" && test ! -L "$archive"
  printf '%s  %s\n' "$digest" "$archive" | sha256sum --check --status
  python3 "$release/deploy/validate-runtime.py" "$archive" "$sha"
  tar -xzf "$archive" -C "$release" --no-same-owner --no-same-permissions
  test "$(cat deploy-sha.txt)" = "$sha"
  test -f frontend/.output/server/index.mjs
  test -f backend/dist/main.js
  # Heavy Nuxt compilation and all checks already ran in the gated CI job.
  # Install native API dependencies and the migration CLI on the target host.
  npm --prefix backend ci --no-audit --no-fund
else
  npm run install:all
  node scripts/build-curriculum.mjs
  git diff --exit-code -- backend/src/catalog/data/lessons.json
  npm run typecheck
  npm --prefix backend run lint
  npm test
  npm run build
fi
npm --prefix backend audit --omit=dev --audit-level=low
npm --prefix runner/sandbox ci --ignore-scripts --no-audit --no-fund
npm --prefix runner/sandbox audit --omit=dev --audit-level=low
# A failed preparation can leave a partial runtime, which must not be nested
# into on retry. An active runtime is never removed.
if [[ -d "$app/runtime/$sha" ]]; then
  test "$(readlink -f "$app/current-runtime")" != "$app/runtime/$sha"
  rm -rf -- "$app/runtime/$sha"
fi
mkdir -p "$app/runtime/$sha/api" "$app/runtime/$sha/runner"
cp -a frontend/.output "$app/runtime/$sha/web"
cp -a backend/dist backend/package.json backend/package-lock.json "$app/runtime/$sha/api/"
npm --prefix "$app/runtime/$sha/api" ci --omit=dev --ignore-scripts --no-audit --no-fund
cp runner/{server,docker,nsjail}.mjs "$app/runtime/$sha/runner/"
find "$app/runtime/$sha" -type d -exec chmod 755 {} +
find "$app/runtime/$sha" -type f -exec chmod a+r {} +
touch "$app/runtime/$sha/ready"
# Production runs the copied standalone bundle; frontend build dependencies are regenerable.
rm -rf -- "$release/frontend/.output" "$release/frontend/node_modules"
printf 'Built native release %s\n' "$sha"
