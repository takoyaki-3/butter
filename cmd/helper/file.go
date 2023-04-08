package helper

import (
	"io"
	"os"
	"crypto/sha256"
	"encoding/hex"
	filetool "github.com/takoyaki-3/go-file-tool"
)

func CopyDir(srcDir, dstDir string) error {

	os.MkdirAll(dstDir, 0777)

	err, files := filetool.DirWalk(srcDir, filetool.DirWalkOption{})
	if err != nil {
		return err
	}
	for _, file := range files {
		if file.IsDir {
			continue
		}
		err := Copy(file.Path, dstDir+"/"+file.Name)
		if err != nil {
			return err
		}
	}
	return nil
}

func Copy(srcPath, dstPath string) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()
	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()
	_, err = io.Copy(dst, src)
	if err != nil {
		return err
	}
	return err
}

func GetBinaryBySHA256(s string) string {
	r := sha256.Sum256([]byte(s))
	return hex.EncodeToString(r[:])
}

func FileName2IntegratedFileName(s string) string {
	return GetBinaryBySHA256(s)
}
