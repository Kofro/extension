import { v4 } from 'uuid'

// Utils
import { validateWallet } from '@utils/validate'
import { toLower } from '@utils/format'
import { encrypt } from '@utils/crypto'

// Config
import { getCurrency, getCurrencyByChain } from '@config/currencies'
import { getToken } from '@config/tokens'

export interface IWallet {
  symbol: string
  balance?: number
  balance_btc?: number
  address: string
  uuid: string
  privateKey?: string
  chain?: string
  name?: string
  contractAddress?: string
  decimals?: number
  createdAt?: Date
  isHidden?: boolean
}

const sortByBalance = (a: IWallet, b: IWallet, isAscending: boolean) => {
  return isAscending
    ? Number(a.balance_btc || 0) - Number(b.balance_btc || 0)
    : Number(b.balance_btc || 0) - Number(a.balance_btc || 0)
}

const sortByDate = (a: IWallet, b: IWallet, isAscending: boolean) => {
  if (a.createdAt && b.createdAt) {
    return isAscending
      ? new Date(a?.createdAt).getTime() - new Date(b?.createdAt).getTime()
      : new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
  }
  return -1
}

const sortByName = (a: IWallet, b: IWallet, isAscending: boolean) => {
  const currencyA = a.chain ? getToken(a.symbol, a.chain) : getCurrency(a.symbol)
  const currencyB = b.chain ? getToken(b.symbol, b.chain) : getCurrency(b.symbol)

  if (currencyA && currencyB) {
    return isAscending
      ? currencyA.name.localeCompare(currencyB.name)
      : currencyB.name.localeCompare(currencyA.name)
  }
  return -1
}

export const sortWallets = (a: IWallet, b: IWallet) => {
  const getSortKey = localStorage.getItem('activeSortKey')
  const getSortType = localStorage.getItem('activeSortType')

  if (getSortKey && getSortType) {
    const isAscending = getSortType === 'asc'

    if (getSortKey === 'balances') {
      return sortByBalance(a, b, isAscending)
    } else if (getSortKey === 'date') {
      return sortByDate(a, b, isAscending)
    } else if (getSortKey === 'alphabet') {
      return sortByName(a, b, isAscending)
    }
  }

  return b?.createdAt && a?.createdAt
    ? new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
    : -1
}

export const getWallets = (): IWallet[] | null => {
  try {
    const walletsList = localStorage.getItem('wallets')

    if (walletsList) {
      const parseWallets = JSON.parse(walletsList)

      return parseWallets
    }
    return null
  } catch {
    return null
  }
}

export const updateBalance = (
  address: string,
  symbol: string,
  balance: number,
  balance_btc: number
): void => {
  const wallets = getWallets()
  const findWallet = wallets?.find(
    (wallet: IWallet) =>
      toLower(wallet.address) === toLower(address) && toLower(wallet.symbol) === toLower(symbol)
  )

  if (findWallet) {
    findWallet.balance = balance
    findWallet.balance_btc = balance_btc
    localStorage.setItem('wallets', JSON.stringify(wallets))
  }
}

export const getLatestBalance = (address: string): number => {
  const wallets = getWallets()

  if (wallets) {
    const findWallet = wallets.find((wallet: IWallet) => wallet.address === address)

    if (findWallet) {
      return findWallet.balance || 0
    }
  }

  return 0
}

export const checkExistWallet = (address: string, symbol: string, chain?: string): boolean => {
  const wallets = getWallets()

  if (wallets?.length) {
    const checkExistWallet =
      wallets.find(
        (wallet: IWallet) =>
          toLower(wallet.address) === toLower(address) &&
          toLower(wallet.symbol) === toLower(symbol) &&
          toLower(wallet.chain) === toLower(chain)
      ) !== undefined

    if (chain) {
      const getCurrency = getCurrencyByChain(chain)

      if (getCurrency) {
        const checkExistChainWallet =
          wallets.find(
            (wallet: IWallet) =>
              toLower(wallet.address) === toLower(address) &&
              toLower(wallet.symbol) === toLower(getCurrency.symbol)
          ) !== undefined

        return checkExistChainWallet || checkExistWallet
      }
    }
    return checkExistWallet
  }
  return false
}

export const addNew = (
  address: string,
  privateKey: string,
  decryptBackup: string,
  password: string,
  currencies: string[],
  includeChain?: boolean,
  chain?: string,
  tokenName?: string,
  contractAddress?: string,
  decimals?: number
): string | null => {
  const parseBackup = JSON.parse(decryptBackup)

  for (const [index, currency] of currencies.entries()) {
    const getTokenName = index == 0 ? tokenName : undefined
    const getContractAddress = index === 0 ? contractAddress : undefined
    const getDecimals = index === 0 ? decimals : undefined

    const getChain = includeChain
      ? index !== 1
        ? chain
        : undefined
      : index === 0
      ? chain
      : undefined

    const walletsList = localStorage.getItem('wallets')
    const validateWallets = validateWallet(walletsList)

    if (validateWallets && walletsList) {
      const parseWallets = JSON.parse(walletsList)

      const data = {
        symbol: toLower(currency),
        address,
        uuid: v4(),
        chain: getChain,
        name: getTokenName,
        contractAddress: getContractAddress,
        decimals: getDecimals,
        createdAt: new Date(),
      }

      parseWallets.push(data)
      parseBackup.wallets.push({ ...data, ...{ privateKey } })

      localStorage.setItem('backup', encrypt(JSON.stringify(parseBackup), password))
      localStorage.setItem('wallets', JSON.stringify(parseWallets))
    }
  }

  return localStorage.getItem('wallets')
}

export const toggleVisibleWallet = (address: string, symbol: string, isHidden: boolean): void => {
  const wallets = getWallets()
  const findWallet = wallets?.find(
    (wallet: IWallet) =>
      toLower(wallet.address) === toLower(address) && toLower(wallet.symbol) === toLower(symbol)
  )

  if (findWallet) {
    findWallet.isHidden = isHidden
    localStorage.setItem('wallets', JSON.stringify(wallets))
  }
}
