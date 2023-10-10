<template>
  <v-container>
    <!-- モード切り替えトグルを追加 -->
    <v-switch v-model="isBothStopsMode" label="出発と到着のバス停を選択"></v-switch>

    <v-tabs class="mb-5" v-model="tabs"> <!-- vertical 属性を削除 -->
      <v-tab>マップから選択</v-tab>
      <v-tab>名前から選択</v-tab>
      <v-tabs-items v-model="tabs" :touchless="true">
        <v-tab-item>
          <v-row class="text-left,py-1">
            <v-container class="my-3,py-1">
              <v-container class="my-3,py-1">
                <v-row class="py-1">
                  <v-col class="py-1">
                    <v-text-field v-model="searchQuery" placeholder="例）東京都新宿区"></v-text-field>
                  </v-col>
                  <v-col class="py-1">
                    <v-btn @click="searchLocation" style="marginRight: 20px;">検索</v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-container>
            <v-col cols="12">
              <v-container fluid class="map-container" style="padding-top: 0;">
                <l-map :center="center"
                  :zoom="zoom"
                  @click.right="mapRclicked"
                  ref="map"
                  style="height: 60vh; width: 100%">
                  <l-tile-layer :url="url"></l-tile-layer>
                  <l-marker v-for="(marker, index) in busStopMarkers"
                    :key="index + marker.name"
                    :lat-lng="marker.latlon"
                    :name="marker.name"
                    :icon="BusStopIcon"
                    @click="busStopClicked(marker.gtfs_id, marker.stop_id)">
                  </l-marker>
                </l-map>
              </v-container>
            </v-col>
          </v-row>
        </v-tab-item>

        <v-tab-item>
          <v-row class="text-left">
            <v-col class="mb-5" cols="12" md="6">
              <v-container class="my-3">
                <h3>文字列から停留所を検索</h3>
                <v-text-field v-model="substring" label="Stop Name" outlined></v-text-field>
                <v-data-table
                  :headers="stops_headers"
                  :items="stops"
                  @click:row="busStopClickedFromTable"
                ></v-data-table>
              </v-container>
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs-items>
    </v-tabs>
    <v-row class="text-left">
      <v-col class="mb-5" cols="12">
        <h3>プレビュー表示</h3>
        <!--プレビュー表示-->
        <div id="previewTagCode"></div>
      </v-col>
    </v-row>
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
        <v-card-title>生成されたタグ</v-card-title>
        <v-card-text>
          <pre class="language-html">
            <code>
              {{ tagCode }}
            </code>
          </pre>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="copyTag">コピー</v-btn>
          <span v-if="copySuccess">コピーしました！</span>
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
    boardingStop: null, // 乗車するバス停
    alightingStop: null, // 降車するバス停
    isBothStopsMode: false, // デフォルトでは出発バス停のみのモード
    tabs:'',
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
    host_updated:[],
    tagCode:"",
    searchQuery:"",
  }),
  async mounted (){

    // 日付取得
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.date = `${year}${month}${day}`;

    // Get data list
    this.dataList = await Butter.getHostDataList()
    
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
    this.$nextTick(() => {
      this.$refs.map.mapObject.on('moveend', () => {
        const newCenter = this.$refs.map.mapObject.getCenter();
        this.center = [newCenter.lat, newCenter.lng];
      });
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
    },
    isBothStopsMode: {
        immediate: true,
        handler() {
            this.resetState();
        }
    }
  },
  methods: {
    async loadPreviewTag(gtfs_id, stop_ids) {

      const divPreview = document.getElementById('previewTagCode')
      divPreview.innerHTML = ''

      // スタイルシートの追加
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://www.unpkg.com/butter-tag/style.css';
      divPreview.appendChild(link);

      // divタグの追加
      const div = document.createElement('div');
      div.className = 'butter-tag';
      div.setAttribute('gtfs_id', gtfs_id);
      div.setAttribute('stop_ids', JSON.stringify(stop_ids));
      divPreview.appendChild(div); // 適切なクラス名またはIDに置き換えてください

      // スクリプトの追加
      const script = document.createElement('script');
      script.src = 'https://www.unpkg.com/butter-tag/dist.js';
      divPreview.appendChild(script);
    },
    async searchLocation() {
      try {
        // 例: OpenStreetMapのジオコーディングAPIを使用する場合
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.searchQuery}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = data[0].lat;
          const lon = data[0].lon;
          this.center = [lat, lon];
          this.zoom = 15;  // ズームレベルを調整することができます
        } else {
          // alert("地区が見つかりませんでした。");
        }
      } catch (error) {
        console.error("エラー:", error);
        alert("検索中にエラーが発生しました。");
      }
    },
    busStopClicked(gtfs_id, stop_id) {
      if (!this.boardingStop) {
        this.boardingStop = { gtfs_id, stop_id };
        if (this.isBothStopsMode) {
          alert("乗車するバス停を選択しました。次に降車するバス停を選択してください。");
        } else {
          this.generateTagForOneStop();
        }
      } else if (this.isBothStopsMode && !this.alightingStop) {
        this.alightingStop = { gtfs_id, stop_id };
        this.generateTagForBothStops();
      } else {
        alert("既に2つのバス停が選択されています。再選択する場合は、モードを切り替えてください。");
      }
    },
    generateTagForOneStop() {
      this.tagCode = `
        <link rel="stylesheet" href="https://www.unpkg.com/butter-tag/style.css"></link>
        <div class="butter-tag" gtfs_id="${this.boardingStop.gtfs_id}" stop_ids='["${this.boardingStop.stop_id}"]'>
        </div><script src="https://www.unpkg.com/butter-tag/dist.js"></scri`+`pt>`;
      this.dialog = true;
      this.loadPreviewTag(this.boardingStop.gtfs_id, [this.boardingStop.stop_id]);
    },
    generateTagForBothStops() {
      this.tagCode = `
        <link rel="stylesheet" href="https://www.unpkg.com/butter-tag/style.css"></link>
        <div class="butter-tag" gtfs_id="${this.boardingStop.gtfs_id}" stop_ids='["${this.boardingStop.stop_id}"]' to_stop_ids='["${this.alightingStop.stop_id}"]'>
        </div><script src="https://www.unpkg.com/butter-tag/dist.js"></scri`+`pt>`;
      this.dialog = true;
      this.loadPreviewTag(this.boardingStop.gtfs_id, [this.boardingStop.stop_id, this.alightingStop.stop_id]);
    },
    busStopClickedFromTable(row) { // この新しいメソッドを追加
      console.log(`GTFS ID: ${row.gtfs_id}`);
      console.log(`Stop ID: ${row.stop_id}`);
      this.tagCode = `\n<link rel="stylesheet" href="https://www.unpkg.com/butter-tag/style.css"></link>
<div class="butter-tag" gtfs_id="${row.gtfs_id}" stop_ids='["${row.stop_id}"]'>
</div><script src="https://www.unpkg.com/butter-tag/dist.js"></scri`+`pt>`; // 生成されたタグ欄に表示
      this.dialog = true; // ダイアログを表示
      this.loadPreviewTag(row.gtfs_id, [row.stop_id]);
      console.log(this.tagCode)
    },
    copyTag() {
      navigator.clipboard.writeText(this.tagCode).then(() => {
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 2000); // 2秒後にメッセージを隠す
      });
    },
    resetState() {
      this.boardingStop = null;
      this.alightingStop = null;
      this.tagCode = "";
    },
  }
}
</script>
