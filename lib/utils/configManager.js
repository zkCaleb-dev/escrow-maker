// lib/utils/configManager.js

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Nombre de la carpeta donde guardamos la configuración global del usuario.
 * Ejemplo en Linux/macOS: /home/usuario/.escrow/config.json
 */
const CONFIG_DIR_NAME = '.escrow';
const CONFIG_FILE_NAME = 'config.json';

/**
 * Devuelve la ruta al directorio de configuración global.
 * - En Linux/macOS: ~/.escrow
 * - En Windows: C:\Users\<Usuario>\.escrow
 */
function getConfigDirectory() {
  const homeDir = os.homedir();
  return path.join(homeDir, CONFIG_DIR_NAME);
}

/**
 * Devuelve la ruta completa al archivo de configuración JSON.
 * (por ejemplo: /home/usuario/.escrow/config.json)
 */
function getConfigFilePath() {
  return path.join(getConfigDirectory(), CONFIG_FILE_NAME);
}

/**
 * Lee (o crea si no existe) el archivo de configuración global.
 * Si no existía, regresa un objeto vacío {}.
 */
function loadConfig() {
  const configDir = getConfigDirectory();
  const configPath = getConfigFilePath();

  try {
    // Si la carpeta ~/.escrow no existe, devolvemos {} (sin crearla aún).
    if (!fs.existsSync(configDir)) {
      return {};
    }
    // Si el archivo config.json no existe, devolvemos {}.
    if (!fs.existsSync(configPath)) {
      return {};
    }
    // Leemos el JSON y lo parseamos.
    const raw = fs.readFileSync(configPath, { encoding: 'utf-8' });
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Error al leer la configuración global en '${configPath}': ${err.message}`);
  }
}

/**
 * Escribe (o sobreescribe) el objeto de configuración en el archivo config.json,
 * creando la carpeta ~/.escrow si hace falta.
 */
function saveConfig(configObject) {
  const configDir = getConfigDirectory();
  const configPath = getConfigFilePath();

  try {
    if (!fs.existsSync(configDir)) {
      // Creamos la carpeta ~/.escrow con permisos restrictivos (700)
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
    const jsonContent = JSON.stringify(configObject, null, 2);
    // Escribimos config.json con permisos 600 (lectura/escritura solo para el usuario).
    fs.writeFileSync(configPath, jsonContent, { encoding: 'utf-8', mode: 0o600 });
  } catch (err) {
    throw new Error(`Error al guardar la configuración global en '${configPath}': ${err.message}`);
  }
}

/**
 * Devuelve el valor de la clave `key` en el config global. Si no existe,
 * regresa `fallback` (por defecto undefined).
 */
function getConfigValue(key, fallback = undefined) {
  const config = loadConfig();
  return Object.prototype.hasOwnProperty.call(config, key) ? config[key] : fallback;
}

/**
 * Asigna o actualiza la clave `key` con el `value` en el config global
 * y lo guarda en disco.
 */
function setConfigValue(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * Elimina la clave `key` del config global (si existe) y vuelve a escribir el archivo.
 */
function unsetConfigValue(key) {
  const config = loadConfig();
  if (Object.prototype.hasOwnProperty.call(config, key)) {
    delete config[key];
    saveConfig(config);
  }
}

/**
 * Obtiene la red por defecto de la configuración global.
 * Si no existe, retorna 'testnet'.
 */
function getDefaultNetwork() {
  const config = loadConfig();
  return config.defaultNetwork || 'testnet';
}

/**
 * Establece la red por defecto en la configuración global.
 */
function setDefaultNetwork(networkName) {
  const config = loadConfig();
  config.defaultNetwork = networkName;
  saveConfig(config);
}

/**
 * Obtiene la configuración de una red específica.
 * Si no existe la estructura de redes o la red específica, retorna un objeto con valores por defecto.
 */
function getNetworkConfig(networkName) {
  const config = loadConfig();

  // Si no existe la estructura networks, inicializamos
  if (!config.networks) {
    initializeDefaultConfig();
    return getNetworkConfig(networkName);
  }

  // Si la red no existe, retornar configuración por defecto
  if (!config.networks[networkName]) {
    return getDefaultNetworkTemplate(networkName);
  }

  return config.networks[networkName];
}

/**
 * Establece un valor en la configuración de una red específica.
 * Soporta notación de punto: testnet.apiKey
 */
function setNetworkConfig(networkName, key, value) {
  const config = loadConfig();

  // Asegurar que existe la estructura
  if (!config.networks) {
    config.networks = {};
  }

  if (!config.networks[networkName]) {
    config.networks[networkName] = getDefaultNetworkTemplate(networkName);
  }

  // Establecer el valor
  config.networks[networkName][key] = value;
  saveConfig(config);
}

/**
 * Retorna un template por defecto para una red
 */
function getDefaultNetworkTemplate(networkName) {
  const templates = {
    testnet: {
      name: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      apiKey: '',
      publicKey: '',
      secretKey: '',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: '',
      baseUrlLocal: 'http://localhost:3000',
      baseUrlDev: 'https://dev.api.trustlesswork.com',
    },
    mainnet: {
      name: 'mainnet',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
      apiKey: '',
      publicKey: '',
      secretKey: '',
      horizonUrl: 'https://horizon.stellar.org',
      rpcUrl: '',
      baseUrlLocal: 'http://localhost:3000',
      baseUrlDev: 'https://api.trustlesswork.com',
    },
  };

  return templates[networkName] || {
    name: networkName,
    networkPassphrase: '',
    apiKey: '',
    publicKey: '',
    secretKey: '',
    horizonUrl: '',
    rpcUrl: '',
    baseUrlLocal: '',
    baseUrlDev: '',
  };
}

/**
 * Inicializa la configuración por defecto con estructura de redes
 */
function initializeDefaultConfig() {
  const config = loadConfig();

  if (!config.networks) {
    config.networks = {
      testnet: getDefaultNetworkTemplate('testnet'),
      mainnet: getDefaultNetworkTemplate('mainnet'),
    };
    config.defaultNetwork = 'testnet';
    saveConfig(config);
  }
}

/**
 * Migra la configuración antigua (flat) a la nueva estructura (por redes).
 * Crea un backup antes de migrar.
 */
function migrateOldConfig() {
  const config = loadConfig();

  // Si ya tiene la estructura networks, no hace falta migrar
  if (config.networks) {
    return false;
  }

  // Verificar si hay configuración antigua que migrar
  const hasOldConfig = config.apiKey || config.publicKey || config.secretKey ||
                       config.baseUrlLocal || config.baseUrlDev;

  if (!hasOldConfig) {
    // No hay nada que migrar, solo inicializar
    initializeDefaultConfig();
    return false;
  }

  // Crear backup
  const configPath = getConfigFilePath();
  const backupPath = configPath + '.backup';

  try {
    fs.copyFileSync(configPath, backupPath);
  } catch (err) {
    console.warn(`Warning: Could not create backup: ${err.message}`);
  }

  // Migrar valores a testnet
  const newConfig = {
    networks: {
      testnet: {
        name: 'testnet',
        networkPassphrase: 'Test SDF Network ; September 2015',
        apiKey: config.apiKey || '',
        publicKey: config.publicKey || '',
        secretKey: config.secretKey || '',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        rpcUrl: '',
        baseUrlLocal: config.baseUrlLocal || 'http://localhost:3000',
        baseUrlDev: config.baseUrlDev || 'https://dev.api.trustlesswork.com',
      },
      mainnet: getDefaultNetworkTemplate('mainnet'),
    },
    defaultNetwork: 'testnet',
  };

  saveConfig(newConfig);

  console.log('\n✅ Configuration migrated successfully!');
  console.log(`   Backup saved to: ${backupPath}`);
  console.log('   Your existing values were moved to "testnet" network.');
  console.log('\n   To configure mainnet:');
  console.log('     escrow config set mainnet.apiKey <your-api-key>');
  console.log('     escrow config set mainnet.publicKey <your-public-key>');
  console.log('     escrow config set mainnet.secretKey <your-secret-key>\n');

  return true;
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  unsetConfigValue,
  getDefaultNetwork,
  setDefaultNetwork,
  getNetworkConfig,
  setNetworkConfig,
  initializeDefaultConfig,
  migrateOldConfig,
};
