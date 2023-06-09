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

	json "github.com/takoyaki-3/go-json"
)

type Config struct {
	FTPHost     string `json:"ftp_host"`
	FTPUser     string `json:"ftp_user"`
	FTPPass     string `json:"ftp_pass"`
	FTPPort     string `json:"ftp_port"`
}

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

func main() {
	for {
		var config Config
		err := json.LoadFromPath("./config.json", &config)
		if err != nil {
			log.Fatalln(err)
		}

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
		if err == nil && info.DataList[len(info.DataList)-1].Key == oldInfo.DataList[len(oldInfo.DataList)-1].Key {
			log.Println("No updates found. Exiting.")
			time.Sleep(time.Minute*5)
			continue
		}

		err = ioutil.WriteFile(infoPath, infoData, 0644)
		if err != nil {
			log.Fatalln(err)
		}

		err = DownloadAndExtractTar(root.OriginalData.Host + info.DataList[len(info.DataList)-1].Key, "./" + info.DataList[len(info.DataList)-1].Key)
		if err != nil {
			log.Fatal(err)
		}

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
