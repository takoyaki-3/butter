package main

import (
	"archive/tar"
	"fmt"
	"os"
	"io"
	"log"

	json "github.com/takoyaki-3/go-json"
)

type dataListStr []struct {
	NAMING_FAILED      string `json:"事業者名,omitempty"`
	URL                string `json:"事業者名_url,omitempty"`
	NAMING_FAILED0     string `json:"都道府県,omitempty"`
	GTFS               string `json:"GTFSフィード名,omitempty"`
	NAMING_FAILED1     string `json:"ライセンス,omitempty"`
	URL0               string `json:"ライセンス_url,omitempty"`
	URLs               string `json:"URLs,omitempty"`
	GTFSURL            string `json:"GTFS_url,omitempty"`
	GTFS0              string `json:"最新GTFS開始日,omitempty"`
	GTFS1              string `json:"最新GTFS終了日,omitempty"`
	NAMING_FAILED2     string `json:"最終更新日,omitempty"`
	NAMING_FAILED3     string `json:"詳細,omitempty"`
	GTFS_ID            string `json:"gtfs_id,omitempty"`
	VehiclePositionURL string `json:"VehiclePosition_url,omitempty"`
}

type OrganizationInfo []struct {
	VersionID           string `json:"version_id"`
	ByStopHashValueSize int    `json:"by_stop_hash_value_size"`
	ByTripHashValueSize int    `json:"by_trip_hash_value_size"`
}

func main(){
	fmt.Println("start")

	dataList := dataListStr{}
	if err := json.LoadFromPath("./data.json", &dataList);err!=nil{
		log.Fatalln(err)
	}

	// GTFS_IDごとのデータ存在確認
	for _,v:=range dataList{
		if v.GTFS_ID==""{
			continue
		}
		err := checkCrganization(v.GTFS_ID)
		if err != nil {
			fmt.Println(err)
		}
	}

	// n-gramフォルダが存在するか

	// 
}

func checkCrganization(GTFS_ID string)error{
	// 
	info := OrganizationInfo{}
	err := json.LoadFromPath("v0.0.0/"+GTFS_ID+"/info.json", &info)
	if err != nil{
		return err
	}

	// 各ファイルがあるか判定
	dir := "v0.0.0/"+GTFS_ID+"/"+info[0].VersionID

	// ByTrips
	for i:=0;i<16<<info[0].ByTripHashValueSize;i++{
		hexString := fmt.Sprintf("%0*X", info[0].ByTripHashValueSize, info[0].ByTripHashValueSize)
		fileName := dir+"/byTrips/"+hexString+".tar"
		if _,err:=isValidTarFile(fileName);err!=nil{
			return err
		}
	}

	// ByStops
	for i:=0;i<16<<info[0].ByStopHashValueSize;i++{
		hexString := fmt.Sprintf("%0*X", info[0].ByStopHashValueSize, info[0].ByStopHashValueSize)
		fileName := dir+"/byStops/"+hexString+".tar"
		if _,err:=isValidTarFile(fileName);err!=nil{
			return err
		}
	}

	// GTFS


	// byH3index

	
	return nil
}

func isValidTarFile(filename string) (bool, error) {

	// ファイル存在確認
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false, nil
	}

	// ファイルを開く
	file, err := os.Open(filename)
	if err != nil {
		return false, err
	}
	defer file.Close()

	// tar.Reader を作成
	tr := tar.NewReader(file)

	// tar ファイルのエントリを走査
	for {
		_, err := tr.Next()
		if err == io.EOF {
			break // ファイルの終わり
		}
		if err != nil {
			return false, err // これは正しい tar フォーマットではありません
		}
	}

	return true, nil // これは正しい tar フォーマットです
}