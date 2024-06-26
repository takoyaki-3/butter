package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"

	json "github.com/takoyaki-3/go-json"
)

type InfoType struct {
	VersionID           string `json:"version_id"`
	ByStopHashValueSize int    `json:"by_stop_hash_value_size"`
	ByTripHashValueSize int    `json:"by_trip_hash_value_size"`
}

func main() {

	// Set the root directory path
	moveInfoFile("v0.0.0")
	moveInfoFile("v1.0.0")
}

func moveInfoFile(root string) {
	// Get the list of directories in the root directory
	dirs, err := ioutil.ReadDir(root)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Loop through the directories in the root directory
	for _, dir := range dirs {
		// Check if the item is a directory
		if dir.IsDir() {
			gtfsID := dir.Name()

			// Get the list of subdirectories in the directory
			subdirs, err := ioutil.ReadDir(filepath.Join(root, dir.Name()))
			if err != nil {
				fmt.Println(err)
				continue
			}

			versionInfo := []InfoType{}

			// Loop through the subdirectories in the directory
			for _, subdir := range subdirs {
				// Check if the item is a directory
				if subdir.IsDir() {
					// Print the subdirectory name and full path
					dirPath := filepath.Join(root, dir.Name(), subdir.Name())
					fmt.Printf("  Found subdirectory: %s (%s) %s\n", subdir.Name(), gtfsID, dirPath)

					// JSON Load
					info := InfoType{}
					json.LoadFromPath(dirPath+"/info.json", &info)
					info.VersionID = subdir.Name()
					versionInfo = append(versionInfo, info)
					fmt.Println(info)
				}
			}

			json.DumpToFile(versionInfo, "./"+root+"/"+dir.Name()+"/info.json")
		}
	}
}
