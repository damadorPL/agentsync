# AgentSync Walkthrough

AgentSync is a Node.js-based CLI tool that synchronizes your AI agent sessions (Claude Code, Cursor, Aider, GitHub Copilot, Gemini CLI, and Codex) across multiple machines using a Git-backed local vault.

## Project Structure

The project has been initialized in `c:\Users\damador\Documents\Code\agentsync` with the following structure:

- `src/index.ts`: The main CLI entrypoint using `commander`.
- `src/vault.ts`: Manages the local `~/.agentsync/vault` directory.
- `src/gitSync.ts`: A wrapper around `simple-git` to handle pushing and pulling the vault to/from a remote repository.
- `src/provider.ts`: The interface that all agent providers implement.
- `src/providers/`: Implementations for extracting and importing data for each agent:
  - `claudeCode.ts`: Syncs `~/.claude/`
  - `cursor.ts`: Syncs Cursor's `globalStorage/state.vscdb` and `workspaceStorage`
  - `aider.ts`: Syncs Aider's `.aider.*` files in the current working directory
  - `copilot.ts`: Syncs Copilot chat databases from VS Code's `workspaceStorage`
  - `gemini.ts`: Syncs Gemini CLI's `~/.gemini/tmp/` sessions
  - `codex.ts`: Syncs Codex CLI's `~/.codex/` sessions

## How to Use

1. **Build the Tool**
   Ensure the project is built:
   ```bash
   npm run build
   ```

2. **Link the CLI (Optional)**
   You can link the CLI globally so you can just type `agentsync` anywhere:
   ```bash
   npm link
   ```

3. **Initialize the Vault**
   On your first machine, initialize the vault and link it to a private Git repository:
   ```bash
   agentsync init git@github.com:yourusername/agentsync-vault.git
   ```

4. **Configure Active Agents**
   By default, on the first run of a sync command, an interactive setup wizard will detect installed agents and ask you to select which ones to sync. You can trigger this wizard manually at any time:
   ```bash
   agentsync config
   ```
   Or set it explicitly:
   ```bash
   agentsync config --agents claude,cursor
   ```

   * You'll see a prompt like this:
   ```
   Welcome to AgentSync! Let's configure which agents to synchronize.
   ? Select the agents you want to sync »
   Instructions:
      ↑/↓: Highlight option
      ←/→/[space]: Toggle selection
      a: Toggle all
    enter/return: Complete answer
   ( )   claude - Not detected locally
   (*)   cursor - Detected locally
   ( )   aider - Not detected locally
   (*)   copilot - Detected locally
   ( )   gemini - Not detected locally
   ( )   codex - Not detected locally
   ```

5. **Push Your Sessions**
   When you finish a coding session and want to back it up or move to another machine:
   ```bash
   agentsync push
   ```
   This command extracts data from your configured agents, copies it to `~/.agentsync/vault`, commits the changes (defaulting to the `main` branch), and pushes to the remote repo.

6. **Pull Your Sessions**
   On your second machine (after running `agentsync init`), run:
   ```bash
   agentsync pull
   ```
   This pulls the latest data from the remote repository and distributes it to the correct local folders for your selected agents.

7. **Check Status**
   If you want to see if there are pending changes in your vault:
   ```bash
   agentsync status
   ```

> [!NOTE]
> Because Cursor uses SQLite databases (`state.vscdb`), running `agentsync pull` will overwrite the local database with the one from the vault. Ensure Cursor is closed when pulling to prevent locking issues.
