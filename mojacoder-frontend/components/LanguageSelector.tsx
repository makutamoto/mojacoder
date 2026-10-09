import React from 'react'

import { SUBMISSION_LANGUAGES } from '../lib/submission_languages'
import Selector, { SelectorProps } from './Selector'

export type LanguageSelectorProps = Omit<SelectorProps, 'options'>

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
    return <Selector {...props} options={SUBMISSION_LANGUAGES} />
}

export default LanguageSelector
