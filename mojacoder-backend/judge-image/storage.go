package main

import (
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"

	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

var storage *s3.S3
var storageDownloader *s3manager.Downloader

func downloadFromStorage(path string, bucket, key string) error {
	const errorMessage = "Failed to download %s from %s: %v"
	var err error
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf(errorMessage, key, bucket, err)
	}
	_, err = storageDownloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf(errorMessage, key, bucket, err)
	}
	return nil
}

func deleteFromStorage(bucket, key string) error {
	const errorMessage = "Failed to delete %s from %s: %v"
	_, err := storage.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf(errorMessage, key, bucket, err)
	}
	return nil
}
