// lib/commands/wallet.js

const { Command } = require('commander');
const {
  getDefaultNetwork,
  getWallets,
  getWallet,
  setWallet,
  removeWallet,
  setDefaultWallet,
  getDefaultWallet,
} = require('../utils/configManager');

/**
 * Acción para listar todas las wallets
 */
async function listAction(options) {
  try {
    const network = options.network || getDefaultNetwork() || 'testnet';
    const wallets = getWallets(network);
    const defaultWallet = getDefaultWallet(network);

    if (Object.keys(wallets).length === 0) {
      console.log(`\n📭 No wallets configured for ${network}\n`);
      console.log('Add a wallet with:');
      console.log(`  escrow wallet add <name> --public <key> --secret <key>\n`);
      return;
    }

    console.log(`\n💼 Wallets for ${network}:\n`);

    for (const [name, wallet] of Object.entries(wallets)) {
      const isDefault = defaultWallet && defaultWallet.publicKey === wallet.publicKey;
      const marker = isDefault ? '✓' : ' ';
      console.log(`  ${marker} ${name}`);
      console.log(`    Alias: ${wallet.alias}`);
      console.log(`    Public: ${wallet.publicKey}`);
      console.log(`    Secret: ${wallet.secretKey.substring(0, 8)}...${wallet.secretKey.substring(wallet.secretKey.length - 4)}`);
      if (isDefault) {
        console.log(`    (default)`);
      }
      console.log('');
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

/**
 * Acción para mostrar detalles de una wallet
 */
async function showAction(name, options) {
  try {
    const network = options.network || getDefaultNetwork() || 'testnet';
    const wallet = getWallet(network, name);

    if (!wallet) {
      console.error(`\n❌ Wallet '${name}' not found in ${network}\n`);
      console.log('Available wallets:');
      console.log(`  escrow wallet list\n`);
      process.exit(1);
    }

    const defaultWallet = getDefaultWallet(network);
    const isDefault = defaultWallet && defaultWallet.publicKey === wallet.publicKey;

    console.log(`\n💼 Wallet: ${name}\n`);
    console.log(`  Alias:      ${wallet.alias}`);
    console.log(`  Public Key: ${wallet.publicKey}`);
    console.log(`  Secret Key: ${wallet.secretKey.substring(0, 8)}...${wallet.secretKey.substring(wallet.secretKey.length - 4)}`);
    console.log(`  Network:    ${network}`);
    console.log(`  Default:    ${isDefault ? 'Yes ✓' : 'No'}`);
    console.log('');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

/**
 * Acción para agregar una wallet
 */
async function addAction(name, options) {
  try {
    const network = options.network || getDefaultNetwork() || 'testnet';

    if (!options.public || !options.secret) {
      console.error(`\n❌ Missing required options: --public and --secret\n`);
      console.log('Usage:');
      console.log(`  escrow wallet add ${name} --public <key> --secret <key> [--alias "My Wallet"]\n`);
      process.exit(1);
    }

    // Validar formato de las claves
    if (!/^G[A-Z0-9]{55}$/.test(options.public)) {
      throw new Error('Invalid Public Key format (must start with "G" and be 56 characters long)');
    }

    if (!/^S[A-Z0-9]{55}$/.test(options.secret)) {
      throw new Error('Invalid Secret Key format (must start with "S" and be 56 characters long)');
    }

    setWallet(network, name, {
      alias: options.alias || name,
      publicKey: options.public,
      secretKey: options.secret,
    });

    console.log(`\n✅ Wallet '${name}' added to ${network}`);
    console.log(`   Public Key: ${options.public}`);
    console.log(`   Alias: ${options.alias || name}\n`);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

/**
 * Acción para eliminar una wallet
 */
async function removeAction(name, options) {
  try {
    const network = options.network || getDefaultNetwork() || 'testnet';

    const wallet = getWallet(network, name);
    if (!wallet) {
      console.error(`\n❌ Wallet '${name}' not found in ${network}\n`);
      process.exit(1);
    }

    // Confirmar eliminación si no se usa --yes
    if (!options.yes) {
      console.log(`\n⚠️  About to remove wallet '${name}' from ${network}`);
      console.log(`   Public Key: ${wallet.publicKey}`);
      console.log('\n   This action cannot be undone.');
      console.log('\n   Use --yes to confirm, or Ctrl+C to cancel.\n');
      process.exit(0);
    }

    const removed = removeWallet(network, name);

    if (removed) {
      console.log(`\n✅ Wallet '${name}' removed from ${network}\n`);
    } else {
      console.error(`\n❌ Failed to remove wallet '${name}'\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

/**
 * Acción para establecer wallet por defecto
 */
async function setDefaultAction(name, options) {
  try {
    const network = options.network || getDefaultNetwork() || 'testnet';

    setDefaultWallet(network, name);

    console.log(`\n✅ Default wallet for ${network} set to '${name}'\n`);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

// Crear comando principal con subcomandos
const walletCmd = new Command('wallet')
  .description('Manage wallets for different networks');

// Subcomando: list
walletCmd
  .command('list')
  .description('List all wallets')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .action(listAction);

// Subcomando: show
walletCmd
  .command('show <name>')
  .description('Show details of a specific wallet')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .action(showAction);

// Subcomando: add
walletCmd
  .command('add <name>')
  .description('Add a new wallet')
  .requiredOption('--public <key>', 'Public key (G...)')
  .requiredOption('--secret <key>', 'Secret key (S...)')
  .option('--alias <alias>', 'Friendly name for the wallet')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .action(addAction);

// Subcomando: remove
walletCmd
  .command('remove <name>')
  .description('Remove a wallet')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .option('--yes', 'Skip confirmation prompt')
  .action(removeAction);

// Subcomando: set-default
walletCmd
  .command('set-default <name>')
  .description('Set default wallet for a network')
  .option('-n, --network <network>', 'Network: testnet or mainnet')
  .action(setDefaultAction);

module.exports = walletCmd;
