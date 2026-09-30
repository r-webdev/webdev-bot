#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="r-webdev/webdev-bot"
title=""
body_file=""

usage() {
  cat <<'EOF'
Create a GitHub issue in the current repository using the GitHub CLI.

Usage:
  create-github-issue.sh --title <title> --body-file <path>

Arguments:
  --title       Issue title
  --body-file   Path to a file containing the issue body (markdown)

Examples:
  create-github-issue.sh --title "Add issue template" --body-file /tmp/issue-body.md

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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      if [[ $# -lt 2 ]]; then
        echo "error: --title requires a value" >&2
        exit 1
      fi
      title="$2"
      shift 2
      ;;
    --body-file)
      if [[ $# -lt 2 ]]; then
        echo "error: --body-file requires a path" >&2
        exit 1
      fi
      body_file="$2"
      shift 2
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$title" ]]; then
  echo "error: --title is required" >&2
  usage >&2
  exit 1
fi

if [[ -z "$body_file" ]]; then
  echo "error: --body-file is required" >&2
  usage >&2
  exit 1
fi

if [[ ! -f "$body_file" ]]; then
  echo "error: body file not found: $body_file" >&2
  exit 1
fi

if [[ ! -s "$body_file" ]]; then
  echo "error: body file is empty: $body_file" >&2
  exit 1
fi

require_gh
require_expected_repo

issue_url="$(gh issue create --title "$title" --body-file "$body_file")"
issue_number="${issue_url##*/}"

echo "Created issue #${issue_number}"
echo "$issue_url"
