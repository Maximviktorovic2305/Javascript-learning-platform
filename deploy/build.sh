#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
sha="${1:?Commit required}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 1
app=/home/max/jslab
release="$app/releases/$sha"
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
npm run install:all
node scripts/build-curriculum.mjs
git diff --exit-code -- backend/src/catalog/data/lessons.json
npm run typecheck
npm --prefix backend run lint
npm test
npm run build
npm --prefix backend audit --omit=dev --audit-level=low
npm --prefix runner/sandbox ci --ignore-scripts --no-audit --no-fund
npm --prefix runner/sandbox audit --omit=dev --audit-level=low
mkdir -p "$app/runtime/$sha/api" "$app/runtime/$sha/runner"
cp -a frontend/.output "$app/runtime/$sha/web"
cp -a backend/dist backend/package.json backend/package-lock.json "$app/runtime/$sha/api/"
npm --prefix "$app/runtime/$sha/api" ci --omit=dev --ignore-scripts --no-audit --no-fund
cp runner/{server,docker,nsjail}.mjs "$app/runtime/$sha/runner/"
find "$app/runtime/$sha" -type d -exec chmod 755 {} +
find "$app/runtime/$sha" -type f -exec chmod a+r {} +
touch "$app/runtime/$sha/ready"
printf 'Built native release %s\n' "$sha"
