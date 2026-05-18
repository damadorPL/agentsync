import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';

export class GitSyncEngine {
  private git: SimpleGit;
  private repoDir: string;

  constructor(repoDir: string) {
    this.repoDir = repoDir;
    this.git = simpleGit(this.repoDir);
  }

  public async init(remoteUrl: string): Promise<void> {
    await fs.ensureDir(this.repoDir);
    
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      await this.git.init();
      await this.git.addRemote('origin', remoteUrl);
    }
  }

  public async pull(): Promise<void> {
    // Stash any local changes before pulling to avoid merge conflicts
    const status = await this.git.status();
    let stashed = false;
    if (status.files.length > 0) {
      await this.git.stash();
      stashed = true;
    }

    try {
      await this.git.pull('origin', 'main', { '--rebase': 'true' });
    } catch (error) {
      // If pull fails (e.g., no remote branch yet), just ignore
      console.log('Notice: Could not pull from remote (might be empty or unreachable).');
    }

    if (stashed) {
      try {
        await this.git.stash(['pop']);
      } catch (error) {
         console.warn('Warning: Could not pop stash after pull. You may need to resolve conflicts manually.');
      }
    }
  }

  public async push(message: string = 'Sync agent data'): Promise<void> {
    await this.git.add('./*');
    const status = await this.git.status();
    
    // Ensure the branch is renamed to main (in case it defaulted to master)
    try {
      await this.git.branch(['-M', 'main']);
    } catch (e) {
      // Ignore if it fails (e.g., if there are no commits yet)
    }
    
    if (status.staged.length > 0 || status.created.length > 0 || status.modified.length > 0 || status.deleted.length > 0) {
      await this.git.commit(message);
    } else {
      console.log('No new changes to commit.');
    }

    // Always attempt to push (there might be unpushed commits even if working tree is clean)
    await this.git.push('origin', 'main', { '--set-upstream': null });
  }
}
