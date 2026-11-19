#!/usr/bin/env bash
# CI only. Runs an apt install command with the downloaded .deb files kept in ~/.cache/apt-debs,
# which the workflow restores and saves with actions/cache. The runner's Ubuntu mirror sometimes
# trickles at a few KB/s: on 2026-11-19 `playwright install-deps webkit` ran past the 15-minute job
# limit twice. With the debs cached, apt downloads only what changed since the last save.
# Usage: scripts/ci-apt.sh <command...>
set -euo pipefail
dir="$HOME/.cache/apt-debs"
mkdir -p "$dir"
sudo tee /etc/apt/apt.conf.d/90uipack-ci >/dev/null <<'CONF'
APT::Keep-Downloaded-Packages "true";
Binary::apt::APT::Keep-Downloaded-Packages "true";
Acquire::Retries "5";
Acquire::http::Timeout "30";
Acquire::https::Timeout "30";
CONF
# Some runner images delete downloaded packages after every install.
sudo rm -f /etc/apt/apt.conf.d/docker-clean
shopt -s nullglob
debs=("$dir"/*.deb)
echo "apt cache: ${#debs[@]} restored .deb files"
if ((${#debs[@]})); then sudo cp "${debs[@]}" /var/cache/apt/archives/; fi
# Copy back on any exit, so a run the slow mirror times out still keeps what it fetched; the
# workflow saves that under a partial key the next run restores from.
keep() {
  sudo find /var/cache/apt/archives -maxdepth 1 -name '*.deb' -exec cp -u {} "$dir"/ \;
  sudo chown -R "$(id -u):$(id -g)" "$dir"
  echo "apt cache: $(find "$dir" -name '*.deb' | wc -l | tr -d ' ') .deb files to save"
}
trap keep EXIT
"$@"
