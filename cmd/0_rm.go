package main

import (
	"fmt"
	"os"
)

func main() {
	dirPaths := []string{"./dir_out", "./gtfs", "./v0.0.0", "./data.json", "./merged_csv_file.csv", "./dataList.txt", "./feed", "./feed_dir_out", "./v1.0.0"}

	for _, dirPath := range dirPaths {
		err := os.RemoveAll(dirPath)
		if err != nil {
			fmt.Printf("Failed to delete directory: %v\n", err)
		} else {
			fmt.Println("Directory deleted successfully.")
		}
	}
}
