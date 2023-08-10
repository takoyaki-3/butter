package main

import (
	"archive/tar"
	"bytes"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func main() {
	listenAddr := "0.0.0.0:8001"
	destDir := "v0.0.0"

	// サーバーを起動して待機
	listener, err := net.Listen("tcp", listenAddr)
	if err != nil {
		fmt.Printf("Error listening on %s: %v\n", listenAddr, err)
		return
	}
	defer listener.Close()

	fmt.Printf("Listening on %s\n", listenAddr)

	conn, err := listener.Accept()
	if err != nil {
		fmt.Printf("Error accepting connection: %v\n", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected.")

	// 公開鍵のサイズを受信
	pubKeySizeBuffer := make([]byte, 20)
	_, err = conn.Read(pubKeySizeBuffer)
	if err != nil {
		fmt.Printf("Error reading public key size: %v\n", err)
		return
	}

	pubKeySizeStr := strings.TrimSpace(string(pubKeySizeBuffer)) // 余計な空白文字を取り除く
	pubKeySize, err := strconv.Atoi(pubKeySizeStr)
	if err != nil {
		fmt.Printf("Error parsing public key size: %v\n", err)
		return
	}

	// 確認メッセージを送信
	_, err = conn.Write([]byte("confirm"))
	if err != nil {
		fmt.Printf("Error sending confirmation: %v\n", err)
		return
	}

	// 公開鍵を受信
	pubKeyPem := make([]byte, pubKeySize)
	_, err = conn.Read(pubKeyPem)
	if err != nil {
		fmt.Printf("Error reading public key: %v\n", err)
		return
	}

	block, _ := pem.Decode(pubKeyPem)
	pubKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		fmt.Printf("Error parsing public key: %v\n", err)
		return
	}

	rsaPubKey, ok := pubKey.(*rsa.PublicKey)
	if !ok {
		fmt.Println("Invalid public key")
		return
	}
	fmt.Println(string(pubKeyPem))

	// ファイルサイズを受信
	fileSizeBuffer := make([]byte, 20)
	_, err = conn.Read(fileSizeBuffer)
	if err != nil {
		fmt.Printf("Error reading file size: %v\n", err)
		return
	}

	fileSize, err := strconv.ParseInt(strings.TrimSpace(string(fileSizeBuffer)), 10, 64)
	if err != nil {
		fmt.Printf("Error parsing file size: %v\n", err)
		return
	}

	// .tarファイルを受信
	tarBuffer := bytes.NewBuffer(make([]byte, 0, fileSize))
	_, err = io.CopyN(tarBuffer, conn, fileSize)
	if err != nil {
		fmt.Printf("Error receiving tar file: %v\n", err)
		return
	}

	// 電子署名を受信
	signature := make([]byte, 256)
	_, err = conn.Read(signature)
	if err != nil {
		fmt.Printf("Error receiving signature: %v\n", err)
		return
	}

	// 3. 電子署名を検証する
	isValid, err := verifySignature(tarBuffer.Bytes(), signature, rsaPubKey)
	if err != nil {
		fmt.Printf("Error verifying signature: %v\n", err)
		return
	}

	if !isValid {
		fmt.Println("Invalid signature. Aborting.")
		return
	}

	fmt.Println("Signature verified.")

	// 4. 電子署名が正しい場合、サーバーが.tarファイルを特定のディレクトリに展開する
	err = extractTarArchive(tarBuffer, destDir)
	if err != nil {
		fmt.Printf("Error extracting tar archive: %v\n", err)
		return
	}

	fmt.Println("File received and extracted successfully.")
}

// 電子署名を検証する
func verifySignature(data, signature []byte, pubKey *rsa.PublicKey) (bool, error) {
	hash := sha256.Sum256(data)

	err := rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, hash[:], signature)
	if err != nil {
		return false, err
	}

	return true, nil
}

// .tarファイルを特定のディレクトリに展開する
func extractTarArchive(tarBuffer *bytes.Buffer, destDir string) error {
	tarReader := tar.NewReader(tarBuffer)

	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}

		if err != nil {
			return err
		}

		target := filepath.Join(destDir, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, os.FileMode(header.Mode)); err != nil {
				return err
			}
		case tar.TypeReg:
			file, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}

			_, err = io.Copy(file, tarReader)
			file.Close()

			if err != nil {
				return err
			}
		default:
			return fmt.Errorf("unsupported type: %v", header.Typeflag)
		}
	}

	return nil
}
