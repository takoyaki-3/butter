<template>
  <div id="app">
    <MapComponent />
  </div>
</template>

<script>
import MapComponent from './components/MapComponent.vue'
import Butter from "butter"

export default {
  name: 'App',
  components: {
    MapComponent,
  },
  mounted: async function(){
    console.log(Butter)
    const hostData = (await window.Butter.getHostDataList())
      console.log({ "getHostDataList": hostData })

      const agencyInfo = await window.Butter.getAgencyInfo(hostData[0].gtfs_id)
      console.log({ "GetInfo": agencyInfo })

      const stops = await window.Butter.getBusStops(hostData[0].gtfs_id, agencyInfo[0].version_id)
      console.log({ "getBusStops": stops })

      const trips = await window.Butter.getTrips(hostData[0].gtfs_id, agencyInfo[0].version_id)
      console.log({ "getTrips": trips })

      // 名前からの停留所検索使用例
      const substring = "かみ";
      await window.Butter.utils.getStopsBySubstring(substring).then((stops) => {
        console.log(`Stops containing '${substring}':`);
        console.log(stops);
      });

      // 緯度経度からの停留所検索使用例
      const lat = 35.693906;
      const lon = 139.701504;
      const radius = 500; // メートル単位

      const aroundStops = await window.Butter.utils.getStopsWithinRadius(lat, lon, radius);
      console.log("stops",aroundStops);

      // バスのリアルタイム情報取得例
      const busInfo = await window.Butter.utils.getBusInfo(lat,lon)
      console.log("bus positions",busInfo)

      // 時刻表情報の取得
      let tt = await window.Butter.utils.fetchTimeTableV1(hostData[0].gtfs_id, {
        date: "20230513",
        stop_ids: [stops[0].stop_id]
      })
      console.log({ "ttFetched1": tt })

      tt = await window.Butter.utils.fetchTimeTableV1(hostData[0].gtfs_id, {
        date: "20230513",
        trip_ids: [trips[0].trip_id, trips[1].trip_id]
      })
      console.log({ "ttFetched2": tt })

      console.log("COMSUMED OPERATIONS ARE", window.Butter.getComsumedOp())
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
