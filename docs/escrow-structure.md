# Escrow Structure Documentation

This document describes the data structures used by the Trustless Work Smart Escrow API.

## Important Note

**API vs Smart Contract:**
- The **API endpoints** use **camelCase** field names and numeric types for amounts
- The **smart contracts** (Rust/Soroban) use **snake_case** field names and string types
- This documentation describes the **API format** that you use when making requests

## Overview

There are two types of escrow contracts:
- **Single-Release**: One total amount released upon completion of all milestones
- **Multi-Release**: Each milestone has its own amount released independently

---

## Single-Release Escrow

### Main Structure

```json
{
  "signer": "Address",
  "engagementId": "string",
  "title": "string",
  "description": "string",
  "roles": { ... },
  "amount": "number",
  "platformFee": "number",
  "milestones": [ ... ],
  "trustline": { ... }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signer` | Address | ✅ | Account that will sign the transaction |
| `engagementId` | string | ✅ | Unique identifier for the engagement |
| `title` | string | ✅ | Name of the escrow arrangement |
| `description` | string | ✅ | Detailed description of the work |
| `roles` | Roles | ✅ | All participant addresses |
| `amount` | number | ✅ | Total amount in escrow (e.g., 100000000 for 10 USDC) |
| `platformFee` | number | ✅ | Platform fee as percentage (e.g., 5 = 5%, max 99) |
| `milestones` | Milestone[] | ✅ | Array of milestones (description only) |
| `trustline` | Trustline | ✅ | Asset/token information |

### Roles Structure

```json
{
  "approver": "Address",
  "serviceProvider": "Address",
  "platformAddress": "Address",
  "releaseSigner": "Address",
  "disputeResolver": "Address",
  "receiver": "Address"
}
```

| Role | Description |
|------|-------------|
| `approver` | Who approves milestone completion |
| `serviceProvider` | Who provides the service |
| `platformAddress` | Platform wallet for fees |
| `releaseSigner` | Who can sign fund releases |
| `disputeResolver` | Who resolves disputes |
| `receiver` | **Single payment receiver for all funds** |

### Milestone Structure (Single-Release)

```json
{
  "description": "string",
  "status": "string",
  "evidence": "string",
  "approved": "bool"
}
```

**Note:** In single-release, milestones do NOT have individual amounts or receivers.

---

## Multi-Release Escrow

### Main Structure

```json
{
  "signer": "Address",
  "engagementId": "string",
  "title": "string",
  "description": "string",
  "roles": { ... },
  "platformFee": "number",
  "milestones": [ ... ],
  "trustline": { ... }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signer` | Address | ✅ | Account that will sign the transaction |
| `engagementId` | string | ✅ | Unique identifier for the engagement |
| `title` | string | ✅ | Name of the escrow arrangement |
| `description` | string | ✅ | Detailed description of the work |
| `roles` | Roles | ✅ | All participant addresses (NO receiver here) |
| `platformFee` | number | ✅ | Platform fee as percentage (e.g., 5 = 5%, max 99) |
| `milestones` | Milestone[] | ✅ | Array of milestones (each with amount) |
| `trustline` | Trustline | ✅ | Asset/token information |

**Key Difference:** NO `amount` field at escrow level, NO `receiver` in roles.

### Roles Structure (Multi-Release)

```json
{
  "approver": "Address",
  "serviceProvider": "Address",
  "platformAddress": "Address",
  "releaseSigner": "Address",
  "disputeResolver": "Address"
}
```

**Note:** No `receiver` field - each milestone has its own receiver.

### Milestone Structure (Multi-Release)

```json
{
  "description": "string",
  "status": "string",
  "evidence": "string",
  "amount": "number",
  "receiver": "Address",
  "flags": {
    "disputed": "boolean",
    "released": "boolean",
    "resolved": "boolean",
    "approved": "boolean"
  }
}
```

**Key Additions:**
- `amount`: Payment for this specific milestone (number, e.g., 30000000)
- `receiver`: Payment recipient for this milestone
- `flags`: Status flags for tracking milestone state

---

## Common Structures

### Trustline

```json
{
  "address": "Address"
}
```

The Stellar asset contract address (e.g., USDC token address).

### Flags (Multi-Release only)

```json
{
  "disputed": "bool",
  "released": "bool",
  "resolved": "bool",
  "approved": "bool"
}
```

---

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text string | `"Website Development"` |
| `number` | JavaScript number | `100000000` (10 USDC with 7 decimals) |
| `boolean` | Boolean | `true` or `false` |
| `Address` | Stellar address | `"GB6MP3L6UGIDY6O6..."` |

---

## Amount Calculation

Amounts are typically in stroops (smallest unit):

```
amount = value × 10^decimals
```

**Example for USDC (7 decimals):**
- 10 USDC = `100000000` stroops
- 0.5 USDC = `5000000` stroops

---

## Platform Fee

Platform fee is a percentage value (0-99):

```
platformFee = percentage value (0-99)
```

**Examples:**
- 5% fee = `5`
- 2.5% fee = `2.5`
- 0.1% fee = `0.1`
- 10% fee = `10`

**Note:** The API accepts percentages and converts them to basis points internally (e.g., 5 → 500 basis points).

---

## Key Differences Summary

| Feature | Single-Release | Multi-Release |
|---------|----------------|---------------|
| **Total amount** | ✅ In Escrow.amount | ❌ Sum of milestone amounts |
| **Receiver** | ✅ In Roles.receiver | ❌ Per milestone |
| **Milestone amount** | ❌ No | ✅ Yes |
| **Milestone receiver** | ❌ No | ✅ Yes |
| **Milestone flags** | ❌ No | ✅ Yes |

---

## Example Use Cases

### Single-Release
Best for projects where:
- Payment is made once upon full completion
- All funds go to the same receiver
- Milestones are tracking phases, not separate payments

**Example:** Fixed-price website development with phases but one final payment.

### Multi-Release
Best for projects where:
- Staged payments upon each milestone completion
- Different receivers per milestone (e.g., different contractors)
- Independent release of funds per phase

**Example:** Large project with multiple contractors or phases requiring separate payments.

---

## API Endpoints

### Single-Release
- **Deploy:** `POST /deployer/single-release`
- **Branch:** `single-release-develop`

### Multi-Release
- **Deploy:** `POST /deployer/multi-release`
- **Branch:** `multi-release-develop`

---

## CLI Workflow Commands

The Escrow Maker CLI provides automated workflow commands for testing:

### Single-Release Workflows
- **`escrow test-single-release`**: Full happy path (deploy → fund → change-status → approve → release)
- **`escrow test-single-dispute`**: Dispute flow using 2 wallets (deploy → fund → dispute → resolve)

### Multi-Release Workflows
- **`escrow test-multi-release`**: Process multiple milestones (deploy → fund → process each milestone)
- **`escrow test-multi-dispute`**: Multi-release with dispute using 2 wallets

All workflows use default values from configuration (`~/.escrow/config.json`) and can be customized with CLI flags.

---

## API Environment Limitations

### Dev Environment (`dev.api.trustlesswork.com`)

**Important:** The dev environment has operational limits:

- **Fund amount limit**: ~1000 stroops per fund operation
- **Recommended defaults**: Use amounts ≤ 1000 for testing
- **Error handling**: Larger amounts may return misleading errors (e.g., "Invalid milestone index")

**Recommended defaults for dev:**
```json
{
  "testDefaults": {
    "amount": 1000,
    "multiAmounts": "500,500"
  }
}
```

### Production Environment (`api.trustlesswork.com`)

No known operational limits - use realistic amounts based on your use case.

---

## Notes

1. **Addresses must be valid Stellar addresses** starting with 'G'
2. **All amounts are i128** to support large values
3. **Memo is i128** for compatibility with Stellar memos
4. **Status** field typically: "pending", "completed", "disputed"
5. **Evidence** is initially empty, filled upon milestone completion
6. **Dev environment**: Use small amounts (≤1000) for testing to avoid API limits
