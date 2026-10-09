import { readFileSync } from 'fs'
import { resolve } from 'path'
import { buildSchema, execute, validate } from 'graphql'

import { invokeQueryWithApiKey } from '../../lib/backend'
import { getServerSideProps } from '../../pages/sitemap.xml'

jest.mock('../../lib/backend', () => ({
    invokeQueryWithApiKey: jest.fn(),
}))

// AppSync provides these scalars and directives when loading the backend schema.
const schema = buildSchema(`
    scalar AWSDateTime
    scalar AWSURL
    directive @aws_api_key
        on OBJECT | FIELD_DEFINITION | INPUT_OBJECT | INPUT_FIELD_DEFINITION
    directive @aws_cognito_user_pools
        on OBJECT | FIELD_DEFINITION | INPUT_OBJECT | INPUT_FIELD_DEFINITION
    directive @aws_iam
        on OBJECT | FIELD_DEFINITION | INPUT_OBJECT | INPUT_FIELD_DEFINITION
    directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION
    ${readFileSync(
        resolve(__dirname, '../../../mojacoder-backend/graphql/schema.graphql'),
        'utf8'
    )}
`)

describe('sitemap.xml', () => {
    it('generates a valid sitemap with a query accepted by the backend schema', async () => {
        const query = invokeQueryWithApiKey as jest.Mock
        query.mockImplementation(async (document) => {
            const errors = validate(schema, document)
            if (errors.length > 0) {
                throw errors[0]
            }
            const result = await execute({
                schema,
                document,
                rootValue: {
                    newProblems: {
                        items: [
                            {
                                slug: 'a-plus-b',
                                title: 'A + B',
                                datetime: '2026-10-09T00:00:00Z',
                                user: { detail: { screenName: 'alice' } },
                            },
                        ],
                    },
                },
            })
            if (result.errors) {
                throw result.errors[0]
            }
            return result.data
        })

        const previousOrigin = process.env.ORIGIN
        process.env.ORIGIN = 'https://mojacoder.example'
        const setHeader = jest.fn()
        const end = jest.fn()

        try {
            await getServerSideProps({ res: { setHeader, end } } as any)
        } finally {
            if (previousOrigin === undefined) {
                delete process.env.ORIGIN
            } else {
                process.env.ORIGIN = previousOrigin
            }
            query.mockReset()
        }

        expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/xml')
        expect(setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            's-maxage=86400'
        )
        expect(end).toHaveBeenCalledTimes(1)

        const sitemap = new DOMParser().parseFromString(
            end.mock.calls[0][0],
            'application/xml'
        )
        expect(sitemap.querySelector('parsererror')).toBeNull()
        expect(
            Array.from(
                sitemap.querySelectorAll('loc'),
                (node) => node.textContent
            )
        ).toEqual([
            'https://mojacoder.example',
            'https://mojacoder.example/problems',
            'https://mojacoder.example/users/alice/problems/a-plus-b',
        ])
        expect(sitemap.querySelector('lastmod')?.textContent).toBe(
            '2026-10-09T00:00:00Z'
        )
    })
})
