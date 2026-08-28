import { generateProblemOGP } from '../../lib/cloudinary'
import { ProblemDetail } from '../../lib/backend_types'

const problem = {
    title: 'Example problem',
    user: {
        detail: {
            userID: 'user-with-an-uploaded-icon',
            screenName: 'Alice',
            icon: true,
        },
    },
} as ProblemDetail

test('uses the default avatar for problem OGP images', () => {
    const url = generateProblemOGP(problem)

    expect(url).not.toContain('icon.mojacoder.app')
    expect(url).not.toContain(problem.user.detail.userID)
})
