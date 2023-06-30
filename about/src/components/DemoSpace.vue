<template>
  <v-container>
    <v-row class="text-left">
      <h2>Demo</h2>
      <v-col
        class="mb-5"
        cols="12"
      >
        <h3>文字列から停留所を検索</h3>
        <input v-model="substring" placeholder="ここにバス停名を入力">
        <table>
          <tr>
            <th>名称</th>
            <th>stop_id</th>
            <th>GTFS ID</th>
          </tr>
          <tr v-for="stop in stops" :key="stop.stop_id">
            <td>{{stop.stop_name}}</td>
            <td>{{stop.stop_id}}</td>
            <td>{{stop.gtfs_id}}</td>
          </tr>
        </table>
      </v-col>
    </v-row>
    <v-row class="text-left">
      <v-col
        class="mb-5"
        cols="12"
      >
        <h3>Butter.getStopsWithinRadius(lat, lon, radius)</h3>
        <p>特定の緯度、経度、半径の範囲内にあるバス停を取得します。</p>
        <v-container fluid>
          <l-map :center="center"
            :zoom="zoom"
            @click.right="mapRclicked"
            ref="map"
            style="height: 50vh; width: 50vh"
            >
            <l-tile-layer :url="url"></l-tile-layer>
            <l-marker v-for="(marker,index) in busStopMarkers"
              :key="index+marker.name"
              :lat-lng="marker.latlon"
              :name="marker.name"
              :icon="BusStopIcon"
              >
            
            </l-marker>
          </l-map>
        </v-container>
      </v-col>
      <v-col
        class="mb-5"
        cols="12"
      >
        <input v-model="gtfs_id" placeholder="ここにgtfs_idを入力">
        <input v-model="stop_id" placeholder="ここにstop_idを入力">
        <input v-model="date" placeholder="ここにyyyymmdd形式の日付を入力">
        <table>
          <tr>
            <th>行先表示</th>
            <th>発車時刻</th>
          </tr>
          <tr v-for="st,i in stop_times.stop_times" :key="i">
            <td>{{st.head_sign}}</td>
            <td>{{st.departure_time}}</td>
          </tr>
        </table>
      </v-col>
    </v-row>
  </v-container>
</template>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
<style>
#map {
    height: 100vh;
    width: 100vw;
  }
</style>

<script>
import {latLng} from 'leaflet';
import { LMap,LTileLayer,LMarker } from "vue2-leaflet";
import Butter from 'butter-lib/dist.js';
Butter.init()
import 'leaflet/dist/leaflet.css'

export default {
  name: 'DemoSpace',
  components:{
    LMap,
    LTileLayer,
    LMarker,
  },
  data: () => ({
    dataList: [],
    updateTime: '',
    substring:'東京駅',
    gtfs_id:'ToeiBus',
    stop_id:'0965-01',
    date:'2023-06-30',
    stops:[],
    stop_times:[],
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    zoom: 13,
    center: [35.6809591, 139.7673068],
    bounds: null,
    busMarkers:[],
    busStopMarkers:[],
    BusStopIcon:null,
    updateBusLocations:null,
  }),
  async mounted (){

    // 時刻表
    this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
      date: this.date,
      stop_ids: [this.stop_id]
    });
    console.log(this.stop_times)

    // 日付取得
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.date = `${year}${month}${day}`;

    // Get data list
    this.dataList = await Butter.getHostDataList()
    
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
    this.$refs.map.mapObject.on('moveend', () => {
      const newCenter = this.$refs.map.mapObject.getCenter();
      this.center = [newCenter.lat, newCenter.lng];
    });

    // 停留所名
    this.stops = await Butter.getStopsBySubstring(this.substring);
  },
  watch:{
    async substring(){
      this.stops = await Butter.getStopsBySubstring(this.substring);
    },
    async head_sign(){
      this.stop_times = await Butter.fetchTimeTableV1(this.gtfs_id, {
        date: this.date,
        stop_ids: [this.stop_id]
      });
    },
    async gtfs_id(){
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
