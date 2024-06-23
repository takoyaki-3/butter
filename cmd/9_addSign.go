package main

import (
	"github.com/takoyaki-3/butter/cmd/helper"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
)

func SignAllFilesInDir(directory string, privateKeyPath string) error {
	privateKeyData, err := ioutil.ReadFile(privateKeyPath)
	if err != nil {
		return err
	}

	return filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// ディレクトリはスキップ
		if info.IsDir() {
			return nil
		}

		// ファイルの拡張子が.sigの場合は署名をスキップ
		if filepath.Ext(path) == ".sig" {
			return nil
		}

		// ファイルに署名を付与
		return helper.AddSing(path, privateKeyData)
	})
}

func main() {
	err := SignAllFilesInDir("./v0.0.0/", "key.pem")
	if err != nil {
		log.Fatalln(err)
	}
	err = SignAllFilesInDir("./v1.0.0/", "key.pem")
	if err != nil {
		log.Fatalln(err)
	}
}
