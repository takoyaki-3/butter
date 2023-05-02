package main

import (
	"archive/tar"
	"bytes"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"net/http"
	"io/ioutil"

	json "github.com/takoyaki-3/go-json"
	"github.com/jlaffaye/ftp"
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

	var config Config
	err := json.LoadFromPath("./config.json",&config)
	if err != nil {
		log.Fatalln(err)
	}

	// Download root file from the URL
	var root Root
	rootData, err := downloadFile("https://butter.takoyaki3.com/v0.0.0/root.json")
	if err != nil {
		log.Fatalln(err)
	}
	err = json.LoadFromString(string(rootData), &root)
	if err != nil {
		log.Fatalln(err)
	}

	// Download info file from the URL
	var info Info
	infoData, err := downloadFile(root.OriginalData.Host+"info.json")
	if err != nil {
		log.Fatalln(err)
	}
	err = json.LoadFromString(string(infoData), &info)
	if err != nil {
		log.Fatalln(err)
	}

	// Download .tar file from the URL
	tarData, err := downloadFile(root.OriginalData.Host+info.DataList[len(info.DataList)-1].Key)
	if err != nil {
		log.Fatal(err)
	}

	err = uploadTarFilesToFTP(config.FTPHost, config.FTPPort, config.FTPUser, config.FTPPass, tarData)
	if err != nil {
		log.Fatal(err)
	}
}

func uploadTarFilesToFTP(host, port, user, pass string, tarData []byte) error {
	// Connect to FTP server
	conn, err := ftp.Dial(fmt.Sprintf("%s:%s", host, port))
	if err != nil {
		return err
	}

	defer conn.Quit()

	// Login to FTP server
	err = conn.Login(user, pass)
	if err != nil {
		return err
	}

	counter := 0

	// Create a buffer with the .tar data and read it
	tarReader := tar.NewReader(bytes.NewReader(tarData))

	for {
		header, err := tarReader.Next()

		if err == io.EOF {
			break
		} else if err != nil {
			return err
		}

		if header.Typeflag == tar.TypeReg {
			// Check and create the directory if it doesn't exist
			dir := filepath.Dir(header.Name)
			err := createDirIfNotExists(conn, dir)
			if err != nil {
				return err
			}

			var buf bytes.Buffer
			_, err = io.Copy(&buf, tarReader)
			if err != nil {
				return err
			}

			// Upload file to FTP server
			err = conn.Stor(header.Name, &buf)
			if err != nil {
				return err
			}

			fmt.Println(counter,"Uploaded:", header.Name)
			counter++
		}
	}

	return nil
}

var cash map[string]bool

func createDirIfNotExists(conn *ftp.ServerConn, dir string) error {
	if cash == nil {
		cash = map[string]bool{}
	}
	if _, ok := cash[dir]; ok {
		return nil
	}

	parts := strings.Split(dir, "/")
	currentPath := ""
	for _, part := range parts {
		currentPath = filepath.Join(currentPath, part)
		_, err := conn.List(currentPath)
		if err != nil {
			err := conn.MakeDir(currentPath)
			if err != nil {
				// Check if the error message contains "550" and "File exists" or "Directory exists"
				if strings.Contains(err.Error(), "550") && (strings.Contains(err.Error(), "File exists") || strings.Contains(err.Error(), "Directory exists")) {
					// If the error is related to the file or directory already existing, skip this iteration
					continue
				} else {
					return err
				}
			}
		}
	}
	cash[dir] = true
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
