import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Button, Form, Tab, Tabs, Table } from 'react-bootstrap'
import gql from 'graphql-tag'
import parse from 'path-parse'
import axios from 'axios'
import { OrderedMap } from 'immutable'
import JSZip from 'jszip'

import { invokeMutation } from '../lib/backend'
import Editor from '../components/Editor'
import AlertWithSpinner from '../components/AlertWithSpinner'
import Dropzone from '../components/Dropzone'
import Markdown from '../components/Markdown'
import ButtonWithSpinner from '../components/ButtonWithSpinner'
import ORSeparator from '../components/ORSeparator'

const IssueUrl = gql`
    mutation IssueUrl($input: IssueProblemUploadUrlInput!) {
        issueProblemUploadUrl(input: $input)
    }
`
async function uploadProblem(slug: string, data: any) {
    const { issueProblemUploadUrl } = await invokeMutation(IssueUrl, {
        input: {
            problemName: slug,
        },
    })
    await axios.put(issueProblemUploadUrl, data, {
        headers: {
            'Content-Type': 'application/zip',
        },
    })
}

const ZipUploaderStatus = {
    Normal: 'Normal',
    Posting: 'Posting',
    Done: 'Done',
    FileTypeError: 'FileTypeError',
} as const
type ZipUploaderStatus = typeof ZipUploaderStatus[keyof typeof ZipUploaderStatus]
interface ZipUploaderProps {
    zip?: Blob
}
const ZipUploader: React.FC<ZipUploaderProps> = ({ zip }) => {
    const [status, setStatus] = useState<ZipUploaderStatus>(
        ZipUploaderStatus.Normal
    )
    const onPost = useCallback(async (files: File[]) => {
        setStatus(ZipUploaderStatus.Posting)
        if (files.length === 0) {
            setStatus(ZipUploaderStatus.FileTypeError)
            return
        }
        for (const file of files) {
            const { name } = parse(file.name)
            await uploadProblem(name, file)
        }
        setStatus(ZipUploaderStatus.Done)
    }, [])
    const downloadUri = useMemo(() => {
        if (zip) return URL.createObjectURL(zip)
        return null
    }, [zip])
    return (
        <>
            <Dropzone
                accept={['application/zip', 'application/x-zip-compressed']}
                onDrop={onPost}
                message="ここにZipファイルをドロップするか、クリックしてファイルを選択して下さい。"
                description={
                    downloadUri && (
                        <a
                            href={downloadUri}
                            download="problem.zip"
                            onClick={(e) => e.stopPropagation()}
                        >
                            現在のZipファイルをダウンロード
                        </a>
                    )
                }
            />
            <div className="mt-4">
                <AlertWithSpinner
                    show={status === ZipUploaderStatus.Posting}
                    variant="primary"
                >
                    アップロード中です。
                </AlertWithSpinner>
                <Alert
                    show={status === ZipUploaderStatus.Done}
                    variant="success"
                >
                    完了しました。
                </Alert>
                <Alert
                    show={status === ZipUploaderStatus.FileTypeError}
                    variant="danger"
                >
                    ファイルタイプが異なります。
                </Alert>
            </div>
        </>
    )
}

const WebEditorStatus = {
    Normal: 'Normal',
    AlreadyExists: 'AlreadyExists',
    Posting: 'Posting',
    SlugNotSpecified: 'SlugNotSpecified',
    Done: 'Done',
    Deleting: 'Deleting',
} as const
type WebEditorStatus = typeof WebEditorStatus[keyof typeof WebEditorStatus]
export interface Testcase {
    input: string
    output: string
}
function readFileAsText(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
    })
}
const DeleteProblem = gql`
    mutation DeleteProblem($input: DeleteProblemInput!) {
        deleteProblem(input: $input)
    }
`
export interface WebEditorData {
    slug: string
    title: string
    statement: string
    editorial: string
    difficulty: string
    testcases: OrderedMap<string, Testcase>
}
interface WebEditorProps {
    data?: WebEditorData
    setZip: (zip: Blob) => void
}
const WebEditor: React.FC<WebEditorProps> = ({ data, setZip }) => {
    const [status, setStatus] = useState<WebEditorStatus>(
        WebEditorStatus.Normal
    )
    const router = useRouter()
    const [problemSlug, setProblemSlug] = useState(data?.slug || '')
    const [problemTitle, setProblemTitle] = useState(data?.title || '')
    const [problemDifficulty, setProblemDifficulty] = useState(
        data?.difficulty || ''
    )
    const [problemStatement, setProblemStatement] = useState(
        data?.statement || ''
    )
    const [problemEditorial, setProblemEditorial] = useState(
        data?.editorial || ''
    )
    const [testcases, setTestcases] = useState(
        data?.testcases || OrderedMap<string, Testcase>()
    )
    const [currentTestcase, setCurrentTestcase] = useState<string | null>(null)
    const [testcaseName, setTestcaseName] = useState('')
    const [testcaseInput, setTestcaseInput] = useState('')
    const [testcaseOutput, setTestcaseOutput] = useState('')
    const onSelectTestcase = useCallback(
        (name: string) => {
            const testcase = testcases.get(currentTestcase)
            if (
                testcase &&
                (testcase.input !== testcaseInput ||
                    testcase.output !== testcaseOutput)
            ) {
                window.alert('テストケースが更新されていません。')
                return
            }
            setCurrentTestcase(name)
            setTestcaseName(name)
            const { input, output } = testcases.get(name)
            setTestcaseInput(input)
            setTestcaseOutput(output)
        },
        [testcases, currentTestcase, testcaseInput, testcaseOutput]
    )
    const onAddTestcase = useCallback(() => {
        let number = 1
        const testcaseName = (n: number) => `testcase-${n}.txt`
        while (testcases.has(testcaseName(number))) number++
        setTestcases(
            testcases.set(testcaseName(number), {
                input: '',
                output: '',
            })
        )
    }, [testcases, setTestcases])
    const onDeleteTestcase = useCallback(() => {
        setTestcases(testcases.delete(currentTestcase))
        setCurrentTestcase(null)
    }, [testcases, currentTestcase, setTestcases, setCurrentTestcase])
    const onUpdateTestcase = useCallback(() => {
        if (testcaseName !== currentTestcase && testcases.has(testcaseName)) {
            setStatus(WebEditorStatus.AlreadyExists)
            return
        }
        setStatus(WebEditorStatus.Normal)
        setTestcases(
            testcases.delete(currentTestcase).set(testcaseName, {
                input: testcaseInput,
                output: testcaseOutput,
            })
        )
        setCurrentTestcase(testcaseName)
    }, [
        testcases,
        testcaseInput,
        testcaseOutput,
        currentTestcase,
        testcaseName,
    ])
    const onRestoreTestcase = useCallback(() => {
        setTestcaseName(currentTestcase)
        const { input, output } = testcases.get(currentTestcase)
        setTestcaseInput(input)
        setTestcaseOutput(output)
    }, [testcases, currentTestcase])
    const onTestcaseDrop = useCallback(
        async (inputTestcase: boolean, files: File[]) => {
            let tempTestcases = testcases
            for (const file of files) {
                const data = await readFileAsText(file)
                const input = inputTestcase
                    ? data
                    : tempTestcases.get(file.name)?.input || ''
                const output = inputTestcase
                    ? tempTestcases.get(file.name)?.output || ''
                    : data
                tempTestcases = tempTestcases.set(file.name, {
                    input,
                    output,
                })
                setTestcases(tempTestcases)
                if (file.name === currentTestcase) {
                    if (inputTestcase) setTestcaseInput(data)
                    else setTestcaseOutput(data)
                }
            }
        },
        [testcases, currentTestcase]
    )
    const onPost = useCallback(async () => {
        const testcase = testcases.get(currentTestcase)
        if (
            testcase &&
            (testcase.input !== testcaseInput ||
                testcase.output !== testcaseOutput)
        ) {
            window.alert('テストケースが更新されていません。')
            return
        }
        if (problemSlug.length === 0) {
            setStatus(WebEditorStatus.SlugNotSpecified)
            return
        }
        setStatus(WebEditorStatus.Posting)
        const zip = new JSZip()
        zip.file(
            'problem.json',
            JSON.stringify({
                title: problemTitle,
                difficulty: problemDifficulty,
            })
        )
        zip.file('README.md', problemStatement)
        if (problemEditorial) zip.file('EDITORIAL.md', problemEditorial)
        const testcasesDirectory = zip.folder('testcases')
        const inDirectory = testcasesDirectory.folder('in')
        const outDirectory = testcasesDirectory.folder('out')
        testcases.forEach(({ input, output }, key) => {
            inDirectory.file(key, input)
            outDirectory.file(key, output)
        })
        const data = await zip.generateAsync({
            type: 'blob',
        })
        setZip(data)
        await uploadProblem(problemSlug, data)
        setStatus(WebEditorStatus.Done)
    }, [
        problemSlug,
        problemTitle,
        problemDifficulty,
        problemStatement,
        problemEditorial,
        testcases,
        currentTestcase,
        testcaseInput,
        testcaseOutput,
    ])
    const onDelete = useCallback(async () => {
        if (!window.confirm('削除してよろしいですか？')) return
        setStatus(WebEditorStatus.Deleting)
        await invokeMutation(DeleteProblem, {
            input: {
                slug: problemSlug,
            },
        })
        router.push('/')
    }, [problemSlug, router])
    return (
        <>
            <Tabs
                defaultActiveKey="statement"
                variant="pills"
                transition={false}
            >
                <Tab className="py-3" eventKey="statement" title="問題文">
                    <Form.Group>
                        <Form.Label>問題Slug</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="a-plus-b..."
                            readOnly={data !== undefined}
                            value={problemSlug}
                            onChange={(e) =>
                                setProblemSlug(e.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>タイトル</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="A + B..."
                            value={problemTitle}
                            onChange={(e) =>
                                setProblemTitle(e.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>難易度</Form.Label>
                        <Form.Control
                            as="select"
                            value={problemDifficulty}
                            onChange={(e) =>
                                setProblemDifficulty(e.currentTarget.value)
                            }
                        >
                            <option>-</option>
                            <option value="gray">灰</option>
                            <option value="brown">茶</option>
                            <option value="green">緑</option>
                            <option value="cyan">水</option>
                            <option value="blue">青</option>
                            <option value="yellow">黄</option>
                            <option value="orange">橙</option>
                            <option value="red">赤</option>
                        </Form.Control>
                    </Form.Group>
                    <h6>問題文(Markdown)</h6>
                    <Editor
                        lang="markdown"
                        lineNumbers
                        value={problemStatement}
                        onChange={setProblemStatement}
                    />
                    <h6>問題文(プレビュー)</h6>
                    <Markdown source={problemStatement} />
                </Tab>
                <Tab className="py-3" eventKey="testcases" title="テストケース">
                    <Table responsive bordered striped hover>
                        <thead>
                            <tr>
                                <th></th>
                                <th className="w-100">テストケース名</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testcases.entrySeq().map(([name]) => (
                                <tr key={name}>
                                    <td>
                                        <Form.Check
                                            type="radio"
                                            name="testcaseSelect"
                                            checked={currentTestcase === name}
                                            onChange={() =>
                                                onSelectTestcase(name)
                                            }
                                        />
                                    </td>
                                    <td>{name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Dropzone
                        message="ここに入力テストケースファイルをドロップするか、クリックして選択することでも追加できます。"
                        multiple
                        onDrop={(files) => onTestcaseDrop(true, files)}
                    />
                    <Dropzone
                        message="ここに出力テストケースファイルをドロップするか、クリックして選択することでも追加できます。"
                        multiple
                        onDrop={(files) => onTestcaseDrop(false, files)}
                    />
                    <div className="text-right">
                        <Button variant="danger" onClick={onDeleteTestcase}>
                            削除
                        </Button>{' '}
                        <Button variant="secondary" onClick={onAddTestcase}>
                            追加
                        </Button>
                    </div>
                    {currentTestcase && (
                        <>
                            <Form.Group>
                                <Form.Label>テストケース名</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="sample-1.txt..."
                                    value={testcaseName}
                                    onChange={(e) =>
                                        setTestcaseName(e.currentTarget.value)
                                    }
                                />
                            </Form.Group>
                            <h6>入力</h6>
                            <Editor
                                lineNumbers
                                value={testcaseInput}
                                onChange={setTestcaseInput}
                            />
                            <h6>出力</h6>
                            <Editor
                                lineNumbers
                                value={testcaseOutput}
                                onChange={setTestcaseOutput}
                            />
                            <Alert
                                variant="danger"
                                show={status === WebEditorStatus.AlreadyExists}
                            >
                                既に同じ名前のテストケースが存在します。
                            </Alert>
                            <div className="text-right">
                                <Button
                                    variant="danger"
                                    onClick={onRestoreTestcase}
                                >
                                    もとに戻す
                                </Button>{' '}
                                <Button
                                    variant="secondary"
                                    onClick={onUpdateTestcase}
                                >
                                    更新
                                </Button>
                            </div>
                        </>
                    )}
                </Tab>
                <Tab className="py-3" eventKey="editorial" title="解説">
                    <h6>解説(Markdown)</h6>
                    <Editor
                        lang="markdown"
                        lineNumbers
                        value={problemEditorial}
                        onChange={setProblemEditorial}
                    />
                    <h6>解説(プレビュー)</h6>
                    <Markdown source={problemEditorial} />
                </Tab>
            </Tabs>
            <hr />
            <Alert
                variant="danger"
                show={status === WebEditorStatus.SlugNotSpecified}
            >
                Slugが指定されていません。
            </Alert>
            <Alert variant="success" show={status === WebEditorStatus.Done}>
                完了しました。
            </Alert>
            <div className="text-right">
                {data && (
                    <>
                        <ButtonWithSpinner
                            variant="danger"
                            loading={status === WebEditorStatus.Deleting}
                            onClick={onDelete}
                        >
                            削除
                        </ButtonWithSpinner>{' '}
                    </>
                )}
                <ButtonWithSpinner
                    loading={status === WebEditorStatus.Posting}
                    onClick={onPost}
                >
                    投稿
                </ButtonWithSpinner>
            </div>
        </>
    )
}

export interface ProblemEditorData {
    zip: Blob
    problem: WebEditorData
}
export interface ProblemEditorProps {
    data?: ProblemEditorData
}
const ProblemEditor: React.FC<ProblemEditorProps> = ({ data }) => {
    const [zip, setZip] = useState(data?.zip)
    return (
        <>
            <ZipUploader zip={zip} />
            <ORSeparator />
            <WebEditor data={data?.problem} setZip={setZip} />
        </>
    )
}
export default ProblemEditor
