import API, { graphqlOperation, GraphQLResult } from '@aws-amplify/api'
import Observable from 'zen-observable-ts'
import gql from 'graphql-tag'

export interface SubscriptionResponse<T> {
  value: {
    data: T
  }
  errors: any
}

export interface RunCodetestResponse {
  runCodetest: {
    id: string
  }
}

export interface OnResponseCodetestResponse {
  exitCode: number
  time: number
  memory: number
  stdout: string
  stderr: string
}

export function runCodetest(
  lang: string,
  code: string,
  stdin: string
): Promise<OnResponseCodetestResponse> {
  return new Promise((resolve, reject) => {
    const mutationOperation = gql`
      mutation runCodetest($input: RunCodetestInput!) {
        runCodetest(input: $input) {
          id
        }
      }
    `
    const subscriptionOperation = gql`
      subscription onResponseCodetest($id: ID!) {
        onResponseCodetest(id: $id) {
          exitCode
          time
          memory
          stderr
          stdout
        }
      }
    `
    ;(API.graphql(
      graphqlOperation(mutationOperation, {
        input: { lang, code, stdin },
      })
    ) as Promise<GraphQLResult<RunCodetestResponse>>).then(
      (mutationResponse) => {
        const subscriptionResponse = API.graphql(
          graphqlOperation(subscriptionOperation, {
            id: mutationResponse.data.runCodetest.id,
          })
        ) as Observable<
          SubscriptionResponse<{
            onResponseCodetest: OnResponseCodetestResponse
          }>
        >
        const subscription = subscriptionResponse.subscribe({
          next: (res) => {
            subscription.unsubscribe()
            if (res.errors) reject(res.errors)
            else resolve(res.value.data.onResponseCodetest)
          },
          error: (err) => {
            reject(err)
          },
        })
      },
      (err) => reject(err)
    )
  })
}
