import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import {
    Alert,
    Button,
    ButtonGroup,
    Form,
    Tab,
    Tabs,
    Table,
} from 'react-bootstrap'
import gql from 'graphql-tag'
import {
    ChevronUpIcon,
    ChevronDownIcon,
    TrashIcon,
} from '@primer/octicons-react'

import Auth from '../lib/auth'
import { invokeMutation, invokeQuery } from '../lib/backend'
import { ContestStatus } from '../lib/backend_types'
import Editor from '../components/Editor'
import Markdown from '../components/Markdown'
import ButtonWithSpinner from '../components/ButtonWithSpinner'

function getLocalDatetime(date: Date) {
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    const hours = ('0' + date.getHours()).slice(-2)
    const minutes = ('0' + date.getMinutes()).slice(-2)
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

const GetProblemID = gql`
    query GetProblemID($problemOwner: String!, $problemSlug: String!) {
        user(username: $problemOwner) {
            problem(slug: $problemSlug) {
                id
            }
        }
    }
`
const CreateContest = gql`
    mutation CreateContest($input: CreateContestInput!) {
        createContest(input: $input) {
            id
        }
    }
`
const UpdateContest = gql`
    mutation UpdateContest($input: UpdateContestInput!) {
        updateContest(input: $input) {
            id
        }
    }
`
const DeleteContest = gql`
    mutation DeleteContest($input: DeleteContestInput!) {
        deleteContest(input: $input)
    }
`
const Status = {
    Normal: 'Normal',
    LoadingProblem: 'LoadingProblem',
    ProblemNotFound: 'ProblemNotFound',
    Creating: 'Creating',
    SlugNotSpecified: 'SlugNotSpecified',
    Deleting: 'Deleting',
} as const
type Status = typeof Status[keyof typeof Status]
interface ContestEditorProblem {
    id: string
    point: number
    owner: string
    slug: string
}
interface ContestEditorData {
    slug: string
    name: string
    status: ContestStatus
    description: string
    startDatetime: string
    duration: number
    penaltySeconds: number
    problems: ContestEditorProblem[]
}
interface ContestEditorProps {
    data?: ContestEditorData
}
const ContestEditor: React.FC<ContestEditorProps> = ({ data }) => {
    const [status, setStatus] = useState<Status>(Status.Normal)
    const { auth } = Auth.useContainer()
    const router = useRouter()
    const [contestSlug, setContestSlug] = useState(data?.slug || '')
    const [contestName, setContestName] = useState(data?.name || '')
    const [contestStartDatetime, setContestStartDatetime] = useState(
        data?.startDatetime || new Date().toISOString()
    )
    const [contestDuration, setContestDuration] = useState(
        data?.duration || 5400
    )
    const [contestPenaltySeconds, setContestPenaltySeconds] = useState(
        data?.penaltySeconds || 300
    )
    const [contestStatus, setContestStatus] = useState(
        data?.status || ContestStatus.PUBLIC
    )
    const [contestDescription, setContestDescription] = useState(
        data?.description || ''
    )
    const [contestTasks, setTasks] = useState<ContestEditorProblem[]>(
        data?.problems || []
    )
    const [currentProblem, setCurrentProblem] = useState('')
    const onAddTask = useCallback(
        (problemName: string) => {
            const addTask = async () => {
                setStatus(Status.LoadingProblem)
                const [problemOwner, problemSlug] = [
                    ...problemName.split('/'),
                    '',
                ]
                const problemID = (
                    await invokeQuery(GetProblemID, {
                        problemOwner,
                        problemSlug,
                    })
                ).user?.problem?.id
                if (!problemID) {
                    setStatus(Status.ProblemNotFound)
                    return
                }
                setTasks([
                    ...contestTasks,
                    {
                        id: problemID,
                        point: 100,
                        owner: problemOwner,
                        slug: problemSlug,
                    },
                ])
                setCurrentProblem('')
                setStatus(Status.Normal)
            }
            addTask()
        },
        [contestTasks]
    )
    const onDeleteTask = useCallback(
        (index: number) => {
            const newTasks = [...contestTasks]
            newTasks.splice(index, 1)
            setTasks(newTasks)
        },
        [contestTasks]
    )
    const swapTasks = useCallback(
        (a: number, b: number) => {
            const newTasks = [...contestTasks]
            const temp = newTasks[a]
            newTasks[a] = newTasks[b]
            newTasks[b] = temp
            setTasks(newTasks)
        },
        [contestTasks]
    )
    const onSetPoint = useCallback(
        (index: number, point: number) => {
            const newTasks = [...contestTasks]
            newTasks[index].point = point
            setTasks(newTasks)
        },
        [contestTasks]
    )
    const onCreate = useCallback(() => {
        const create = async () => {
            if (!contestSlug) {
                setStatus(Status.SlugNotSpecified)
                return
            }
            setStatus(Status.Creating)
            await invokeMutation(data ? UpdateContest : CreateContest, {
                input: {
                    slug: contestSlug,
                    name: contestName,
                    status: contestStatus,
                    description: contestDescription,
                    startDatetime: contestStartDatetime,
                    duration: contestDuration,
                    penaltySeconds: contestPenaltySeconds,
                    problems: contestTasks.map((task) => ({
                        problemID: task.id,
                        point: task.point,
                    })),
                },
            })
            router.push(`/users/${auth.screenName}/contests/${contestSlug}`)
        }
        create()
    }, [
        data,
        auth,
        contestSlug,
        contestName,
        contestStatus,
        contestDescription,
        contestStartDatetime,
        contestDuration,
        contestPenaltySeconds,
        contestTasks,
        router,
    ])
    const onDelete = useCallback(() => {
        const deleteContest = async () => {
            if (!window.confirm('削除してよろしいですか？')) return
            setStatus(Status.Deleting)
            await invokeMutation(DeleteContest, {
                input: {
                    slug: contestSlug,
                },
            })
            router.push('/')
        }
        deleteContest()
    }, [contestSlug, router])
    return (
        <>
            <Tabs
                defaultActiveKey="statement"
                variant="pills"
                transition={false}
            >
                <Tab className="py-3" eventKey="statement" title="コンテスト">
                    <Form.Group>
                        <Form.Label>問題Slug</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="a-plus-b..."
                            readOnly={data !== undefined}
                            value={contestSlug}
                            onChange={(e) =>
                                setContestSlug(e.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>コンテスト名</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Test Contest 1..."
                            value={contestName}
                            onChange={(e) =>
                                setContestName(e.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>開始時間</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            placeholder="Test Contest 1..."
                            value={
                                contestStartDatetime === ''
                                    ? ''
                                    : getLocalDatetime(
                                          new Date(contestStartDatetime)
                                      )
                            }
                            onChange={(e) =>
                                setContestStartDatetime(
                                    new Date(
                                        e.currentTarget.value
                                    ).toISOString()
                                )
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>コンテスト時間(秒)</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="5400"
                            value={contestDuration}
                            onChange={(e) =>
                                setContestDuration(
                                    Number(e.currentTarget.value)
                                )
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>ペナルティ(秒)</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="300"
                            value={contestPenaltySeconds}
                            onChange={(e) =>
                                setContestPenaltySeconds(
                                    Number(e.currentTarget.value)
                                )
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Check
                            type="switch"
                            id="not-listed-switch"
                            label="コンテスト一覧に表示しない。"
                            checked={contestStatus === ContestStatus.UNLISTED}
                            onChange={(e) =>
                                setContestStatus(
                                    e.currentTarget.checked
                                        ? ContestStatus.UNLISTED
                                        : ContestStatus.PUBLIC
                                )
                            }
                        />
                    </Form.Group>
                    <h6>コンテストの説明(Markdown)</h6>
                    <Editor
                        lang="markdown"
                        lineNumbers
                        value={contestDescription}
                        onChange={setContestDescription}
                    />
                    <h6>問題文(プレビュー)</h6>
                    <Markdown source={contestDescription} />
                </Tab>
                <Tab className="py-3" eventKey="testcases" title="問題">
                    <Table responsive bordered striped hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>問題名</th>
                                <th>得点</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contestTasks.map((task, i) => (
                                <tr key={task.id}>
                                    <td>{i + 1}</td>
                                    <td>
                                        {task.owner}/{task.slug}
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            placeholder="makutamoto/a-plus-b..."
                                            value={task.point}
                                            onChange={(e) =>
                                                onSetPoint(
                                                    i,
                                                    Number(
                                                        e.currentTarget.value
                                                    )
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <ButtonGroup size="sm">
                                            <Button
                                                variant="secondary"
                                                disabled={i === 0}
                                                onClick={() =>
                                                    swapTasks(i - 1, i)
                                                }
                                            >
                                                <ChevronUpIcon />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                disabled={
                                                    i + 1 ===
                                                    contestTasks.length
                                                }
                                                onClick={() =>
                                                    swapTasks(i, i + 1)
                                                }
                                            >
                                                <ChevronDownIcon />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => onDeleteTask(i)}
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Form.Group>
                        <Form.Label>ユーザー名/問題Slug</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="makutamoto/a-plus-b..."
                            value={currentProblem}
                            onChange={(e) =>
                                setCurrentProblem(e.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <Alert
                        variant="danger"
                        show={status === Status.ProblemNotFound}
                    >
                        問題が存在しません。
                    </Alert>
                    <div className="text-right">
                        <ButtonWithSpinner
                            variant="secondary"
                            loading={status === Status.LoadingProblem}
                            onClick={() => onAddTask(currentProblem)}
                        >
                            追加
                        </ButtonWithSpinner>
                    </div>
                </Tab>
            </Tabs>
            <hr />
            <Alert variant="danger" show={status === Status.SlugNotSpecified}>
                Slugが指定されていません。
            </Alert>
            <div className="text-right">
                {data && (
                    <>
                        <ButtonWithSpinner
                            variant="danger"
                            loading={status === Status.Deleting}
                            onClick={onDelete}
                        >
                            削除
                        </ButtonWithSpinner>{' '}
                    </>
                )}
                <ButtonWithSpinner
                    loading={status === Status.Creating}
                    onClick={onCreate}
                >
                    {data ? '更新' : '作成'}
                </ButtonWithSpinner>
            </div>
        </>
    )
}
export default ContestEditor
