import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import SVG from 'react-inlinesvg'

// Components
import WalletCard from '@components/WalletCard'
import CollapsibleHeader from '@components/CollapsibleHeader'

// Drawers
import SortWalletsDrawer from '@drawers/SortWallets'
import FilterWalletsDrawer from '@drawers/FilterWallets'

// Hooks
import useScroll from '@hooks/useScroll'
import useToastContext from '@hooks/useToastContext'
import useState from '@hooks/useState'

// Utils
import { IWallet, getWallets, sortWallets, filterWallets, getWalletName } from '@utils/wallet'
import { logEvent } from '@utils/amplitude'
import { setBadgeText, getBadgeText } from '@utils/extension'
import { clear } from '@utils/storage'

// Config
import { ADD_ADDRESS, BALANCE_CHANGED } from '@config/events'

// Types
import { ILocationState, IState } from './types'

// Styles
import Styles from './styles'

const initialState: IState = {
  wallets: null,
  totalBalance: null,
  totalEstimated: null,
  walletsBalance: [],
  walletsEstimated: [],
  walletsPending: [],
  pendingBalance: null,
  activeDrawer: null,
}

const Wallets: React.FC = () => {
  const history = useHistory()
  const { state: locationState } = useLocation<ILocationState>()
  const { state, updateState } = useState<IState>(initialState)

  const { scrollPosition } = useScroll()
  const addToast = useToastContext()

  React.useEffect(() => {
    getWalletsList()
    checkBadgeText()
  }, [])

  React.useEffect(() => {
    if (
      state.wallets?.length === 0 &&
      state.totalBalance === null &&
      state.totalEstimated === null
    ) {
      updateState({
        totalBalance: 0,
        totalEstimated: 0,
      })
    }
  }, [state.wallets, state.totalBalance, state.totalEstimated])

  React.useEffect(() => {
    if (locationState?.status === 'passcodeTurnedOff') {
      addToast('Your passcode is disabled now. You can turn it on in settings.')
    }
  }, [locationState])

  React.useEffect(() => {
    if (state.walletsBalance.length === state.wallets?.length && state.totalBalance === null) {
      updateState({ totalBalance: state.walletsBalance.reduce((a, b) => a + b, 0) })
    }
  }, [state.walletsBalance, state.totalBalance])

  React.useEffect(() => {
    if (state.walletsEstimated.length === state.wallets?.length && state.totalEstimated === null) {
      updateState({ totalEstimated: state.walletsEstimated.reduce((a, b) => a + b, 0) })
    }
  }, [state.walletsEstimated, state.totalEstimated])

  React.useEffect(() => {
    if (state.walletsPending.length === state.wallets?.length && state.pendingBalance === null) {
      updateState({ pendingBalance: state.walletsPending.reduce((a, b) => a + b, 0) })
    }
  }, [state.walletsPending, state.pendingBalance])

  React.useEffect(() => {
    if (state.totalBalance !== null && state.totalEstimated !== null) {
      const getLatesTotalBalance = state.wallets?.reduce((a, b) => {
        if (b.balance_btc) {
          return a + b.balance_btc
        }
        return 0
      }, 0)

      if (getLatesTotalBalance !== state.totalBalance) {
        logEvent({
          name: BALANCE_CHANGED,
        })
      }
    }
  }, [state.totalBalance, state.totalEstimated])

  const checkBadgeText = async () => {
    const text = await getBadgeText()

    if (text?.length) {
      setBadgeText('')
    }
  }

  const getWalletsList = () => {
    updateState({ wallets: null })

    const walletsList = getWallets()

    if (walletsList) {
      updateState({ wallets: walletsList.filter(filterWallets).sort(sortWallets) })
    } else {
      clear()
      history.push('/welcome')
    }
  }

  const onAddNewAddress = (): void => {
    logEvent({
      name: ADD_ADDRESS,
    })

    history.push('/select-currency')
  }

  const sumBalance = (amount: number) => {
    updateState({ walletsBalance: [...state.walletsBalance, amount] })
  }

  const sumEstimated = (amount: number) => {
    updateState({ walletsEstimated: [...state.walletsEstimated, amount] })
  }

  const sumPending = (amount: number) => {
    updateState({ walletsPending: [...state.walletsPending, amount] })
  }

  const onShowDrawer = (activeDrawer: 'sort' | 'filters'): void => {
    updateState({ activeDrawer })
  }

  const onCloseDrawer = (): void => {
    updateState({ activeDrawer: null })
  }

  const onApplyDrawer = (): void => {
    onCloseDrawer()
    getWalletsList()
  }

  return (
    <>
      <Styles.Wrapper>
        <CollapsibleHeader
          scrollPosition={scrollPosition}
          balance={state.totalBalance}
          estimated={state.totalEstimated}
          pendingBalance={state.pendingBalance}
          onShowDrawer={onShowDrawer}
          isDrawersActive={state.activeDrawer !== null}
        />
        {state.wallets !== null ? (
          <Styles.WalletsList>
            {state.wallets?.length
              ? state.wallets.map((wallet: IWallet) => {
                  const {
                    address,
                    symbol,
                    chain,
                    name,
                    contractAddress,
                    decimals,
                    isHidden,
                    uuid,
                    hardware,
                  } = wallet

                  const walletName = state.wallets
                    ? wallet.walletName ||
                      getWalletName(state.wallets, symbol, uuid, hardware, chain, name)
                    : ''

                  return (
                    <WalletCard
                      key={`${symbol}/${address}/${chain}`}
                      address={address}
                      chain={chain}
                      symbol={symbol.toLowerCase()}
                      name={name}
                      contractAddress={contractAddress}
                      decimals={decimals}
                      isHidden={isHidden}
                      sumBalance={sumBalance}
                      sumEstimated={sumEstimated}
                      sumPending={sumPending}
                      walletName={walletName}
                      uuid={uuid}
                      hardware={hardware}
                    />
                  )
                })
              : null}
            {state.wallets.length === 0 ? (
              <Styles.NotFound>Nothing was found for the specified parameters</Styles.NotFound>
            ) : null}
            <Styles.AddWalletButton onClick={onAddNewAddress}>
              <SVG
                src="../../assets/icons/plus.svg"
                width={14}
                height={14}
                title="Add new wallet"
              />
            </Styles.AddWalletButton>
          </Styles.WalletsList>
        ) : null}
      </Styles.Wrapper>
      <SortWalletsDrawer
        isActive={state.activeDrawer === 'sort'}
        onClose={onCloseDrawer}
        onApply={onApplyDrawer}
      />
      <FilterWalletsDrawer
        isActive={state.activeDrawer === 'filters'}
        onClose={onCloseDrawer}
        onApply={onApplyDrawer}
      />
    </>
  )
}

export default Wallets
