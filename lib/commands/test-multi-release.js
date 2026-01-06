// lib/commands/test-multi-release.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');
const axios = require('axios');
const { signTransaction } = require('../utils/signer');

async function testMultiReleaseAction(options) {
  try {
    console.log('\n🚀 Starting multi-release test workflow...\n');

    // 1. Obtener configuración
    const config = await getConfig(options);
    const amounts = (options.amounts || config.testDefaults.multiAmounts).split(',').map(Number);

    console.log('Using configuration:');
    console.log(`  • Network: ${config.network}`);
    console.log(`  • Wallet: ${options.wallet || 'main'}`);
    console.log(`  • Milestone amounts: ${amounts.join(', ')} stroops`);
    console.log('');

    // 2. Deploy multi-release escrow
    console.log('⏳ [1/7] Deploying multi-release escrow...');

    const deployPayload = {
      signer: config.publicKey,
      engagementId: 'TEST-MULTI-' + Date.now(),
      title: 'Test Multi-Release Escrow',
      description: 'Automated test workflow from CLI',
      roles: {
        approver: config.publicKey,
        serviceProvider: config.publicKey,
        platformAddress: config.publicKey,
        releaseSigner: config.publicKey,
        disputeResolver: config.publicKey,
        // Note: NO receiver in multi-release roles
      },
      platformFee: 5,
      milestones: amounts.map((amount, index) => ({
        description: `Test milestone ${index + 1}`,
        status: 'pending',
        evidence: '',
        amount,
        receiver: config.publicKey,
        flags: {
          disputed: false,
          released: false,
          resolved: false,
          approved: false,
        },
      })),
      trustline: {
        symbol: 'USDC',
        address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      },
    };

    const deployResponse = await axios.post(
      `${config.baseUrl}/deployer/multi-release`,
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

    // 3. Fund escrow (total amount)
    console.log('⏳ [2/7] Funding escrow...');
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);

    const fundResponse = await axios.post(
      `${config.baseUrl}/escrow/multi-release/fund-escrow`,
      {
        contractId,
        signer: config.publicKey,
        amount: totalAmount,
      },
      { headers: { 'x-api-key': config.apiKey, 'Content-Type': 'application/json' } }
    );

    const fundSignedXdr = signTransaction(
      fundResponse.data.unsignedTransaction,
      config.secretKey,
      config.networkPassphrase
    );

    await axios.post(
      `${config.baseUrl}/helper/send-transaction`,
      { signedXdr: fundSignedXdr },
      { headers: { 'x-api-key': config.apiKey, 'Content-Type': 'application/json' } }
    );

    console.log('✅ Escrow funded\n');

    const apiClient = createApiClient(config);

    // Process first milestone
    console.log('⏳ [3/7] Changing milestone 1 status to "completed"...');
    await apiClient.changeMilestoneStatus(contractId, 0, 'completed', 'Test evidence for milestone 1', config.publicKey, config.secretKey, false);
    console.log('✅ Status updated\n');

    console.log('⏳ [4/7] Approving milestone 1...');
    await apiClient.approveMilestone(contractId, 0, config.publicKey, config.secretKey, false);
    console.log('✅ Milestone approved\n');

    console.log('⏳ [5/7] Releasing milestone 1 funds...');
    await apiClient.releaseMilestoneFunds(contractId, 0, config.publicKey, config.secretKey, false);
    console.log('✅ Funds released for milestone 1\n');

    // Process second milestone (if exists)
    if (amounts.length > 1) {
      console.log('⏳ [6/7] Processing milestone 2...');
      await apiClient.changeMilestoneStatus(contractId, 1, 'completed', 'Test evidence for milestone 2', config.publicKey, config.secretKey, false);
      await apiClient.approveMilestone(contractId, 1, config.publicKey, config.secretKey, false);
      console.log('✅ Milestone 2 approved\n');

      console.log('⏳ [7/7] Releasing milestone 2 funds...');
      await apiClient.releaseMilestoneFunds(contractId, 1, config.publicKey, config.secretKey, false);
      console.log('✅ Funds released for milestone 2\n');
    }

    console.log('🎉 Test completed successfully!');
    console.log(`   Contract ID: ${contractId}`);
    console.log(`   Milestones processed: ${amounts.length}`);
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    if (err.response?.data) {
      console.error('API Error Details:');
      console.error(JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

const testMultiReleaseCmd = new Command('test-multi-release')
  .description('Test complete multi-release workflow (deploy → fund → approve milestones → release)')
  .option('--amounts <amounts>', 'Comma-separated amounts for milestones (default: from config)')
  .option('--wallet <name>', 'Wallet to use (default: main)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(testMultiReleaseAction);

module.exports = testMultiReleaseCmd;
