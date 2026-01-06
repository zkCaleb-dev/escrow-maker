// lib/commands/test-single-release.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');
const axios = require('axios');
const { signTransaction } = require('../utils/signer');

async function testSingleReleaseAction(options) {
  try {
    console.log('\n🚀 Starting single-release test workflow...\n');

    // 1. Obtener configuración
    const config = await getConfig(options);
    const amount = options.amount ? parseInt(options.amount) : config.testDefaults.amount;

    console.log('Using configuration:');
    console.log(`  • Network: ${config.network}`);
    console.log(`  • Wallet: ${options.wallet || 'main'}`);
    console.log(`  • Amount: ${amount} stroops (${amount / 10000000} USDC)`);
    console.log('');

    // 2. Deploy escrow
    console.log('⏳ [1/5] Deploying single-release escrow...');

    const deployPayload = {
      signer: config.publicKey,
      engagementId: 'TEST-SINGLE-' + Date.now(),
      title: 'Test Single-Release Escrow',
      description: 'Automated test workflow from CLI',
      roles: {
        approver: config.publicKey,
        serviceProvider: config.publicKey,
        platformAddress: config.publicKey,
        releaseSigner: config.publicKey,
        disputeResolver: config.publicKey,
        receiver: config.publicKey,
      },
      amount,
      platformFee: 5,
      milestones: [{
        description: 'Test milestone',
        status: 'pending',
        evidence: '',
        approved: false,
      }],
      trustline: {
        symbol: 'USDC',
        address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      },
    };

    const deployResponse = await axios.post(
      `${config.baseUrl}/deployer/single-release`,
      deployPayload,
      { headers: { 'x-api-key': config.apiKey, 'Content-Type': 'application/json' } }
    );

    const unsignedXdr = deployResponse.data.unsignedTransaction;
    const signedXdr = signTransaction(unsignedXdr, config.secretKey, config.networkPassphrase);

    const sendResponse = await axios.post(
      `${config.baseUrl}/helper/send-transaction`,
      { signedXdr },
      { headers: { 'x-api-key': config.apiKey, 'Content-Type': 'application/json' } }
    );

    const contractId = sendResponse.data.contractId;
    console.log(`✅ Contract deployed: ${contractId}\n`);

    // 3. Fund escrow
    console.log('⏳ [2/5] Funding escrow...');
    const apiClient = createApiClient(config);
    await apiClient.fundEscrow(contractId, config.publicKey, amount, config.secretKey, false);
    console.log('✅ Escrow funded\n');

    // 4. Change milestone status
    console.log('⏳ [3/5] Changing milestone status to "completed"...');
    await apiClient.changeMilestoneStatus(contractId, 0, 'completed', 'Test evidence', config.publicKey, config.secretKey, false);
    console.log('✅ Status updated\n');

    // 5. Approve milestone
    console.log('⏳ [4/5] Approving milestone...');
    await apiClient.approveMilestone(contractId, 0, config.publicKey, config.secretKey, false);
    console.log('✅ Milestone approved\n');

    // 6. Release funds
    console.log('⏳ [5/5] Releasing funds...');
    await apiClient.releaseFunds(contractId, config.publicKey, config.secretKey, false);
    console.log('✅ Funds released\n');

    console.log('🎉 Test completed successfully!');
    console.log(`   Contract ID: ${contractId}`);
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const testSingleReleaseCmd = new Command('test-single-release')
  .description('Test complete single-release workflow (deploy → fund → approve → release)')
  .option('--amount <stroops>', 'Amount to fund (default: 100000000 = 10 USDC)')
  .option('--wallet <name>', 'Wallet to use (default: main)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(testSingleReleaseAction);

module.exports = testSingleReleaseCmd;
