package main

import (
	"log"
	"net/http"
	"time"
	"bytes"
	"io/ioutil"
)

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
	dir := "./public/v0.0.0"
	port := "8000"

	fs := http.FileServer(http.Dir(dir))
	http.HandleFunc("/server", func(w http.ResponseWriter, r *http.Request) {
		responseMessage := "{\"version\":\"1.1\"}"
		w.Write([]byte(responseMessage))
	})
	http.Handle("/", fs)

	// CORS設定
	headers := make(http.Header)
	headers.Set("Access-Control-Allow-Origin", "*")
	headers.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	headers.Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")
	corsHandler := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for key, values := range headers {
				for _, value := range values {
					w.Header().Add(key, value)
				}
			}
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	done := make(chan bool)
	go monitorFile("./fileServer.go", "./fileServerLastCheckedTime.txt", done)

	go func() {
		log.Printf("Serving %s on HTTP port: %s\n", dir, port)
		log.Fatal(http.ListenAndServe(":"+port, corsHandler(http.DefaultServeMux)))
	}()

	<-done
	log.Printf("File has been modified. Shutting down in 10 seconds.")
	time.Sleep(10 * time.Second)
	log.Printf("Shutting down server.")
}