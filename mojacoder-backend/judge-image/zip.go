package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func unzip(src, dest string) error {
	const errorMessage = "Failed to unzip an archive: %v"
	var err error
	zipReader, err := zip.OpenReader(src)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	defer zipReader.Close()

	for _, file := range zipReader.File {
		fileReader, err := file.Open()
		if err != nil {
			return err
		}
		defer fileReader.Close()

		path := filepath.Join(dest, file.Name)
		if !file.FileInfo().IsDir() {
			dirname, _ := filepath.Split(path)
			os.MkdirAll(dirname, file.Mode())
			file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE, file.Mode())
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			defer file.Close()

			_, err = io.Copy(file, fileReader)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
		}
	}
	return nil
}
