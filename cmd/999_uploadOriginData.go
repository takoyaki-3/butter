package main

import (
	"io"
	"fmt"
	"log"
	"time"

	. "github.com/takoyaki-3/butter/cmd/helper"
	gos3 "github.com/takoyaki-3/go-s3"
	json "github.com/takoyaki-3/go-json"
)

type OriginalData struct {
	DataList []OriginalDataItem `json:"data_list"`
}
type OriginalDataItem struct {
	Key string `json:"key"`
}

func main() {
	sourceDir := "./v0.0.0/"
	now := time.Now().Format("20060102-150405")
	targetFile := now + ".tar"

	s3, err := gos3.NewSession("s3-conf.json")
	if err != nil {
		log.Fatalln(err)
	}

	// 1. 指定したディレクトリ内のファイルを.tar形式にまとめる
	err = CreateTarArchive(sourceDir, targetFile)
	if err != nil {
		fmt.Printf("Error creating tar archive: %v\n", err)
		return
	}

	// 2. 現在のバージョン情報を取得する
	var originalData OriginalData
	err = s3.DownloadToReaderFunc("v0.0.0/originalData/info.json", func(r io.Reader) error {
		err := json.LoadFromReader(r, &originalData)
		if err != nil {
			return err
		}
		return nil
	})

	// 3. 新しいデータをアップロードする
	key := "v0.0.0/originalData/" + targetFile
	err = s3.UploadFromPath(targetFile, key)
	if err!=nil{
		log.Fatalln(err)
	}

	// 4. ファイルとオリジナルデータバージョン情報をアップロードする
	originalData.DataList = append(originalData.DataList, OriginalDataItem{Key: targetFile})
	key = "v0.0.0/originalData/info.json"
	str, _ := json.DumpToString(originalData)
	err = s3.UploadFromRaw([]byte(str), key)
	if err!=nil{
		log.Fatalln(err)
	}
}
