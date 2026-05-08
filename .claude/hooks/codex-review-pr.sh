#!/usr/bin/env bash
# PostToolUse hook for Bash.
# After a successful `gh pr create` whose base is `develop`, run codex review
# in the background and post the result as a PR comment.
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
if [[ "$COMMAND" != *"gh pr create"* ]]; then
  exit 0
fi

# Only proceed if the bash invocation succeeded.
EXIT_CODE=$(printf '%s' "$INPUT" | jq -r '.tool_response.exitCode // .tool_response.exit_code // 0')
if [[ "$EXIT_CODE" != "0" ]]; then
  exit 0
fi

# Grab PR URL from gh's stdout.
STDOUT=$(printf '%s' "$INPUT" | jq -r '.tool_response.stdout // .tool_response.output // empty')
PR_URL=$(printf '%s' "$STDOUT" | grep -Eo 'https://github\.com/[^[:space:]]+/pull/[0-9]+' | head -1)
if [[ -z "$PR_URL" ]]; then
  exit 0
fi

PROJECT_DIR=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
PROJECT_DIR=${PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(pwd)}}

mkdir -p "$PROJECT_DIR/.codex"
LOG="$PROJECT_DIR/.codex/pr-review.log"
STAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cd "$PROJECT_DIR"

{
  printf '\n===== %s =====\n' "$STAMP"
  printf 'PR: %s\n' "$PR_URL"
} >>"$LOG"

# Confirm base branch is develop. Project rule: feature PRs target develop.
BASE=$(gh pr view "$PR_URL" --json baseRefName -q .baseRefName 2>>"$LOG" || true)
if [[ "$BASE" != "develop" ]]; then
  printf 'skipping: base=%s (only develop reviewed)\n' "$BASE" >>"$LOG"
  exit 0
fi

(
  REVIEW_FILE=$(mktemp)
  trap 'rm -f "$REVIEW_FILE"' EXIT

  REVIEW_PROMPT="Review this PR's diff against develop. Anchor on AGENTS.md (three-layer architecture: index → domain → repository, Result/tryCatch error handling, Zod schemas via @/openapi/zod). Flag: layering violations, missing OpenAPI registration, raw try/catch in feature code, hand-written interfaces duplicating Zod schemas, and security issues. Be concise and actionable — bullet findings with file:line references."

  if codex review --base develop "$REVIEW_PROMPT" >"$REVIEW_FILE" 2>>"$LOG"; then
    if [[ -s "$REVIEW_FILE" ]]; then
      {
        printf '## Codex review\n\n'
        cat "$REVIEW_FILE"
      } | gh pr comment "$PR_URL" --body-file - >>"$LOG" 2>&1 || true
    else
      printf 'codex review produced empty output\n' >>"$LOG"
    fi
  else
    printf 'codex review failed\n' >>"$LOG"
  fi
) >>"$LOG" 2>&1 </dev/null &
disown || true

exit 0
