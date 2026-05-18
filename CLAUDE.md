# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript → dist/
npm start              # Run CLI from source via ts-node
npm test               # Run test suite (Vitest)
npm run test:coverage  # Run tests with coverage report
```

To run a single test file:
```bash
npx vitest run tests/vault.test.ts
```

## Architecture

AgentSync is a Node.js CLI tool (published as `@damador/agentsync`) that syncs AI agent session data across machines using a private Git repository as a central vault.

### Core layers

```
CLI Commands (src/index.ts via Commander.js)
    ↓
VaultManager (src/vault.ts)  ←→  GitSyncEngine (src/gitSync.ts)
    ↓
SyncProvider interface (src/provider.ts)
    ↓
6 provider implementations (src/providers/)
```

**VaultManager** manages `~/.agentsync/vault/` (local vault directory) and `~/.agentsync/config.json` (which agents are enabled). If `config.agents` is undefined, it's treated as first-run and triggers an interactive wizard.

**GitSyncEngine** wraps `simple-git`. Pull uses stash → rebase → pop-stash to avoid merge conflicts across machines. Push forces `main` branch naming.

**SyncProvider** is the interface each agent must implement:
- `exportToVault(vaultDir)` — copy local agent data into the vault
- `importFromVault(vaultDir)` — restore from vault into local agent directories
- `isInstalled()` — detect if the agent is present on this machine

### Providers

| Provider | Agent | Local path |
|---|---|---|
| `ClaudeCodeProvider` | Claude Code | `~/.claude/` |
| `CursorProvider` | Cursor IDE | Platform-specific `Cursor/User/` in AppData/Library/.config |
| `AiderProvider` | Aider | `.aider.*` files in CWD; vault-namespaced by MD5 of project path |
| `CopilotProvider` | GitHub Copilot | `Code/User/workspaceStorage/*/GitHub.copilot-chat/` |
| `GeminiProvider` | Gemini CLI | `~/.gemini/tmp/` |
| `CodexProvider` | Codex CLI | `~/.codex/` |

### Key design decisions

- **Aider is project-scoped**: unlike others, Aider files live in CWD. The provider uses an MD5 hash of the project path to namespace vault storage per project.
- **Cursor and Copilot sync selectively**: only specific database files and workspace directories, not entire app data.
- **Errors are non-fatal**: missing directories are skipped, git push/pull failures are logged but don't crash the CLI.
- **No linting or formatting config** is present in this repo.

### Testing

Tests live in `tests/` and use Vitest. All filesystem (`fs-extra`) and git (`simple-git`) calls are fully mocked — no real disk or network I/O in tests. `os.homedir()` is also mocked for cross-platform consistency.
