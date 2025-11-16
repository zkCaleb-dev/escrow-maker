// lib/commands/network.js

const { Command } = require('commander');
const {
  getDefaultNetwork,
  setDefaultNetwork,
  getNetworkConfig,
  loadConfig,
} = require('../utils/configManager');

const networkCmd = new Command('network')
  .description('Manage network configurations (testnet/mainnet)');

/**
 * escrow network list
 * Lista todas las redes disponibles
 */
networkCmd
  .command('list')
  .alias('ls')
  .description('List all available networks')
  .action(() => {
    try {
      const config = loadConfig();
      const defaultNetwork = getDefaultNetwork();

      if (!config.networks || Object.keys(config.networks).length === 0) {
        console.log('No networks configured yet.');
        console.log('\nRun migration or configure networks manually:');
        console.log('  escrow config set testnet.apiKey <your-api-key>');
        return;
      }

      console.log('\nAvailable Networks:');
      console.log('==================\n');

      for (const [name, networkConfig] of Object.entries(config.networks)) {
        const isDefault = name === defaultNetwork;
        const marker = isDefault ? '* ' : '  ';
        const configured = networkConfig.apiKey && networkConfig.publicKey && networkConfig.secretKey;
        const status = configured ? '✅' : '⚠️ ';

        console.log(`${marker}${name} ${status}`);
        if (isDefault) {
          console.log(`    (default)`);
        }
        if (!configured) {
          console.log(`    (not fully configured)`);
        }
      }

      console.log('');
    } catch (err) {
      console.error('❌ Error listing networks:', err.message);
      process.exit(1);
    }
  });

/**
 * escrow network current
 * Muestra la red activa actual
 */
networkCmd
  .command('current')
  .description('Show the current active network')
  .action(() => {
    try {
      const defaultNetwork = getDefaultNetwork();

      if (!defaultNetwork) {
        console.log('No default network set. Using: testnet');
        return;
      }

      console.log(`\nCurrent network: ${defaultNetwork}`);

      const networkConfig = getNetworkConfig(defaultNetwork);
      const configured = networkConfig && networkConfig.apiKey && networkConfig.publicKey && networkConfig.secretKey;

      if (configured) {
        console.log('Status: ✅ Configured');
      } else {
        console.log('Status: ⚠️  Not fully configured');
        console.log('\nTo configure this network, run:');
        console.log(`  escrow config set ${defaultNetwork}.apiKey <your-api-key>`);
        console.log(`  escrow config set ${defaultNetwork}.publicKey <your-public-key>`);
        console.log(`  escrow config set ${defaultNetwork}.secretKey <your-secret-key>`);
      }

      console.log('');
    } catch (err) {
      console.error('❌ Error getting current network:', err.message);
      process.exit(1);
    }
  });

/**
 * escrow network use <name>
 * Cambia la red por defecto
 */
networkCmd
  .command('use <name>')
  .description('Set the default network (testnet or mainnet)')
  .action((name) => {
    try {
      const validNetworks = ['testnet', 'mainnet'];

      if (!validNetworks.includes(name)) {
        console.error(`❌ Invalid network: ${name}`);
        console.error(`   Valid networks: ${validNetworks.join(', ')}`);
        process.exit(1);
      }

      setDefaultNetwork(name);
      console.log(`✅ Default network set to: ${name}`);

      if (name === 'mainnet') {
        console.log('\n⚠️  WARNING: You have switched to MAINNET.');
        console.log('   Make sure your mainnet configuration is correct before deploying!');
        console.log('\n   To verify your configuration:');
        console.log(`     escrow config list mainnet`);
      }
    } catch (err) {
      console.error('❌ Error setting network:', err.message);
      process.exit(1);
    }
  });

/**
 * escrow network show <name>
 * Muestra la configuración de una red específica
 */
networkCmd
  .command('show <name>')
  .description('Show configuration for a specific network')
  .action((name) => {
    try {
      const networkConfig = getNetworkConfig(name);

      if (!networkConfig) {
        console.error(`❌ Network "${name}" not found.`);
        console.error('\nAvailable networks: testnet, mainnet');
        console.error('\nTo configure this network:');
        console.error(`  escrow config set ${name}.apiKey <your-api-key>`);
        process.exit(1);
      }

      console.log(`\nNetwork: ${name}`);
      console.log('='.repeat(50));
      console.log(`Network Passphrase: ${networkConfig.networkPassphrase || 'Not set'}`);
      console.log(`API Key:            ${networkConfig.apiKey ? maskSecret(networkConfig.apiKey) : 'Not set'}`);
      console.log(`Public Key:         ${networkConfig.publicKey || 'Not set'}`);
      console.log(`Secret Key:         ${networkConfig.secretKey ? maskSecret(networkConfig.secretKey) : 'Not set'}`);
      console.log(`Horizon URL:        ${networkConfig.horizonUrl || 'Not set'}`);
      console.log(`RPC URL:            ${networkConfig.rpcUrl || 'Not set'}`);
      console.log(`Base URL (Local):   ${networkConfig.baseUrlLocal || 'Not set'}`);
      console.log(`Base URL (Dev):     ${networkConfig.baseUrlDev || 'Not set'}`);
      console.log('');
    } catch (err) {
      console.error('❌ Error showing network:', err.message);
      process.exit(1);
    }
  });

/**
 * Enmascara secretos para mostrar solo los primeros caracteres
 */
function maskSecret(secret) {
  if (!secret || secret.length < 8) return '***';
  return secret.substring(0, 8) + '...';
}

module.exports = networkCmd;
