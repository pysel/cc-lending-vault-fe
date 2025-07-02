export interface Account {
  sessionAddress: string;
  adminAddress: string;
  accountAddress: string;
}

export interface TokenInfo {
  aggregatedAssetId: string;
  amount: string;
  assetType: string | string[];
  fiatValue: never;
}

export interface QuoteRequest {
  from: {
    account: {
      sessionAddress: string;
      adminAddress: string;
      accountAddress: string;
    };
    asset: {
      assetId: string;
    };
    amount: string;
  };
  to: {
    asset: {
      assetId: string;
    };
    account?: string; // Optional CAIP account ID for transfers to other accounts
    amount?: string; // Optional for quotes (used for exact output)
  };
}

export interface ChainOperation {
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
}

export interface Quote {
  id: string;
  account: Account;
  originToken: TokenInfo;
  destinationToken: TokenInfo;
  expirationTimestamp: string;
  tamperProofSignature: string;
  originChainsOperations: ChainOperation[];
  destinationChainOperation?: ChainOperation;
}

export interface QuoteStatus {
  quoteId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'REFUNDED';
  user: string;
  recipientAccountId: string;
  originChainOperations: {
    hash: string;
    chainId: number;
    explorerUrl: string;
  }[];
  destinationChainOperations: {
    hash: string;
    chainId: number;
    explorerUrl: string;
  }[];
}
