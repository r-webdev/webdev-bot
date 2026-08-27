#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Link project skills from .agents/skills/ to an agent-specific directory.

Usage:
  link-agent-skills.sh <agent>

Agents:
  claude   Symlink .claude/skills -> .agents/skills
  cursor   Symlink .cursor/skills -> .agents/skills
  copilot  Symlink .github/skills -> .agents/skills
  codex    Symlink .codex/skills -> .agents/skills
  other    No symlink; print where skills live

Run from the repository root, or via: pnpm agent-ready <agent> --skills
EOF
}

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

agent="${1,,}"

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"

source_skills=".agents/skills"

confirm_optional_symlink() {
  local agent_name="$1"
  local target_path="$2"

  cat <<EOF

${agent_name^} already discovers skills from .agents/skills/ directly.
A symlink at ${target_path} is optional and usually not needed.

EOF
  read -r -p "Create symlink anyway? [y/N] " reply
  case "$reply" in
    y | Y | yes | Yes)
      return 0
      ;;
    *)
      echo "skipped: no symlink created"
      exit 0
      ;;
  esac
}

if [[ ! -d "$source_skills" ]]; then
  echo "error: $source_skills not found in repository root" >&2
  exit 1
fi

case "$agent" in
  claude)
    link_path=".claude/skills"
    ;;
  cursor)
    link_path=".cursor/skills"
    ;;
  copilot)
    link_path=".github/skills"
    ;;
  codex)
    link_path=".codex/skills"
    ;;
  other)
    cat <<EOF
No agent-specific symlink is created for "$agent".

Project skills live in .agents/skills/. Read the relevant SKILL.md when a task matches.

To link skills for a supported agent, run:
  pnpm agent-ready claude --skills
  pnpm agent-ready cursor --skills
  pnpm agent-ready copilot --skills
  pnpm agent-ready codex --skills
EOF
    exit 0
    ;;
  -h | --help | help)
    usage
    exit 0
    ;;
  *)
    echo "error: unknown agent '$1'" >&2
    usage >&2
    exit 1
    ;;
esac

if [[ -L "$link_path" ]]; then
  current_target="$(readlink "$link_path")"
  if [[ "$current_target" == "$source_skills" || "$current_target" == "../agents/skills" ]]; then
    echo "already linked: $link_path -> $source_skills"
    exit 0
  fi
  rm "$link_path"
elif [[ -e "$link_path" ]]; then
  echo "error: $link_path exists and is not a symlink; remove it manually first" >&2
  exit 1
elif [[ "$agent" == "cursor" || "$agent" == "codex" ]]; then
  confirm_optional_symlink "$agent" "$link_path"
fi

mkdir -p "$(dirname "$link_path")"
ln -s "$source_skills" "$link_path"
echo "linked: $link_path -> $source_skills"
