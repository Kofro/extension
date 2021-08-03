import * as React from 'react'
import { useLocation, useHistory } from 'react-router-dom'

// Components
import Cover from '@components/Cover'
import Header from '@components/Header'
import Button from '@components/Button'
import WalletCard from './components/WalletCard'
import SendForm from './components/SendForm'

// Drawers
import WalletsDrawer from '@drawers/Wallets'

// Utils
import { toLower, toUpper } from '@utils/format'
import { getBalance, getUnspentOutputs } from '@utils/api'
import { THardware, updateBalance, getWallets, IWallet } from '@utils/wallet'
import { getExtraIdName, checkWithOuputs } from '@utils/address'

// Config
import { getCurrency } from '@config/currencies'
import { getToken } from '@config/tokens'

// Styles
import Styles from './styles'

interface LocationState {
  symbol: string
  address: string
  walletName: string
  chain: string
  contractAddress?: string
  hardware?: THardware
  name?: string
}

const SendPage: React.FC = () => {
  const {
    state,
    state: { symbol, chain, contractAddress, name },
  } = useLocation<LocationState>()
  const history = useHistory()

  const [balance, setBalance] = React.useState<number | null>(null)
  const [estimated, setEstimated] = React.useState<number | null>(null)
  const [selectedAddress, setSelectedAddress] = React.useState<string>(state.address)
  const [wallets, setWallets] = React.useState<IWallet[]>([])
  const [activeDrawer, setActiveDrawer] = React.useState<'wallets' | null>(null)
  const [walletName, setWalletName] = React.useState<string>(state.walletName)
  const [hardware, setHardware] = React.useState<THardware | undefined>(state.hardware)
  const [destination, setDestination] = React.useState<string>('')
  const [amount, setAmount] = React.useState<string>('')
  const [isSendDisable, setSendDisable] = React.useState<boolean>(true)
  const [extraIdName, setExtraIdName] = React.useState<string | null>(null)
  const [extraId, setExtraId] = React.useState<string>('')
  const [outputs, setOutputs] = React.useState<UnspentOutput[]>([])
  const [destinationError, setDestinationError] = React.useState<string | null>(null)
  const [amountError, setAmountError] = React.useState<string | null>(null)

  const currency = chain ? getToken(symbol, chain) : getCurrency(symbol)

  React.useEffect(() => {
    getWalletsList()
    getExtraId()
  }, [])

  React.useEffect(() => {
    loadBalance()
    getOutputs()
  }, [selectedAddress])

  const getOutputs = async (): Promise<void> => {
    const withOutputs = checkWithOuputs(chain, symbol)

    if (withOutputs) {
      const unspentOutputs = await getUnspentOutputs(selectedAddress, chain)
      setOutputs(unspentOutputs)
    }
  }

  const getExtraId = (): void => {
    const name = getExtraIdName(symbol)

    if (name) {
      setExtraIdName(name)
    }
  }

  const loadBalance = async (): Promise<void> => {
    const { balance, balance_usd, balance_btc } = await getBalance(
      selectedAddress,
      currency?.chain || chain,
      chain ? symbol : undefined,
      contractAddress
    )

    setBalance(balance)
    updateBalance(selectedAddress, symbol, balance, balance_btc)
    setEstimated(balance_usd)
  }

  const getWalletsList = (): void => {
    const walletsList = getWallets()

    if (walletsList) {
      const filterWallets = walletsList.filter(
        (wallet: IWallet) =>
          toLower(wallet.symbol) === toLower(symbol) && toLower(wallet.chain) === toLower(chain)
      )
      setWallets(filterWallets)
    }
  }

  const onCancel = (): void => {
    history.goBack()
  }

  const onCloseDrawer = (): void => {
    setActiveDrawer(null)
  }

  const openWalletsDrawer = (): void => {
    setActiveDrawer('wallets')
  }

  const onClickDrawerWallet = (address: string) => (): void => {
    setDestination(address)
    setActiveDrawer(null)
  }

  const changeWallet = (address: string, name: string, hardware?: THardware) => {
    setSelectedAddress(address)
    setWalletName(name)
    setHardware(hardware)
  }

  const onConfirm = (): void => {}

  return (
    <>
      <Styles.Wrapper>
        <Cover />
        <Header withBack onBack={history.goBack} backTitle={`${currency?.name} wallet`} />
        <Styles.Container>
          <Styles.Title>Send {toUpper(symbol)}</Styles.Title>
          <Styles.Body>
            <Styles.Row>
              <WalletCard
                balance={balance}
                estimated={estimated}
                symbol={symbol}
                hardware={hardware}
                walletName={walletName}
                address={selectedAddress}
                chain={chain}
                name={name}
                wallets={wallets}
                selectedAddress={selectedAddress}
                changeWallet={changeWallet}
              />
              <SendForm
                symbol={symbol}
                chain={chain}
                extraIdName={extraIdName}
                destination={{
                  value: destination,
                  onChange: setDestination,
                  errorLabel: destinationError,
                  setErrorLabel: setDestinationError,
                }}
                amount={{
                  value: amount,
                  onChange: setAmount,
                  errorLabel: amountError,
                  setErrorLabel: setAmountError,
                }}
                extraId={{
                  value: extraId,
                  onChange: setExtraId,
                }}
                isDisabled={balance === null}
                balance={balance}
                openWalletsDrawer={openWalletsDrawer}
                selectedAddress={selectedAddress}
                outputs={outputs}
              />
            </Styles.Row>
          </Styles.Body>
          <Styles.Actions>
            <Button label="Cancel" isLight onClick={onCancel} mr={7.5} />
            <Button label="Send" disabled={isSendDisable} onClick={onConfirm} ml={7.5} />
          </Styles.Actions>
        </Styles.Container>
      </Styles.Wrapper>
      <WalletsDrawer
        isActive={activeDrawer === 'wallets'}
        onClose={onCloseDrawer}
        selectedAddress={selectedAddress}
        wallets={wallets}
        onClickWallet={onClickDrawerWallet}
      />
    </>
  )
}

export default SendPage
