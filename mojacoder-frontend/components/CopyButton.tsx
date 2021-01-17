import React, { useRef, useState } from 'react'
import { Button, ButtonProps, Overlay, Tooltip } from 'react-bootstrap'
import { CopyIcon } from '@primer/octicons-react'
import copy from 'copy-text-to-clipboard'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'ref'> {
    value: string
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, ...buttonProps }) => {
    const copyButton = useRef(null)
    const [lastTimeout, setLastTimeout] = useState<null | ReturnType<
        typeof setTimeout
    >>(null)
    const [tooltipVisible, setTooltipVisible] = useState(false)
    return (
        <>
            <Button
                {...buttonProps}
                ref={copyButton}
                onClick={() => {
                    copy(value)
                    setTooltipVisible(true)
                    if (lastTimeout) clearTimeout(lastTimeout)
                    setLastTimeout(
                        setTimeout(() => setTooltipVisible(false), 500)
                    )
                }}
            >
                <CopyIcon size={16} />
            </Button>
            <Overlay target={copyButton.current} show={tooltipVisible}>
                <Tooltip id="sample-copied-tooltip">Copied!</Tooltip>
            </Overlay>
        </>
    )
}
export default CopyButton
