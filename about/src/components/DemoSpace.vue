<template>
  <v-container>
    <v-row class="text-left">
      <v-col
        class="mb-5"
        cols="12"
      >
        <h3>各ストレージにおけるデータ最終更新日時</h3>
        <p>過去30日以内にデータが更新されたストレージホストの一覧です。</p>
        <v-data-table
          :headers="host_updated_headers"
          :items="host_updated"
        ></v-data-table>

        <h2>Demo</h2>
        <h3>インストール方法</h3>
        <p>はじめに、次のコマンドによりBuTTERモジュールをインストールします。</p>
        <p>CDNを使ったコードサンプル</p>
        <pre><code class="language-javascript">&lt;html&gt;
&lt;script type="module"&gt;
import Butter from 'https://www.unpkg.com/butter-lib@1.0.4/dist.js';
Butter.init("https://butter.takoyaki3.com/v0.0.0/root.json", {version: '1.0.0'})

// ここに処理を書いていく

&lt;/script&gt;
&lt;/html&gt;</code></pre>
        <h3>バス停・リアルタイムバスロケーションの表示</h3>
        <p><b>Butter.getStopsWithinRadius(lat, lon, radius)</b>関数及び<b>Butter.getBusInfo(lat, lon)</b>関数により、特定の緯度、経度、半径の範囲内にあるバス停及びリアルタイムのバス位置情報を取得します。</p>
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
            <l-marker v-for="(marker,index) in busMarkers"
              :key="index+'_'+marker.name"
              :lat-lng="marker.latlon"
              :name="marker.name"
              :icon="BusIcon"
              >
            </l-marker>
          </l-map>
          <p><br/>コードサンプル</p>
          <pre><code class="language-javascript">import {latLng,Icon} from 'leaflet';
import { LMap,LTileLayer,LMarker } from "vue2-leaflet";
import Butter from 'butter-lib/dist.js';
Butter.init("https://butter.takoyaki3.com/v0.0.0/root.json", {version: '1.0.0'})
import 'leaflet/dist/leaflet.css'

export default {
  name: 'DemoSpace',
  components:{
    LMap,
    LTileLayer,
    LMarker,
  },
  data: () => ({
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
  }),
  async mounted (){

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
        });
      });

      const busInfo = await Butter.getBusInfo(this.center[0], this.center[1])

      if(busInfo.length > 0){
        busInfo.forEach((item)=>{
          item.forEach((bus)=>{
            this.busMarkers.push({
              latlon:latLng(bus.vehicle.position.latitude, bus.vehicle.position.longitude),
              name:'',
              bindPopup:bus.name,
            });
          });
        })
      }
    }

    setInterval(this.updateBusLocations, 30000);
    this.updateBusLocations();

    // 地図の移動が終わったときのイベントハンドラを設定
    this.$nextTick(() => {
      this.$refs.map.mapObject.on('moveend', () => {
        const newCenter = this.$refs.map.mapObject.getCenter();
        this.center = [newCenter.lat, newCenter.lng];
      });
    });
  },
  watch:{
    center(){
      this.updateBusLocations();
    }
  }
}
</code></pre>
        </v-container>
      </v-col>
    </v-row>
    <v-row class="text-left">
      <v-col
        class="mb-5"
        cols="12" md="6"
      >
        <h3>文字列から停留所を検索</h3>
        <v-text-field v-model="substring" label="Stop Name" outlined></v-text-field>
        <v-data-table
          :headers="stops_headers"
          :items="stops"
          @click:row="busStopClickedFromTable"
        ></v-data-table>

        <p><br/>コードサンプル</p>
        <pre><code class="language-javascript">this.stops = await Butter.getStopsBySubstring(this.substring);</code></pre>
      </v-col>
      <v-col
        class="mb-5"
        cols="12" md="6"
      >
        <h3>バス停の時刻表を取得</h3>
        <p><b>Butter.fetchTimeTableV1</b>関数により停留所及びバスの時刻表を取得できます。</p>

        <v-text-field v-model="gtfs_id" label="GTFS ID" outlined></v-text-field>
        <v-text-field v-model="stop_id" label="Stop ID" outlined></v-text-field>
        <v-text-field v-model="date" label="Date" outlined></v-text-field>
        <v-data-table
          :headers="stop_times_headers"
          :items="stop_times.stop_times"
        ></v-data-table>

        <p><br/>コードサンプル</p>
        <pre><code class="language-javascript">this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date,
        stop_ids: [this.stop_id]
      });</code></pre>
      </v-col>
      <v-col
        class="mb-5"
        cols="12"
      >
        <h3>対応事業者一覧の取得</h3>
        <p><b>Butter.getHostDataList()</b>関数により対応事業者一覧を取得できます。</p>
        <v-data-table
          :headers="gtfs_list_headers"
          :items="gtfs_list"
        ></v-data-table>
      
        <p><br/>コードサンプル</p>
        <pre><code class="language-javascript">const hostData = await Butter.getHostDataList()
console.log(hostData)</code></pre>

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
.map-container {
  z-index: 0;
  position: relative; /* z-indexを有効にするためにpositionを設定 */
}
#map {
    height: 100vh;
    width: 100vw;
  }
</style>

<script>
import {latLng,Icon} from 'leaflet';
import { LMap,LTileLayer,LMarker } from "vue2-leaflet";
import Butter from 'butter-lib/dist.js';
await Butter.init(process.env.VUE_APP_BUTTER_ABOUT_ROOT, {version: '1.0.0'})
import 'leaflet/dist/leaflet.css'

export default {
  name: 'DemoSpace',
  components:{
    LMap,
    LTileLayer,
    LMarker,
  },
  data: () => ({
    menu: false,
    dialog:false,
    dataList: [],
    updateTime: '',
    substring:'東京駅',
    gtfs_id:'ToeiBus',
    stop_id:'0965-01',
    date:'2023-06-30',
    stops:[],
    stop_times:[],
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
    stop_times_headers:[
      {text:"stop_headsign",value:"stop_headsign"},
      {text:"departure_time",value:"departure_time"},
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
    gtfs_id2name:{},
    stop_name: '',
    gtfs_name: '',
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

      const busInfo = await Butter.getBusInfo(this.center[0], this.center[1])
      console.log({busInfo});

      if(busInfo.length > 0){
        busInfo.forEach((item)=>{
          item.forEach((bus)=>{
            if (bus['vehicle']){
              this.busMarkers.push({
                latlon:latLng(bus.vehicle.position.latitude, bus.vehicle.position.longitude),
                name:'',
                bindPopup:bus.name,
              });
            }
          });
        })
      }
    }

    setInterval(this.updateBusLocations, 30000);
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
    for(let i=0;i<this.dataList.length;i++) this.gtfs_id2name[this.dataList[i].gtfs_id] = this.dataList[i].name;

    // データ最終更新日時取得
    this.host_updated = await Butter.getHostUpdated();
  },
  methods:{
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
  },
  watch:{
    async substring(){
      this.stops = await Butter.getStopsBySubstring(this.substring);
    },
    async gtfs_id(){
      this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date,
        stop_ids: [this.stop_id]
      });
    },
    async stop_id(){
      this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date,
        stop_ids: [this.stop_id]
      });
    },
    async date(){
      this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date,
        stop_ids: [this.stop_id]
      });
    },
    center(){
      this.updateBusLocations();
    }
  }
}
</script>
