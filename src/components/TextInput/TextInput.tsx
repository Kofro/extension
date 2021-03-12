import * as React from 'react'

// Styles
import Styles from './styles'

interface Props {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  errorLabel?: string | null
  withPasswordVisible?: boolean
  onBlurInput?: Function
}

const TextInput: React.FC<Props> = (props) => {
  const { label, value, onChange, type, errorLabel, withPasswordVisible, onBlurInput } = props

  const textInputRef = React.useRef<HTMLInputElement>(null)
  const visibleBlockRef = React.useRef<HTMLDivElement>(null)

  const [isFocused, setIsFocused] = React.useState<boolean>(false)
  const [isPasswordVisible, setPasswordVisible] = React.useState<boolean>(false)

  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    if (
      (visibleBlockRef.current && !visibleBlockRef.current.contains(event.target as Node)) ||
      !withPasswordVisible
    ) {
      textInputRef.current?.focus()
    }
  }

  const onFocus = (): void => {
    setIsFocused(true)
  }

  const onBlur = (): void => {
    setIsFocused(false)
    if (onBlurInput) {
      onBlurInput()
    }
  }

  return (
    <Styles.Container
      onClick={onClick}
      isFocused={isFocused}
      isError={errorLabel !== undefined && errorLabel !== null && !isFocused && value.length > 0}
    >
      <Styles.Row isActive={isFocused || value?.length > 0}>
        <Styles.Label>
          {errorLabel && !isFocused && value.length > 0 ? errorLabel : label}
        </Styles.Label>
        {type === 'number ' ? (
          <Styles.NumberInput
            ref={textInputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            onChange={onChange}
          />
        ) : (
          <Styles.Input
            ref={textInputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            onChange={onChange}
            type={type === 'password' && isPasswordVisible ? 'text' : type}
          />
        )}
      </Styles.Row>
      {withPasswordVisible ? (
        <Styles.VisibleInput
          ref={visibleBlockRef}
          onClick={() => setPasswordVisible(!isPasswordVisible)}
        >
          <Styles.EyeIcon isVisible={isPasswordVisible} />
        </Styles.VisibleInput>
      ) : null}
    </Styles.Container>
  )
}

export default TextInput
