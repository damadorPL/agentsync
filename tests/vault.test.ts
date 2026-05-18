// @ts-nocheck
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { VaultManager } from '../src/vault';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

// Mock fs-extra and os
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

describe('VaultManager', () => {
  let vaultManager: VaultManager;
  const mockHomeDir = '/mock/home';
  
  beforeEach(() => {
    (os.homedir as vi.Mock<any>).mockReturnValue(mockHomeDir);
    vaultManager = new VaultManager();
    vi.clearAllMocks();
  });

  test('should construct with correct paths', () => {
    expect(vaultManager.getVaultDir()).toBe(path.join(mockHomeDir, '.agentsync', 'vault'));
  });

  test('initVault should ensure vault directory exists', async () => {
    await vaultManager.initVault();
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockHomeDir, '.agentsync', 'vault'));
  });

  test('cleanVault should keep .git but remove other files', async () => {
    const mockFiles = ['.git', 'somefile.txt', 'claude'];
    (fs.readdir as vi.Mock<any>).mockResolvedValue(mockFiles);
    
    await vaultManager.cleanVault();
    
    expect(fs.readdir).toHaveBeenCalledWith(vaultManager.getVaultDir());
    expect(fs.remove).toHaveBeenCalledTimes(2);
    expect(fs.remove).toHaveBeenCalledWith(path.join(vaultManager.getVaultDir(), 'somefile.txt'));
    expect(fs.remove).toHaveBeenCalledWith(path.join(vaultManager.getVaultDir(), 'claude'));
  });

  test('getConfig should return empty object if file does not exist', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(false);
    const config = await vaultManager.getConfig();
    expect(config).toEqual({});
  });

  test('getConfig should return config if file exists', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(true);
    (fs.readJson as vi.Mock<any>).mockResolvedValue({ agents: ['claude'] });
    
    const config = await vaultManager.getConfig();
    expect(config).toEqual({ agents: ['claude'] });
  });

  test('saveConfig should write config file', async () => {
    const newConfig = { agents: ['cursor'] };
    await vaultManager.saveConfig(newConfig);
    
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockHomeDir, '.agentsync'));
    expect(fs.writeJson).toHaveBeenCalledWith(
      path.join(mockHomeDir, '.agentsync', 'config.json'),
      newConfig,
      { spaces: 2 }
    );
  });

  test('isFirstRun should return true if config agents is undefined', async () => {
    (fs.pathExists as vi.Mock<any>).mockResolvedValue(false);
    const firstRun = await vaultManager.isFirstRun();
    expect(firstRun).toBe(true);
  });

  test('getAgentVaultDir should return correct path', () => {
    const dir = vaultManager.getAgentVaultDir('claude');
    expect(dir).toBe(path.join(mockHomeDir, '.agentsync', 'vault', 'claude'));
  });

  test('ensureAgentVaultDir should ensure directory exists', async () => {
    await vaultManager.ensureAgentVaultDir('claude');
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockHomeDir, '.agentsync', 'vault', 'claude'));
  });
});
