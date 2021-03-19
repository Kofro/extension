import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Transaction } from 'bitcore-lib'

// Components
import Cover from '@components/Cover'
import Header from '@components/Header'
import CurrenciesDropdown from '@components/CurrenciesDropdown'
import TextInput from '@components/TextInput'
import Button from '@components/Button'
import Skeleton from '@components/Skeleton'
import Spinner from '@components/Spinner'

// Utils
import { getWallets, IWallet } from '@utils/wallet'
import { toUpper, price } from '@utils/format'
import {
  getBalance,
  getTransactionSize,
  getUnspentOutputs,
  getFees,
  IUnspentOutput,
  btcToSat,
  satToBtc,
} from '@utils/bitcoin'
import { logEvent } from '@utils/amplitude'
import addressLib, { TSymbols } from '@utils/address'

// Config
import { ADDRESS_SEND, ADDRESS_SEND_CANCEL } from '@config/events'
import { getCurrency } from '@config/currencies'

// Hooks
import useDebounce from '@hooks/useDebounce'

// Styles
import Styles from './styles'

interface LocationState {
  symbol: TSymbols
  address: string
}

const Send: React.FC = () => {
  const history = useHistory()
  const {
    state: { symbol, address: locationAddress },
  } = useLocation<LocationState>()

  const currency = getCurrency(symbol)

  const [address, setAddress] = React.useState<string>('')
  const [amount, setAmount] = React.useState<string>('')
  const [addresses, setAddresses] = React.useState<string[]>([])
  const [selectedAddress, setSelectedAddress] = React.useState<string>(locationAddress)
  const [networkFee, setNetworkFee] = React.useState<number>(0)
  const [balance, setBalance] = React.useState<null | number>(null)
  const [estimated, setEstimated] = React.useState<null | number>(null)
  const [addressErrorLabel, setAddressErrorLabel] = React.useState<null | string>(null)
  const [amountErrorLabel, setAmountErrorLabel] = React.useState<null | string>(null)
  const [outputs, setOutputs] = React.useState<IUnspentOutput[]>([])
  const [utxosList, setUtxosList] = React.useState<Transaction.UnspentOutput[]>([])
  const [isNetworkFeeLoading, setNetworkFeeLoading] = React.useState<boolean>(false)

  const debounced = useDebounce(amount, 1000)

  React.useEffect(() => {
    getWalletsList()
  }, [])

  React.useEffect(() => {
    getOutputs()
    loadBalance()
  }, [selectedAddress])

  React.useEffect(() => {
    if (amount.length && Number(balance) > 0 && outputs.length) {
      setNetworkFeeLoading(true)
      getNetworkFee()
    }
  }, [debounced])

  const getOutputs = async (): Promise<void> => {
    const unspentOutputs = await getUnspentOutputs(selectedAddress)
    setOutputs(unspentOutputs)
  }

  const getNetworkFee = async (): Promise<void> => {
    const fee = await getFees()
    setUtxosList([])

    const sortOutputs = outputs.sort((a, b) => a.value - b.value)
    const utxos: Transaction.UnspentOutput[] = []

    for (const output of sortOutputs) {
      const getUtxosValue = utxos.reduce((a, b) => a + b.satoshis, 0)
      const transactionFeeBytes = getTransactionSize(utxos) * fee

      if (getUtxosValue >= btcToSat(Number(amount)) + transactionFeeBytes) {
        break
      }

      const newOutput = new Transaction.UnspentOutput({
        txId: output.tx_hash_big_endian,
        vout: output.tx_output_n,
        address: selectedAddress,
        scriptPubKey: output.script,
        amount: satToBtc(output.value),
      })

      utxos.push(newOutput)
    }

    setUtxosList(utxos)

    const transactionFeeBytes = window.getTransactionSize(utxos)
    setNetworkFee((transactionFeeBytes * fee) / 100000000)
    setNetworkFeeLoading(false)
  }

  const getWalletsList = (): void => {
    const walletsList = getWallets()

    if (walletsList) {
      const filterWallets = walletsList
        .filter((wallet: IWallet) => wallet.symbol === symbol)
        .map((wallet: IWallet) => wallet.address)
      setAddresses(filterWallets)
    }
  }

  const loadBalance = async (): Promise<void> => {
    setBalance(null)
    setEstimated(null)

    if (currency) {
      const fetchBalance = await getBalance(selectedAddress, currency?.chain)

      if (fetchBalance) {
        setBalance(fetchBalance.balance)
        setEstimated(fetchBalance.usd)
      } else {
        //   const latestbalance = getLatestBalance(address)
        // setBalance(latestbalance)
        // if (latestbalance !== 0) {
        //   const fetchEstimated = await getEstimated(latestbalance)
        //   setEstimated(fetchEstimated)
        // } else {
        //   setEstimated(0)
        // }
      }
    }
  }

  const onSend = (): void => {
    logEvent({
      name: ADDRESS_SEND,
    })

    history.push('/send-confirm', {
      amount: Number(amount),
      symbol,
      networkFee,
      addressFrom: selectedAddress,
      addressTo: address,
      outputs: utxosList,
    })
  }

  const onBlurAddressInput = (): void => {
    if (addressErrorLabel) {
      setAddressErrorLabel(null)
    }

    if (address.length && !new addressLib(symbol).validate(address)) {
      setAddressErrorLabel('Address is not valid')
    }

    if (address === selectedAddress) {
      setAddressErrorLabel('Address same as sender')
    }
  }

  const onBlurAmountInput = (): void => {
    if (amountErrorLabel) {
      setAmountErrorLabel(null)
    }

    if (
      `${amount}`.length &&
      balance !== null &&
      Number(amount) + Number(networkFee) > Number(balance)
    ) {
      setAmountErrorLabel('Insufficient funds')
    }
  }

  const isButtonDisabled = (): boolean => {
    return (
      !new addressLib(symbol).validate(address) ||
      !amount.length ||
      Number(amount) <= 0 ||
      !outputs.length ||
      addressErrorLabel !== null ||
      amountErrorLabel !== null ||
      Number(balance) <= 0 ||
      networkFee === 0 ||
      isNetworkFeeLoading
    )
  }

  const onCancel = (): void => {
    logEvent({
      name: ADDRESS_SEND_CANCEL,
    })

    history.goBack()
  }

  return (
    <Styles.Wrapper>
      <Cover />
      <Header withBack backTitle="Wallet" onBack={history.goBack} />
      <Styles.Container>
        <Styles.Row>
          <Styles.PageTitle>Send</Styles.PageTitle>
          <Skeleton width={250} height={42} type="gray" mt={21} isLoading={balance === null}>
            <Styles.Balance>{`${balance} ${toUpper(symbol)}`}</Styles.Balance>
          </Skeleton>
          <Skeleton width={130} height={23} mt={5} type="gray" isLoading={estimated === null}>
            <Styles.USDEstimated>{`$${price(estimated, 2)} USD`}</Styles.USDEstimated>
          </Skeleton>
        </Styles.Row>
        <Styles.Form>
          {addresses?.length ? (
            <CurrenciesDropdown
              symbol={symbol}
              isDisabled={addresses.length < 2}
              selectedAddress={selectedAddress}
              addresses={addresses}
              setAddress={setSelectedAddress}
            />
          ) : null}
          <TextInput
            label="Recipient Address"
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAddress(e.target.value)}
            errorLabel={addressErrorLabel}
            onBlurInput={onBlurAddressInput}
          />
          <TextInput
            label={`Amount (${toUpper(symbol)})`}
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAmount(e.target.value)}
            type="number"
            errorLabel={amountErrorLabel}
            onBlurInput={onBlurAmountInput}
          />
          <Styles.NetworkFeeBlock>
            <Styles.NetworkFeeLabel>Network fee:</Styles.NetworkFeeLabel>
            {isNetworkFeeLoading ? (
              <Spinner ml={10} />
            ) : (
              <>
                {networkFee === 0 ? (
                  <Styles.NetworkFee>-</Styles.NetworkFee>
                ) : (
                  <Styles.NetworkFee>
                    {networkFee} {toUpper(symbol)}
                  </Styles.NetworkFee>
                )}
              </>
            )}
          </Styles.NetworkFeeBlock>

          <Styles.Actions>
            <Button label="Cancel" isLight onClick={onCancel} mr={7.5} />
            <Button label="Send" onClick={onSend} disabled={isButtonDisabled()} ml={7.5} />
          </Styles.Actions>
        </Styles.Form>
      </Styles.Container>
    </Styles.Wrapper>
  )
}

export default Send
