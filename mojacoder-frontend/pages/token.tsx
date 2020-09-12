import { useRouter } from 'next/router'

import { useAuthRedirect } from '../lib/auth'

export default function Token() {
    const router = useRouter()

    useAuthRedirect(() => {
        router.replace('/')
    })

    return <p>loading..</p>
}
