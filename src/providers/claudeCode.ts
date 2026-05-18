import { SyncProvider } from '../provider';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export class ClaudeCodeProvider implements SyncProvider {
  name = 'claude';

  private getLocalClaudeDir(): string {
    const homeDir = os.homedir();
    // Claude Code uses ~/.claude or %USERPROFILE%\.claude
    return path.join(homeDir, '.claude');
  }

  public async isInstalled(): Promise<boolean> {
    return fs.pathExists(this.getLocalClaudeDir());
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalClaudeDir();
    const vaultClaudeDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(localDir)) {
      console.log(`Exporting ${this.name} data...`);
      await fs.ensureDir(vaultClaudeDir);
      
      // Copy the entire .claude directory to the vault, excluding potentially huge caches if needed
      // but for now, copy everything.
      await fs.copy(localDir, vaultClaudeDir, {
        overwrite: true,
        errorOnExist: false,
        filter: (src) => {
          // You might want to exclude things here, like active sockets or massive log files if any exist
          return true;
        }
      });
      console.log(`Successfully exported ${this.name} data.`);
    } else {
      console.log(`${this.name} local data not found at ${localDir}, skipping export.`);
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalClaudeDir();
    const vaultClaudeDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(vaultClaudeDir)) {
      console.log(`Importing ${this.name} data...`);
      await fs.ensureDir(localDir);
      
      // Copy from vault back to local
      await fs.copy(vaultClaudeDir, localDir, {
        overwrite: true,
        errorOnExist: false
      });
      console.log(`Successfully imported ${this.name} data.`);
    } else {
      console.log(`${this.name} data not found in vault, skipping import.`);
    }
  }
}
