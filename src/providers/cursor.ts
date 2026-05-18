import { SyncProvider } from '../provider';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export class CursorProvider implements SyncProvider {
  name = 'cursor';

  private getLocalCursorUserDir(): string {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    if (platform === 'win32') {
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(appData, 'Cursor', 'User');
    } else if (platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'User');
    } else {
      return path.join(homeDir, '.config', 'Cursor', 'User');
    }
  }

  private getCursorPaths(): string[] {
    const baseDir = this.getLocalCursorUserDir();
    return [
      path.join(baseDir, 'globalStorage', 'state.vscdb'), // The SQLite database
      path.join(baseDir, 'workspaceStorage'), // Workspace specific settings
    ];
  }

  public async isInstalled(): Promise<boolean> {
    return fs.pathExists(this.getLocalCursorUserDir());
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const vaultCursorDir = path.join(vaultDir, this.name);
    await fs.ensureDir(vaultCursorDir);

    const pathsToSync = this.getCursorPaths();
    
    for (const p of pathsToSync) {
      if (await fs.pathExists(p)) {
        const relativePath = path.relative(this.getLocalCursorUserDir(), p);
        const vaultPath = path.join(vaultCursorDir, relativePath);
        
        console.log(`Exporting ${this.name} data: ${relativePath}`);
        await fs.copy(p, vaultPath, { overwrite: true });
      }
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const vaultCursorDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(vaultCursorDir)) {
      const pathsToSync = this.getCursorPaths();
      
      for (const p of pathsToSync) {
        const relativePath = path.relative(this.getLocalCursorUserDir(), p);
        const vaultPath = path.join(vaultCursorDir, relativePath);
        
        if (await fs.pathExists(vaultPath)) {
          console.log(`Importing ${this.name} data: ${relativePath}`);
          await fs.copy(vaultPath, p, { overwrite: true });
        }
      }
    } else {
      console.log(`${this.name} data not found in vault, skipping import.`);
    }
  }
}
