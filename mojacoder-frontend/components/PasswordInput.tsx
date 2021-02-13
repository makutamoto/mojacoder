import React from 'react'

import { useI18n } from '../lib/i18n'
import InputWithLabel, { InputWithLabelProps } from './InputWithLabel'

type PasswordInputProps = InputWithLabelProps

export default (({ ...inputProps }) => {
    const { t } = useI18n('passwordControl')
    return (
        <InputWithLabel
            label={t`password`}
            type="password"
            placeholder="password..."
            pattern="^(?=.*?[!-\/:-@\[-`{-~])(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])[!-~]{8,128}$"
            message={t`passwordConstraintsMessage`}
            invalidFeedback={t`passwordConstraintsMessage`}
            {...inputProps}
        />
    )
}) as React.FC<PasswordInputProps>
