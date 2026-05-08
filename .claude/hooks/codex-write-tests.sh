#!/usr/bin/env bash
# PostToolUse hook for ExitPlanMode.
# When the user approves a plan, spawn codex in the background to write
# integration tests in tests/integration/<feature>/ following project conventions.
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
if [[ "$TOOL_NAME" != "ExitPlanMode" ]]; then
  exit 0
fi

PLAN=$(printf '%s' "$INPUT" | jq -r '.tool_input.plan // empty')
if [[ -z "$PLAN" ]]; then
  exit 0
fi

PROJECT_DIR=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
PROJECT_DIR=${PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(pwd)}}

mkdir -p "$PROJECT_DIR/.codex"
LOG="$PROJECT_DIR/.codex/test-writer.log"
STAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

PROMPT=$(cat <<EOF
You are writing integration tests for the Cortex AI project. Claude Code is
implementing the plan below in parallel — your sole responsibility is the
integration tests. Do NOT modify anything in src/.

Read these files first to understand conventions:
- AGENTS.md (three-layer architecture, Result/tryCatch, Zod schemas)
- playwright.config.ts (Playwright config, test server on port 3001)
- tests/integration/auth/auth.spec.ts (reference test pattern — match this style)
- tests/integration/helpers/ (fixtures used by existing specs)

The user just approved this plan:

<plan>
$PLAN
</plan>

Steps:
1. Identify the feature name from the plan.
2. Create tests/integration/<feature>/<feature>.spec.ts (or extend an existing
   spec if the feature already has tests).
3. Cover the golden path plus edge cases described in the plan
   (validation failures, auth, conflicts, etc.).
4. Use the same imports and fixture style as tests/integration/auth/auth.spec.ts.
5. Tests will fail until Claude finishes the implementation — that's expected
   for TDD. Do not run them.
6. Stop after writing the test file. Do not touch src/, prisma/, or config.
EOF
)

cd "$PROJECT_DIR"

{
  printf '\n===== %s =====\n' "$STAMP"
  printf 'plan length: %d chars\n' "${#PLAN}"
} >>"$LOG"

nohup codex exec --full-auto --skip-git-repo-check "$PROMPT" \
  >>"$LOG" 2>&1 </dev/null &
disown || true

exit 0
