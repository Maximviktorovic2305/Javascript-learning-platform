#!/usr/bin/env bash
set -Eeuo pipefail
sha="${1:?Commit required}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 1
digest="${2:?Runtime checksum required}"
[[ "$digest" =~ ^[0-9a-f]{64}$ ]] || exit 1
app=/home/max/jslab
archive="$app/incoming/$sha.tar.gz"
trap 'rm -f -- "$archive"' EXIT
export PATH=/home/max/.nvm/versions/node/v24.22.1/bin:/usr/bin:/bin
# Serialize the complete operation, including migrations and activation.
exec 8>"$app/publish.lock"
flock 8
git -C "$app/repo" fetch origin main
if [[ "$(git -C "$app/repo" rev-parse origin/main)" != "$sha" ]]; then
  printf 'Skipping superseded commit %s\n' "$sha"
  exit 0
fi
release="$app/releases/$sha"
if [[ ! -d "$release" ]]; then
  git -C "$app/repo" worktree add --detach "$release" "$sha"
fi
test ! -L "$release"
test "$(git -C "$release" rev-parse HEAD)" = "$sha"
bash "$release/deploy/build.sh" "$sha" "$digest"
sudo -n /usr/local/sbin/jslab-admin backup
sudo -n /usr/local/sbin/jslab-admin migrate "$sha"
sudo -n /usr/local/sbin/jslab-admin activate "$sha"
sudo -n /usr/local/sbin/jslab-admin health
printf 'Published https://js-lab.site at %s\n' "$sha"
