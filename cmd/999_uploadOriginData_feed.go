package main

import (
	"fmt"
	"io"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"io/ioutil"
	"log"
	"time"

	. "github.com/takoyaki-3/butter/cmd/helper"
	json "github.com/takoyaki-3/go-json"
	gos3 "github.com/takoyaki-3/go-s3"

	"os"
	"path/filepath"
	"strings"
)

type OriginalData struct {
	DataList []OriginalDataItem `json:"data_list"`
}
type OriginalDataItem struct {
	Key string `json:"key"`
}



func VerifySignature(originalFilePath, signatureFilePath, publicKeyPath string) bool {
	// 公開鍵の読み込み
	publicKeyBytes, err := ioutil.ReadFile(publicKeyPath)
	if err != nil {
		log.Fatalf("Failed to load public key: %v", err)
		return false
	}

	// PEMデコード
	block, _ := pem.Decode(publicKeyBytes)
	if block == nil || block.Type != "PUBLIC KEY" {
		log.Fatalf("Failed to decode PEM block containing public key")
		return false
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		log.Fatalf("Failed to parse public key: %v", err)
		return false
	}

	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		log.Fatalf("Not an RSA public key")
		return false
	}

	// 元のファイルのハッシュの計算
	originalData, err := ioutil.ReadFile(originalFilePath)
	if err != nil {
		log.Fatalf("Failed to read original file: %v", err)
		return false
	}
	hashed := sha256.Sum256(originalData)

	// 署名の読み込み
	signature, err := ioutil.ReadFile(signatureFilePath)
	if err != nil {
		log.Fatalf("Failed to read signature file: %v", err)
		return false
	}

	// 署名の検証
	err = rsa.VerifyPKCS1v15(rsaPub, crypto.SHA256, hashed[:], signature)
	if err != nil {
		log.Printf("Signature verification failed: %v", err)
		return false
	}

	return true
}

func CheckAllSignaturesInDir(directory, publicKeyPath string) error {
	return filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// ディレクトリと.sig拡張子のファイルはスキップ
		if info.IsDir() || strings.HasSuffix(path, ".sig") {
			return nil
		}

		signaturePath := path + ".sig"
		if _, err := os.Stat(signaturePath); os.IsNotExist(err) {
			return fmt.Errorf("signature file not found for %s", path)
		}

		// 署名を検証
		if !VerifySignature(path, signaturePath, publicKeyPath) {
			return fmt.Errorf("signature verification failed for %s", path)
		}

		return nil
	})
}

func checkData()error{
	directory := "./v1.0.0"
	publicKeyPath := "./public_Key.pem" // 公開鍵ファイルのパス

	if err := CheckAllSignaturesInDir(directory, publicKeyPath); err != nil {
		fmt.Println("Error:", err)
	}
	return nil
}

func main() {

	fmt.Println("start upload origin data feed")

	if err:=checkData();err!=nil{
		log.Fatalln(err)
		return
	}

	sourceDir := "./v1.0.0/"
	now := time.Now().Format("20060102-150405")
	targetFile := now + ".tar"

	s3, err := gos3.NewSession("s3-conf.json")
	if err != nil {
		log.Fatalln(err)
	}
	// 0. index.htmlのコピー	
	newFile, err := os.Create("v1.0.0/index.html")
	if err != nil {
		fmt.Println(err)
	}
	oldFile, err := os.Open("index.html")
	if err != nil {
		fmt.Println(err)
	}

	io.Copy(newFile, oldFile)

	// 1. 指定したディレクトリ内のファイルを.tar形式にまとめる
	err = CreateTarArchive(sourceDir, targetFile)
	if err != nil {
		fmt.Printf("Error creating tar archive: %v\n", err)
		return
	}

	// 2. 現在のバージョン情報を取得する
	var originalData OriginalData
	err = s3.DownloadToReaderFunc("v1.0.0/originalData/info.json", func(r io.Reader) error {
		err := json.LoadFromReader(r, &originalData)
		if err != nil {
			return err
		}
		return nil
	})

	// 3. 新しいデータをアップロードする
	key := "v1.0.0/originalData/" + targetFile
	err = s3.UploadFromPath(targetFile, key)
	if err != nil {
		log.Fatalln(err)
	}

	// 4. ファイルとオリジナルデータバージョン情報をアップロードする
	originalData.DataList = append(originalData.DataList, OriginalDataItem{Key: targetFile})
	key = "v1.0.0/originalData/info.json"
	str, _ := json.DumpToString(originalData)
	err = s3.UploadFromRaw([]byte(str), key)
	if err != nil {
		log.Fatalln(err)
	}
}
