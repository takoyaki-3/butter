package main

import (
	"fmt"
	"strings"

	csv "github.com/takoyaki-3/go-csv-tag/v3"
	filetool "github.com/takoyaki-3/go-file-tool"
	gos3 "github.com/takoyaki-3/go-s3"
	"github.com/takoyaki-3/goc"
)

func main() {

	// filelist.csv 取得
	uploadedfiles := []filetool.FileInfo{}
	csv.LoadFromPath("./filelist.csv", &uploadedfiles)
	fileMap := map[string]bool{}
	for _, v := range uploadedfiles {
		fileMap[v.Path] = true
	}

	// データ本体のアップロード
	err, files := filetool.DirWalk("./v0.0.0", filetool.DirWalkOption{})
	if err != nil {
		return
	}

	goc.Parallel(16, len(files), func(i, rank int) {
		if fileMap[files[i].Path] {
			return
		}
		uploadedfiles = append(uploadedfiles, files[i])

		s3, err := gos3.NewSession("s3-conf.json")
		if err != nil {
			fmt.Println(err)
			return
		}

		v := files[i]

		if v.IsDir {
			fmt.Println(err)
			return
		}

		if v.Name == "v0.0.0" {
			fmt.Println(err)
			return
		}

		exs := strings.Split(v.Name, ".")
		if len(exs) == 1 {
			fmt.Println(err)
			return
		}
		key := "v0.0.0/" + strings.ReplaceAll(v.Path[len("v0.0.0\\"):], "\\", "/")
		fmt.Println(i, len(files), float32(i)/float32(len(files)), key)

		err = s3.UploadFromPath(v.Path, key)
		if err != nil {
			fmt.Println(err)
			return
		}

	})

	csv.DumpToFile(&uploadedfiles, "./filelist.csv")

	return
}
