// @ts-nocheck
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GitSyncEngine } from '../src/gitSync';
import * as fs from 'fs-extra';
import simpleGit from 'simple-git';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  readdir: vi.fn(),
  remove: vi.fn(),
  pathExists: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
  copy: vi.fn(),
}));

// Mock simple-git
vi.mock('simple-git');

describe('GitSyncEngine', () => {
  let gitSync: GitSyncEngine;
  const mockRepoDir = '/mock/repo';
  const mockGit = {
    checkIsRepo: vi.fn(),
    init: vi.fn(),
    addRemote: vi.fn(),
    status: vi.fn(),
    stash: vi.fn(),
    pull: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    branch: vi.fn(),
  };

  beforeEach(() => {
    (simpleGit as unknown as vi.Mock<any>).mockReturnValue(mockGit);
    gitSync = new GitSyncEngine(mockRepoDir);
    vi.clearAllMocks();
  });

  test('init should create repo and add remote if not a repo', async () => {
    mockGit.checkIsRepo.mockResolvedValue(false);
    
    await gitSync.init('git@github.com:test/test.git');
    
    expect(fs.ensureDir).toHaveBeenCalledWith(mockRepoDir);
    expect(mockGit.init).toHaveBeenCalled();
    expect(mockGit.addRemote).toHaveBeenCalledWith('origin', 'git@github.com:test/test.git');
  });

  test('init should do nothing if already a repo', async () => {
    mockGit.checkIsRepo.mockResolvedValue(true);
    
    await gitSync.init('git@github.com:test/test.git');
    
    expect(fs.ensureDir).toHaveBeenCalledWith(mockRepoDir);
    expect(mockGit.init).not.toHaveBeenCalled();
    expect(mockGit.addRemote).not.toHaveBeenCalled();
  });

  test('pull should stash if there are changes', async () => {
    mockGit.status.mockResolvedValue({ files: ['dirty.txt'] });
    mockGit.pull.mockResolvedValue(undefined);
    
    await gitSync.pull();
    
    expect(mockGit.stash).toHaveBeenCalledWith(); // First to stash
    expect(mockGit.pull).toHaveBeenCalledWith('origin', 'main', { '--rebase': 'true' });
    expect(mockGit.stash).toHaveBeenCalledWith(['pop']); // Then to pop
  });

  test('pull should not stash if clean', async () => {
    mockGit.status.mockResolvedValue({ files: [] });
    mockGit.pull.mockResolvedValue(undefined);
    
    await gitSync.pull();
    
    expect(mockGit.stash).not.toHaveBeenCalled();
    expect(mockGit.pull).toHaveBeenCalledWith('origin', 'main', { '--rebase': 'true' });
  });

  test('pull should catch error if pull fails', async () => {
    mockGit.status.mockResolvedValue({ files: [] });
    mockGit.pull.mockRejectedValue(new Error('pull failed'));
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await gitSync.pull();
    
    expect(consoleSpy).toHaveBeenCalledWith('Notice: Could not pull from remote (might be empty or unreachable).');
    consoleSpy.mockRestore();
  });

  test('pull should catch error if stash pop fails', async () => {
    mockGit.status.mockResolvedValue({ files: ['dirty.txt'] });
    mockGit.pull.mockResolvedValue(undefined);
    mockGit.stash.mockImplementation((args: string[]) => {
      if (args && args[0] === 'pop') {
        throw new Error('pop failed');
      }
    });
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await gitSync.pull();
    
    expect(consoleSpy).toHaveBeenCalledWith('Warning: Could not pop stash after pull. You may need to resolve conflicts manually.');
    consoleSpy.mockRestore();
  });

  test('push should commit and push if there are changes', async () => {
    mockGit.status.mockResolvedValue({
      staged: ['file1.txt'],
      created: [],
      modified: [],
      deleted: []
    });
    
    await gitSync.push('Test commit');
    
    expect(mockGit.add).toHaveBeenCalledWith('./*');
    expect(mockGit.branch).toHaveBeenCalledWith(['-M', 'main']);
    expect(mockGit.commit).toHaveBeenCalledWith('Test commit');
    expect(mockGit.push).toHaveBeenCalledWith('origin', 'main', { '--set-upstream': null });
  });

  test('push should push even if working tree is clean', async () => {
    mockGit.status.mockResolvedValue({
      staged: [],
      created: [],
      modified: [],
      deleted: []
    });
    
    await gitSync.push('Test commit');
    
    expect(mockGit.add).toHaveBeenCalledWith('./*');
    expect(mockGit.commit).not.toHaveBeenCalled();
    expect(mockGit.push).toHaveBeenCalledWith('origin', 'main', { '--set-upstream': null });
  });
});
