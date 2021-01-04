import React, { useCallback, useState } from 'react'
import { Alert } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation } from '../lib/backend'
import Layout from '../components/Layout'
import Top from '../components/Top'
import UserIcon from '../components/UserIcon'
import ButtonWithSpinner from '../components/ButtonWithSpinner'

const Status = {
    Normal: 'Normal',
    UpdatingIcon: 'UpdatingIcon',
    ClearingIcon: 'ClearingIcon',
    DoneIcon: 'DoneIcon',
} as const
type Status = typeof Status[keyof typeof Status]

const SetUserIcon = gql`
    mutation SetUserIcon($input: SetUserIconInput) {
        setUserIcon(input: $input)
    }
`

const Settings: React.FC = () => {
    const { t } = useI18n('settings')
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [icon, setIcon] = useState<string | null>(null)
    const onIconDrop = useCallback(
        (files: File[]) => {
            const reader = new FileReader()
            reader.onload = () => {
                setIcon(reader.result as string)
            }
            reader.readAsDataURL(files[0])
        },
        [setIcon]
    )
    const { getRootProps, getInputProps } = useDropzone({
        accept: 'image/png',
        onDrop: onIconDrop,
        multiple: false,
    })
    const onClearIcon = useCallback(async () => {
        setStatus(Status.ClearingIcon)
        await invokeMutation(SetUserIcon, { input: null })
        setStatus(Status.DoneIcon)
    }, [setStatus])
    const onUpdateIcon = useCallback(async () => {
        setStatus(Status.UpdatingIcon)
        await invokeMutation(SetUserIcon, {
            input: {
                icon: icon.replace(/data:[^,]+?,/, ''),
            },
        })
        setStatus(Status.DoneIcon)
    }, [setStatus])
    return (
        <>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                {auth ? (
                    <>
                        <h2>{t`icon`}</h2>
                        <hr />
                        <Alert
                            show={status === Status.DoneIcon}
                            variant="success"
                        >{t`updatedMessage`}</Alert>
                        <div className="text-center">
                            <UserIcon width={256} src={icon}>
                                {auth}
                            </UserIcon>
                            <UserIcon width={24} src={icon}>
                                {auth}
                            </UserIcon>
                        </div>
                        <div
                            {...getRootProps({
                                className: 'my-3 border rounded p-3 bg-light',
                            })}
                        >
                            <input {...getInputProps()} />
                            {t`dropHereOrSelect`}
                            <div className="text-muted">{t`regulationOfIcon`}</div>
                        </div>
                        <div className="text-right">
                            <ButtonWithSpinner
                                variant="danger"
                                loading={status === Status.ClearingIcon}
                                onClick={onClearIcon}
                            >{t`clearIcon`}</ButtonWithSpinner>{' '}
                            <ButtonWithSpinner
                                loading={status === Status.UpdatingIcon}
                                disabled={icon === null}
                                onClick={onUpdateIcon}
                            >{t`update`}</ButtonWithSpinner>
                        </div>
                    </>
                ) : (
                    <Alert variant="danger">{t`signInRequired`}</Alert>
                )}
            </Layout>
        </>
    )
}

export default Settings
