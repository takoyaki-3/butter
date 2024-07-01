package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sync"

	"github.com/takoyaki-3/butter/cmd/helper"
)

// Worker function to sign files
func signWorker(files <-chan string, privateKeyData []byte, wg *sync.WaitGroup) {
	defer wg.Done()
	for path := range files {
		err := helper.AddSing(path, privateKeyData)
		if err != nil {
			log.Printf("Error signing file %s: %v", path, err)
		}
	}
}

func SignAllFilesInDir(directory string, privateKeyPath string, workerCount int) error {
	privateKeyData, err := ioutil.ReadFile(privateKeyPath)
	if err != nil {
		return err
	}

	files := make(chan string, 100) // Buffer size of 100 for file paths
	var wg sync.WaitGroup

	// Start worker goroutines
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go signWorker(files, privateKeyData, &wg)
	}

	err = filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Skip already signed files
		if filepath.Ext(path) == ".sig" {
			return nil
		}

		// Send file path to workers
		files <- path
		return nil
	})

	if err != nil {
		close(files)
		wg.Wait()
		return err
	}

	// Close the channel and wait for all workers to finish
	close(files)
	wg.Wait()

	return nil
}

func main() {
	fmt.Println("start sign")
	workerCount := 10 // Number of parallel workers
	err := SignAllFilesInDir("./v0.0.0/", "key.pem", workerCount)
	if err != nil {
		log.Fatalln(err)
	}
	err = SignAllFilesInDir("./v1.0.0/", "key.pem", workerCount)
	if err != nil {
		log.Fatalln(err)
	}
}
