export interface IWallet {
  symbol: string
  balance: string
  address: string
  uuid: string
  privateKey: string
}

export const getWallets = (symbol: string): string[] | null => {
  try {
    const walletsList = localStorage.getItem('wallets')

    if (walletsList) {
      const parseWallets = JSON.parse(walletsList)

      return parseWallets.wallets
        .filter((wallet: IWallet) => wallet.symbol === symbol)
        .map((wallet: IWallet) => wallet.address)
    }
    return null
  } catch {
    return null
  }
}

export const validate = (walletы: string): boolean => {
  return true // Fix me
}

export const setBalance = (address: string): void => {}

export const checkExistWallet = (address: string) => {}

export const getWalletsFromBackup = (backup: string): string | null => {
  const parsebackup = JSON.parse(backup)

  if (parsebackup) {
    const validateWallets = validate(parsebackup.wallets)

    if (validateWallets) {
      return parsebackup.wallets.map((wallet: IWallet) => {
        const { symbol, balance = 0, address } = wallet
        return {
          symbol,
          balance,
          address,
        }
      })
    }
  }

  return null
}
