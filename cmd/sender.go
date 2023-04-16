package main

import (
	"crypto"
	"archive/tar"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"os"
	"strings"
	"path/filepath"
)

func main() {
	sourceDir := "./dist/"
	targetFile := "archive.tar"
	serverAddr := "takoyaki3.com:8001"

	// 1. 指定したディレクトリ内のファイルを.tar形式にまとめる
	err := createTarArchive(sourceDir, targetFile)
	if err != nil {
		fmt.Printf("Error creating tar archive: %v\n", err)
		return
	}

	// 2. ソケット通信で.tarファイルを送信する
	conn, err := net.Dial("tcp", serverAddr)
	if err != nil {
		fmt.Printf("Error connecting to server: %v\n", err)
		return
	}
	defer conn.Close()

	file, err := os.Open(targetFile)
	if err != nil {
		fmt.Printf("Error opening tar file: %v\n", err)
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		fmt.Printf("Error getting file info: %v\n", err)
		return
	}

	// 電子署名用のキーペアを生成
	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		fmt.Printf("Error generating private key: %v\n", err)
		return
	}

	pubKeyBytes, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	if err != nil {
		fmt.Printf("Error marshaling public key: %v\n", err)
		return
	}

	pubKeyPem := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubKeyBytes,
	})

	// 公開鍵のサイズを送信
	pubKeySize := len(pubKeyPem)
	pubKeySizeStr := fmt.Sprintf("%20d", pubKeySize) // パディングを追加
	_, err = conn.Write([]byte(pubKeySizeStr))
	if err != nil {
		fmt.Printf("Error sending public key size: %v\n", err)
		return
	}

	// 確認メッセージを受信
	confirmation := make([]byte, 7)
	_, err = conn.Read(confirmation)
	if err != nil || string(confirmation) != "confirm" {
		fmt.Printf("Error receiving confirmation: %v\n", err)
		return
	}

	// 公開鍵を送信
	_, err = conn.Write(pubKeyPem)
	if err != nil {
		fmt.Printf("Error sending public key: %v\n", err)
		return
	}
	fmt.Println(string(pubKeyPem))

	// ファイルサイズを送信
	fileSize := fmt.Sprintf("%20d", fileInfo.Size())
	conn.Write([]byte(fileSize))

	buffer := make([]byte, 1024)
	for {
		_, err = file.Read(buffer)
		if err == io.EOF {
			break
		}

		// データを送信
		_, err = conn.Write(buffer)
		if err != nil {
			fmt.Printf("Error sending file data: %v\n", err)
			return
		}
	}

	
	// 電子署名を生成
	signature, err := createSignature(targetFile, privKey)
	if err != nil {
		fmt.Printf("Error creating signature: %v\n", err)
		return
	}

	// 電子署名を送信
	_, err = conn.Write(signature)
	if err != nil {
		fmt.Printf("Error sending signature: %v\n", err)
		return
	}

	fmt.Println("File and signature sent successfully.")
}

// 指定したディレクトリ内のファイルを.tar形式にまとめる
func createTarArchive(sourceDir, targetFile string) error {
	file, err := os.Create(targetFile)
	if err != nil {
		return err
	}
	defer file.Close()

	tarWriter := tar.NewWriter(file)
	defer tarWriter.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		path = strings.ReplaceAll(path,"\\","/")

		header, err := tar.FileInfoHeader(info, info.Name())
		if err != nil {
			return err
		}

		header.Name = path

		if err := tarWriter.WriteHeader(header); err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		data, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}

		_, err = tarWriter.Write(data)
		return err
	})
}

// 電子署名を生成する
func createSignature(filePath string, privKey *rsa.PrivateKey) ([]byte, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return nil, err
	}

	hashed := hash.Sum(nil)
	signature, err := rsa.SignPKCS1v15(rand.Reader, privKey, crypto.SHA256, hashed)
	if err != nil {
		return nil, err
	}

	return signature, nil
}
