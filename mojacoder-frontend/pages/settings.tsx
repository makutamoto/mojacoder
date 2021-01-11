import React, { useCallback, useState } from 'react'
import { Alert } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation } from '../lib/backend'
import Layout from '../components/Layout'
import Top from '../components/Top'
import UserIcon from '../components/UserIcon'
import ButtonWithSpinner from '../components/ButtonWithSpinner'
import Dropzone from '../components/Dropzone'

const Status = {
    Normal: 'Normal',
    UpdatingIcon: 'UpdatingIcon',
    ClearingIcon: 'ClearingIcon',
    DoneIcon: 'DoneIcon',
    ErrorIcon: 'ErrorIcon',
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
            if (files.length === 0) return
            const reader = new FileReader()
            reader.onload = () => {
                setIcon(reader.result as string)
            }
            reader.readAsDataURL(files[0])
        },
        [setIcon]
    )
    const onClearIcon = useCallback(async () => {
        setStatus(Status.ClearingIcon)
        try {
            await invokeMutation(SetUserIcon, { input: null })
        } catch (err) {
            console.error(err)
            setStatus(Status.ErrorIcon)
            return
        }
        setStatus(Status.DoneIcon)
    }, [setStatus])
    const onUpdateIcon = useCallback(async () => {
        setStatus(Status.UpdatingIcon)
        try {
            await invokeMutation(SetUserIcon, {
                input: {
                    icon: icon.replace(/data:[^,]+?,/, ''),
                },
            })
        } catch (err) {
            console.error(err)
            setStatus(Status.ErrorIcon)
            return
        }
        setStatus(Status.DoneIcon)
    }, [setStatus, icon])
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
                        <Alert
                            show={status === Status.ErrorIcon}
                            variant="danger"
                        >{t`errorMessage`}</Alert>
                        <div className="text-center">
                            <UserIcon size={256} src={icon}>
                                {auth}
                            </UserIcon>
                            <UserIcon size={24} src={icon}>
                                {auth}
                            </UserIcon>
                        </div>
                        <Dropzone
                            accept="image/png"
                            onDrop={onIconDrop}
                            multiple={false}
                            message={t`dropHereOrSelect`}
                            description={t`regulationOfIcon`}
                        />
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
