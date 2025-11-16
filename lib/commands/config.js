// lib/commands/config.js

const { Command } = require('commander');
const {
  loadConfig,
  getConfigValue,
  setConfigValue,
  unsetConfigValue,
  getNetworkConfig,
  setNetworkConfig,
} = require('../utils/configManager');

const configCmd = new Command('config')
  .description('Manage global CLI configuration (keys, URLs, networks, etc.)');

/**
 * 1) escrow config list [network]
 */
configCmd
  .command('list [network]')
  .description('Show all configuration (or specific network configuration)')
  .action((network) => {
    try {
      const config = loadConfig();

      // Si no hay configuración
      if (Object.keys(config).length === 0) {
        console.log('No configuration saved yet.');
        console.log('\nTo configure a network:');
        console.log('  escrow config set testnet.apiKey <your-api-key>');
        console.log('  escrow config set testnet.publicKey <your-public-key>');
        console.log('  escrow config set testnet.secretKey <your-secret-key>');
        return;
      }

      // Si se especificó una red, mostrar solo esa red
      if (network) {
        const networkConfig = getNetworkConfig(network);
        if (!networkConfig || !config.networks || !config.networks[network]) {
          console.log(`Network "${network}" not configured yet.`);
          console.log(`\nTo configure it:`);
          console.log(`  escrow config set ${network}.apiKey <your-api-key>`);
          console.log(`  escrow config set ${network}.publicKey <your-public-key>`);
          console.log(`  escrow config set ${network}.secretKey <your-secret-key>`);
          return;
        }

        console.log(`\nConfiguration for ${network}:`);
        console.log('='.repeat(50));
        for (const [key, value] of Object.entries(networkConfig)) {
          const displayValue = (key.includes('secret') || key.includes('apiKey'))
            ? maskSecret(value)
            : value;
          console.log(`  ${key}: ${displayValue}`);
        }
        console.log('');
        return;
      }

      // Mostrar toda la configuración
      console.log('\nGlobal Configuration:');
      console.log('='.repeat(50));

      if (config.defaultNetwork) {
        console.log(`Default Network: ${config.defaultNetwork}`);
      }

      if (config.networks) {
        console.log('\nNetworks:');
        for (const [netName, netConfig] of Object.entries(config.networks)) {
          const configured = netConfig.apiKey && netConfig.publicKey && netConfig.secretKey;
          const marker = configured ? '✅' : '⚠️ ';
          console.log(`\n  ${marker} ${netName}:`);

          for (const [key, value] of Object.entries(netConfig)) {
            if (key === 'name') continue; // Skip redundant name field
            const displayValue = (key.includes('secret') || key.includes('apiKey'))
              ? maskSecret(value)
              : value;
            console.log(`      ${key}: ${displayValue}`);
          }
        }
      }

      // Mostrar campos legacy si existen
      const legacyFields = Object.keys(config).filter(k => !['networks', 'defaultNetwork'].includes(k));
      if (legacyFields.length > 0) {
        console.log('\n⚠️  Legacy fields (consider migrating):');
        for (const key of legacyFields) {
          console.log(`  ${key}: ${config[key]}`);
        }
      }

      console.log('');
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

/**
 * 2) escrow config get <clave>
 */
configCmd
  .command('get <key>')
  .description('Muestra el valor actual de la clave de configuración <key>.')
  .action((key) => {
    try {
      const value = getConfigValue(key);
      if (value === undefined) {
        console.log(`La clave '${key}' no está definida.`);
        process.exit(1);
      }
      console.log(value);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });

/**
 * 3) escrow config set <key> <value>
 * Soporta notación con punto: testnet.apiKey
 */
configCmd
  .command('set <key> <value>')
  .description('Set a configuration value (supports network.key notation, e.g., testnet.apiKey)')
  .action((key, value) => {
    try {
      // Check if key uses network.field notation
      if (key.includes('.')) {
        const [network, field] = key.split('.');

        const validNetworks = ['testnet', 'mainnet'];
        if (!validNetworks.includes(network)) {
          console.error(`❌ Invalid network: ${network}`);
          console.error(`   Valid networks: ${validNetworks.join(', ')}`);
          console.error(`\n   Example: escrow config set testnet.apiKey <value>`);
          process.exit(1);
        }

        setNetworkConfig(network, field, value);
        const displayValue = (field.includes('secret') || field.includes('apiKey'))
          ? maskSecret(value)
          : value;
        console.log(`✅ Set ${network}.${field} = ${displayValue}`);
      } else {
        // Legacy flat key (for backwards compatibility)
        setConfigValue(key, value);
        console.log(`✅ Set ${key} = ${value}`);
        console.log('   Note: Consider using network.key notation (e.g., testnet.apiKey)');
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

/**
 * 4) escrow config unset <key>
 */
configCmd
  .command('unset <key>')
  .description('Remove a configuration key')
  .action((key) => {
    try {
      const existing = getConfigValue(key);
      if (existing === undefined) {
        console.log(`Key '${key}' does not exist.`);
        process.exit(0);
      }
      unsetConfigValue(key);
      console.log(`✅ Removed key '${key}' from configuration.`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

/**
 * Helper function to mask secrets for display
 */
function maskSecret(value) {
  if (!value || value.length < 8) return '***';
  return value.substring(0, 8) + '...';
}

module.exports = configCmd;
