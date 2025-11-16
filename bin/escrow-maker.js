#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

const deploySingleCmd = require('../lib/commands/deploy-single');
const deployMultiCmd = require('../lib/commands/deploy-multi');
const configCmd = require('../lib/commands/config');
const networkCmd = require('../lib/commands/network');

const { signXdr: signCmd } = require('../lib/commands/sign');
const { signAndSendXdr: signAndSendCmd } = require('../lib/commands/sign-and-send');

program
  .name('escrow')
  .version('1.0.0')
  .description('CLI "escrow" to interact with Trustless Work on Stellar');

program.addCommand(configCmd);
program.addCommand(networkCmd);

program.addCommand(deploySingleCmd);
program.addCommand(deployMultiCmd);

program.addCommand(signCmd);
program.addCommand(signAndSendCmd);

program.parse(process.argv);
