package main

import (
	"io/ioutil"
	"bytes"
	"log"
	"net/http"
	"time"
)

func monitorURL(url string, filePath string) {
	ticker := time.NewTicker(1 * time.Minute)
	for {
		select {
		case <-ticker.C:
			resp, err := http.Get(url)
			if err != nil {
				log.Printf("Error fetching URL: %v", err)
				continue
			}
			defer resp.Body.Close()

			content, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Printf("Error reading response body: %v", err)
				continue
			}

			// 文字数が100字以下の場合、処理をスキップ
			if len(content) <= 100 {
				log.Printf("Content is less than or equal to 100 characters, skipping update.")
				continue
			}

			// ファイルから前回の内容を読み込む
			lastContent, err := ioutil.ReadFile(filePath)
			if err != nil {
				log.Printf("Error reading from file: %v, assuming it's a new content", err)
				lastContent = nil
			}

			if lastContent == nil || !bytes.Equal(lastContent, content) {
				log.Printf("Content has been modified, saving to file: %s", filePath)
				err = ioutil.WriteFile(filePath, content, 0644)
				if err != nil {
					log.Printf("Error writing to file: %v", err)
				}
			}
		}
	}
}

func monitorFile(filePath, timeFilePath string, done chan bool) {
	ticker := time.NewTicker(1 * time.Minute)
	var lastFileContent []byte
	lastFileContent, _ = ioutil.ReadFile(filePath)

	for {
		select {
		case <-ticker.C:
			fileContent, err := ioutil.ReadFile(filePath)
			if err != nil {
				log.Printf("Error reading file: %v", err)
				continue
			}

			if !bytes.Equal(fileContent, lastFileContent) {
				log.Printf("File %s has been modified", filePath)
				lastFileContent = fileContent
				time.AfterFunc(10*time.Second, func() {
					done <- true
				})
			}

			// 現在の時刻を取得し、ファイルに書き込む
			currentTime := time.Now().Format(time.RFC3339)
			if err := ioutil.WriteFile(timeFilePath, []byte(currentTime), 0644); err != nil {
				log.Printf("Error writing last checked time: %v", err)
			}
		}
	}
}

func main() {

	go monitorURL("https://butter.takoyaki3.com/code/serverUpdater.go", "./serverUpdater.go")
	go monitorURL("https://butter.takoyaki3.com/code/dataUpdater.go", "./dataUpdater.go")
	go monitorURL("https://butter.takoyaki3.com/code/fileServer.go", "./fileServer.go")
	go monitorURL("https://butter.takoyaki3.com/code/go.mod", "./go.mod")
	go monitorURL("https://butter.takoyaki3.com/code/go.sum", "./go.sum")

	done := make(chan bool)
	go monitorFile("./serverUpdater.go", "./serverUpdaterLastCheckedTime.txt", done)

	<-done
	log.Printf("File has been modified. Shutting down in 10 seconds.")
	time.Sleep(10 * time.Second)
	log.Printf("Shutting down server.")
}