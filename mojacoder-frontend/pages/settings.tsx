import React, { useCallback, useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation } from '../lib/backend'
import Layout from '../components/Layout'
import Top from '../components/Top'
import ButtonWithSpinner from '../components/ButtonWithSpinner'
import Heading from '../components/Heading'
import Title from '../components/Title'

const Status = {
    Normal: 'Normal',
    UpdatingScreenName: 'UpdatingScreenName',
    DoneScreenName: 'DoneScreenName',
    ErrorScreenName: 'ErrorScreenName',
} as const
type Status = typeof Status[keyof typeof Status]

const RenameScreenName = gql`
    mutation RenameScreenName($screenName: String!) {
        renameScreenName(screenName: $screenName)
    }
`

const Settings: React.FC = () => {
    const { t } = useI18n('settings')
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [screenName, setScreenName] = useState<string>('')
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
