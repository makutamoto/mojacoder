import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { Alert } from 'react-bootstrap';

import { submitCodetest } from '../../lib/backend';
import SubmissionBox from '../../components/SubmissionBox';

interface Props {
    login: boolean,
}

const Codetest: React.FC<Props> = (props) => {
    const router = useRouter();
    const [lang, setLang] = useState("go-1.14");
    const [code, setCode] = useState("");
    const [stdin, setStdin] = useState("");
    const onCodeSubmit = useCallback(() => {
        submitCodetest("A", lang, code, stdin).then(() => {
            router.push('/codetest/submissions');
        });
    }, [lang, code, stdin]);
    return (
        <>
            <Alert variant="primary">コードテストではMojaCoderのジャッジ上でコードの動作を確認することができます。</Alert>
            <h2>標準入力</h2>
            <hr />
            <CodeMirror
                className="my-2"
                value={stdin}
                onBeforeChange={(_editor, _data, value) => setStdin(value)}
            />
            <SubmissionBox
                id="codetest-submission"
                login={props.login}
                lang={lang}
                code={code}
                onLangChange={value => setLang(value)}
                onCodeChange={value => setCode(value)}
                onCodeSubmit={onCodeSubmit}
            />
        </>
    );
};

export default Codetest;
