package main

import (
	"fmt"
	"log"
	"math"
	"net/url"
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
	StopName       string `csv:"stop_name" json:"stop_name"`

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
	dstDir := "v0.0.0/" + file[:len(file)-len(".zip")] + "/" + version

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
	// stops.txtからStopのスライスをロード
	stops := []gtfs.Stop{}
	err = csvtag.LoadFromPath(srcDir+"/stops.txt", &stops)
	if err != nil {
		return err
	}
	stopID2Name := map[string]string{}
	for _,stop := range stops{
		stopID2Name[stop.ID] = stop.Name
	}

	// StopTimesの各要素に対応するTrip情報を追加
	for i, _ := range stopTimes {
		tripID := stopTimes[i].TripID
		stopTimes[i].StopName = stopID2Name[stopTimes[i].StopID]
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

	// location_typeが1の停留所と、それに関連するlocation_typeが0の停留所を特定
	relatedStopIDs := map[string][]string{}
	for _, stop := range stops {
		if stop.Type == "1" {
			for _, relatedStop := range stops {
				if relatedStop.Parent == stop.ID && relatedStop.Type == "0" {
					if _,ok:=relatedStopIDs[stop.ID];!ok{
						relatedStopIDs[stop.ID] = []string{}
					}
					relatedStopIDs[stop.ID] = append(relatedStopIDs[stop.ID], relatedStop.ID)
				}
			}
		}
	}
	// location_typeが0の関連する停留所のstop_timesを取得
	var relatedStopTimes []StopTime
	for _, stopTime := range stopTimes {
		for baseStopID, stopIDs := range relatedStopIDs {
			for _,stopID := range stopIDs{
				if stopTime.StopID == stopID {
					stopTime.StopID = baseStopID
					relatedStopTimes = append(relatedStopTimes, stopTime)
					break
				}
			}
		}
	}

	// StopTimeのデータを停留所IDとTripIDでグループ化
	byStop := map[string][]StopTime{}
	byTrip := map[string][]StopTime{}

	for _, stopTime := range stopTimes {
		byStop[url.QueryEscape(stopTime.StopID)] = append(byStop[url.QueryEscape(stopTime.StopID)], stopTime)
		byTrip[url.QueryEscape(stopTime.TripID)] = append(byTrip[url.QueryEscape(stopTime.TripID)], stopTime)
	}
	for _, stopTime := range relatedStopTimes {
		byStop[url.QueryEscape(stopTime.StopID)] = append(byStop[url.QueryEscape(stopTime.StopID)], stopTime)
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

	// tarByStopのデータをアーカイブして保存
	for hid, data := range tarByStop {
		// TarGzWriterを作成し、指定したファイル名で開く
		tgz, err := NewTarGzWriter(dstDir + "/byStops/" + hid + ".tar.gz")
		if err != nil {
			panic(err)
		}
		defer tgz.Close() // TarGzWriterを閉じることを保証

		// data内の各停留所IDとその停留所の時刻データをTarGzWriterに追加
		for stopID, stopTimes := range data {
			str, _ := csvtag.DumpToString(&stopTimes) // StopTimesを文字列に変換
			b := []byte(str)                          // 文字列をバイト配列に変換

			// データを署名付きでTarGzWriterに追加
			err := tgz.AddDataWithSign(stopID, b, privateKeyBytes)
			if err != nil {
				log.Fatalln(err)
			}
		}
	}

	// tarByTripのデータをアーカイブして保存
	for hid, data := range tarByTrip {
		// TarGzWriterを作成し、指定したファイル名で開く
		tgz, err := NewTarGzWriter(dstDir + "/byTrips/" + hid + ".tar.gz")
		if err != nil {
			panic(err)
		}
		defer tgz.Close() // TarGzWriterを閉じることを保証

		// data内の各TripIDとそのトリップの時刻データをTarGzWriterに追加
		for tripID, stopTimes := range data {
			str, _ := csvtag.DumpToString(&stopTimes) // StopTimesを文字列に変換
			b := []byte(str)                          // 文字列をバイト配列に変換

			// データを署名付きでTarGzWriterに追加
			err := tgz.AddDataWithSign(tripID, b, privateKeyBytes)
			if err != nil {
				log.Fatalln(err)
			}
		}
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
	return err
}
