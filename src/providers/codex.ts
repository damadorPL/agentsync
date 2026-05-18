import { SyncProvider } from '../provider';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export class CodexProvider implements SyncProvider {
  name = 'codex';

  private getLocalCodexDir(): string {
    const homeDir = os.homedir();
    // Codex CLI uses ~/.codex
    return path.join(homeDir, '.codex');
  }

  public async isInstalled(): Promise<boolean> {
    return fs.pathExists(this.getLocalCodexDir());
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalCodexDir();
    const vaultCodexDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(localDir)) {
      console.log(`Exporting ${this.name} data...`);
      await fs.ensureDir(vaultCodexDir);
      
      await fs.copy(localDir, vaultCodexDir, {
        overwrite: true,
        errorOnExist: false
      });
      console.log(`Successfully exported ${this.name} data.`);
    } else {
      console.log(`${this.name} local data not found at ${localDir}, skipping export.`);
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalCodexDir();
    const vaultCodexDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(vaultCodexDir)) {
      console.log(`Importing ${this.name} data...`);
      await fs.ensureDir(localDir);
      
      await fs.copy(vaultCodexDir, localDir, {
        overwrite: true,
        errorOnExist: false
      });
      console.log(`Successfully imported ${this.name} data.`);
    } else {
      console.log(`${this.name} data not found in vault, skipping import.`);
    }
  }
}
