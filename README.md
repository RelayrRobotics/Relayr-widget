# @relayrrobotics/pay-widget

Drop-in helper for Relayr's **real** pay flow:

1. `pay.createSession` → Settlement Splitter address + session ref  
2. Approve USDG + `SettlementSplitter.pay(sessionRef, operator, amount)`  
3. `pay.confirm({ reference, txHash })` → robot fires + access token  

## Install

```bash
npm i @relayrrobotics/pay-widget viem
```

## Usage

```ts
import { createRelayrPayClient, SPLITTER_ABI } from "@relayrrobotics/pay-widget";

const pay = createRelayrPayClient({
  apiUrl: "https://api.relayr.tech", // or http://localhost:3030
});

const session = await pay.createSession({ operatorId, actionId });
// Use wagmi/viem walletClient to approve + writeContract(SPLITTER_ABI, "pay", ...)
const result = await pay.confirm({
  reference: session.reference,
  txHash,
});
```

Embed the hosted page: `/pay?operatorId=…&actionId=…`

## Network

Robinhood Chain **mainnet `4663`** only for production config.
