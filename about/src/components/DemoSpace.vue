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
        <div id="map"></div>
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
import L from 'leaflet';
import Butter from 'butter-lib/dist.js';
await Butter.init()

export default {
  name: 'DemoSpace',
  data: () => ({
    dataList: [],
    updateTime: '',
    substring:'東京駅',
    gtfs_id:'ToeiBus',
    stop_id:'0965-01',
    date:'2023-06-30',
    stops:[],
    stop_times:[]
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

    var map = L.map('map');

    var lat = 35.6809591;
    var lon = 139.7673068;

    map.setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
      
    // バスアイコン
    var busIcon = L.icon({
      iconUrl: 'bus-icon.png',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    // バス停アイコン
    var busStopIcon = L.icon({
      iconUrl: 'bus_stop_icon.png',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // 全てのバスマーカーを格納する配列
    let busMarkers = [];
    let busStopMarkers = [];

    async function updateBusLocations() {
      // 全ての前回のマーカーを削除
      if(busMarkers.length > 0) busMarkers.forEach(marker => map.removeLayer(marker));
      busMarkers = [];

      const center = map.getCenter();

      // 停留所可視化
      busStopMarkers.forEach(marker => map.removeLayer(marker));
      busStopMarkers = [];
      // 緯度経度からの停留所検索使用例
      const radius = 5000; // メートル単位
      const aroundStops = await Butter.getStopsWithinRadius(center.lat, center.lng, radius);
      if(aroundStops.length > 0) aroundStops.forEach(function(bus_stop) {
        const marker = L.marker([bus_stop.stop_lat, bus_stop.stop_lon], {icon: busStopIcon})
          .bindPopup(bus_stop.stop_name);
        busStopMarkers.push(marker);
        marker.addTo(map);
      });

      const busInfo = await Butter.getBusInfo(center.lat, center.lng)

      if(busInfo.length > 0){
        busInfo.forEach(function(item){
          item.forEach(function(bus) {
            const marker = L.marker([bus.vehicle.position.latitude, bus.vehicle.position.longitude], { icon: busIcon })
              .bindPopup(bus.name);

            busMarkers.push(marker);
            marker.addTo(map);
          });
        })
      }
    }

    map.on('moveend', function() {
      updateBusLocations();
    });

    setInterval(updateBusLocations, 30000);
    updateBusLocations();

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
    }
  }
}
</script>
