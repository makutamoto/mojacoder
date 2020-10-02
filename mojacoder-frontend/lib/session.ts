import { useMemo, useState } from 'react'
import { createContainer } from 'unstated-next'
import { v4 as uuid } from 'uuid'

export interface Session {
    id: string
}

function useSession(initialState?: string) {
    const id = initialState ?? useMemo(() => uuid(), [])
    const [session] = useState({ id })
    return { session }
}
export default createContainer(useSession)
