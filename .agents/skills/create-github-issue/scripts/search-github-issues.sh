#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="r-webdev/webdev-bot"

usage() {
  cat <<'EOF'
Search GitHub issues in the current repository using the GitHub CLI.

Usage:
  search-github-issues.sh <search-terms...>

Examples:
  search-github-issues.sh issue template
  search-github-issues.sh timeout member role

Requires: gh CLI authenticated for this repository (run `gh auth status`).
Must be run from a clone of r-webdev/webdev-bot.
EOF
}

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is not installed. Install it from https://cli.github.com/" >&2
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh CLI is not authenticated. Run \`gh auth login\`." >&2
    exit 1
  fi
}

require_expected_repo() {
  local repository

  if ! repository=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null); then
    echo "error: could not determine the GitHub repository. Run this from the webdev-bot clone." >&2
    exit 1
  fi

  if [[ "$repository" != "$EXPECTED_REPO" ]]; then
    echo "error: expected repository ${EXPECTED_REPO}, got ${repository}" >&2
    echo "       Run this script from the webdev-bot repository root." >&2
    exit 1
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

query="$*"

require_gh
require_expected_repo

echo "Repository: ${EXPECTED_REPO}"
echo "Search: ${query}"
echo

if ! gh issue list --search "$query" --state all --limit 20; then
  echo "error: failed to search issues" >&2
  exit 1
fi
