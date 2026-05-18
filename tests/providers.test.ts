// @ts-nocheck
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ClaudeCodeProvider } from '../src/providers/claudeCode';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  readdir: vi.fn(),
  remove: vi.fn(),
  pathExists: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
  copy: vi.fn(),
}));
vi.mock('os');

describe('ClaudeCodeProvider', () => {
  let provider: ClaudeCodeProvider;
  const mockHomeDir = '/mock/home';

  beforeEach(() => {
    (os.homedir as vi.Mock<any>).mockReturnValue(mockHomeDir);
    provider = new ClaudeCodeProvider();
    vi.clearAllMocks();
  });

  test('isInstalled should return true if directory exists', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(true);
    const installed = await provider.isInstalled();
    expect(installed).toBe(true);
    expect(fs.pathExists).toHaveBeenCalledWith(path.join(mockHomeDir, '.claude'));
  });

  test('isInstalled should return false if directory does not exist', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(false);
    const installed = await provider.isInstalled();
    expect(installed).toBe(false);
  });

  test('exportToVault should copy files if installed', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(true);
    
    await provider.exportToVault('/mock/vault');
    
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join('/mock/vault', 'claude'));
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockHomeDir, '.claude'),
      path.join('/mock/vault', 'claude'),
      expect.any(Object)
    );
  });

  test('exportToVault should skip if not installed', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(false);
    
    await provider.exportToVault('/mock/vault');
    
    expect(fs.copy).not.toHaveBeenCalled();
  });

  test('exportToVault should have a valid filter function', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(true);
    await provider.exportToVault('/mock/vault');
    
    const copyCall = (fs.copy as vi.Mock).mock.calls[0];
    const options = copyCall[2];
    expect(options.filter('any_file')).toBe(true);
  });

  test('importFromVault should copy files if vault dir exists', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(true);
    
    await provider.importFromVault('/mock/vault');
    
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockHomeDir, '.claude'));
    expect(fs.copy).toHaveBeenCalledWith(
      path.join('/mock/vault', 'claude'),
      path.join(mockHomeDir, '.claude'),
      expect.any(Object)
    );
  });

  test('importFromVault should skip if vault dir does not exist', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(false);
    
    await provider.importFromVault('/mock/vault');
    
    expect(fs.copy).not.toHaveBeenCalled();
  });
});
