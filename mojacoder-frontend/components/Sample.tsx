import React, { useRef, useState } from 'react'
import { Button, Overlay, Tooltip } from 'react-bootstrap'
import { CopyIcon } from '@primer/octicons-react'
import copy from 'copy-text-to-clipboard'

interface Props {
    title: string
    value: string
}

const Sample: React.FC<Props> = (props) => {
    const copyButton = useRef(null)
    const [lastTimeout, setLastTimeout] = useState<null | ReturnType<
        typeof setTimeout
    >>(null)
    const [tooltipVisible, setTooltipVisible] = useState(false)
    return (
        <>
            <div className="my-2 p-2 border rounded bg-light">
                <h6 className="d-inline">{props.title}</h6>
                <Button
                    ref={copyButton}
                    className="px-1 py-0"
                    variant="light"
                    onClick={() => {
                        copy(props.value)
                        setTooltipVisible(true)
                        if (lastTimeout) clearTimeout(lastTimeout)
                        setLastTimeout(
                            setTimeout(() => setTooltipVisible(false), 500)
                        )
                    }}
                >
                    <CopyIcon size={16} />
                </Button>
                <pre
                    {...({ readonly: 'true' } as any)}
                    className="form-control mt-1 mb-0"
                >
                    {props.value}
                </pre>
            </div>
            <Overlay target={copyButton.current} show={tooltipVisible}>
                <Tooltip id="sample-copied-tooltip">Copied!</Tooltip>
            </Overlay>
        </>
    )
}
export default Sample
