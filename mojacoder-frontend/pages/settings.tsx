import React, { useCallback, useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation } from '../lib/backend'
import Layout from '../components/Layout'
import Top from '../components/Top'
import UserIcon from '../components/UserIcon'
import ButtonWithSpinner from '../components/ButtonWithSpinner'
import Dropzone from '../components/Dropzone'
import Heading from '../components/Heading'
import Title from '../components/Title'

const Status = {
    Normal: 'Normal',
    UpdatingIcon: 'UpdatingIcon',
    ClearingIcon: 'ClearingIcon',
    DoneIcon: 'DoneIcon',
    ErrorIcon: 'ErrorIcon',
    UpdatingScreenName: 'UpdatingScreenName',
    DoneScreenName: 'DoneScreenName',
    ErrorScreenName: 'ErrorScreenName',
} as const
type Status = typeof Status[keyof typeof Status]

const SetUserIcon = gql`
    mutation SetUserIcon($input: SetUserIconInput) {
        setUserIcon(input: $input)
    }
`

const RenameScreenName = gql`
    mutation RenameScreenName($screenName: String!) {
        renameScreenName(screenName: $screenName)
    }
`

const Settings: React.FC = () => {
    const { t } = useI18n('settings')
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [icon, setIcon] = useState<string | null>(null)
    const [screenName, setScreenName] = useState<string>('')
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
    const onUpdateUsername = useCallback(async () => {
        setStatus(Status.UpdatingScreenName)
        try {
            await invokeMutation(RenameScreenName, {
                screenName,
            })
        } catch (err) {
            console.error(err)
            setStatus(Status.ErrorScreenName)
            return
        }
        setStatus(Status.DoneScreenName)
    }, [setStatus, screenName])
    return (
        <>
            <Title>設定</Title>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                {auth ? (
                    <>
                        <Heading>{t`icon`}</Heading>
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

                        <Heading>{t`username`}</Heading>
                        <Alert
                            show={status === Status.DoneScreenName}
                            variant="success"
                        >{t`updatedMessage`}</Alert>
                        <Alert
                            show={status === Status.ErrorScreenName}
                            variant="danger"
                        >{t`renamingErrorMessage`}</Alert>
                        <Alert variant="warning">{t`renamingUsernameAlert`}</Alert>
                        <Form.Group>
                            <Form.Control
                                type="text"
                                placeholder={`${auth.screenName}...`}
                                value={screenName}
                                onChange={(e) =>
                                    setScreenName(e.currentTarget.value)
                                }
                            />
                        </Form.Group>
                        <div className="text-right">
                            <ButtonWithSpinner
                                loading={status === Status.UpdatingScreenName}
                                disabled={screenName.length === 0}
                                onClick={onUpdateUsername}
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
