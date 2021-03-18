import * as React from 'react'

// Components
import DrawerWrapper from '@components/DrawerWrapper'
import Button from '@components/Button'

// Styles
import Styles from './styles'

interface Props {
  onClose: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  isActive: boolean
  onConfirm: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

const ForgotPasscodeDrawer: React.FC<Props> = (props) => {
  const { onClose, isActive, onConfirm } = props

  return (
    <DrawerWrapper title="Forgot my passcode" isActive={isActive} onClose={onClose}>
      <Styles.Row>
        <Styles.Text>
          Are you sure that you want to clear cache and log out? Note: backup file will downloaded
          after you confirm this action
        </Styles.Text>

        <Styles.Actions>
          <Button label="Cancel" isLight isSmall onClick={onClose} mr={7.5} />
          <Button label="Ok" isSmall onClick={onConfirm} ml={7.5} />
        </Styles.Actions>
      </Styles.Row>
    </DrawerWrapper>
  )
}

export default ForgotPasscodeDrawer
