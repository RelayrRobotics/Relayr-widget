import { parseAbi } from "viem";

export const ROBINHOOD_MAINNET_CHAIN_ID = 4663;

export const SPLITTER_ABI = parseAbi([
  "function pay(bytes32 sessionRef, address operator, uint256 amount)",
  "event Paid(bytes32 indexed sessionRef, address indexed payer, address indexed operator, uint256 amount, uint256 operatorAmount, uint256 stakersAmount, uint256 treasuryAmount, uint256 burnAmount)",
]);

export type CreateSessionInput = {
  operatorId: string;
  actionId: string;
};

export type CreateSessionResult = {
  reference: string;
  sessionRefBytes32: string;
  amount: number;
  amountRaw: string;
  recipient: string;
  operatorWallet: string;
  usdgContract: string;
  chainId: number;
  splitterAddress: string | null;
  mock: boolean;
  url: string;
};

export type ConfirmPayInput = {
  reference: string;
  txHash?: string;
};

export type ConfirmPayResult = {
  txSignature: string;
  explorerUrl: string;
  mock: boolean;
  payerAddress: string | null;
  accessToken: string | null;
  paidAction: { id: string; status: string };
};

export type RelayrPayClientOptions = {
  apiUrl: string;
  /** Optional fetch impl (defaults to global fetch) */
  fetch?: typeof fetch;
};

async function trpcMutation<T>(
  apiUrl: string,
  path: string,
  input: unknown,
  fetchImpl: typeof fetch,
): Promise<T> {
  const url = `${apiUrl.replace(/\/$/, "")}/${path}`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const body = (await res.json()) as {
    result?: { data?: { json?: T } };
    error?: { json?: { message?: string } };
  };
  if (!res.ok || body.error) {
    throw new Error(
      body.error?.json?.message ?? `tRPC ${path} failed (${res.status})`,
    );
  }
  return body.result?.data?.json as T;
}

export function createRelayrPayClient(options: RelayrPayClientOptions) {
  const fetchImpl = options.fetch ?? fetch;
  const apiUrl = options.apiUrl;

  return {
    createSession(input: CreateSessionInput) {
      return trpcMutation<CreateSessionResult>(
        apiUrl,
        "pay.createSession",
        input,
        fetchImpl,
      );
    },
    confirm(input: ConfirmPayInput) {
      return trpcMutation<ConfirmPayResult>(
        apiUrl,
        "pay.confirm",
        input,
        fetchImpl,
      );
    },
    payPageUrl(input: CreateSessionInput & { origin?: string }) {
      const origin = input.origin ?? (typeof location !== "undefined" ? location.origin : "");
      const q = new URLSearchParams({
        operatorId: input.operatorId,
        actionId: input.actionId,
      });
      return `${origin}/pay?${q.toString()}`;
    },
  };
}

/** Minimal DOM embed: mounts a link button to the hosted pay page. */
export function mountPayButton(
  el: HTMLElement,
  opts: {
    apiOrigin: string;
    operatorId: string;
    actionId: string;
    label?: string;
  },
): () => void {
  const a = document.createElement("a");
  a.href = `${opts.apiOrigin.replace(/\/$/, "")}/pay?operatorId=${opts.operatorId}&actionId=${opts.actionId}`;
  a.textContent = opts.label ?? "Pay with Relayr";
  a.rel = "noopener noreferrer";
  a.target = "_blank";
  a.style.cssText =
    "display:inline-flex;padding:0.75rem 1rem;background:#CCFF00;color:#000;font:600 14px/1 system-ui;border-radius:8px;text-decoration:none";
  el.appendChild(a);
  return () => a.remove();
}
