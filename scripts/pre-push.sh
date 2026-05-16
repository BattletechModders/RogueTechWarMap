#!/usr/bin/env bash
# Pre-push hook: typecheck + full test suite.
# Requires Node 20+. Sources nvm automatically if available.
set -e

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use --silent
fi

npx tsc -p tsconfig.vitest.json --noEmit && yarn test
