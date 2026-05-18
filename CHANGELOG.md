# Changelog

All notable changes to the AgentSync project will be documented in this file.

## [1.0.0] - 2026-05-18

### Added
- Initial release of AgentSync CLI.
- Core Git-backed sync engine (`init`, `push`, `pull`, `status` commands).
- Interactive first-run setup wizard to auto-detect installed agents and configure them via a terminal UI.
- Persistent configuration via `~/.agentsync/config.json`.
- `config` command to manage or re-run agent selection.
- `ClaudeCodeProvider` for syncing `~/.claude/` directories.
- `CursorProvider` for syncing Cursor's `globalStorage` and `workspaceStorage`.
- `AiderProvider` for syncing Aider's project-specific `.aider.*` files.
- `CopilotProvider` for syncing Copilot's `workspaceStorage` sessions.
- `GeminiProvider` for syncing Gemini CLI's `~/.gemini/tmp/` sessions.
- `CodexProvider` for synchronizing Codex CLI session history (`~/.codex/`).

### Fixed
- Fixed a Git push error by ensuring the repository defaults to `main` branch before pushing, resolving issues with new vaults initialized with `master`.
- Fixed `push` command to capture untracked changes correctly.
