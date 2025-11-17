// lib/commands/test-single-dispute.js

const { Command } = require('commander');
const { getConfig, getConfigWithWallet } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');
const axios = require('axios');
const { signTransaction } = require('../utils/signer');

async function testSingleDisputeAction(options) {
  try {
    console.log('\n🚀 Starting single-release dispute test workflow...\n');

    // 1. Obtener configuraciones para ambas wallets
    const mainWallet = options.wallet || 'main';
    const resolverWallet = options.resolverWallet || 'resolver';

    const mainConfig = await getConfig({ ...options, wallet: mainWallet });
    const resolverConfig = await getConfigWithWallet(options, resolverWallet);

    const amount = options.amount ? parseInt(options.amount) : mainConfig.testDefaults.amount;
    const split = options.split || mainConfig.testDefaults.disputeSplit;
    const [approverPct, receiverPct] = split.split(':').map(Number);

    console.log('Using configuration:');
    console.log(`  • Network: ${mainConfig.network}`);
    console.log(`  • Main wallet: ${mainWallet} (${mainConfig.publicKey.substring(0, 10)}...)`);
    console.log(`  • Resolver wallet: ${resolverWallet} (${resolverConfig.publicKey.substring(0, 10)}...)`);
    console.log(`  • Amount: ${amount} stroops (${amount / 10000000} USDC)`);
    console.log(`  • Dispute split: ${approverPct}% / ${receiverPct}%`);
    console.log('');

    // 2. Deploy escrow
    console.log('⏳ [1/4] Deploying escrow (main wallet)...');

    const deployPayload = {
      signer: mainConfig.publicKey,
      engagementId: 'TEST-DISPUTE-' + Date.now(),
      title: 'Test Single-Release Dispute',
      description: 'Automated dispute test workflow from CLI',
      roles: {
        approver: mainConfig.publicKey,
        serviceProvider: mainConfig.publicKey,
        platformAddress: mainConfig.publicKey,
        releaseSigner: mainConfig.publicKey,
        disputeResolver: resolverConfig.publicKey, // ⚡ Different wallet
        receiver: mainConfig.publicKey,
      },
      amount,
      platformFee: 5,
      milestones: [{
        description: 'Test milestone for dispute',
        status: 'pending',
        evidence: '',
        approved: false,
      }],
      trustline: {
        address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      },
    };

    const deployResponse = await axios.post(
      `${mainConfig.baseUrl}/deployer/single-release`,
      deployPayload,
      { headers: { 'x-api-key': mainConfig.apiKey, 'Content-Type': 'application/json' } }
    );

    const unsignedXdr = deployResponse.data.unsignedTransaction;
    const signedXdr = signTransaction(unsignedXdr, mainConfig.secretKey, mainConfig.networkPassphrase);

    const sendResponse = await axios.post(
      `${mainConfig.baseUrl}/helper/send-transaction`,
      { signedXdr },
      { headers: { 'x-api-key': mainConfig.apiKey, 'Content-Type': 'application/json' } }
    );

    const contractId = sendResponse.data.contractId;
    console.log(`✅ Contract deployed: ${contractId}\n`);

    // 3. Fund escrow
    console.log('⏳ [2/4] Funding escrow (main wallet)...');
    const mainApiClient = createApiClient(mainConfig);
    await mainApiClient.fundEscrow(contractId, mainConfig.publicKey, amount, mainConfig.secretKey, false);
    console.log('✅ Escrow funded\n');

    // 4. Dispute escrow
    console.log('⏳ [3/4] Disputing escrow (main wallet)...');
    await mainApiClient.disputeEscrow(contractId, mainConfig.publicKey, mainConfig.secretKey, false);
    console.log('✅ Dispute initiated\n');

    // 5. Resolve dispute (different wallet!)
    console.log('⏳ [4/4] Resolving dispute (resolver wallet)... ⚡');

    // Calcular distribución
    const approverAmount = Math.floor(amount * approverPct / 100);
    const receiverAmount = amount - approverAmount;

    const distributions = [
      { address: mainConfig.publicKey, amount: approverAmount },
      { address: mainConfig.publicKey, amount: receiverAmount },
    ];

    const resolverApiClient = createApiClient(resolverConfig);
    await resolverApiClient.resolveDispute(
      contractId,
      resolverConfig.publicKey,
      distributions,
      resolverConfig.secretKey,
      false
    );

    console.log('✅ Dispute resolved');
    console.log(`   - Approver: ${approverAmount} stroops (${approverPct}%)`);
    console.log(`   - Receiver: ${receiverAmount} stroops (${receiverPct}%)`);
    console.log('');

    console.log('🎉 Dispute test completed successfully!');
    console.log(`   Contract ID: ${contractId}`);
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const testSingleDisputeCmd = new Command('test-single-dispute')
  .description('Test complete single-release dispute workflow (deploy → fund → dispute → resolve)')
  .option('--amount <stroops>', 'Amount to fund (default: 100000000 = 10 USDC)')
  .option('--wallet <name>', 'Main wallet to use (default: main)')
  .option('--resolver-wallet <name>', 'Resolver wallet to use (default: resolver)')
  .option('--split <ratio>', 'Dispute split ratio like 30:70 (default: 50:50)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(testSingleDisputeAction);

module.exports = testSingleDisputeCmd;
