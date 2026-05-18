export interface SyncProvider {
  /**
   * The name of the AI agent (e.g., 'claude', 'cursor', 'aider')
   */
  name: string;

  /**
   * Extracts data from the agent's local directories and copies it into the vault.
   * @param vaultDir The base directory of the vault.
   */
  exportToVault(vaultDir: string): Promise<void>;

  /**
   * Restores data from the vault back into the agent's local directories.
   * @param vaultDir The base directory of the vault.
   */
  importFromVault(vaultDir: string): Promise<void>;

  /**
   * Checks whether the agent is installed locally on this machine.
   * Used to auto-detect agents during first run setup.
   */
  isInstalled(): Promise<boolean>;
}
