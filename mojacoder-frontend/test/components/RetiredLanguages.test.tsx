import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'

import SubmissionBox from '../../components/SubmissionBox'
import Playground from '../../pages/playground'
import { invokeMutation } from '../../lib/backend'

jest.mock('next/router', () => ({
    useRouter: () => ({ asPath: '/problem', push: jest.fn() }),
}))
jest.mock('../../lib/auth', () => ({
    __esModule: true,
    default: { useContainer: () => ({ auth: { userID: 'test-user' } }) },
}))
jest.mock('../../lib/session', () => ({
    __esModule: true,
    default: { useContainer: () => ({ session: { id: 'test-session' } }) },
}))
jest.mock('../../lib/backend', () => ({
    invokeMutation: jest.fn(),
    invokeMutationWithApiKey: jest.fn(),
    useSubscription: jest.fn(),
}))
jest.mock('../../lib/i18n', () => ({
    useI18n: () => ({ t: (strings) => strings[0] }),
}))
jest.mock('../../components/Editor', () => {
    const React = require('react')
    return ({ value, onChange, readOnly }) =>
        React.createElement('textarea', {
            'data-testid': 'editor',
            value,
            readOnly,
            onChange: (event) => onChange && onChange(event.target.value),
        })
})
jest.mock('../../components/Selector', () => {
    const React = require('react')
    return ({ value, options, onChange }) =>
        React.createElement(
            'select',
            {
                'aria-label': 'language',
                value,
                onChange: (event) => onChange(event.target.value),
            },
            options.map((option) =>
                React.createElement(
                    'option',
                    { key: option.value, value: option.value },
                    option.label
                )
            )
        )
})
jest.mock('../../components/Title', () => () => null)
jest.mock('../../components/Layout', () => ({ children }) => children)
jest.mock('../../components/Top', () => ({ children }) => children)

const retiredLanguages = [
    'kotlin-1.9.21',
    'csharp-mono-csc-3.9.0',
    'csharp-mono-mcs-6.12.0',
    'commonlisp-2.1.11',
    'nim-1.6.16',
]

beforeEach(() => {
    window.localStorage.clear()
    jest.clearAllMocks()
    ;(invokeMutation as jest.Mock).mockResolvedValue({})
})

describe.each(['submission', 'playground'])(
    '%s with a saved language',
    (page) => {
        test.each(retiredLanguages)(
            'keeps the code and requires another language when %s is retired',
            async (lang) => {
                window.localStorage.setItem('code-lang', lang)
                const ui = render(
                    page === 'submission' ? (
                        <SubmissionBox
                            id="test-editor"
                            problemID="test-problem"
                            redirect="submissions"
                        />
                    ) : (
                        <Playground />
                    )
                )
                const codeEditor = ui.getAllByTestId(
                    'editor'
                )[0] as HTMLTextAreaElement
                fireEvent.change(codeEditor, {
                    target: { value: 'saved code' },
                })
                const button = ui.getByRole('button', {
                    name: page === 'submission' ? 'submit' : 'run',
                }) as HTMLButtonElement

                expect(
                    ui.getByText(
                        'この言語は現在利用できません。別の言語を選択してください。'
                    )
                ).toBeTruthy()
                expect(button.disabled).toBe(true)
                fireEvent.click(button)
                expect(invokeMutation).not.toHaveBeenCalled()

                fireEvent.change(ui.getByLabelText('language'), {
                    target: { value: 'go-1.21' },
                })
                expect(codeEditor.value).toBe('saved code')
                expect(button.disabled).toBe(false)
                expect(window.localStorage.getItem('code-lang')).toBe('go-1.21')
                fireEvent.click(button)
                await waitFor(() =>
                    expect(invokeMutation).toHaveBeenCalledTimes(1)
                )
                expect(invokeMutation).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        input: expect.objectContaining({
                            lang: 'go-1.21',
                            code: 'saved code',
                        }),
                    })
                )
            }
        )
    }
)
