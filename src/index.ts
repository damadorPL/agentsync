#!/usr/bin/env node
import { Command } from 'commander';
import prompts from 'prompts';
import { VaultManager } from './vault';
import { GitSyncEngine } from './gitSync';
import { ClaudeCodeProvider } from './providers/claudeCode';
import { CursorProvider } from './providers/cursor';
import { AiderProvider } from './providers/aider';
import { CopilotProvider } from './providers/copilot';
import { GeminiProvider } from './providers/gemini';
import { CodexProvider } from './providers/codex';
import { SyncProvider } from './provider';

const program = new Command();
const vaultManager = new VaultManager();

const providers: SyncProvider[] = [
  new ClaudeCodeProvider(),
  new CursorProvider(),
  new AiderProvider(),
  new CopilotProvider(),
  new GeminiProvider(),
  new CodexProvider()
];

async function runSetupWizard(): Promise<void> {
  console.log('\nWelcome to AgentSync! Let\'s configure which agents to synchronize.');
  
  // Detect installed agents
  const choices = [];
  for (const provider of providers) {
    const installed = await provider.isInstalled();
    choices.push({
      title: provider.name,
      value: provider.name,
      selected: installed,
      description: installed ? 'Detected locally' : 'Not detected locally'
    });
  }

  const response = await prompts({
    type: 'multiselect',
    name: 'agents',
    message: 'Select the agents you want to sync',
    choices,
    min: 1
  });

  if (response.agents) {
    const config = await vaultManager.getConfig();
    config.agents = response.agents;
    await vaultManager.saveConfig(config);
    console.log(`\nConfiguration saved. Active agents: ${config.agents!.join(', ')}\n`);
  } else {
    console.log('\nSetup cancelled. No agents configured.\n');
    process.exit(1);
  }
}

program
  .name('agentsync')
  .description('Synchronize AI agent sessions across machines')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the AgentSync vault and connect to a remote Git repository')
  .argument('<repo>', 'Git repository URL')
  .action(async (repo) => {
    try {
      console.log('Initializing AgentSync vault...');
      await vaultManager.initVault();
      const gitSync = new GitSyncEngine(vaultManager.getVaultDir());
      await gitSync.init(repo);
      console.log('Successfully initialized AgentSync vault connected to', repo);
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  });

program
  .command('config')
  .description('Manage AgentSync configuration')
  .option('--agents <agents>', 'Comma-separated list of agents to sync (e.g., claude,cursor)')
  .action(async (options) => {
    try {
      const config = await vaultManager.getConfig();
      if (options.agents) {
        const agents = options.agents.split(',').map((a: string) => a.trim().toLowerCase());
        config.agents = agents;
        await vaultManager.saveConfig(config);
        console.log(`Config updated. Active agents: ${agents.join(', ')}`);
      } else {
        // Run wizard if no options are passed
        await runSetupWizard();
      }
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  });

program
  .command('push')
  .description('Export local agent data and push to the remote vault')
  .action(async () => {
    try {
      if (await vaultManager.isFirstRun()) {
        await runSetupWizard();
      }

      console.log('Preparing to push data...');
      await vaultManager.initVault();
      const vaultDir = vaultManager.getVaultDir();

      let activeProviders = providers;
      const config = await vaultManager.getConfig();
      if (config.agents && config.agents.length > 0) {
        const configuredAgents = config.agents;
        activeProviders = providers.filter(p => configuredAgents.includes(p.name.toLowerCase()));
        if (activeProviders.length === 0) {
          console.log('No matching agents found. Check your config.');
          return;
        }
      }

      // Export from all selected providers
      for (const provider of activeProviders) {
        try {
          await provider.exportToVault(vaultDir);
        } catch (e) {
          console.error(`Error exporting ${provider.name}:`, e);
        }
      }

      const gitSync = new GitSyncEngine(vaultDir);
      await gitSync.push('Auto-sync agent data from ' + new Date().toISOString());
      console.log('Push complete.');
    } catch (error) {
      console.error('Failed to push:', error);
    }
  });

program
  .command('pull')
  .description('Pull data from the remote vault and import into local agents')
  .action(async () => {
    try {
      if (await vaultManager.isFirstRun()) {
        await runSetupWizard();
      }

      console.log('Preparing to pull data...');
      await vaultManager.initVault();
      const vaultDir = vaultManager.getVaultDir();

      const gitSync = new GitSyncEngine(vaultDir);
      await gitSync.pull();

      let activeProviders = providers;
      const config = await vaultManager.getConfig();
      if (config.agents && config.agents.length > 0) {
        const configuredAgents = config.agents;
        activeProviders = providers.filter(p => configuredAgents.includes(p.name.toLowerCase()));
        if (activeProviders.length === 0) {
          console.log('No matching agents found. Check your config.');
          return;
        }
      }

      // Import into all selected providers
      for (const provider of activeProviders) {
        try {
          await provider.importFromVault(vaultDir);
        } catch (e) {
          console.error(`Error importing ${provider.name}:`, e);
        }
      }
      console.log('Pull complete.');
    } catch (error) {
      console.error('Failed to pull:', error);
    }
  });

program
  .command('status')
  .description('Check the status of the local vault')
  .action(async () => {
    try {
      const vaultDir = vaultManager.getVaultDir();
      console.log(`Vault directory: ${vaultDir}`);
      
      const gitSync = new GitSyncEngine(vaultDir);
      // Let simpleGit handle it (dirty hack but works for logging)
      const git = require('simple-git')(vaultDir);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log('Vault is not a git repository. Run `agentsync init <repo>` first.');
        return;
      }
      
      const status = await git.status();
      console.log(`Current branch: ${status.current}`);
      console.log(`Tracking: ${status.tracking}`);
      console.log(`Modified files: ${status.modified.length}`);
      console.log(`Untracked files: ${status.not_added.length}`);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  });

program.parse();
