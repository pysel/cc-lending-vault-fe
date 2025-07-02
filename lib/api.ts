import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const quoteClient = {
  prepareCallQuote: async (request: PrepareCallRequest): Promise<TargetCallQuote> => {
    const response = await apiClient.post('/quotes/prepare-call-quote', request);
    return response.data;
  },
  fetchCallQuote: async (request: CallRequest): Promise<Quote> => {
    const response = await apiClient.post('/quotes/call-quote', request);
    return response.data;
  },
  executeQuote: async (quote: Quote): Promise<BundleResponse> => {
    const response = await apiClient.post('/quotes/execute-quote', quote);
    return response.data;
  },
  fetchTransactionHistory: async (accountAddress: string): Promise<HistoryResponse> => {
    const response = await apiClient.get(
      `/status/get-tx-history?limit=20&sortBy=createdAt&user=${accountAddress}`
    );
    return response.data;
  },
  getQuoteStatus: async (quoteId: string): Promise<QuoteStatus> => {
    const response = await apiClient.get(`/status/get-execution-status?quoteId=${quoteId}`);
    return response.data;
  },
};

// OneBalance Types
export type Hex = `0x${string}`;

export interface EvmAccount {
  accountAddress: Hex;
  sessionAddress: Hex;
  adminAddress: Hex;
}

export interface EvmCall {
  to: Hex;
  data: Hex;
  value: string;
}

export interface TokenRequirement {
  assetType: string;
  amount: string;
}

export interface TokenAllowanceRequirement {
  assetType: string;
  amount: string;
  spender: Hex;
}

export interface PrepareCallRequest {
  account: EvmAccount;
  targetChain: string; // CAIP-2
  calls: EvmCall[];
  tokensRequired: TokenRequirement[];
  allowanceRequirements?: TokenAllowanceRequirement[];
  // permits
  validAfter?: string;
  validUntil?: string;
}

export interface TargetCallQuote {
  chainOperation: {
    userOp: {
      sender: string;
      nonce: string;
      callData: string;
      callGasLimit: string;
      verificationGasLimit: string;
      preVerificationGas: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      paymaster: string;
      paymasterVerificationGasLimit: string;
      paymasterPostOpGasLimit: string;
      paymasterData: string;
      signature: string;
    };
    typedDataToSign: {
      domain: unknown;
      types: unknown;
      primaryType: string;
      message: unknown;
    };
    assetType: string;
    amount: string;
  };
  tamperProofSignature: string;
}

export interface CallRequest {
  fromAggregatedAssetId: string;
  account: EvmAccount;
  tamperProofSignature: string;
  chainOperation: {
    userOp: {
      sender: string;
      nonce: string;
      callData: string;
      callGasLimit: string;
      verificationGasLimit: string;
      preVerificationGas: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      paymaster: string;
      paymasterVerificationGasLimit: string;
      paymasterPostOpGasLimit: string;
      paymasterData: string;
      signature: string;
    };
    typedDataToSign: {
      domain: unknown;
      types: unknown;
      primaryType: string;
      message: unknown;
    };
    assetType: string;
    amount: string;
  };
}

export interface Quote {
  id: string;
  account: EvmAccount;
  originChainsOperations: any[];
  destinationChainOperation?: any;
  expirationTimestamp: string;
  tamperProofSignature: string;
}

export interface BundleResponse {
  success: boolean;
  error?: string;
}

export interface ChainOperation {
  hash: string;
  chainId: number;
  explorerUrl: string;
}

export interface QuoteStatus {
  quoteId: string;
  status: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'REFUNDED';
  };
  user: string;
  recipientAccountId: string;
  originChainOperations: ChainOperation[];
  destinationChainOperations: ChainOperation[];
}

export interface Transaction {
  quoteId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'REFUNDED';
  hash?: string;
  chainId?: number;
  explorerUrl?: string;
}

export interface HistoryResponse {
  transactions: Transaction[];
}
