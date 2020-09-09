import React from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

import LanguageSelector from './LanguageSelector';
import { Alert, Button } from 'react-bootstrap';

if(process.browser) {
    require('codemirror/mode/clike/clike');
    require('codemirror/mode/go/go');
    require('codemirror/mode/python/python');
    require('codemirror/mode/markdown/markdown');
}

export interface SubmissionBoxProps {
    id: string,
    login: boolean,
    lang: string,
    code: string,
    onLangChange: (value: string) => void,
    onCodeChange: (value: string) => void,
    onCodeSubmit: () => void,
}

const LANGUAGE_TO_MODE: { [index: string]: string } = {
    "python3.8": "python",
    "go-1.14": "text/x-go",
};

const SubmissionBox: React.FC<SubmissionBoxProps> = (props) => {
    return (
        <div>
            <h2>提出</h2>
            <hr />
            {props.login ? (
                <>
                    <LanguageSelector id={props.id} value={props.lang} onChange={props.onLangChange} />
                    <CodeMirror
                        className="my-2"
                        value={props.code}
                        options={{
                            mode: LANGUAGE_TO_MODE[props.lang],
                            lineNumbers: true,
                        }}
                        onBeforeChange={(_editor, _data, value) => props.onCodeChange(value)}
                    />
                    <Button variant="primary" onClick={props.onCodeSubmit}>提出</Button>
                </>
            ) : (
                <Alert variant="danger">提出するにはサインインしてください。</Alert>
            )}
        </div>
    );
};

export default SubmissionBox;
