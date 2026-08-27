#!/usr/bin/env bash
set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Prepare the repository for AI-assisted development.

Usage:
  agent-ready.sh <agent> [--skills]

Agents:
  claude   Claude Code
  cursor   Cursor
  copilot  GitHub Copilot
  codex    OpenAI Codex
  other    Generic agent (no agent-specific setup)

Flags:
  --skills  Link skills only (skip other setup steps)

With no flags, all setup steps run for the chosen agent.

Examples:
  pnpm agent-ready claude
  pnpm agent-ready claude --skills

Run from the repository root, or via: pnpm agent-ready <agent> [--skills]
EOF
}

agent=""
skills_only=false
manual_nvm_use_required=false

for argument in "$@"; do
  case "$argument" in
    --skills)
      skills_only=true
      ;;
    -h | --help | help)
      usage
      exit 0
      ;;
    -*)
      echo "error: unknown flag '$argument'" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$agent" ]]; then
        echo "error: unexpected argument '$argument'" >&2
        usage >&2
        exit 1
      fi
      agent="${argument,,}"
      ;;
  esac
done

if [[ -z "$agent" ]]; then
  usage >&2
  exit 1
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"

step() {
  echo
  echo "==> $1"
}

load_nvm() {
  if [[ -n "${NVM_DIR:-}" && -s "${NVM_DIR}/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "${NVM_DIR}/nvm.sh"
    return 0
  fi

  for nvm_script in \
    "${HOME}/.nvm/nvm.sh" \
    /usr/local/opt/nvm/nvm.sh \
    /opt/homebrew/opt/nvm/nvm.sh; do
    if [[ -s "$nvm_script" ]]; then
      # shellcheck source=/dev/null
      . "$nvm_script"
      return 0
    fi
  done

  return 1
}

node_major_minor() {
  node -p "process.versions.node.split('.').slice(0, 2).join('.')" 2>/dev/null || true
}

check_node_version() {
  step "Checking Node.js version"

  if [[ ! -f .nvmrc ]]; then
    echo "warning: .nvmrc not found; skipping version check"
    return 0
  fi

  expected_version="$(tr -d '[:space:]' < .nvmrc)"
  expected_major_minor="$(echo "${expected_version#v}" | cut -d. -f1-2)"
  current_version="$(node_major_minor)"

  if [[ -n "$current_version" && "$current_version" == "$expected_major_minor" ]]; then
    echo "ok: Node.js ${current_version} matches .nvmrc (${expected_version})"
    return 0
  fi

  if [[ -n "$current_version" ]]; then
    echo "Node.js ${current_version} does not match .nvmrc (${expected_version})"
  else
    echo "Node.js is not installed or not on PATH"
  fi

  if ! load_nvm; then
    echo "warning: nvm not found; install Node ${expected_version} manually"
    echo "         See https://github.com/nvm-sh/nvm"
    return 0
  fi

  echo "running: nvm install ${expected_version}"
  nvm install "$expected_version"

  echo "running: nvm use ${expected_version}"
  nvm use "$expected_version"

  current_version="$(node_major_minor)"
  if [[ "$current_version" == "$expected_major_minor" ]]; then
    echo "ok: switched to Node.js ${current_version} for this script"
    manual_nvm_use_required=true
    return 0
  fi

  echo "warning: still on Node.js ${current_version:-unknown} after nvm use"
}

print_manual_steps() {
  if [[ "$manual_nvm_use_required" != true ]]; then
    return 0
  fi

  echo
  echo "┌─────────────────────────────────────────────────────────────────────┐"
  echo "│ Manual step required                                                │"
  echo "├─────────────────────────────────────────────────────────────────────┤"
  echo "│ This script switched Node.js only inside its own process.           │"
  echo "│ Your terminal is still using the previous version.                  │"
  echo "│                                                                     │"
  echo "│ In this terminal, run:                                              │"
  echo "│                                                                     │"
  echo "│   nvm use                                                           │"
  echo "│                                                                     │"
  echo "│ Then confirm with:                                                  │"
  echo "│                                                                     │"
  echo "│   node -v                                                           │"
  echo "└─────────────────────────────────────────────────────────────────────┘"
}

install_dependencies() {
  step "Installing dependencies"

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "warning: pnpm is not installed; run pnpm install manually"
    return 0
  fi

  if [[ -d node_modules ]]; then
    echo "ok: node_modules already present"
    return 0
  fi

  pnpm install
}

scaffold_env_file() {
  step "Scaffolding .env file"

  if [[ -f .env ]]; then
    echo "ok: .env already exists"
    return 0
  fi

  if [[ ! -f .env.example ]]; then
    echo "warning: .env.example not found; create .env manually"
    return 0
  fi

  cp .env.example .env
  echo "created: .env from .env.example"
  echo "         Fill in required values before running the bot."
}

check_github_cli() {
  step "Checking GitHub CLI"

  if command -v gh >/dev/null 2>&1; then
    echo "ok: gh is installed"
    return 0
  fi

  echo "warning: gh is not installed"
  echo "         Install it for the plan-github-issue skill: https://cli.github.com/"
}

link_agent_skills() {
  step "Linking agent skills"
  bash "$script_directory/link-agent-skills.sh" "$agent"
}

run_all_steps() {
  check_node_version
  install_dependencies
  scaffold_env_file
  check_github_cli
  link_agent_skills

  echo
  echo "Agent setup complete for ${agent}."
  print_manual_steps
}

if [[ "$skills_only" == true ]]; then
  link_agent_skills
else
  run_all_steps
fi
