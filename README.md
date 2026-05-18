# AgentSync 🔄

**AgentSync** is a lightweight, cross-machine synchronization tool designed to persistently migrate and synchronize AI agent session data—including conversation logs, history, and workspace context—across different development machines.

Keep your AI pairing assistants (like Claude Code, Cursor, Aider, Copilot, Gemini, and Codex) perfectly in sync between your workstation, laptop, and remote environments.

---

## Features

- **Multi-Agent Support**: Out-of-the-box support for:
  - 🤖 **Claude Code**
  - 🚀 **Cursor**
  - 💻 **Aider**
  - 👥 **GitHub Copilot**
  - ♊ **Gemini**
  - ⌨️ **Codex CLI**
- **Git-Backed Vault**: Securely tracks and synchronizes your agent data using a private Git repository as the central storage ("vault").
- **Seamless Local Persistence**: Exports from local application directories and imports them back smoothly.
- **Developer-Friendly CLI**: Intuitive commands to keep your workflow synchronized with minimal friction.

---

## Installation

You can run AgentSync directly via `npx` without installing it:

```bash
npx @damador/agentsync init <your-private-vault-git-repo-url>
```

Alternatively, you can install it globally to use the `agentsync` command anywhere:

```bash
npm install -g @damador/agentsync
```

---

## Usage

AgentSync commands can be run directly using `npx` (or `agentsync` if installed globally):

### 1. Initialize the Vault
Connect your AgentSync to a private remote Git repository which will act as your cross-machine vault:
```bash
npx @damador/agentsync init <your-private-vault-git-repo-url>
```

### 2. Configure Active Agents
By default, the first time you run a sync command, an **interactive setup wizard** will detect the agents installed on your machine and ask you to select which ones to sync.

You can also trigger the wizard or configure this manually at any time:
```bash
# Run the interactive setup wizard
npx @damador/agentsync config

# Or manually set specific agents
npx @damador/agentsync config --agents claude,cursor
```

*You'll see a prompt like this:*
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

### 3. Export & Push Agent Sessions
To save your current local sessions and push them to your remote vault:
```bash
npx @damador/agentsync push
```

### 4. Pull & Import Agent Sessions
On another machine, pull the latest data from the remote vault and import it into your local agent directories:
```bash
npx @damador/agentsync pull
```

### 5. Check Vault Status
Check the status of your local synchronization vault:
```bash
npx @damador/agentsync status
```

---

## Testing

AgentSync includes a comprehensive test suite powered by **Vitest**. The tests heavily mock filesystem operations (`fs-extra`) and git interactions (`simple-git`) to ensure they run quickly and safely without altering your real local files or Git repositories.

To run the test suite:

```bash
npm test
```

---

## How It Works

1. **Vault Management**: AgentSync manages a local vault directory that holds exported configuration, database files, and JSONL log files from supported agents.
2. **Push/Pull Engine**: Uses a Git-backed engine to track file changes and handle version synchronization (commit, pull, push) securely and privately.
3. **Provider System**: Each agent provider defines how to locate, export, and import its session files safely.

---

## License

MIT License.
