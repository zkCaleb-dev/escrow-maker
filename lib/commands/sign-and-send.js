// lib/commands/sign-and-send.js

const { Command } = require('commander');
const axios = require('axios');
const { getConfig } = require('../utils/config');
const { signTransaction } = require('../utils/signer');

async function signXdrAndSendAction(xdr, options) {
  try {
    // 1. Obtener configuración consolidada
    const config = await getConfig(options);

    // 2. Mostrar warning si es mainnet
    if (config.network === 'mainnet') {
      console.warn('\n⚠️  WARNING: Using MAINNET - Real funds will be used!');
      console.warn('   Make sure your configuration is correct!\n');
    }

    // 3. Mostrar info si verbose
    if (options.verbose) {
      console.log('🔍 Configuration:');
      console.log(`   Network: ${config.network}`);
      console.log(`   Network Passphrase: ${config.networkPassphrase}`);
      console.log(`   Base URL: ${config.baseUrl}`);
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

    if (options.verbose) {
      console.log('   Signed XDR:', signedXdr.substring(0, 50) + '...');
    }

    // 5. Enviar XDR firmado
    const sendEndpoint = `${config.baseUrl}/helper/send-transaction`;
    console.log(`⏳ Sending signed XDR to ${sendEndpoint}...`);

    const axiosConfigSend = {
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    };

    let respuestaSend;
    try {
      respuestaSend = await axios.post(
        sendEndpoint,
        { signedXdr },
        axiosConfigSend
      );
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      throw new Error(`Failed to send signed XDR: ${errorMsg}`);
    }

    // 6. Verificar respuesta
    if (respuestaSend.data && respuestaSend.data.status) {
      console.log('\n✅ Transaction sent successfully!');
      if (options.verbose && respuestaSend.data) {
        console.log('   Response:', respuestaSend.data);
      }
      console.log('');
    } else {
      throw new Error(`Transaction submission failed: ${JSON.stringify(respuestaSend.data)}`);
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const signAndSendCmd = new Command('sign-send')
  .description('Sign an XDR and send it to the network')
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
  .option('--baseUrl <url>', 'Override base URL')
  .option('--secretKey <key>', 'Override secret key')
  .option('--apiKey <key>', 'Override API key')
  .option('-v, --verbose', 'Verbose output for debugging')
  .action(signXdrAndSendAction);

module.exports = { signAndSendXdr: signAndSendCmd };
