#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="r-webdev/webdev-bot"
issue_number=""
body_file=""

usage() {
  cat <<'EOF'
Comment on an existing GitHub issue in the current repository using the GitHub CLI.

Usage:
  comment-github-issue.sh --number <issue-number> --body-file <path>

Arguments:
  --number      Issue number to comment on
  --body-file   Path to a file containing the comment body (markdown)

Examples:
  comment-github-issue.sh --number 100 --body-file /tmp/issue-comment.md

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
    --number)
      if [[ $# -lt 2 ]]; then
        echo "error: --number requires a value" >&2
        exit 1
      fi
      issue_number="$2"
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

if [[ -z "$issue_number" ]]; then
  echo "error: --number is required" >&2
  usage >&2
  exit 1
fi

if [[ ! "$issue_number" =~ ^[0-9]+$ ]]; then
  echo "error: --number must be a positive integer" >&2
  exit 1
fi

if [[ -z "$body_file" ]]; then
  echo "error: --body-file is required" >&2
  usage >&2
  exit 1
fi

if [[ ! -f "$body_file" ]]; then
  echo "error: body file not found: ${body_file}" >&2
  exit 1
fi

if [[ ! -s "$body_file" ]]; then
  echo "error: body file is empty: ${body_file}" >&2
  exit 1
fi

require_gh
require_expected_repo

comment_url="$(gh issue comment "$issue_number" --body-file "$body_file")"

echo "Commented on issue #${issue_number}"
echo "$comment_url"
