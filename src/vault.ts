import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface AgentSyncConfig {
  agents?: string[];
}

export class VaultManager {
  private baseDir: string;
  private vaultDir: string;
  private configPath: string;

  constructor() {
    this.baseDir = path.join(os.homedir(), '.agentsync');
    this.vaultDir = path.join(this.baseDir, 'vault');
    this.configPath = path.join(this.baseDir, 'config.json');
  }

  public getVaultDir(): string {
    return this.vaultDir;
  }

  public async initVault(): Promise<void> {
    await fs.ensureDir(this.vaultDir);
  }

  public async getConfig(): Promise<AgentSyncConfig> {
    if (await fs.pathExists(this.configPath)) {
      return fs.readJson(this.configPath);
    }
    return {};
  }

  public async saveConfig(config: AgentSyncConfig): Promise<void> {
    await fs.ensureDir(this.baseDir);
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  public async isFirstRun(): Promise<boolean> {
    const config = await this.getConfig();
    return config.agents === undefined;
  }

  public async cleanVault(): Promise<void> {
    // Keep the .git folder if it exists, clear everything else
    const files = await fs.readdir(this.vaultDir);
    for (const file of files) {
      if (file !== '.git') {
        await fs.remove(path.join(this.vaultDir, file));
      }
    }
  }

  public getAgentVaultDir(agentName: string): string {
    return path.join(this.vaultDir, agentName);
  }

  public async ensureAgentVaultDir(agentName: string): Promise<void> {
    await fs.ensureDir(this.getAgentVaultDir(agentName));
  }
}
