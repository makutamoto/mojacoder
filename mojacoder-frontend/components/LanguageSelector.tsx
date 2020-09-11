import React from 'react'
import Select from 'react-select'

export interface LanguageSelectorProps {
  id: string
  value: string
  onChange: (value: string) => void
}

const OPTIONS = [
  { value: 'go-1.14', label: 'Go (1.14)' },
  { value: 'python3.8', label: 'Python 3.8' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
  return (
    <Select
      id={props.id}
      instanceId={props.id}
      value={OPTIONS.find((value) => value.value === props.value)}
      options={OPTIONS}
      onChange={(value) => props.onChange((value as any).value)}
    />
  )
}

export default LanguageSelector
