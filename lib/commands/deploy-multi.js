// lib/commands/deploy-multi.js

const { Command } = require('commander');
const axios = require('axios');
const { getConfig } = require('../utils/config');
const { signTransaction } = require('../utils/signer');

async function deployMultiAction(options) {
  try {
    // 1. Obtener configuración consolidada (con migración automática y validaciones)
    const config = await getConfig(options);

    // 2. Mostrar warning si es mainnet
    if (config.network === 'mainnet') {
      console.warn('\n⚠️  WARNING: Using MAINNET - Real funds will be used!');
      console.warn('   Make sure your configuration is correct!\n');
    }

    // 3. Mostrar info de la operación
    if (options.verbose) {
      console.log('🔍 Configuration:');
      console.log(`   Network: ${config.network}`);
      console.log(`   Environment: ${config.env}`);
      console.log(`   Base URL: ${config.baseUrl}`);
      console.log(`   Public Key: ${config.publicKey}`);
      console.log('');
    }

    // 4. Construir payload (Multi-Release structure)
    console.log(`⏳ Requesting unsigned XDR from ${config.baseUrl}/deployer/multi-release...`);

    const payload = {
      signer: config.publicKey,
      engagementId: 'ENG-MULTI-CLI-' + Date.now(),
      title: 'Multi-Release Escrow from CLI',
      description: 'Multi-release escrow created via Escrow-Maker CLI',
      roles: {
        approver: config.publicKey,
        serviceProvider: config.publicKey,
        platformAddress: config.publicKey,
        releaseSigner: config.publicKey,
        disputeResolver: config.publicKey,
        // Note: NO receiver field in multi-release (each milestone has its own)
      },
      platformFee: 5, // 5% (as percentage, not basis points)
      milestones: [
        {
          description: 'Phase 1: Design',
          status: 'pending',
          evidence: '',
          amount: 500, // Limited by dev API
          receiver: config.publicKey,
          flags: {
            disputed: false,
            released: false,
            resolved: false,
            approved: false,
          },
        },
        {
          description: 'Phase 2: Development',
          status: 'pending',
          evidence: '',
          amount: 500, // Limited by dev API
          receiver: config.publicKey,
          flags: {
            disputed: false,
            released: false,
            resolved: false,
            approved: false,
          },
        },
      ],
      trustline: {
        address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      },
    };

    // 5. Solicitar XDR sin firmar
    const deployEndpoint = `${config.baseUrl}/deployer/multi-release`;
    const axiosConfigDeploy = {
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (options.verbose) {
      console.log('📤 Payload being sent:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('');
    }

    let respuestaDeploy;
    try {
      respuestaDeploy = await axios.post(deployEndpoint, payload, axiosConfigDeploy);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      const errorDetails = err.response?.data || {};
      console.error('\n❌ API Error Details:');
      console.error(JSON.stringify(errorDetails, null, 2));
      throw new Error(`Failed to request unsigned XDR: ${errorMsg}`);
    }

    if (!respuestaDeploy.data || !respuestaDeploy.data.unsignedTransaction) {
      throw new Error('API did not return an unsignedTransaction field');
    }

    const xdrSinFirmar = respuestaDeploy.data.unsignedTransaction;
    console.log('✅ Unsigned XDR received.');

    // 6. Firmar la transacción
    console.log(`🔏 Signing transaction for ${config.network}...`);

    let xdrFirmado;
    try {
      xdrFirmado = signTransaction(xdrSinFirmar, config.secretKey, config.networkPassphrase);
    } catch (err) {
      throw new Error(`Failed to sign XDR: ${err.message}`);
    }

    if (options.verbose) {
      console.log('   Signed XDR:', xdrFirmado.substring(0, 50) + '...');
    }

    // 7. Enviar XDR firmado
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
        { signedXdr: xdrFirmado },
        axiosConfigSend
      );
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      throw new Error(`Failed to send signed XDR: ${errorMsg}`);
    }

    // 8. Verificar respuesta
    if (respuestaSend.data && respuestaSend.data.status) {
      console.log('\n✅ Transaction sent successfully!');
      console.log(`   Contract ID: ${respuestaSend.data.contractId}`);
      if (options.verbose && respuestaSend.data.escrow) {
        console.log(`   Escrow Data:`, respuestaSend.data.escrow);
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

const deployMultiCmd = new Command('deploy-multi')
  .description('Deploy a multi-release escrow (get unsigned XDR, sign it, and send it)')
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
  .option('--publicKey <key>', 'Override public key')
  .option('--secretKey <key>', 'Override secret key')
  .option('--apiKey <key>', 'Override API key')
  .option('-v, --verbose', 'Verbose output for debugging')
  .action(deployMultiAction);

module.exports = deployMultiCmd;
