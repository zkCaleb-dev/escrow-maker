// lib/commands/change-status.js

const { Command } = require('commander');
const { getConfig } = require('../utils/config');
const { createApiClient } = require('../utils/apiClient');

async function changeStatusAction(contractId, options) {
  try {
    const config = await getConfig(options);
    const milestoneIndex = options.milestone !== undefined ? options.milestone : config.testDefaults.milestoneIndex;
    const status = options.status || 'completed';
    const evidence = options.evidence || `Evidence for milestone ${milestoneIndex}`;

    console.log(`⏳ Changing milestone ${milestoneIndex} status to '${status}'...`);

    const apiClient = createApiClient(config);
    await apiClient.changeMilestoneStatus(
      contractId,
      milestoneIndex,
      status,
      evidence,
      config.publicKey,
      config.secretKey,
      options.verbose
    );

    console.log(`\n✅ Milestone ${milestoneIndex} status changed to '${status}'\n`);

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

const changeStatusCmd = new Command('change-status')
  .description('Change milestone status')
  .argument('<contractId>', 'Contract ID')
  .option('--milestone <index>', 'Milestone index (default: 0)', parseInt)
  .option('--status <status>', 'New status (default: completed)')
  .option('--evidence <evidence>', 'Evidence URL or text')
  .option('--wallet <name>', 'Wallet to use (default: main)')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--env <environment>', 'Environment: local or dev (default: dev)', 'dev')
  .option('-v, --verbose', 'Verbose output')
  .action(changeStatusAction);

module.exports = changeStatusCmd;
