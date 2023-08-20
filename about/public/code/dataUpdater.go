package main

import (
	"archive/tar"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"bytes"

	json "github.com/takoyaki-3/go-json"
)

type PublicKey struct {
	Pubkey string `json:"pubkey"`
}
type OriginalData struct {
	Host string `json:"host"`
}
type Root struct {
	PubKeys      []PublicKey   `json:"pub_keys"`
	Hosts        []string      `json:"hosts"`
	OriginalData OriginalData  `json:"original_data"`
	LastUpdate   string        `json:"last_update"`
}

type Info struct {
	DataList []OriginalDataItem `json:"data_list"`
}
type OriginalDataItem struct {
	Key string `json:"key"`
}

func monitorFile(filePath, timeFilePath string, done chan bool) {
	ticker := time.NewTicker(1 * time.Minute)
	var lastFileContent []byte
	lastFileContent, _ = ioutil.ReadFile(filePath)

	for {
		select {
		case <-ticker.C:
			fileContent, err := ioutil.ReadFile(filePath)
			if err != nil {
				log.Printf("Error reading file: %v", err)
				continue
			}

			if !bytes.Equal(fileContent, lastFileContent) {
				log.Printf("File %s has been modified", filePath)
				lastFileContent = fileContent
				time.AfterFunc(10*time.Second, func() {
					done <- true
				})
			}

			// 現在の時刻を取得し、ファイルに書き込む
			currentTime := time.Now().Format(time.RFC3339)
			if err := ioutil.WriteFile(timeFilePath, []byte(currentTime), 0644); err != nil {
				log.Printf("Error writing last checked time: %v", err)
			}
		}
	}
}

func main() {

	done := make(chan bool)
	go monitorFile("./dataUpdater.go","./dataUpdaterLastCheckedTime.txt", done)

	go func() {

		isFirst := true
		for {
			var root Root
			rootData, err := downloadFile("https://butter.takoyaki3.com/v0.0.0/root.json")
			if err != nil {
				log.Fatalln(err)
			}
			err = json.LoadFromString(string(rootData), &root)
			if err != nil {
				log.Fatalln(err)
			}

			var info Info
			infoData, err := downloadFile(root.OriginalData.Host + "info.json")
			if err != nil {
				log.Fatalln(err)
			}
			err = json.LoadFromString(string(infoData), &info)
			if err != nil {
				log.Fatalln(err)
			}

			infoPath := "info.json"
			var oldInfo Info
			err = json.LoadFromPath(infoPath, &oldInfo)
			fmt.Println("info.json:",oldInfo)
			if !isFirst {
				if err == nil {
					if info.DataList[len(info.DataList)-1].Key == oldInfo.DataList[len(oldInfo.DataList)-1].Key {
						log.Println("No updates found. Exiting.")
						time.Sleep(time.Minute*5)
						continue
					}
				}	
			}
			isFirst = false
			fmt.Println("start download. ["+root.OriginalData.Host + info.DataList[len(info.DataList)-1].Key+"]")

			err = ioutil.WriteFile(infoPath, infoData, 0644)
			if err != nil {
				log.Fatalln(err)
			}

			err = DownloadAndExtractTar(root.OriginalData.Host + info.DataList[len(info.DataList)-1].Key, "./" + info.DataList[len(info.DataList)-1].Key)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Println("dev")

			err = os.Rename("./public","./old")
			fmt.Println(err)
			err = os.Rename("./" + info.DataList[len(info.DataList)-1].Key, "public")
			fmt.Println(err)
			if err != nil {
				continue
			}
			err = os.RemoveAll("old")
			fmt.Println(err)
		}
	}()

	<-done
	log.Printf("File has been modified. Shutting down in 10 seconds.")
	time.Sleep(10 * time.Second)
	log.Printf("Shutting down server.")
}
func DownloadAndExtractTar(url, dest string) error {
	// Check if output directory exists, create it if not
	if _, err := os.Stat(dest); os.IsNotExist(err) {
		err = os.MkdirAll(dest, 0755)
		if err != nil {
			return fmt.Errorf("failed to create destination directory: %v", err)
		}
	}

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download %s: %d %s", url, resp.StatusCode, resp.Status)
	}

	tr := tar.NewReader(resp.Body)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		target := filepath.Join(dest, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0755); err != nil {
					return err
				}
			}
		case tar.TypeReg:
			file, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
			defer file.Close()

			if _, err := io.Copy(file, tr); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unknown type: %c in %s", header.Typeflag, header.Name)
		}
	}

	return nil
}

func downloadFile(url string) ([]byte, error) {
	fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download file, status code: %d", resp.StatusCode)
	}

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return data, nil
}