#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

const deploySingleCmd = require('../lib/commands/deploy-single');
const deployMultiCmd = require('../lib/commands/deploy-multi');
const configCmd = require('../lib/commands/config');
const networkCmd = require('../lib/commands/network');
const walletCmd = require('../lib/commands/wallet');

const { signXdr: signCmd } = require('../lib/commands/sign');
const { signAndSendXdr: signAndSendCmd } = require('../lib/commands/sign-and-send');

// Individual commands
const fundCmd = require('../lib/commands/fund');
const approveCmd = require('../lib/commands/approve');
const changeStatusCmd = require('../lib/commands/change-status');

// Workflow commands
const testSingleReleaseCmd = require('../lib/commands/test-single-release');
const testSingleDisputeCmd = require('../lib/commands/test-single-dispute');

program
  .name('escrow')
  .version('1.0.0')
  .description('CLI "escrow" to interact with Trustless Work on Stellar');

// Configuration commands
program.addCommand(configCmd);
program.addCommand(networkCmd);
program.addCommand(walletCmd);

// Deploy commands
program.addCommand(deploySingleCmd);
program.addCommand(deployMultiCmd);

// Sign commands
program.addCommand(signCmd);
program.addCommand(signAndSendCmd);

// Individual operation commands
program.addCommand(fundCmd);
program.addCommand(approveCmd);
program.addCommand(changeStatusCmd);

// Workflow test commands
program.addCommand(testSingleReleaseCmd);
program.addCommand(testSingleDisputeCmd);

program.parse(process.argv);
