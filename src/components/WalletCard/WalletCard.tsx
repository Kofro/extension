import * as React from 'react'
import { useHistory } from 'react-router-dom'
import numeral from 'numeral'
import SVG from 'react-inlinesvg'

// Components
import CurrencyLogo from '@components/CurrencyLogo'
import Skeleton from '@components/Skeleton'

// Utils
import { getCurrency } from '@config/currencies'
import { getBalance } from '@utils/api'
import { toUpper, numberFriendly } from '@utils/format'
import { updateBalance, THardware } from '@utils/wallet'

// Config
import { getToken } from '@config/tokens'

// Styles
import Styles from './styles'

interface Props {
  address: string
  symbol: string
  chain?: string
  name?: string
  contractAddress?: string
  decimals?: number
  isHidden?: boolean
  sumBalance?: (balance: number) => void
  sumEstimated?: (estimated: number) => void
  sumPending?: (pending: number) => void
  handleClick?: () => void
  hardware?: THardware
}

const WalletCard: React.FC<Props> = (props) => {
  const {
    address,
    symbol,
    chain,
    name,
    contractAddress,
    decimals,
    isHidden,
    sumBalance,
    sumEstimated,
    sumPending,
    handleClick,
    hardware,
  } = props

  const currency = chain ? getToken(symbol, chain) : getCurrency(symbol)

  const history = useHistory()

  const [balance, setBalance] = React.useState<number | null>(null)
  const [estimated, setEstimated] = React.useState<number | null>(null)
  const [pendingBalance, setPendingBalance] = React.useState<number>(0)

  React.useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async (): Promise<void> => {
    const tryGetBalance = await getBalance(
      address,
      currency?.chain || chain,
      chain ? symbol : undefined,
      contractAddress
    )

    const { balance, balance_usd, balance_btc, pending, pending_btc } = tryGetBalance

    setBalance(balance)
    if (sumBalance) {
      sumBalance(balance_btc)
    }
    updateBalance(address, symbol, balance, balance_btc)

    setPendingBalance(pending)
    if (sumPending) {
      sumPending(pending_btc)
    }

    setEstimated(balance_usd)
    if (sumEstimated) {
      sumEstimated(balance_usd)
    }
  }

  const openWallet = (): void => {
    if (handleClick) {
      return handleClick()
    }
    history.push('/receive', {
      name: currency?.name || name,
      symbol,
      address,
      chain,
      contractAddress,
      tokenName: name,
      decimals,
      isHidden,
      hardware,
    })
  }

  return (
    <Styles.Container onClick={openWallet}>
      <Styles.Body pb={typeof hardware !== 'undefined' ? 10 : 20}>
        <CurrencyLogo width={40} height={40} symbol={symbol} chain={chain} name={name} />
        <Styles.Row>
          <Styles.AddressInfo>
            {currency || name ? <Styles.Currency>{currency?.name || name}</Styles.Currency> : null}
            <Styles.Address>{address}</Styles.Address>
          </Styles.AddressInfo>
          <Styles.Balances>
            <Skeleton width={106} height={19} type="gray" br={4} isLoading={balance === null}>
              <Styles.BalanceRow>
                {pendingBalance !== 0 ? (
                  <Styles.PendingIcon>
                    <SVG src="../../assets/icons/clock.svg" width={12} height={12} />
                  </Styles.PendingIcon>
                ) : null}

                <Styles.Balance>{`${numeral(balance).format('0.[000000]')} ${toUpper(
                  symbol
                )}`}</Styles.Balance>
              </Styles.BalanceRow>
            </Skeleton>
            <Skeleton
              width={80}
              height={16}
              type="gray"
              mt={4}
              br={4}
              isLoading={estimated === null}
            >
              <Styles.Estimated>{`$${
                Number(estimated) < 0.01
                  ? numeral(estimated).format('0.[00000000]')
                  : numberFriendly(estimated)
              }`}</Styles.Estimated>
            </Skeleton>
          </Styles.Balances>
        </Styles.Row>
      </Styles.Body>
      {hardware ? (
        <Styles.Footer>
          <Styles.HardwareBlock>
            {hardware.type === 'ledger' ? (
              <SVG src="../../assets/icons/ledger.svg" width={10} height={12} />
            ) : (
              <SVG src="../../assets/icons/trezor.svg" width={8.22} height={12} />
            )}

            <Styles.HardwareLabel>{hardware.label}</Styles.HardwareLabel>
          </Styles.HardwareBlock>
        </Styles.Footer>
      ) : null}
    </Styles.Container>
  )
}

export default WalletCard
