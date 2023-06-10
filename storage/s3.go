package main

import (
	"archive/tar"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

// {
//   "s3_endpoint": "https://s3-compatible-storage.example.com",
//   "s3_access_key": "your_access_key",
//   "s3_secret_key": "your_secret_key",
//   "s3_bucket": "your_bucket",
//   "tar_file_url": "https://example.com/path/to/your/file.tar"
// }

type Config struct {
	S3Endpoint  string `json:"s3_endpoint"`
	S3AccessKey string `json:"s3_access_key"`
	S3SecretKey string `json:"s3_secret_key"`
	S3Bucket    string `json:"s3_bucket"`
	TarFileURL  string `json:"tar_file_url"`
}

func main() {
	// Load configuration from JSON file
	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatal(err)
	}

	// Download .tar file from the URL
	tarData, err := downloadTarFile(config.TarFileURL)
	if err != nil {
		log.Fatal(err)
	}

	err = uploadTarFilesToS3(config, tarData)
	if err != nil {
		log.Fatal(err)
	}
}

func loadConfig(file string) (*Config, error) {
	data, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}

	var config Config
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func downloadTarFile(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download .tar file, status code: %d", resp.StatusCode)
	}

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func uploadTarFilesToS3(config *Config, tarData []byte) error {
	// Initialize the S3 client
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String(config.S3Endpoint),
		Credentials: credentials.NewStaticCredentials(config.S3AccessKey, config.S3SecretKey, ""),
	})
	if err != nil {
		return err
	}

	s3Client := s3.New(sess)

	// Create a buffer with the .tar data and read it
	tarReader := tar.NewReader(bytes.NewReader(tarData))

	counter := 0

	for {
		header, err := tarReader.Next()

		if err == io.EOF {
			break
		} else if err != nil {
			return err
		}

		if header.Typeflag == tar.TypeReg {
			var buf bytes.Buffer
			_, err = io.Copy(&buf, tarReader)
			if err != nil {
				return err
			}

			// Upload file to S3-compatible storage
			_, err = s3Client.PutObject(&s3.PutObjectInput{
				Bucket: aws.String(config.S3Bucket),
				Key:    aws.String(header.Name),
				Body:   bytes.NewReader(buf.Bytes()),
			})
			if err != nil {
				return err
			}

			fmt.Println(counter, "Uploaded:", header.Name)
			counter++
		}
	}

	return nil
}

