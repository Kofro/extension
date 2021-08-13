export type TProvider = {
  generateWallet: () => TGenerateAddress | null
  validateAddress?: (address: string) => boolean
  importPrivateKey?: (privateKey: string) => string | null
  getExplorerLink?: (address: string) => string
  getTransactionLink?: (hash: string) => string
  importRecoveryPhrase?: (recoveryPhrase: string) => TGenerateAddress | null
  generateExtraId?: () => string
  getStandingFee?: () => number
}

export type TCreateTransactionProps = {
  from: string
  to: string
  amount: number
  privateKey: string
  symbol: string
  tokenChain?: string
  outputs?: UnspentOutput[]
  networkFee?: number
  gas?: number
  chainId?: number
  gasPrice?: string
  nonce?: number
  contractAddress?: string
  xrpTxData?: {
    fee: string
    sequence: number
    maxLedgerVersion: number
  }
  extraId?: string
}

export interface IGetFeeParams {
  symbol: string
  addressFrom: string
  addressTo: string
  chain: string
  amount: string
  tokenChain?: string
  btcLikeParams: TBtcLikeFeeParams
  ethLikeParams: TEthLikeFeeParams
}

export type TBtcLikeFeeParams = {
  outputs: UnspentOutput[]
  feePerByte: number
}

export type TEthLikeFeeParams = {
  contractAddress?: string
  decimals?: number
  gasPrice: number
}

export type TGetFeeData = {
  networkFee?: number
  utxos?: UnspentOutput[] | CardanoUnspentTxOutput[]
  currencyBalance?: number
}