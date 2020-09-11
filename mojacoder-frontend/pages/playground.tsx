import React, { useCallback, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'

import { runCodetest, OnResponseCodetestResponse } from '../lib/backend'
import CodeEditor, { Code } from '../components/CodeEditor'
import Editor from '../components/Editor'

interface Props {
  login: boolean
}

const Codetest: React.FC<Props> = (props) => {
  const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState<OnResponseCodetestResponse>({
    exitCode: 0,
    time: 0,
    memory: 0,
    stdout: '',
    stderr: '',
  })
  const onRun = useCallback(() => {
    runCodetest(code.lang, code.code, stdin).then((res) => {
      setResult(res)
    })
  }, [code, stdin])
  return (
    <>
      <h1>Playground</h1>
      <hr />
      <Alert variant="primary">
        コードテストではMojaCoderのジャッジ上でコードの動作を確認することができます。
      </Alert>
      {props.login ? (
        <>
          <CodeEditor
            id="codetest-submission"
            value={code}
            onChange={setCode}
          />
          <h2>標準入力</h2>
          <hr />
          <Editor value={stdin} onChange={setStdin} />
          <Button variant="primary" onClick={onRun}>
            実行
          </Button>
          <h2>標準出力</h2>
          <hr />
          <Editor value={result.stdout} readOnly />
          <h2>標準エラー出力</h2>
          <hr />
          <Editor value={result.stderr} readOnly />
        </>
      ) : (
        <Alert variant="danger">
          Playgroundを実行するにはサインインして下さい。
        </Alert>
      )}
    </>
  )
}

export default Codetest
