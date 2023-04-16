package main

import (
	"log"
	"net/http"
)

func main() {
	dir := "./dist" // ホストするディレクトリを指定する
	port := "8000" // 使用するポート番号を指定する

	fs := http.FileServer(http.Dir(dir))
	http.Handle("/", fs)

	log.Printf("Serving %s on HTTP port: %s\n", dir, port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
