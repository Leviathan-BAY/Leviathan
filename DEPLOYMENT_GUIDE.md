# hSUI Contract Deployment Guide for Testnet

## Prerequisites
1. Sui CLI installed
2. Wallet with testnet SUI
3. Testnet environment configured

## Step 1: Install Sui CLI
```bash
# For Windows (PowerShell as Administrator)
iwr -Uri https://github.com/MystenLabs/sui/releases/latest/download/sui-windows-x86_64.zip -OutFile sui.zip
Expand-Archive sui.zip -DestinationPath "C:\sui"
$env:PATH += ";C:\sui"
```

## Step 2: Configure Testnet Environment
```bash
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
```

## Step 3: Import Your Wallet (if needed)
```bash
# If you need to import your existing wallet
sui client import [your-private-key]

# Or create a new address and transfer SUI to it
sui client new-address secp256k1
# Then send SUI from your main wallet to this address
```

## Step 4: Deploy the Contract
```bash
cd packages/contracts
sui client publish --gas-budget 200000000
```

## Step 5: Update Frontend Constants
After successful deployment, update `frontend/src/contracts/constants.ts`:

```typescript
export const PACKAGE_ID = "[Package ID from deployment output]";
export const CONTRACT_OBJECTS = {
  HSUI_VAULT: "[HSuiVault object ID from deployment]",
  HSUI_ADMIN_CAP: "[AdminCap object ID from deployment]",
} as const;
```

## Expected Output Format
Look for output like:
```
Object Changes:
├── Package published at: 0x[PACKAGE_ID]
├── Created Object: 0x[VAULT_ID] (shared)  # This is HSUI_VAULT
└── Created Object: 0x[ADMIN_CAP_ID] (owned) # This is HSUI_ADMIN_CAP
```

## Testing
1. Update the constants.ts with the new addresses
2. Refresh the frontend application
3. Your 121 SUI on testnet should now be available for staking

## Troubleshooting
- Make sure you're on testnet network in your wallet
- Ensure you have enough SUI for gas fees (deployment costs ~0.1 SUI)
- Check that the contract compiled without errors