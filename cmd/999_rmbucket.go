package main

import (
	"fmt"
	"log"

	gos3 "github.com/takoyaki-3/go-s3"
	"github.com/takoyaki-3/goc"
)

func main() {
	s3, err := gos3.NewSession("s3-conf.json")
	if err != nil {
		return
	}
	objs,err := s3.GetObjectList("v0.0.0/")
	if err != nil {
		log.Fatalln(err)
	}
	goc.Parallel(16, len(objs), func(i, rank int) {
		err := s3.DeleteObject(objs[i].Key)
		if err != nil {
			log.Fatalln(err)
		}
		fmt.Println(objs[i].Key)
	})
}