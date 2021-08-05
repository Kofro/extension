import * as React from 'react'
import { useLocation, useHistory } from 'react-router-dom'

// Components
import Cover from '@components/Cover'
import Header from '@components/Header'
import Heading from './components/Heading'
import WalletCard from './components/WalletCard'
import TransactionHistory from './components/TransactionHistory'
import Warning from '@components/Warning'

// Drawers
import ConfirmDrawer from '@drawers/Confirm'
import PrivateKeyDrawer from '@drawers/PrivateKey'
import RenameWalletDrawer from '@drawers/RenameWallet'

// Utils
import { getBalance, getTxsInfo } from '@utils/api'
import {
  IWallet,
  updateBalance,
  renameWallet,
  THardware,
  toggleVisibleWallet,
  getWalletName,
  getWallets,
} from '@utils/wallet'
import { getTransactionHistory } from '@utils/api'
import { openWebPage } from '@utils/extension'
import { getExplorerLink, getTransactionLink } from '@utils/address'
import { validatePassword } from '@utils/validate'
import { getItem } from '@utils/storage'
import { decrypt } from '@utils/crypto'
import { toLower } from '@utils/format'
import {
  TAddressTxGroup,
  save as saveTxs,
  group as groupTxs,
  compare as compareTxs,
  getExist as getExistTxs,
} from '@utils/txs'

// Config
import { getCurrency, checkWithPhrase } from '@config/currencies'
import { getToken } from '@config/tokens'

// Styles
import Styles from './styles'

interface LocationState {
  name?: string
  symbol: string
  address: string
  uuid: string
  chain?: string
  contractAddress?: string
  tokenName?: string
  decimals?: number
  isHidden?: boolean
  hardware: THardware
}

const WalletPage: React.FC = () => {
  const {
    state,
    state: {
      symbol,
      address,
      uuid,
      chain,
      contractAddress,
      tokenName,
      hardware,
      isHidden = false,
      name,
    },
  } = useLocation<LocationState>()
  const history = useHistory()

  const [balance, setBalance] = React.useState<null | number>(null)
  const [estimated, setEstimated] = React.useState<null | number>(null)
  const [txHistory, setTxHistory] = React.useState<TAddressTxGroup[] | null>(null)
  const [activeDrawer, setActiveDrawer] = React.useState<
    null | 'confirm' | 'privateKey' | 'renameWallet'
  >(null)
  const [isBalanceRefreshing, setBalanceRefreshing] = React.useState<boolean>(false)
  const [password, setPassword] = React.useState<string>('')
  const [passwordErrorLabel, setPasswordErrorLabel] = React.useState<null | string>(null)
  const [privateKey, setPrivateKey] = React.useState<null | string>(null)
  const [walletName, setWalletName] = React.useState<string>('')
  const [isHiddenWallet, setIsHiddenWallet] = React.useState<boolean>(isHidden)

  const currency = chain ? getToken(symbol, chain) : getCurrency(symbol)
  const withPhrase = checkWithPhrase(symbol)
  const tokenSymbol = chain ? symbol : undefined

  React.useEffect(() => {
    loadBalance()
    getTxHistory()
    getName()
  }, [])

  const getName = (): void => {
    const walletsList = getWallets()

    if (walletsList) {
      const findWallet = walletsList.find(
        (wallet: IWallet) => toLower(wallet.uuid) === toLower(uuid)
      )

      if (findWallet) {
        const walletName =
          findWallet.walletName || getWalletName(walletsList, symbol, uuid, hardware, chain, name)

        setWalletName(walletName)
      }
    }
  }

  React.useEffect(() => {
    if (balance !== null && estimated !== null && isBalanceRefreshing) {
      setBalanceRefreshing(false)
    }
  }, [balance, estimated, isBalanceRefreshing])

  const loadBalance = async (): Promise<void> => {
    const { balance, balance_usd, balance_btc } = await getBalance(
      address,
      currency?.chain || chain,
      tokenSymbol,
      contractAddress
    )

    setBalance(balance)
    updateBalance(address, symbol, balance, balance_btc)
    setEstimated(balance_usd)
  }

  const getTxHistory = async (): Promise<void> => {
    if (currency) {
      const data = await getTransactionHistory(
        currency.chain,
        address,
        tokenSymbol,
        contractAddress
      )

      if (data.length) {
        const compare = compareTxs(address, currency.chain, data, tokenSymbol, contractAddress)

        if (compare.length) {
          const getFullTxHistoryInfo = await getTxsInfo(currency.chain, address, compare)
          saveTxs(address, currency.chain, getFullTxHistoryInfo, tokenSymbol, contractAddress)
        }

        const group = groupTxs(getExistTxs(address, currency.chain, tokenSymbol, contractAddress))
        setTxHistory(group)
      } else {
        setTxHistory([])
      }
    }
  }

  const openPage = (url: string) => () => {
    history.push(url, {
      ...state,
      walletName,
      tokenChain: chain,
      chain: currency?.chain,
    })
  }

  const onSelectDropdown = (index: number) => {
    if (index === 0) {
      setActiveDrawer('confirm')
    } else if (index === 1) {
      openWebPage(getExplorerLink(address, symbol, currency, chain, contractAddress))
    } else if (index === 2) {
      toggleVisibleWallet(address, symbol, !isHiddenWallet)
      setIsHiddenWallet((prev: boolean) => !prev)
    } else if (index === 3) {
      history.push('/select-token', {
        currency,
        address,
      })
    }
  }

  const onRefreshBalance = (): void => {
    if (balance !== null && estimated !== null) {
      setBalanceRefreshing(true)
      setBalance(null)
      setEstimated(null)

      loadBalance()
    }
  }

  const onConfirmDrawer = (): void => {
    if (passwordErrorLabel) {
      setPasswordErrorLabel(null)
    }

    if (validatePassword(password)) {
      const backup = getItem('backup')

      if (backup?.length) {
        const decryptBackup = decrypt(backup, password)

        if (decryptBackup) {
          const parseBackup = JSON.parse(decryptBackup)
          const findWallet: IWallet | undefined = parseBackup?.wallets?.find(
            (wallet: IWallet) => toLower(wallet.address) === toLower(address)
          )

          if (findWallet) {
            if (findWallet.mnemonic) {
              setPrivateKey(findWallet.mnemonic)
            } else if (findWallet.privateKey) {
              setPrivateKey(findWallet.privateKey)
            }
            return setActiveDrawer('privateKey')
          }
        }
      }
    }

    return setPasswordErrorLabel('Password is not valid')
  }

  const onCloseDrawer = (): void => {
    setActiveDrawer(null)
  }

  const openRenameDrawer = (): void => {
    setActiveDrawer('renameWallet')
  }

  const onRenameWallet = (name: string) => (): void => {
    setActiveDrawer(null)
    setWalletName(name)
    renameWallet(uuid, name)
  }

  const openTx = (hash: string) => async (): Promise<void> => {
    if (currency) {
      const url = getTransactionLink(hash, symbol, currency.chain, chain)

      if (url) {
        await openWebPage(url)
      }
    }
  }

  return (
    <>
      <Styles.Wrapper>
        <Cover />
        <Header withBack onBack={history.goBack} backTitle="Home" />
        <Styles.Container>
          <Styles.Row>
            <Heading
              symbol={symbol}
              withPhrase={withPhrase}
              onSelectDropdown={onSelectDropdown}
              walletName={walletName}
              onRenameWallet={openRenameDrawer}
              hardware={hardware}
              isHidden={isHiddenWallet}
            />
            <WalletCard
              openPage={openPage}
              symbol={symbol}
              chain={chain}
              balance={balance}
              estimated={estimated}
              onRefreshBalance={onRefreshBalance}
              isBalanceRefreshing={isBalanceRefreshing}
              address={address}
              tokenName={tokenName}
            />
            {balance !== null && balance < 20 && toLower(symbol) === 'xrp' ? (
              <Warning
                text="You need 20 XRP minimum to activate your XRP address."
                color="#7D7E8D"
                br={8}
                mt={10}
                padding="8px 10px"
                background="rgba(189, 196, 212, 0.2)"
              />
            ) : null}
          </Styles.Row>
          <TransactionHistory data={txHistory} symbol={symbol} openTx={openTx} />
        </Styles.Container>
      </Styles.Wrapper>
      <ConfirmDrawer
        isActive={activeDrawer === 'confirm'}
        onClose={onCloseDrawer}
        title={`Please enter your password to see the ${
          withPhrase ? 'recovery phrase' : 'private key'
        }`}
        isButtonDisabled={!validatePassword(password)}
        onConfirm={onConfirmDrawer}
        textInputValue={password}
        onChangeText={setPassword}
        inputLabel="Enter password"
        textInputType="password"
        inputErrorLabel={passwordErrorLabel}
      />
      <PrivateKeyDrawer
        isMnemonic={withPhrase}
        isActive={activeDrawer === 'privateKey'}
        onClose={() => {
          setActiveDrawer(null)
          setPrivateKey(null)
        }}
        privateKey={privateKey}
      />
      <RenameWalletDrawer
        isActive={activeDrawer === 'renameWallet'}
        onClose={onCloseDrawer}
        onRename={onRenameWallet}
      />
    </>
  )
}

export default WalletPage
