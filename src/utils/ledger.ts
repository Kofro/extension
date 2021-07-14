import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import type Transport from '@ledgerhq/hw-transport'

import BTCApp from '@ledgerhq/hw-app-btc'
import ETHApp from '@ledgerhq/hw-app-eth'
import XRPApp from '@ledgerhq/hw-app-xrp'

// Utils
import { toLower } from '@utils/format'

type TCurrency = {
  symbol: string
  path: string
  index: number
}

export const currencies: TCurrency[] = [
  {
    symbol: 'btc',
    path: "44'/0'/0'/0/",
    index: 0,
  },
  {
    symbol: 'eth',
    path: "44'/60'/0'/0/",
    index: 0,
  },
  {
    symbol: 'xrp',
    path: "44'/144'/0'/0/",
    index: 0,
  },
]

export const requestTransport = async (): Promise<Transport | null> => {
  try {
    return await TransportWebUSB.request()
  } catch {
    return null
  }
}

const findCurrency = (symbol: string): TCurrency | undefined => {
  return currencies.find((currency: TCurrency) => toLower(currency.symbol) === toLower(symbol))
}

export const getBTCAddress = async (
  index: number,
  transport: Transport
): Promise<string | null> => {
  try {
    const { bitcoinAddress } = await new BTCApp(transport).getWalletPublicKey(
      `44'/0'/0'/0/${index}`
    )

    return bitcoinAddress
  } catch (err) {
    console.log('err', err)
    return null
  }
}

export const getETHAddress = async (
  index: number,
  transport: Transport
): Promise<string | null> => {
  try {
    const { address } = await new ETHApp(transport).getAddress(`44'/60'/0'/0/${index}`)

    return address
  } catch (err) {
    console.log('err', err)
    return null
  }
}

export const getXRPAddress = async (
  index: number,
  transport: Transport
): Promise<string | null> => {
  try {
    const { address } = await new XRPApp(transport).getAddress(`44'/144'/0'/0/${index}`)

    return address
  } catch (err) {
    console.log('err', err)
    return null
  }
}
