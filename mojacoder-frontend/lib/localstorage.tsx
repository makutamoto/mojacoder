import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage(
    key: string,
    initialState: string
): [string, (value: string) => void] {
    const [state, setState] = useState(initialState)
    const setStateAndLocalStorage = useCallback(
        (value: string) => {
            window.localStorage.setItem(key, value)
            setState(value)
        },
        [key]
    )
    useEffect(() => {
        const item = window.localStorage.getItem(key)
        if (item !== null) setState(item)
    }, [])
    return [state, setStateAndLocalStorage]
}
