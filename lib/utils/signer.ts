import { ConnectedWallet } from '@privy-io/react-auth';
import { Quote } from '../api';
import { Address, createWalletClient, custom, Hash } from 'viem';

// Define ChainOperation type to match the structure used in the API
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

export const signTypedDataWithPrivy =
  (embeddedWallet: ConnectedWallet) =>
  async (typedData: any): Promise<Hash> => {
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      transport: custom(provider),
      account: embeddedWallet.address as Address,
    });

    return walletClient.signTypedData(typedData);
  };

/**
 * Signs a chain operation for OneBalance using Privy's EIP-1193 provider
 * @param chainOperation - The chain operation to sign
 * @param wallet - The Privy ConnectedWallet
 * @returns The signed chain operation
 */
export const signOperation =
  (embeddedWallet: ConnectedWallet) =>
  (operation: ChainOperation): (() => Promise<ChainOperation>) =>
  async () => {
    const signature = await signTypedDataWithPrivy(embeddedWallet)(operation.typedDataToSign);

    return {
      ...operation,
      userOp: { ...operation.userOp, signature },
    };
  };

/**
 * Alternative signing method for typed data if needed
 */
export async function signTypedData(wallet: ConnectedWallet, typedData: any): Promise<string> {
  try {
    // Get the EIP-1193 provider from Privy wallet
    const provider = await wallet.getEthereumProvider();

    // Use eth_signTypedData_v4 method for EIP-712 typed data signing
    const signature = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [wallet.address, JSON.stringify(typedData)],
    });

    return signature;
  } catch (error) {
    console.error('Error signing typed data:', error);
    throw new Error('Failed to sign typed data');
  }
}

export const signQuote = async (quote: Quote, embeddedWallet: ConnectedWallet) => {
  const signWithEmbeddedWallet = signOperation(embeddedWallet);

  const signedQuote = {
    ...quote,
  };

  signedQuote.originChainsOperations = await sequentialPromises(
    quote.originChainsOperations.map(signWithEmbeddedWallet)
  );

  if (quote.destinationChainOperation) {
    signedQuote.destinationChainOperation = await signWithEmbeddedWallet(
      quote.destinationChainOperation
    )();
  }

  return signedQuote;
};

// Helper to run an array of lazy promises in sequence
export const sequentialPromises = (promises: (() => Promise<any>)[]): Promise<any[]> => {
  return promises.reduce<Promise<any[]>>(
    (acc, curr) => acc.then(results => curr().then(result => [...results, result])),
    Promise.resolve([])
  );
};
