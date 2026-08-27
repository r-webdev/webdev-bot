#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Fetch a GitHub issue from the current repository using the GitHub CLI.

Usage:
  fetch-github-issue.sh <issue-number|issue-url> [issue-url|issue-number]

Arguments:
  First argument   Issue number (e.g. 86) or GitHub issue URL
  Second argument  Optional cross-check: the other form (URL or number)

Examples:
  fetch-github-issue.sh 86
  fetch-github-issue.sh https://github.com/r-webdev/webdev-bot/issues/86
  fetch-github-issue.sh 86 https://github.com/r-webdev/webdev-bot/issues/86

Requires: gh CLI authenticated for this repository (run `gh auth status`), and Node.js.
EOF
}

extract_issue_number() {
  local input="$1"

  if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "$input"
    return
  fi

  if [[ "$input" =~ github\.com/[^/]+/[^/]+/issues/([0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi

  echo "error: cannot parse issue number from: $input" >&2
  exit 1
}

# Captured once per script run. All obfuscation in a run uses this value so names
# stay stable while formatting; a new run (even milliseconds later) may differ.
OBFUSCATION_DATETIME=""
issue_json=""

capture_obfuscation_datetime() {
  if date +%3N >/dev/null 2>&1; then
    OBFUSCATION_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
    return
  fi

  OBFUSCATION_DATETIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
}

sha256_hex() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
    return
  fi

  echo "error: sha256sum or shasum is required to obfuscate author names" >&2
  exit 1
}

# Deterministic pseudonym from name + run datetime. Same name and run datetime
# always produce the same output; a new script run uses a new datetime.
obfuscate_name() {
  local name="$1"
  local hash seed adjective_index noun_index
  local -a adjectives=(
    amber bold calm coral crisp dusk ember flat gloss hazy indigo jade keen lime
    muted neon olive plum quiet rapid sage teal vivid warm zinc
  )
  local -a nouns=(
    arch beacon canyon delta echo flint grove harbor inlet jetty knoll lagoon mesa
    narrows oracle prism quill ridge summit tundra vertex willow
  )

  hash=$(printf '%s\x1f%s' "$name" "$OBFUSCATION_DATETIME" | sha256_hex)
  seed=$((16#${hash:0:8}))
  adjective_index=$((seed % ${#adjectives[@]}))
  noun_index=$(((seed / ${#adjectives[@]}) % ${#nouns[@]}))

  echo "${adjectives[adjective_index]}-${nouns[noun_index]}"
}

# Parse a field from the fetched issue JSON using Node (no external jq required).
issue_json_read() {
  local node_expression="$1"

  ISSUE_JSON="$issue_json" node -e "
    const issue = JSON.parse(process.env.ISSUE_JSON);
    const value = ${node_expression};
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        process.stdout.write(JSON.stringify(value));
      } else {
        process.stdout.write(String(value));
      }
    }
  "
}

format_labels() {
  local labels

  labels=$(issue_json_read 'issue.labels.map((label) => label.name).join(", ")')
  if [[ -z "$labels" ]]; then
    echo "_none_"
  else
    echo "$labels"
  fi
}

format_assignees() {
  local assignee_count index login obfuscated assignee_lines=""

  assignee_count=$(issue_json_read 'issue.assignees.length')
  if [[ "$assignee_count" -eq 0 ]]; then
    echo "_none_"
    return
  fi

  for ((index = 0; index < assignee_count; index++)); do
    login=$(issue_json_read "issue.assignees[${index}].login")
    obfuscated=$(obfuscate_name "$login")
    if [[ -n "$assignee_lines" ]]; then
      assignee_lines+=", "
    fi
    assignee_lines+="$obfuscated"
  done

  echo "$assignee_lines"
}

format_comments() {
  local comment_count index login created_at body obfuscated comment_lines=""

  comment_count=$(issue_json_read 'issue.comments.length')
  if [[ "$comment_count" -eq 0 ]]; then
    echo "_No comments yet._"
    return
  fi

  for ((index = 0; index < comment_count; index++)); do
    login=$(issue_json_read "issue.comments[${index}].author.login")
    created_at=$(issue_json_read "issue.comments[${index}].createdAt")
    body=$(issue_json_read "issue.comments[${index}].body")
    obfuscated=$(obfuscate_name "$login")

    if [[ -n "$comment_lines" ]]; then
      comment_lines+=$'\n\n---\n\n'
    fi
    comment_lines+="### ${obfuscated} (${created_at})"$'\n\n'"${body}"
  done

  echo "$comment_lines"
}

print_issue() {
  local issue_number title state url milestone body comment_count labels assignees comments

  issue_number=$(issue_json_read 'issue.number')
  title=$(issue_json_read 'issue.title')
  state=$(issue_json_read 'issue.state')
  url=$(issue_json_read 'issue.url')
  milestone=$(issue_json_read 'issue.milestone?.title ?? ""')
  body=$(issue_json_read 'issue.body')
  comment_count=$(issue_json_read 'issue.comments.length')
  labels=$(format_labels)
  assignees=$(format_assignees)
  comments=$(format_comments)

  echo "# Issue #${issue_number}: ${title}"
  echo
  echo "**URL:** ${url}"
  echo "**State:** ${state}"
  if [[ -n "$milestone" ]]; then
    echo "**Milestone:** ${milestone}"
  fi
  echo
  echo "## Labels"
  echo "$labels"
  echo
  echo "## Assignees"
  echo "$assignees"
  echo
  echo "## Body"
  echo
  echo "$body"
  echo
  echo "## Comments (${comment_count})"
  echo
  echo "$comments"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI is not installed. Install it from https://cli.github.com/" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required to parse issue JSON" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh CLI is not authenticated. Run \`gh auth login\`." >&2
  exit 1
fi

first_number="$(extract_issue_number "$1")"
issue_number="$first_number"

if [[ $# -eq 2 ]]; then
  second_number="$(extract_issue_number "$2")"
  if [[ "$first_number" != "$second_number" ]]; then
    echo "error: issue number $first_number does not match $second_number" >&2
    exit 1
  fi
  issue_number="$second_number"
fi

if ! gh issue view "$issue_number" --json number >/dev/null 2>&1; then
  echo "error: issue #$issue_number not found in this repository" >&2
  exit 1
fi

capture_obfuscation_datetime

issue_json="$(
  gh issue view "$issue_number" \
    --json number,title,body,state,url,labels,assignees,comments,milestone
)"

print_issue
