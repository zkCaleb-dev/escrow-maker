# Escrow Maker

A professional CLI tool to interact with Trustless Work on the Stellar blockchain. Supports both **testnet** and **mainnet** with easy network switching.

## Features

- 🌐 **Multi-network support**: Testnet and Mainnet
- 🔑 **Separate configurations** per network
- 🚀 **Simple network switching** with `-n` flag
- 📦 **Auto-migration** from old config format
- ✅ **Professional CLI** following industry best practices
- 🔒 **Secure configuration** storage with proper file permissions

---

## Installation (Global)

```bash
npm install -g .
```

---

## Quick Start

### 1. Configure Testnet (Development)

```bash
# Configure API credentials for testnet
escrow config set testnet.apiKey "your-testnet-api-key"
escrow config set testnet.publicKey "GB..."
escrow config set testnet.secretKey "SB..."

# Set default network
escrow network use testnet
```

### 2. Configure Mainnet (Production)

```bash
# Configure API credentials for mainnet
escrow config set mainnet.apiKey "your-mainnet-api-key"
escrow config set mainnet.publicKey "GB..."
escrow config set mainnet.secretKey "SB..."

# Switch to mainnet
escrow network use mainnet
```

### 3. Deploy an Escrow

```bash
# Deploy to testnet (default)
escrow deploy-single --env dev

# Deploy to mainnet (with -n flag)
escrow deploy-single --env dev -n mainnet
```

---

## Commands

### Network Management

Manage Stellar networks (testnet/mainnet):

```bash
# List all configured networks
escrow network list

# Show current active network
escrow network current

# Switch default network
escrow network use testnet
escrow network use mainnet

# Show configuration for a specific network
escrow network show testnet
escrow network show mainnet
```

### Configuration Management

Configure credentials and URLs per network:

```bash
# Set values using network.key notation
escrow config set testnet.apiKey "key-testnet"
escrow config set testnet.publicKey "GB..."
escrow config set testnet.secretKey "SB..."
escrow config set testnet.baseUrlDev "https://dev.api.trustlesswork.com"

escrow config set mainnet.apiKey "key-mainnet"
escrow config set mainnet.publicKey "GB..."
escrow config set mainnet.secretKey "SB..."
escrow config set mainnet.baseUrlDev "https://api.trustlesswork.com"

# List all configuration
escrow config list

# List configuration for a specific network
escrow config list testnet
escrow config list mainnet

# Get a specific value
escrow config get testnet.apiKey

# Remove a value
escrow config unset testnet.apiKey
```

### Deploy Commands

Deploy escrow contracts to Stellar:

```bash
# Deploy single-release escrow
escrow deploy-single [options]

# Deploy multi-release escrow
escrow deploy-multi [options]

# Options:
#   --env <environment>   Environment: "local" or "dev" (default: "local")
#   -n, --network <net>   Network: testnet or mainnet (default: testnet)
#   --baseUrl <url>       Override base URL
#   --apiKey <key>        Override API key
#   --publicKey <key>     Override public key
#   --secretKey <key>     Override secret key
#   -v, --verbose         Verbose output for debugging
```

**Examples:**

```bash
# Deploy to testnet dev environment (default)
escrow deploy-single --env dev

# Deploy to mainnet dev environment
escrow deploy-single --env dev -n mainnet

# Deploy with verbose output
escrow deploy-single --env dev -v

# Deploy with temporary API key override
escrow deploy-single --env dev --apiKey "temp-key"
```

### Signing Commands

Sign and send XDR transactions:

```bash
# Sign an XDR (without sending)
escrow sign <xdr> [options]

# Sign and send an XDR
escrow sign-send <xdr> [options]

# Options:
#   --env <environment>   Environment: "local" or "dev" (default: "local")
#   -n, --network <net>   Network: testnet or mainnet (default: testnet)
#   --secretKey <key>     Override secret key
#   --apiKey <key>        Override API key (for sign-send)
#   -v, --verbose         Verbose output for debugging
```

**Examples:**

```bash
# Sign XDR for testnet
escrow sign "AAAAAgAAAAC..."

# Sign XDR for mainnet
escrow sign "AAAAAgAAAAC..." -n mainnet

# Sign and send to testnet
escrow sign-send "AAAAAgAAAAC..." --env dev

# Sign and send to mainnet
escrow sign-send "AAAAAgAAAAC..." --env dev -n mainnet
```

---

## Configuration Structure

Your configuration is stored in `~/.escrow/config.json` with the following structure:

```json
{
  "networks": {
    "testnet": {
      "name": "testnet",
      "networkPassphrase": "Test SDF Network ; September 2015",
      "apiKey": "your-testnet-api-key",
      "publicKey": "GB...",
      "secretKey": "SB...",
      "horizonUrl": "https://horizon-testnet.stellar.org",
      "rpcUrl": "",
      "baseUrlLocal": "http://localhost:3000",
      "baseUrlDev": "https://dev.api.trustlesswork.com"
    },
    "mainnet": {
      "name": "mainnet",
      "networkPassphrase": "Public Global Stellar Network ; September 2015",
      "apiKey": "your-mainnet-api-key",
      "publicKey": "GB...",
      "secretKey": "SB...",
      "horizonUrl": "https://horizon.stellar.org",
      "rpcUrl": "",
      "baseUrlLocal": "http://localhost:3000",
      "baseUrlDev": "https://api.trustlesswork.com"
    }
  },
  "defaultNetwork": "testnet"
}
```

---

## Configuration Hierarchy

The CLI uses the following priority order for configuration:

1. **CLI flags** (highest priority)
   ```bash
   escrow deploy-single --apiKey "override-key"
   ```

2. **Environment variables**
   ```bash
   export ESCROW_NETWORK=mainnet
   export ESCROW_API_KEY=your-api-key
   ```

3. **Config file** (`~/.escrow/config.json`)

4. **Defaults** (lowest priority)

---

## Environment Variables

You can use environment variables for CI/CD or temporary overrides:

```bash
# Set network
export ESCROW_NETWORK=mainnet

# Set credentials
export ESCROW_API_KEY=your-api-key
export ESCROW_PUBLIC_KEY=GB...
export ESCROW_SECRET_KEY=SB...

# Now commands will use these values
escrow deploy-single --env dev
```

---

## Migration from Old Config

If you have an old configuration format, it will be automatically migrated on first use:

- A backup is created at `~/.escrow/config.json.backup`
- Old values are moved to the "testnet" network
- Mainnet configuration is initialized empty

You'll see a message like:

```
✅ Configuration migrated successfully!
   Backup saved to: ~/.escrow/config.json.backup
   Your existing values were moved to "testnet" network.

   To configure mainnet:
     escrow config set mainnet.apiKey <your-api-key>
     escrow config set mainnet.publicKey <your-public-key>
     escrow config set mainnet.secretKey <your-secret-key>
```

---

## Verbose Mode

Use `-v` or `--verbose` flag to see detailed information:

```bash
escrow deploy-single --env dev -v
```

Output includes:
- Network being used
- Network passphrase
- Base URL
- Public key
- Signed XDR preview
- Full response data

---

## Security Best Practices

1. **Never commit** your `~/.escrow/config.json` file
2. **Use different keys** for testnet and mainnet
3. **Verify network** before deploying (`escrow network current`)
4. **Test on testnet** before deploying to mainnet
5. **Use verbose mode** (`-v`) to verify configuration before important operations

---

## Troubleshooting

### Check Current Configuration

```bash
# See all configuration
escrow config list

# See specific network
escrow config list testnet
escrow config list mainnet

# See active network
escrow network current
```

### Verify Network Before Deploy

```bash
# Always check which network is active
escrow network current

# If wrong network, switch it
escrow network use testnet
```

### Reset Configuration

```bash
# Remove all configuration
rm ~/.escrow/config.json

# Reconfigure from scratch
escrow config set testnet.apiKey "..."
```

---

## Examples

### Complete Setup for Testnet

```bash
# Install globally
npm install -g .

# Configure testnet
escrow config set testnet.apiKey "testnet-api-key-123"
escrow config set testnet.publicKey "GB6MP3L6UGIDY6O6..."
escrow config set testnet.secretKey "SBP7A6FN62JIOSPN7..."
escrow config set testnet.baseUrlDev "https://dev.api.trustlesswork.com"

# Set testnet as default
escrow network use testnet

# Verify configuration
escrow config list testnet

# Deploy escrow to testnet
escrow deploy-single --env dev -v
```

### Complete Setup for Mainnet

```bash
# Configure mainnet (separate from testnet!)
escrow config set mainnet.apiKey "mainnet-api-key-456"
escrow config set mainnet.publicKey "GA..."
escrow config set mainnet.secretKey "SA..."
escrow config set mainnet.baseUrlDev "https://api.trustlesswork.com"

# Verify mainnet configuration
escrow config list mainnet

# Deploy to mainnet (will show warning)
escrow deploy-single --env dev -n mainnet

# Or set mainnet as default
escrow network use mainnet
escrow deploy-single --env dev
```

### Using Both Networks

```bash
# Deploy to testnet (using default)
escrow deploy-single --env dev

# Deploy to mainnet (override with flag)
escrow deploy-single --env dev -n mainnet

# Switch default to mainnet
escrow network use mainnet

# Now deploys to mainnet by default
escrow deploy-single --env dev

# But can still override to testnet
escrow deploy-single --env dev -n testnet
```

---

## Contributing

Issues and pull requests welcome at: https://github.com/zkCaleb-dev/Escrow-Maker

---

## License

ISC

---

## Author

zkCaleb-dev
