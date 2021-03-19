import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'

// Components
import Cover from '@components/Cover'
import Header from '@components/Header'
import Link from '@components/Link'
import TextInput from '@components/TextInput'
import Button from '@components/Button'

// Drawers
import ConfirmDrawer from '@drawers/Confirm'

// Utils
import { validatePassword } from '@utils/validate'
import { checkExistWallet } from '@utils/wallet'
import address, { TSymbols } from '@utils/address'

// Styles
import Styles from './styles'

interface LocationState {
  symbol: TSymbols
}

const ImportPrivateKey: React.FC = () => {
  const [privateKey, setPrivateKey] = React.useState<string>('')
  const [activeDrawer, setActiveDrawer] = React.useState<null | 'confirm'>(null)
  const [errorLabel, setErrorLabel] = React.useState<null | string>(null)
  const [password, setPassword] = React.useState<string>('')

  const history = useHistory()
  const {
    state: { symbol },
  } = useLocation<LocationState>()

  const onConfirm = (): void => {
    if (errorLabel) {
      setErrorLabel(null)
    }

    const getAddress = new address(symbol).import(privateKey)

    if (getAddress) {
      const checkExist = checkExistWallet(getAddress)

      if (checkExist) {
        return setErrorLabel('This address has already been added')
      }
      return setActiveDrawer('confirm')
    }

    return setErrorLabel('Invalid private key')
  }

  const onSuccess = (password: string): void => {
    localStorage.setItem('backupStatus', 'notDownloaded')

    history.push('/download-backup', {
      password,
      from: 'privateKey',
    })
  }

  const onConfirmDrawer = (): void => {
    // if (validatePassword(password)) {
    //   const backup = localStorage.getItem('backup')
    //   if (backup && privateKey) {
    //     const decryptBackup = decrypt(backup, password)
    //     if (decryptBackup) {
    //       const parseBackup = JSON.parse(decryptBackup)
    //       const address = new addressUtil(symbol).import(privateKey)
    //       if (address) {
    //         const uuid = v4()
    //         const newWalletsList = addNewWallet(address, symbol, uuid)
    //         parseBackup.wallets.push({
    //           symbol,
    //           address,
    //           uuid,
    //           privateKey,
    //         })
    //         if (newWalletsList) {
    //           localStorage.setItem('backup', encrypt(JSON.stringify(parseBackup), password))
    //           localStorage.setItem('wallets', newWalletsList)
    //           return onSuccess(password)
    //         }
    //       }
    //     }
    //   }
    // }
    // return setErrorLabel('Password is not valid')
  }

  return (
    <>
      <Styles.Wrapper>
        <Cover />
        <Header withBack onBack={history.goBack} backTitle="Add address" />
        <Styles.Container>
          <Styles.Heading>
            <Styles.Title>Import private key</Styles.Title>
            <Styles.Description>
              The password needs to encrypt your private keys. We dont have access to your keys, so
              be careful.
            </Styles.Description>
            <Link
              to="https://simplehold.freshdesk.com/support/solutions/articles/69000197144-what-is-simplehold-"
              title="How it works?"
              mt={30}
            />
          </Styles.Heading>
          <Styles.Form>
            <TextInput
              label="Enter private key"
              value={privateKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setPrivateKey(e.target.value)
              }
              errorLabel={errorLabel}
            />
            <Styles.Actions>
              <Button label="Back" isLight onClick={history.goBack} mr={7.5} />
              <Button label="Import" disabled={!privateKey.length} onClick={onConfirm} ml={7.5} />
            </Styles.Actions>
          </Styles.Form>
        </Styles.Container>
      </Styles.Wrapper>
      <ConfirmDrawer
        isActive={activeDrawer === 'confirm'}
        onClose={() => setActiveDrawer(null)}
        title="Confirm adding new address"
        inputLabel="Enter password"
        textInputValue={password}
        isButtonDisabled={!validatePassword(password)}
        onConfirm={onConfirmDrawer}
        onChangeInput={(e: React.ChangeEvent<HTMLInputElement>): void =>
          setPassword(e.target.value)
        }
        textInputType="password"
        inputErrorLabel={errorLabel}
      />
    </>
  )
}

export default ImportPrivateKey
