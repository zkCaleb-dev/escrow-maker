// lib/utils/config.js

const {
  getDefaultNetwork,
  getNetworkConfig,
  migrateOldConfig,
  migrateKeysToWallets,
  loadConfig,
  getWallet,
  getDefaultWallet,
  getTestDefaults,
} = require('./configManager');

/**
 * getConfig(options):
 *   - Implementa jerarquía de configuración: CLI flags > env vars > config file > defaults
 *   - Migra automáticamente configuración antigua si es necesario
 *   - Valida que la configuración esté completa
 *   - Retorna configuración consolidada para usar en comandos
 *
 * @param {Object} options - Opciones del comando (flags)
 * @param {string} options.network - Red a usar ('testnet' o 'mainnet')
 * @param {string} options.env - Entorno ('local' o 'dev')
 * @param {string} options.wallet - Nombre de la wallet a usar
 * @param {string} options.apiKey - Override de API key
 * @param {string} options.publicKey - Override de public key
 * @param {string} options.secretKey - Override de secret key
 * @param {string} options.baseUrl - Override de base URL
 * @returns {Object} Configuración consolidada
 */
async function getConfig(options = {}) {
  // 1. Migración automática si es necesario
  const config = loadConfig();
  if (!config.networks) {
    migrateOldConfig();
  }

  // Migrar claves antiguas a wallets
  migrateKeysToWallets();

  // 2. Determinar red usando jerarquía: flag > env var > config default > 'testnet'
  const network = options.network
    || process.env.ESCROW_NETWORK
    || getDefaultNetwork()
    || 'testnet';

  // 3. Validar que la red sea válida
  const validNetworks = ['testnet', 'mainnet'];
  if (!validNetworks.includes(network)) {
    throw new Error(
      `Invalid network: "${network}". Valid networks: ${validNetworks.join(', ')}`
    );
  }

  // 4. Cargar configuración de la red
  const networkConfig = getNetworkConfig(network);

  // 5. Determinar entorno (local o dev) para seleccionar URL
  const env = options.env ? options.env.trim().toLowerCase() : 'dev';

  // 6. Obtener wallet (nueva lógica)
  let publicKey, secretKey;

  if (options.publicKey && options.secretKey) {
    // Override con flags
    publicKey = options.publicKey;
    secretKey = options.secretKey;
  } else if (process.env.ESCROW_PUBLIC_KEY && process.env.ESCROW_SECRET_KEY) {
    // Override con env vars
    publicKey = process.env.ESCROW_PUBLIC_KEY;
    secretKey = process.env.ESCROW_SECRET_KEY;
  } else {
    // Usar wallet del config
    const walletName = options.wallet || 'main';
    const wallet = getWallet(network, walletName) || getDefaultWallet(network);

    if (wallet) {
      publicKey = wallet.publicKey;
      secretKey = wallet.secretKey;
    } else {
      // Fallback a las claves antiguas si existen (retrocompatibilidad)
      publicKey = networkConfig.publicKey;
      secretKey = networkConfig.secretKey;
    }
  }

  // 7. Aplicar jerarquía para apiKey
  const apiKey = options.apiKey || process.env.ESCROW_API_KEY || networkConfig.apiKey;

  // 8. Determinar base URL según entorno
  let baseUrl;
  if (options.baseUrl) {
    baseUrl = options.baseUrl;
  } else if (env === 'dev') {
    baseUrl = networkConfig.baseUrlDev;
  } else {
    baseUrl = networkConfig.baseUrlLocal;
  }

  // 9. Validar que baseUrl esté configurada
  if (!baseUrl) {
    throw new Error(
      `Base URL not configured for network "${network}" and environment "${env}".\n` +
      `Please configure it:\n` +
      `  escrow config set ${network}.baseUrlDev <url>  (for dev environment)\n` +
      `  escrow config set ${network}.baseUrlLocal <url>  (for local environment)\n` +
      `Or use --baseUrl <url> to override temporarily.`
    );
  }

  // 10. Validar formato de baseUrl
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error('Base URL must start with "http://" or "https://"');
  }

  // 11. Validar claves de Stellar
  if (publicKey && !/^G[A-Z0-9]{55}$/.test(publicKey)) {
    throw new Error(
      'Invalid Public Key format (must start with "G" and be 56 characters long)'
    );
  }

  if (secretKey && !/^S[A-Z0-9]{55}$/.test(secretKey)) {
    throw new Error(
      'Invalid Secret Key format (must start with "S" and be 56 characters long)'
    );
  }

  // 12. Validar que campos requeridos existan
  const missing = [];
  if (!publicKey) missing.push('wallet or publicKey');
  if (!secretKey) missing.push('wallet or secretKey');
  if (!apiKey) missing.push('apiKey');

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration for network "${network}": ${missing.join(', ')}\n\n` +
      `Option 1 - Add a wallet:\n` +
      `  escrow wallet add main --public <key> --secret <key>\n\n` +
      `Option 2 - Configure directly:\n` +
      `  escrow config set ${network}.apiKey <value>\n` +
      `  escrow config set ${network}.publicKey <value>\n` +
      `  escrow config set ${network}.secretKey <value>\n\n` +
      `Or check your configuration:\n` +
      `  escrow config list ${network}`
    );
  }

  // 13. Obtener defaults de testing
  const testDefaults = getTestDefaults(network);

  // 14. Retornar configuración consolidada
  return {
    network,
    networkPassphrase: networkConfig.networkPassphrase,
    apiKey: apiKey.trim(),
    publicKey: publicKey.trim(),
    secretKey: secretKey.trim(),
    baseUrl: baseUrl.trim(),
    env,
    horizonUrl: networkConfig.horizonUrl,
    rpcUrl: networkConfig.rpcUrl,
    testDefaults,
  };
}

/**
 * getConfigWithWallet(options, walletName):
 *   - Similar a getConfig pero específicamente para una wallet nombrada
 *   - Útil para comandos que necesitan usar múltiples wallets
 *
 * @param {Object} options - Opciones del comando
 * @param {string} walletName - Nombre de la wallet a usar
 * @returns {Object} Configuración consolidada con la wallet especificada
 */
async function getConfigWithWallet(options = {}, walletName) {
  return getConfig({ ...options, wallet: walletName });
}

module.exports = { getConfig, getConfigWithWallet };
