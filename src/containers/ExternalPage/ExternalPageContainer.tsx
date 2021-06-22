import * as React from 'react'
import SVG from 'react-inlinesvg'
import { browser } from 'webextension-polyfill-ts'

// Components
import Cover from '@components/Cover'
import OneTimePassword from '@components/OneTimePassword'
import TextInput from '@components/TextInput'
import Button from '@components/Button'

// Utils
import { validatePassword } from '@utils/validate'
import { decrypt, sha256hash } from '@utils/crypto'
import { getCurrentTab, getUrl, updateTab } from '@utils/extension'
import { getItem, removeItem } from '@utils/storage'

// Styles
import Styles from './styles'

interface Props {
  onClose: () => void
  children: React.ReactElement<any, any> | null
  backPageTitle?: string
  backPageUrl?: string
  height?: string
  headerStyle: 'white' | 'green'
  isDraggable?: boolean
}

const ExternalPageContainer: React.FC<Props> = (props) => {
  const { onClose, children, backPageTitle, backPageUrl, height, headerStyle, isDraggable } = props

  const [isLocked, setIsLocked] = React.useState<boolean>(getItem('isLocked') !== null)
  const [passcode, setPasscode] = React.useState<string>('')
  const [isPasscodeError, setPasscodeError] = React.useState<boolean>(false)
  const [password, setPassword] = React.useState<string>('')
  const [passwordErrorLabel, setPasswordErrorLabel] = React.useState<null | string>(null)

  const textInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    window.addEventListener('storage', localStorageUpdated)

    return () => {
      window.removeEventListener('storage', localStorageUpdated)
    }
  }, [])

  React.useEffect(() => {
    if (isDraggable) {
      setTimeout(() => {
        makeDraggable()
      }, 0)
    }
  }, [isDraggable])

  React.useEffect(() => {
    if (getItem('isLocked') && !getItem('passcode')) {
      textInputRef.current?.focus()
    }
  }, [])

  React.useEffect(() => {
    if (!isLocked) {
      if (password.length) {
        setPasscode('')
      }
      if (passcode.length) {
        setPasscode('')
      }
    }
  }, [isLocked, password, passcode])

  React.useEffect(() => {
    if (passcode.length === 6) {
      checkPasscode()
    }
  }, [passcode])

  const makeDraggable = () => {
    const getHeader = document.querySelector('.sh-header')
    const container = document.querySelector('body')

    if (getHeader && container) {
      var active = false
      var currentX: number
      var currentY: number
      var initialX: number
      var initialY: number
      var xOffset: number = 0
      var yOffset: number = 0

      const dragStart = (event: MouseEvent) => {
        initialX = event.clientX - xOffset
        initialY = event.clientY - yOffset

        // @ts-ignore
        if (getHeader.contains(event.target)) {
          active = true
        }
      }

      const dragEnd = () => {
        initialX = currentX
        initialY = currentY

        active = false
      }

      const drag = (event: MouseEvent) => {
        if (active) {
          event.preventDefault()

          currentX = event.clientX - initialX
          currentY = event.clientY - initialY

          xOffset = currentX
          yOffset = currentY

          browser.runtime.sendMessage({
            type: 'drag',
            data: {
              currentX,
              currentY,
            },
          })
        }
      }

      container.addEventListener('mousedown', dragStart, false)
      container.addEventListener('mouseup', dragEnd, false)
      container.addEventListener('mousemove', drag, false)
    }
  }

  const checkPasscode = (): void => {
    const getPasscodeHash = getItem('passcode')

    if (getPasscodeHash && getPasscodeHash === sha256hash(passcode)) {
      removeItem('isLocked')
      return setIsLocked(false)
    } else {
      setPasscodeError(true)
      setPasscode('')
    }
  }

  const localStorageUpdated = () => {
    setIsLocked(getItem('isLocked') !== null)
  }

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const onUnlock = (): void => {
    if (passwordErrorLabel) {
      setPasswordErrorLabel(null)
    }

    if (validatePassword(password)) {
      const backup = getItem('backup')

      if (backup) {
        const decryptWallet = decrypt(backup, password)

        if (decryptWallet) {
          removeItem('isLocked')
          return setIsLocked(false)
        }
      }
    }

    return setPasswordErrorLabel('Password is not valid')
  }

  const goBack = async (): Promise<void> => {
    if (backPageUrl) {
      const currenctTab = await getCurrentTab()

      if (currenctTab?.id) {
        const url = getUrl(backPageUrl)

        await updateTab(currenctTab.id, {
          url,
        })
      }
    }
  }

  const renderLocked = () => (
    <Styles.Body>
      <Styles.LockedRow>
        <Styles.LockImage />
        <Styles.LockedTitle>Welcome back!</Styles.LockedTitle>

        <Styles.LockedForm onSubmit={onSubmitForm}>
          {getItem('passcode') !== null ? (
            <OneTimePassword value={passcode} onChange={setPasscode} isError={isPasscodeError} />
          ) : (
            <>
              <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                errorLabel={passwordErrorLabel}
                inputRef={textInputRef}
                openFrom="browser"
              />
              <Styles.LockedFormActions>
                <Button label="Unlock" onClick={onUnlock} disabled={!validatePassword(password)} />
              </Styles.LockedFormActions>
            </>
          )}
        </Styles.LockedForm>
      </Styles.LockedRow>
    </Styles.Body>
  )

  return (
    <Styles.Wrapper>
      <style
        dangerouslySetInnerHTML={{
          __html: `body { padding: 0; margin: 0;font-family: 'Roboto', sans-serif; background-color: #f8f8f8;}`,
        }}
      />
      <Styles.Extension height={height}>
        {headerStyle === 'green' ? <Cover /> : null}
        <Styles.Header className="sh-header" isDraggable={isDraggable}>
          <Styles.Logo headerStyle={headerStyle}>
            <SVG src="../../assets/logo.svg" width={30} height={24} />
          </Styles.Logo>
          <Styles.HeaderRow withBack={backPageTitle !== undefined && backPageUrl !== undefined}>
            {backPageTitle && backPageUrl ? (
              <Styles.HeaderBackRow onClick={goBack}>
                <Styles.HeaderBackIconRow>
                  <SVG src="../../assets/icons/arrow.svg" width={6} height={10} title="Back" />
                </Styles.HeaderBackIconRow>
                <Styles.HeaderBackTitle>{backPageTitle}</Styles.HeaderBackTitle>
              </Styles.HeaderBackRow>
            ) : null}
            <Styles.CloseButton onClick={onClose} headerStyle={headerStyle}>
              <SVG src="../../assets/icons/times.svg" width={15} height={15} />
            </Styles.CloseButton>
          </Styles.HeaderRow>
        </Styles.Header>
        {isLocked ? renderLocked() : children}
      </Styles.Extension>
    </Styles.Wrapper>
  )
}

export default ExternalPageContainer
