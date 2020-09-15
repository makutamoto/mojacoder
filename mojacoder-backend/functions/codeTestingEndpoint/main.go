package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
)

type CodeRunnerParam struct {
	InputType string `json:"inputType"`
	Code      string `json:"code"`
}

func handler(ctx context.Context) (CodeRunnerParam, error) {
	return CodeRunnerParam{"code", "#include<stdio.h>\nint main() { puts(\"Hello world\"); }"}, nil
}

func main() {
	lambda.Start(handler)
}
