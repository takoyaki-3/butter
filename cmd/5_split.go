package main

import (
	"fmt"
	"log"
	"math"
	"os"
	"time"

	"io/ioutil"

	"github.com/takoyaki-3/goc"

	csvtag "github.com/takoyaki-3/go-csv-tag/v3"
	filetool "github.com/takoyaki-3/go-file-tool"
	gtfs "github.com/takoyaki-3/go-gtfs/v2"
	json "github.com/takoyaki-3/go-json"

	. "github.com/takoyaki-3/butter/cmd/helper"
)

var privateKeyBytes []byte

func main() {
	fmt.Println("start")

	var err error

	// RSA秘密鍵を読み込む
	privateKeyBytes, err = ioutil.ReadFile("key.pem")
	if err != nil {
		log.Fatalln(err)
	}

	_, files := filetool.DirWalk("./gtfs", filetool.DirWalkOption{})
	goc.Parallel(8, len(files), func(i, rank int) {
		file := files[i]
		if file.Name[len(file.Name)-len(".zip"):] == ".zip" {
			fmt.Println(file.Name)
			split(file.Name, time.Now().Format("2006-01-02T15_04_05Z07_00"))
		}
	})
}

type Info struct {
	ByStopHashValueSize int `json:"by_stop_hash_value_size"`
	ByTripHashValueSize int `json:"by_trip_hash_value_size"`
}

type StopTime struct {
	StopID       string `csv:"stop_id" json:"stop_id"`
	StopSeq      string `csv:"stop_sequence" json:"stop_sequence"`
	StopHeadSign string `csv:"stop_headsign" json:"stop_headsign"`
	TripID       string `csv:"trip_id" json:"trip_id"`
	Shape        int    `csv:"shape_dist_traveled" json:"shape_dist_traveled"`
	Departure    string `csv:"departure_time" json:"departure_time"`
	Arrival      string `csv:"arrival_time" json:"arrival_time"`
	PickupType   int    `csv:"pickup_type" json:"pickup_type"`
	DropOffType  int    `csv:"drop_off_type" json:"drop_off_type"`

	TripName    string `csv:"trip_short_name" json:"trip_short_name"`
	RouteID     string `csv:"route_id" json:"route_id"`
	ServiceID   string `csv:"service_id" json:"service_id"`
	ShapeID     string `csv:"shape_id" json:"shape_id"`
	DirectionID string `csv:"direction_id" json:"direction_id"`
	Headsign    string `csv:"trip_headsign" json:"trip_headsign"`
}

func split(file string, version string) error {

	// 入力ファイルのディレクトリを設定
	srcDir := "dir_out/" + file

	// 出力ファイルのディレクトリを設定
	dstDir := "dist/" + file[:len(file)-len(".zip")] + "/" + version
	
	// stop_times.txtからStopTimeのスライスをロード
	stopTimes := []StopTime{}
	err := csvtag.LoadFromPath(srcDir+"/stop_times.txt", &stopTimes)
	if err != nil {
		return err
	}
	// trips.txtからTripのスライスをロード
	trips := []gtfs.Trip{}
	err = csvtag.LoadFromPath(srcDir+"/trips.txt", &trips)
	if err != nil {
		return err
	}
	// StopTimesの各要素に対応するTrip情報を追加
	for i, _ := range stopTimes {
		tripID := stopTimes[i].TripID
		for _, trip := range trips {
			if trip.ID == tripID {
				stopTimes[i].TripName = trip.Name
				stopTimes[i].RouteID = trip.RouteID
				stopTimes[i].ServiceID = trip.ServiceID
				stopTimes[i].ShapeID = trip.ServiceID
				stopTimes[i].DirectionID = trip.DirectionID
				stopTimes[i].Headsign = trip.Headsign
				break
			}
		}
	}
	
	// StopTimeのデータを停留所IDとTripIDでグループ化
	byStop := map[string][]StopTime{}
	byTrip := map[string][]StopTime{}
	
	for _, stopTime := range stopTimes {
		byStop[stopTime.StopID] = append(byStop[stopTime.StopID], stopTime)
		byTrip[stopTime.StopID] = append(byTrip[stopTime.StopID], stopTime)
	}
	
	// グループ化されたデータをさらにハッシュ値によってサブグループ化
	tarByStop := map[string]map[string][]StopTime{}
	tarByTrip := map[string]map[string][]StopTime{}
	fileNum := int(math.Log2(float64(len(stopTimes))))/4/4 + 1
	
	// 停留所IDでグループ化されたデータをハッシュ値によってサブグループ化
	for stopID, stopTimes := range byStop {
		hid := GetBinaryBySHA256(stopID)[:fileNum]
		if _, ok := tarByStop[hid]; !ok {
			tarByStop[hid] = map[string][]StopTime{}
		}
		tarByStop[hid][stopID] = stopTimes
	}
	// TripIDでグループ化されたデータをハッシュ値によってサブグループ化
	for tripID, stopTimes := range byTrip {
		hid := GetBinaryBySHA256(tripID)[:fileNum]
		if _, ok := tarByTrip[hid]; !ok {
			tarByTrip[hid] = map[string][]StopTime{}
		}
		tarByTrip[hid][tripID] = stopTimes
	}

	// 出力
	os.MkdirAll(dstDir+"/byStops", 0777)
	os.MkdirAll(dstDir+"/byTrips", 0777)

	for hid, data := range tarByStop {
		tgz, err := NewTarGzWriter(dstDir + "/byStops/" + hid + ".tar.gz")
		if err != nil {
			panic(err)
		}
		defer tgz.Close()

		for stopID, stopTimes := range data {
			str, _ := csvtag.DumpToString(&stopTimes)
			b := []byte(str)

			err := tgz.AddDataWithSign(stopID, b, privateKeyBytes)
			if err != nil {
				log.Fatalln(err)
			}
		}
	}

	for hid, data := range tarByTrip {
		tgz, err := NewTarGzWriter(dstDir + "/byTrips/" + hid + ".tar.gz")
		if err != nil {
			panic(err)
		}
		defer tgz.Close()

		for tripID, stopTimes := range data {
			str, _ := csvtag.DumpToString(&stopTimes)
			b := []byte(str)

			err := tgz.AddDataWithSign(tripID, b, privateKeyBytes)
			if err != nil {
				log.Fatalln(err)
			}
		}
	}

	// データコピー
	err = Copy(srcDir+"/stops.txt", dstDir+"/stops.txt")
	if err != nil {
		return err
	}
	err = AddSing(dstDir+"/stops.txt", privateKeyBytes)
	if err != nil {
		return err
	}

	// GTFSのコピー
	err = CopyDir(srcDir, dstDir+"/GTFS")
	if err != nil {
		return err
	}
	err = AddDirfileSing(dstDir+"/GTFS", privateKeyBytes)
	if err != nil {
		return err
	}

	// 設定ファイル作成
	info := Info{
		ByStopHashValueSize: fileNum,
		ByTripHashValueSize: fileNum,
	}
	err = json.DumpToFile(&info, dstDir+"/info.json")
	if err != nil {
		return err
	}
	err = AddSing(dstDir+"/info.json", privateKeyBytes)
	return err
}
