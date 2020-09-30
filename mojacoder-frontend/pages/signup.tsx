import React from 'react'
import { Button, Form } from 'react-bootstrap'

const SignUp: React.FC = () => {
    return (
        <Form>
            <h1>新規登録</h1>
            <hr />
            <Form.Group>
                <Form.Label>ユーザー名</Form.Label>
                <Form.Control
                    type="text"
                    required
                    placeholder="Makutamoto..."
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>メールアドレス</Form.Label>
                <Form.Control
                    type="email"
                    required
                    placeholder="makutamoto@example.com..."
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>パスワード</Form.Label>
                <Form.Control
                    type="password"
                    required
                    placeholder="password..."
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>パスワードの確認</Form.Label>
                <Form.Control
                    type="password"
                    required
                    placeholder="password..."
                />
            </Form.Group>
            <Button>登録</Button>
        </Form>
    )
}

export default SignUp
