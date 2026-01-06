// lib/commands/test-multi-dispute.js

const { Command } = require('commander');
const { getConfig, getConfigWithWallet } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');
const axios = require('axios');
const { signTransaction } = require('../utils/signer');

async function testMultiDisputeAction(options) {
  try {
    console.log('\n🚀 Starting multi-release dispute test workflow...\n');

    // 1. Obtener configuraciones para ambas wallets
    const mainWallet = options.wallet || 'main';
    const resolverWallet = options.resolverWallet || 'resolver';

    const mainConfig = await getConfig({ ...options, wallet: mainWallet });
    const resolverConfig = await getConfigWithWallet(options, resolverWallet);

    const amount = options.amount ? parseInt(options.amount) : mainConfig.testDefaults.amount;

    console.log('Using configuration:');
    console.log(`  • Network: ${mainConfig.network}`);
    console.log(`  • Main wallet: ${mainWallet} (${mainConfig.publicKey.substring(0, 10)}...)`);
    console.log(`  • Resolver wallet: ${resolverWallet} (${resolverConfig.publicKey.substring(0, 10)}...)`);
    console.log(`  • Milestone amount: ${amount} stroops`);
    console.log('');

    // 2. Deploy multi-release escrow
    console.log('⏳ [1/5] Deploying multi-release escrow (main wallet)...');

    const deployPayload = {
      signer: mainConfig.publicKey,
      engagementId: 'TEST-MULTI-DISPUTE-' + Date.now(),
      title: 'Test Multi-Release Dispute',
      description: 'Automated dispute test workflow from CLI',
      roles: {
        approver: mainConfig.publicKey,
        serviceProvider: mainConfig.publicKey,
        platformAddress: mainConfig.publicKey,
        releaseSigner: mainConfig.publicKey,
        disputeResolver: resolverConfig.publicKey, // ⚡ Different wallet
      },
      platformFee: 5,
      milestones: [
        {
          description: 'Test milestone for dispute',
          status: 'pending',
          evidence: '',
          amount,
          receiver: mainConfig.publicKey,
          flags: {
            disputed: false,
            released: false,
            resolved: false,
            approved: false,
          },
        },
      ],
      trustline: {
        symbol: 'USDC',
        address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      },
    };

    const deployResponse = await axios.post(
      `${mainConfig.baseUrl}/deployer/multi-release`,
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
    console.log('⏳ [2/5] Funding escrow (main wallet)...');

    const fundResponse = await axios.post(
      `${mainConfig.baseUrl}/escrow/multi-release/fund-escrow`,
      {
        contractId,
        signer: mainConfig.publicKey,
        amount,
      },
      { headers: { 'x-api-key': mainConfig.apiKey, 'Content-Type': 'application/json' } }
    );

    const fundSignedXdr = signTransaction(
      fundResponse.data.unsignedTransaction,
      mainConfig.secretKey,
      mainConfig.networkPassphrase
    );

    await axios.post(
      `${mainConfig.baseUrl}/helper/send-transaction`,
      { signedXdr: fundSignedXdr },
      { headers: { 'x-api-key': mainConfig.apiKey, 'Content-Type': 'application/json' } }
    );

    console.log('✅ Escrow funded\n');

    // 4. Change milestone status
    console.log('⏳ [3/5] Changing milestone status to "completed" (main wallet)...');
    const mainApiClient = createApiClient(mainConfig);
    await mainApiClient.changeMilestoneStatus(contractId, 0, 'completed', 'Test evidence', mainConfig.publicKey, mainConfig.secretKey, false);
    console.log('✅ Status updated\n');

    // 5. Dispute milestone
    console.log('⏳ [4/5] Disputing milestone (main wallet)...');
    await mainApiClient.disputeMilestone(contractId, 0, mainConfig.publicKey, mainConfig.secretKey, false);
    console.log('✅ Dispute initiated\n');

    // 6. Resolve dispute (different wallet!)
    console.log('⏳ [5/5] Resolving dispute (resolver wallet)... ⚡');

    // Para multi-release milestone dispute, enviamos todo al receiver
    const distributions = [
      { address: mainConfig.publicKey, amount: amount },
    ];

    const resolverApiClient = createApiClient(resolverConfig);
    await resolverApiClient.resolveMilestoneDispute(
      contractId,
      0,
      resolverConfig.publicKey,
      distributions,
      resolverConfig.secretKey,
      false
    );

    console.log('✅ Dispute resolved');
    console.log(`   - Receiver: ${amount} stroops (100%)`);
    console.log('');

    console.log('🎉 Dispute test completed successfully!');
    console.log(`   Contract ID: ${contractId}`);
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

const testMultiDisputeCmd = new Command('test-multi-dispute')
  .description('Test complete multi-release dispute workflow (deploy → fund → change status → dispute → resolve)')
  .option('--amount <stroops>', 'Amount for milestone (default: from config)')
  .option('--wallet <name>', 'Main wallet to use (default: main)')
  .option('--resolver-wallet <name>', 'Resolver wallet to use (default: resolver)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(testMultiDisputeAction);

module.exports = testMultiDisputeCmd;
