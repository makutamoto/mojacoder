import React, { createContext, useContext } from 'react'

interface Languages {
    [language: string]: Namespaces
}

interface Namespaces {
    [translation: string]: Translations
}

interface Translations {
    [key: string]: string
}

interface I18nProviderProps {
    defaultLanguage: string
    lang: string
    languages: Languages
}

interface Context {
    lang: string
    namespaces: Namespaces
}

const context = createContext<Context>(null)
export const I18nProvider: React.FC<I18nProviderProps> = (props) => {
    const { defaultLanguage, languages } = props
    let { lang } = props
    if (!Object.prototype.hasOwnProperty.call(languages, lang))
        lang = defaultLanguage
    return (
        <context.Provider
            value={{
                lang,
                namespaces: languages[lang],
            }}
        >
            {props.children}
        </context.Provider>
    )
}

export function useI18n(namespace: string) {
    const { lang, namespaces } = useContext(context)
    const t = (key: ReadonlyArray<string>) => {
        if (!Object.prototype.hasOwnProperty.call(namespaces, namespace))
            return undefined
        const ns = namespaces[namespace]
        if (!Object.prototype.hasOwnProperty.call(ns, key[0])) return undefined
        return ns[key[0]]
    }
    return {
        lang,
        t,
    }
}
