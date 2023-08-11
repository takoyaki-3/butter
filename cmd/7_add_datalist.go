package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"time"
	"strings"

	. "github.com/takoyaki-3/butter/cmd/helper"
	json "github.com/takoyaki-3/go-json"
)

type DataItem struct {
	GtfsID             string `json:"gtfs_id"`
	AgencyID           string `json:"agency_id"`
	Name               string `json:"name"`
	License            string `json:"license"`
	LicenseURL         string `json:"licenseUrl"`
	ProviderURL        string `json:"providerUrl"`
	ProviderName       string `json:"providerName"`
	ProviderAgencyName string `json:"providerAgencyName"`
	Memo               string `json:"memo"`
	UpdatedAt          string `json:"updatedAt"`
	AlertURL           string `json:"Alert_url,omitempty"`
	TripUpdateURL      string `json:"TripUpdate_url,omitempty"`
	VehiclePositionURL string `json:"VehiclePosition_url,omitempty"`
}

type DataList struct {
	Updated string     `json:"updated"`
	Data    []DataItem `json:"data_list"`
}

type Data []struct {
	AgentName          string `json:"事業者名,omitempty"`
	URL                string `json:"事業者名_url,omitempty"`
	Prefecture         string `json:"都道府県,omitempty"`
	GTFS               string `json:"GTFSフィード名,omitempty"`
	License            string `json:"ライセンス,omitempty"`
	LicenseURL         string `json:"ライセンス_url,omitempty"`
	URLs               string `json:"URLs,omitempty"`
	GTFSURL            string `json:"GTFS_url,omitempty"`
	StartDate          string `json:"最新GTFS開始日,omitempty"`
	EndDate            string `json:"最新GTFS終了日,omitempty"`
	UpdateDate         string `json:"最終更新日,omitempty"`
	Detail             string `json:"詳細,omitempty"`
	GtfsID             string `json:"gtfs_id,omitempty"`
	AlertURL           string `json:"Alert_url,omitempty"`
	TripUpdateURL      string `json:"TripUpdate_url,omitempty"`
	VehiclePositionURL string `json:"VehiclePosition_url,omitempty"`
}

func main() {
	// RSA秘密鍵を読み込む
	privateKeyBytes, err := ioutil.ReadFile("key.pem")
	if err != nil {
		log.Fatalln(err)
	}

	//
	data := Data{}
	json.LoadFromPath("data.json", &data)

	t := time.Now()
	datalist := DataList{
		Updated: t.Format("2006-01-02T15_04_05+09_00"),
	}

	for _, v := range data {
		t, err := time.Parse("2006-01-02", v.UpdateDate)
		if err != nil {
			continue
		}

		// ODPT API Keyを削除
		v.GTFSURL = strings.Split(v.GTFSURL,"acl:consumerKey=")[0]
		v.AlertURL = strings.Split(v.AlertURL,"acl:consumerKey=")[0]
		v.TripUpdateURL = strings.Split(v.TripUpdateURL,"acl:consumerKey=")[0]
		v.VehiclePositionURL = strings.Split(v.VehiclePositionURL,"acl:consumerKey=")[0]

		datalist.Data = append(datalist.Data, DataItem{
			GtfsID: v.GtfsID,
			// AgencyID: v.,
			Name:               v.AgentName,
			License:            v.License,
			LicenseURL:         v.LicenseURL,
			ProviderURL:        v.GTFSURL,
			ProviderName:       "",
			ProviderAgencyName: "",
			UpdatedAt:          t.Format("2006-01-02T15_04_05+09_00"),
			AlertURL:           v.AlertURL,
			TripUpdateURL:      v.TripUpdateURL,
			VehiclePositionURL: v.VehiclePositionURL,
		})
	}

	json.DumpToFile(datalist, "v0.0.0/datalist.json")
	err = AddSing("v0.0.0/datalist.json", privateKeyBytes)
	fmt.Println(err)
}
