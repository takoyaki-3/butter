package helper

import (
	"archive/tar"
	"compress/gzip"
	"os"
	"time"
	"io/ioutil"
	"strings"
	"path/filepath"
)

type TarGzWriter struct {
	tw *tar.Writer
	gw *gzip.Writer
	f  *os.File
}

func NewTarGzWriter(filename string) (*TarGzWriter, error) {
	f, err := os.Create(filename)
	if err != nil {
		return nil, err
	}
	gw := gzip.NewWriter(f)
	tw := tar.NewWriter(gw)
	return &TarGzWriter{tw: tw, gw: gw, f: f}, nil
}

func (tgz *TarGzWriter) Close() {
	tgz.tw.Close()
	tgz.gw.Close()
	tgz.f.Close()
}

func (tgz *TarGzWriter) AddData(path string, data []byte) error {
	// Write header
	err := tgz.tw.WriteHeader(&tar.Header{
		Name:    path,
		Mode:    int64(777),
		ModTime: time.Now().Truncate(24 * time.Hour),
		Size:    int64(len(data)),
	})
	if err != nil {
		return err
	}
	_, err = tgz.tw.Write(data)
	if err != nil {
		return err
	}
	return nil
}

func (tgz *TarGzWriter) AddDataWithSign(path string, data []byte, privateKeyBytes []byte) error {
	tgz.AddData(path, data)

	// add signature
	signBytes, err := Sing(data, privateKeyBytes)
	if err != nil {
		return err
	}
	return tgz.AddData(path + ".sig", signBytes)
}

// 指定したディレクトリ内のファイルを.tar形式にまとめる
func CreateTarArchive(sourceDir, targetFile string) error {
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
