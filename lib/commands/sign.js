// lib/commands/sign.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { signTransaction } = require('../utils/signer');

async function signXdrAction(xdr, options) {
  try {
    // 1. Obtener configuración consolidada
    const config = await getConfig(options);

    // 2. Mostrar warning si es mainnet
    if (config.network === 'mainnet') {
      console.warn('\n⚠️  WARNING: Signing for MAINNET\n');
    }

    // 3. Mostrar info si verbose
    if (options.verbose) {
      console.log('🔍 Configuration:');
      console.log(`   Network: ${config.network}`);
      console.log(`   Network Passphrase: ${config.networkPassphrase}`);
      console.log(`   Public Key: ${config.publicKey}`);
      console.log('');
    }

    // 4. Firmar localmente
    console.log(`🔏 Signing XDR for ${config.network}...`);

    let signedXdr;
    try {
      signedXdr = signTransaction(xdr, config.secretKey, config.networkPassphrase);
    } catch (err) {
      throw new Error(`Failed to sign XDR: ${err.message}`);
    }

    // 5. Mostrar XDR firmado
    console.log('\n✅ XDR signed successfully:\n');
    console.log(signedXdr);
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const signCmd = new Command('sign')
  .description('Sign an XDR using the configured secret key')
  .argument('<xdr>', 'Unsigned XDR string (base64)')
  .option(
    '--env <environment>',
    'Environment: "local" or "dev" (default: "dev")',
    'dev'
  )
  .option(
    '-n, --network <network>',
    'Network: testnet or mainnet (default: testnet)',
  )
  .option('--secretKey <key>', 'Override secret key for this execution')
  .option('-v, --verbose', 'Verbose output for debugging')
  .action(signXdrAction);

module.exports = { signXdr: signCmd };
