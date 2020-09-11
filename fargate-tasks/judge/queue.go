package main

import (
	"encoding/json"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type JudgeQueueData struct {
	Type         string `json:"type"`
	SubmissionID string `json:"submissionID"`
}

type JudgeQueueMessage struct {
	message *sqs.Message
	data    JudgeQueueData
}

const JUDGEQUEUE_WAIT_TIMEOUT = 20

var judgeQueue *sqs.SQS

func receiveJudgeQueueMessage() (JudgeQueueMessage, bool, error) {
	var message JudgeQueueMessage
	var err error
	res, err := judgeQueue.ReceiveMessage(&sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(JUDGEQUEUE_URL),
		MaxNumberOfMessages: aws.Int64(1),
		WaitTimeSeconds:     aws.Int64(JUDGEQUEUE_WAIT_TIMEOUT),
	})
	if err != nil {
		return message, false, err
	}
	if len(res.Messages) == 0 {
		return message, false, nil
	}
	message.message = res.Messages[0]
	err = json.Unmarshal([]byte(*message.message.Body), &message.data)
	if err != nil {
		return message, false, err
	}
	return message, true, nil
}

func deleteJudgeQueueMessage(message *sqs.Message) error {
	_, err := judgeQueue.DeleteMessage(&sqs.DeleteMessageInput{
		QueueUrl:      aws.String(JUDGEQUEUE_URL),
		ReceiptHandle: aws.String(*message.ReceiptHandle),
	})
	return err
}
