import { SyncProvider } from '../provider';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';

export class AiderProvider implements SyncProvider {
  name = 'aider';

  private getProjectHash(dir: string): string {
    return crypto.createHash('md5').update(dir).digest('hex');
  }

  private getAiderFiles(): string[] {
    const cwd = process.cwd();
    return [
      path.join(cwd, '.aider.chat.history.md'),
      path.join(cwd, '.aider.input.history'),
      path.join(cwd, '.aider.tags.cache.v3')
    ];
  }

  public async isInstalled(): Promise<boolean> {
    const files = this.getAiderFiles();
    for (const f of files) {
      if (await fs.pathExists(f)) return true;
    }
    return false;
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const cwd = process.cwd();
    const hash = this.getProjectHash(cwd);
    const vaultAiderDir = path.join(vaultDir, this.name, hash);

    const aiderFiles = this.getAiderFiles();
    let exported = false;

    for (const file of aiderFiles) {
      if (await fs.pathExists(file)) {
        if (!exported) {
          await fs.ensureDir(vaultAiderDir);
          exported = true;
        }
        const fileName = path.basename(file);
        const vaultFile = path.join(vaultAiderDir, fileName);
        await fs.copy(file, vaultFile, { overwrite: true });
        console.log(`Exported Aider file: ${fileName}`);
      }
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const cwd = process.cwd();
    const hash = this.getProjectHash(cwd);
    const vaultAiderDir = path.join(vaultDir, this.name, hash);

    if (await fs.pathExists(vaultAiderDir)) {
      const files = await fs.readdir(vaultAiderDir);
      for (const file of files) {
        const vaultFile = path.join(vaultAiderDir, file);
        const localFile = path.join(cwd, file);
        await fs.copy(vaultFile, localFile, { overwrite: true });
        console.log(`Imported Aider file: ${file}`);
      }
    } else {
      console.log(`No Aider data found in vault for current project.`);
    }
  }
}
