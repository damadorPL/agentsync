import { SyncProvider } from '../provider';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export class CopilotProvider implements SyncProvider {
  name = 'copilot';

  private getWorkspaceStorageDir(): string {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    if (platform === 'win32') {
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(appData, 'Code', 'User', 'workspaceStorage');
    } else if (platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage');
    } else {
      return path.join(homeDir, '.config', 'Code', 'User', 'workspaceStorage');
    }
  }

  public async isInstalled(): Promise<boolean> {
    return fs.pathExists(this.getWorkspaceStorageDir());
  }

  public async exportToVault(vaultDir: string): Promise<void> {
    const storageDir = this.getWorkspaceStorageDir();
    const vaultCopilotDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(storageDir)) {
      const workspaces = await fs.readdir(storageDir);
      let foundCopilotData = false;

      for (const ws of workspaces) {
        const wsDir = path.join(storageDir, ws);
        const stat = await fs.stat(wsDir);
        
        if (stat.isDirectory()) {
          // Copilot chat is typically stored in GitHub.copilot-chat or similar within the workspace hash
          const copilotChatDir = path.join(wsDir, 'GitHub.copilot-chat');
          
          if (await fs.pathExists(copilotChatDir)) {
            if (!foundCopilotData) {
              await fs.ensureDir(vaultCopilotDir);
              foundCopilotData = true;
            }
            
            const vaultWsDir = path.join(vaultCopilotDir, ws, 'GitHub.copilot-chat');
            await fs.copy(copilotChatDir, vaultWsDir, { overwrite: true });
            console.log(`Exported Copilot data for workspace ${ws}`);
          }
        }
      }

      if (!foundCopilotData) {
        console.log(`No Copilot data found in workspaceStorage.`);
      }
    } else {
      console.log(`VS Code workspaceStorage not found at ${storageDir}`);
    }
  }

  public async importFromVault(vaultDir: string): Promise<void> {
    const storageDir = this.getWorkspaceStorageDir();
    const vaultCopilotDir = path.join(vaultDir, this.name);

    if (await fs.pathExists(vaultCopilotDir)) {
      const workspaces = await fs.readdir(vaultCopilotDir);
      
      for (const ws of workspaces) {
        const vaultWsCopilotDir = path.join(vaultCopilotDir, ws, 'GitHub.copilot-chat');
        const localWsCopilotDir = path.join(storageDir, ws, 'GitHub.copilot-chat');
        
        if (await fs.pathExists(vaultWsCopilotDir)) {
          await fs.ensureDir(path.join(storageDir, ws));
          await fs.copy(vaultWsCopilotDir, localWsCopilotDir, { overwrite: true });
          console.log(`Imported Copilot data for workspace ${ws}`);
        }
      }
    } else {
      console.log(`${this.name} data not found in vault, skipping import.`);
    }
  }
}
