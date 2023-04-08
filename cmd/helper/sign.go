package helper

import (
	"io/ioutil"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"

	filetool "github.com/takoyaki-3/go-file-tool"
)

func Sing(dataBytes, privateKeyBytes []byte) ([]byte, error) {
	privateKeyBlock, _ := pem.Decode(privateKeyBytes)

	privateKey, err := x509.ParsePKCS1PrivateKey(privateKeyBlock.Bytes)
	if err != nil {
		return nil, err
	}

	// ファイルのハッシュ値を計算する
	hash := sha256.Sum256(dataBytes)

	// ハッシュ値に署名する
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hash[:])
	if err != nil {
		return nil, err
	}

	return signature, nil
}

func AddSing(path string, privateKeyBytes []byte) error {
	// ファイルを読み込む
	file, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	signature, err := Sing(file, privateKeyBytes)
	if err != nil {
		return err
	}

	// 署名をファイルに書き込む
	err = ioutil.WriteFile(path+".sig", signature, 0644)
	return err
}

func AddDirfileSing(dirPath string, privateKeyBytes []byte) error {
	err, files := filetool.DirWalk(dirPath, filetool.DirWalkOption{})
	if err != nil {
		return err
	}

	for _, item := range files {
		if item.IsDir {
			continue
		}
		// ファイルを読み込む
		file, err := ioutil.ReadFile(item.Path)
		if err != nil {
			return err
		}
		signature, err := Sing(file, privateKeyBytes)
		if err != nil {
			return err
		}

		// 署名をファイルに書き込む
		err = ioutil.WriteFile(item.Path+".sig", signature, 0644)
		if err != nil {
			return err
		}
	}

	return err
}
