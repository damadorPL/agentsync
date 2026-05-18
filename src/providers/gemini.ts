import { SyncProvider } from '../provider';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export class GeminiProvider implements SyncProvider {
  name = 'gemini';

  private getLocalGeminiDir(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.gemini', 'tmp');
  }

  public async isInstalled(): Promise<boolean> {
    return fs.pathExists(this.getLocalGeminiDir());
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalGeminiDir();
    const vaultGeminiDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(localDir)) {
      console.log(`Exporting ${this.name} data...`);
      await fs.ensureDir(vaultGeminiDir);
      
      await fs.copy(localDir, vaultGeminiDir, {
        overwrite: true,
        errorOnExist: false
      });
      console.log(`Successfully exported ${this.name} data.`);
    } else {
      console.log(`${this.name} local data not found at ${localDir}, skipping export.`);
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const localDir = this.getLocalGeminiDir();
    const vaultGeminiDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(vaultGeminiDir)) {
      console.log(`Importing ${this.name} data...`);
      await fs.ensureDir(localDir);
      
      await fs.copy(vaultGeminiDir, localDir, {
        overwrite: true,
        errorOnExist: false
      });
      console.log(`Successfully imported ${this.name} data.`);
    } else {
      console.log(`${this.name} data not found in vault, skipping import.`);
    }
  }
}
