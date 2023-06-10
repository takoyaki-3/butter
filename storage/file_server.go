package main

import (
	"log"
	"net/http"
)

func main() {
	dir := "./public/v0.0.0" // ホストするディレクトリを指定する
	port := "8000" // 使用するポート番号を指定する

	fs := http.FileServer(http.Dir(dir))
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
	http.ListenAndServe(":"+port, corsHandler(http.DefaultServeMux))
	log.Printf("Serving %s on HTTP port: %s\n", dir, port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
