<template>
  <v-container>
    <v-tabs class="mb-5"> <!-- vertical 属性を削除 -->
      <v-tab>マップから選択</v-tab>
      <v-tab-item>
        <v-row class="text-left">
          <v-col cols="12">
            <v-container fluid class="map-container">
              <l-map :center="center"
                :zoom="zoom"
                @click.right="mapRclicked"
                ref="map"
                style="height: 80vh; width: 100%"
                >
                <l-tile-layer :url="url"></l-tile-layer>
                <l-marker v-for="(marker,index) in busStopMarkers"
                  :key="index+marker.name"
                  :lat-lng="marker.latlon"
                  :name="marker.name"
                  :icon="BusStopIcon"
                  @click="busStopClicked(marker.gtfs_id, marker.stop_id, marker.name)"
                  >
                </l-marker>
              </l-map>
            </v-container>
          </v-col>
        </v-row>
      </v-tab-item>
      <v-tab>名前から選択</v-tab>
      <v-tab-item>
        <v-row class="text-left">
          <v-col class="mb-5" cols="12" md="6">
            <h3>文字列から停留所を検索</h3>
              <v-text-field v-model="substring" label="Stop Name" outlined></v-text-field>
              <v-data-table
                :headers="stops_headers"
                :items="stops"
                @click:row="busStopClickedFromTable"
              ></v-data-table>
          </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs>
    <v-row class="text-left">
      <v-col class="mb-5" cols="12">
        <h3>対応事業者一覧</h3>
        <v-data-table :headers="gtfs_list_headers" :items="gtfs_list"></v-data-table>
      </v-col>
    </v-row>
    <v-row class="text-left">
      <v-col class="mb-5" cols="12">
        <h3>各ストレージにおけるデータ最終更新日時</h3>
        <p>過去30日以内にデータが更新されたストレージホストの一覧です。</p>
        <v-data-table :headers="host_updated_headers" :items="host_updated"></v-data-table>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>{{stop_name}} （{{gtfs_name}}）</v-card-title>
        <v-card-text>
          <v-menu ref="menu" v-model="menu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" offset-y min-width="290px">
            <template v-slot:activator="{ on, attrs }">
              <v-text-field v-model="date" label="日付選択" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
            </template>
            <v-date-picker v-model="date" @input="menu = false; fetchTimeTable()"></v-date-picker>
          </v-menu>
        </v-card-text>
        <v-data-table
            :headers="stop_times_headers"
            :items="stop_times.stop_times"
          ></v-data-table>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
<style>
#map {
    height: 100vh;
    width: 100vw;
  }
.map-container {
  z-index: 0;
  position: relative; /* z-indexを有効にするためにpositionを設定 */
}
</style>

<script>
import {latLng,Icon} from 'leaflet';
import { LMap,LTileLayer,LMarker } from "vue2-leaflet";
import Butter from 'butter-lib/dist.js';
await Butter.init()
import 'leaflet/dist/leaflet.css'

export default {
  name: 'DemoSpace',
  components:{
    LMap,
    LTileLayer,
    LMarker,
  },
  data: () => ({
    dialog: false,
    copySuccess: false,
    dataList: [],
    updateTime: '',
    substring:'東京駅',
    gtfs_id:'ToeiBus',
    stop_id:'0965-01',
    date:'2023-06-30',
    stops:[],
    gtfs_list:[],
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    zoom: 13,
    center: [35.6809591, 139.7673068],
    bounds: null,
    busMarkers:[],
    busStopMarkers:[],
    updateBusLocations:null,
    BusStopIcon: new Icon({  // アイコンオブジェクトの作成
      iconUrl: '/bus_stop_icon.png',  // マーカー画像の URL を指定
      iconSize: [32, 32],  // マーカー画像のサイズを指定
      iconAnchor: [32, 32]  // マーカー画像のアンカーポイントを指定
    }),
    BusIcon: new Icon({  // アイコンオブジェクトの作成
      iconUrl: '/bus-icon.png',  // マーカー画像の URL を指定
      iconSize: [32, 32],  // マーカー画像のサイズを指定
      iconAnchor: [32, 32]  // マーカー画像のアンカーポイントを指定
    }),
    stops_headers:[
      {text:"stop_name",value:"stop_name"},
      {text:"stop_id",value:"stop_id"},
      {text:"GTFS ID",value:"gtfs_id"},
    ],
    gtfs_list_headers:[
      {text:"GTFS ID",value:"gtfs_id"},
      {text:"Name",value:"name"},
      {text:"license",value:"license"},
      {text:"updatedAt",value:"updatedAt"},
    ],
    host_updated_headers:[
      {text:"Host",value:"host"},
      {text:"Last updated",value:"updated"},
    ],
    stop_times:[],
    stop_times_headers:[
      {text:"stop_headsign",value:"stop_headsign"},
      {text:"departure_time",value:"departure_time"},
    ],
    host_updated:[],
    tagCode:"",
    stop_name:'',
    gtfs_name:'',
    gtfs_id2name:{},
    menu: false,
  }),
  async mounted (){

    // 日付取得
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.date = `${year}-${month}-${day}`;

    // Get data list
    this.dataList = await Butter.getHostDataList()
    for(let i=0;i<this.dataList.length;i++) this.gtfs_id2name[this.dataList[i].gtfs_id] = this.dataList[i].name;
    
    // バス停・バスロケーションのマーカを設定
    this.updateBusLocations = async () => {

      // 全ての前回のマーカーを削除
      this.busMarkers = [];
      this.busStopMarkers = [];

      // 緯度経度からの停留所検索使用例
      const radius = 5000; // メートル単位
      const aroundStops = await Butter.getStopsWithinRadius(this.center[0], this.center[1], radius);
      if(aroundStops.length > 0) aroundStops.forEach((bus_stop)=>{
        this.busStopMarkers.push({
          latlon:latLng(bus_stop.stop_lat, bus_stop.stop_lon),
          name:bus_stop.stop_name,
          bindPopup:bus_stop.stop_name,
          stop_id: bus_stop.stop_id,
          gtfs_id: bus_stop.gtfs_id
        });
      });
    }

    this.updateBusLocations();

    // 地図の移動が終わったときのイベントハンドラを設定
    this.$refs.map.mapObject.on('moveend', () => {
      const newCenter = this.$refs.map.mapObject.getCenter();
      this.center = [newCenter.lat, newCenter.lng];
    });

    // 停留所名
    this.stops = await Butter.getStopsBySubstring(this.substring);

    // 対応事業者取得
    this.gtfs_list = await Butter.getHostDataList();

    // データ最終更新日時取得
    this.host_updated = await Butter.getHostUpdated();
  },
  watch:{
    async substring(){
      this.stops = await Butter.getStopsBySubstring(this.substring);
    },
    center(){
      this.updateBusLocations();
    }
  },
  methods: {
    async fetchTimeTable() {
      this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date.replaceAll('-',''),
        stop_ids: [this.stop_id]
      });
    },
    async busStopClicked(gtfs_id, stop_id, stop_name) {
      // クリックされたバス停のgtfs_idとstop_idを取得
      // ここで必要な処理を行う
      console.log(`GTFS ID: ${gtfs_id}`);
      console.log(`Stop ID: ${stop_id}`);
      this.dialog = true; // ダイアログを表示
      this.stop_times = await Butter.fetchTimeTableV1(gtfs_id, {
        date: this.date.replaceAll('-',''),
        stop_ids: [stop_id]
      });
      this.stop_name = stop_name;
      this.gtfs_name = this.gtfs_id2name[gtfs_id];
    },
    async busStopClickedFromTable(row) { // この新しいメソッドを追加
      console.log(`GTFS ID: ${row.gtfs_id}`);
      console.log(`Stop ID: ${row.stop_id}`);
      this.dialog = true; // ダイアログを表示
      this.stop_times = await Butter.fetchTimeTableV1(row.gtfs_id, {
        date: this.date.replaceAll('-',''),
        stop_ids: [row.stop_id]
      });
      this.stop_name = row.stop_name;
      this.gtfs_name = this.gtfs_id2name[row.gtfs_id];
    },
  }
}
</script>
<!--
<link rel="stylesheet" href="https://www.unpkg.com/butter-tag@1.0.1/style.css"></link>
<div class="butter-tag" gtfs_id="ToeiBus" stop_ids='["0605-07"]'></div>
<script src="https://www.unpkg.com/butter-tag@1.0.1/dist.js"></script>
-->