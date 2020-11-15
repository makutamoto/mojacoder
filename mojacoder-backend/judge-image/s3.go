package main

import (
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"

	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

var s3Downloader *s3manager.Downloader

func downloadFromS3(path string, bucket, key string) error {
	var err error
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	_, err = s3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return err
}
