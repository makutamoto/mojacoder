import { readFileSync } from 'fs'
import { join } from 'path'

import { SUBMISSION_LANGUAGES } from '../../lib/submission_languages'

test('offers exactly the languages executable by the judge image', () => {
    const definitions = JSON.parse(
        readFileSync(
            join(
                __dirname,
                '../../../mojacoder-backend/judge-image/language-definition.json'
            ),
            'utf8'
        )
    )
    expect(SUBMISSION_LANGUAGES.map(({ value }) => value).sort()).toEqual(
        Object.keys(definitions).sort()
    )
})
