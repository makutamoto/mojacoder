import { getJudgeStatusFromTestcases, JudgeStatus } from '../../lib/JudgeStatus'
import { SubmissionStatus } from '../../lib/backend_types'

describe('getJudgeStatusFromTestcases', () => {
    const testcases = [
        { name: 'AC', status: JudgeStatus.AC, time: 100, memory: 256 },
        { name: 'WA', status: JudgeStatus.WA, time: 100, memory: 500 },
        { name: 'TLE', status: JudgeStatus.TLE, time: 2000, memory: 256 },
        { name: 'WJ', status: JudgeStatus.WJ, time: -1, memory: -1 },
    ]
    test('should return the correct status and progress', () => {
        const result = getJudgeStatusFromTestcases(
            SubmissionStatus.WJ,
            testcases
        )
        expect(result).toEqual({
            wholeStatus: JudgeStatus.TLE,
            progress: { current: 3, whole: testcases.length },
            time: 2000,
            memory: 500,
        })
    })
    test('should return status CE and null progress', () => {
        const result = getJudgeStatusFromTestcases(
            SubmissionStatus.CE,
            testcases
        )
        expect(result).toEqual({
            wholeStatus: JudgeStatus.CE,
            progress: null,
        })
    })
    test('should return status IE and null progress', () => {
        const result = getJudgeStatusFromTestcases(
            SubmissionStatus.IE,
            testcases
        )
        expect(result).toEqual({
            wholeStatus: JudgeStatus.IE,
            progress: null,
        })
    })
    test('should return status JCE and null progress', () => {
        const result = getJudgeStatusFromTestcases(
            SubmissionStatus.JCE,
            testcases
        )
        expect(result).toEqual({
            wholeStatus: JudgeStatus.JCE,
            progress: null,
        })
    })
    test('should return status AC when zero testcases and submission status is JUDGED', () => {
        const result = getJudgeStatusFromTestcases(SubmissionStatus.JUDGED, [])
        expect(result).toEqual({
            wholeStatus: JudgeStatus.AC,
            progress: null,
            memory: -1,
            time: -1,
        })
    })
})
