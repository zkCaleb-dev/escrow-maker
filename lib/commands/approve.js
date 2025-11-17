// lib/commands/approve.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');

async function approveAction(contractId, options) {
  try {
    const config = await getConfig(options);
    const milestoneIndex = options.milestone !== undefined ? options.milestone : config.testDefaults.milestoneIndex;

    if (options.verbose) {
      console.log('\n🔍 Approving milestone:');
      console.log(`   Contract ID: ${contractId}`);
      console.log(`   Milestone Index: ${milestoneIndex}`);
      console.log(`   Approver: ${config.publicKey}`);
      console.log('');
    }

    console.log(`⏳ Approving milestone ${milestoneIndex}...`);

    const apiClient = createApiClient(config);
    const result = await apiClient.approveMilestone(
      contractId,
      milestoneIndex,
      config.publicKey,
      config.secretKey,
      options.verbose
    );

    console.log(`\n✅ Milestone ${milestoneIndex} approved successfully!\n`);

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const approveCmd = new Command('approve')
  .description('Approve a milestone')
  .argument('<contractId>', 'Contract ID')
  .option('--milestone <index>', 'Milestone index (default: 0)', parseInt)
  .option('--wallet <name>', 'Wallet to use (default: main)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(approveAction);

module.exports = approveCmd;
