// lib/commands/fund.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');

async function fundAction(contractId, options) {
  try {
    // 1. Obtener configuración
    const config = await getConfig(options);

    // 2. Usar amount del flag o default
    const amount = options.amount || config.testDefaults.amount;

    // 3. Mostrar info
    if (options.verbose) {
      console.log('\n🔍 Configuration:');
      console.log(`   Network: ${config.network}`);
      console.log(`   Wallet: ${options.wallet || 'main'}`);
      console.log(`   Contract ID: ${contractId}`);
      console.log(`   Amount: ${amount} stroops`);
      console.log('');
    }

    console.log(`⏳ Funding escrow ${contractId}...`);

    // 4. Crear cliente API y ejecutar
    const apiClient = createApiClient(config);
    const result = await apiClient.fundEscrow(
      contractId,
      config.publicKey,
      amount,
      config.secretKey,
      options.verbose
    );

    console.log(`\n✅ Escrow funded successfully!`);
    if (result.contractId) {
      console.log(`   Contract ID: ${result.contractId}`);
    }
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const fundCmd = new Command('fund')
  .description('Fund an escrow contract')
  .argument('<contractId>', 'Contract ID to fund')
  .option('--amount <stroops>', 'Amount to fund (in stroops)')
  .option('--wallet <name>', 'Wallet to use (default: main)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(fundAction);

module.exports = fundCmd;
