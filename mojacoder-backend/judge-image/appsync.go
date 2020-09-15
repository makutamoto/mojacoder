package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	v4 "github.com/aws/aws-sdk-go/aws/signer/v4"
)

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type GraphQLResponseErrorDetail struct {
	ErrorType string `json:"errorType"`
	Message   string `json:"message"`
}

type GraphQLResponseErrors []GraphQLResponseErrorDetail

func (errs *GraphQLResponseErrors) Error() string {
	message := "["
	for i, err := range *errs {
		message += fmt.Sprintf("{ ErrorType: %s, Message: %s }", err.ErrorType, err.Message)
		if i != len(*errs)-1 {
			message += ","
		}
	}
	message += "]"
	return message
}

type GraphQLResponse struct {
	Data   interface{}           `json:"data"`
	Errors GraphQLResponseErrors `json:"errors"`
}

var signer *v4.Signer

func requestGraphql(query string, variables map[string]interface{}, responseData ...interface{}) error {
	var err error
	var response GraphQLResponse
	client := &http.Client{}
	request := GraphQLRequest{query, variables}
	requestData, err := json.Marshal(&request)
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", API_ENDPOINT, bytes.NewReader(requestData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	signer.Sign(req, bytes.NewReader(requestData), "appsync", AWS_REGION, time.Now())
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	bodyData, err := ioutil.ReadAll(res.Body)
	if len(responseData) > 0 {
		response.Data = responseData
	}
	err = json.Unmarshal(bodyData, &response)
	if err != nil {
		return err
	}
	if len(response.Errors) > 0 {
		return &response.Errors
	}
	return nil
}

type ResponsePlaygroundInput struct {
	SessionID string `json:"sessionID"`
	UserID    string `json:"userID"`
	ExitCode  int    `json:"exitCode"`
	Time      int    `json:"time"`
	Memory    int    `json:"memory"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
}

func responsePlayground(sessionID string, userID string, exitCode int, time, memory int, stdout, stderr string) error {
	variables := make(map[string]interface{})
	query := `
		mutation ResponsePlayground($input: ResponsePlaygroundInput!) {
			responsePlayground(input: $input) {
				sessionID
				userID
				exitCode
				time
				memory
				stdout
				stderr
			}
		}
	`
	variables["input"] = ResponsePlaygroundInput{sessionID, userID, exitCode, time, memory, stdout, stderr}
	err := requestGraphql(query, variables)
	return err
}
