// lib/utils/config.js

const {
  getDefaultNetwork,
  getNetworkConfig,
  migrateOldConfig,
  loadConfig,
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
  const env = options.env ? options.env.trim().toLowerCase() : 'local';

  // 6. Aplicar jerarquía de configuración (flags override config file)
  const apiKey = options.apiKey || process.env.ESCROW_API_KEY || networkConfig.apiKey;
  const publicKey = options.publicKey || process.env.ESCROW_PUBLIC_KEY || networkConfig.publicKey;
  const secretKey = options.secretKey || process.env.ESCROW_SECRET_KEY || networkConfig.secretKey;

  // 7. Determinar base URL según entorno
  let baseUrl;
  if (options.baseUrl) {
    baseUrl = options.baseUrl;
  } else if (env === 'dev') {
    baseUrl = networkConfig.baseUrlDev;
  } else {
    baseUrl = networkConfig.baseUrlLocal;
  }

  // 8. Validar que baseUrl esté configurada
  if (!baseUrl) {
    throw new Error(
      `Base URL not configured for network "${network}" and environment "${env}".\n` +
      `Please configure it:\n` +
      `  escrow config set ${network}.baseUrlDev <url>  (for dev environment)\n` +
      `  escrow config set ${network}.baseUrlLocal <url>  (for local environment)\n` +
      `Or use --baseUrl <url> to override temporarily.`
    );
  }

  // 9. Validar formato de baseUrl
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error('Base URL must start with "http://" or "https://"');
  }

  // 10. Validar claves de Stellar
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

  // 11. Validar que campos requeridos existan
  const missing = [];
  if (!publicKey) missing.push('publicKey');
  if (!secretKey) missing.push('secretKey');
  if (!apiKey) missing.push('apiKey');

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration for network "${network}": ${missing.join(', ')}\n\n` +
      `To configure them, run:\n` +
      missing.map(field => `  escrow config set ${network}.${field} <value>`).join('\n') +
      `\n\nOr check your configuration:\n` +
      `  escrow config list ${network}`
    );
  }

  // 12. Retornar configuración consolidada
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
  };
}

module.exports = { getConfig };
