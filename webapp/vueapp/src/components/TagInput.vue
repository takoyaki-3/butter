<template>
  <div>
    <!-- GTFS 名 -->
    <label for="gtfs_name">GTFS Name: </label>
    <input type="text" v-model="GTFSName" id="gtfs_name"><br><br>
    <input type="text" v-model="gtfsId" id="gtfs_id" style="display:none;">

    <!-- 駅名 -->
    <label for="station_name">Station Name: </label>
    <input type="text" v-model="stationName" id="station_name"><br><br>
    <input type="text" v-model="stopIdsInput" id="stop_ids" style="display:none;">

    <button @click="updateData">検索</button>

    <link rel="stylesheet" href="https://www.unpkg.com/butter-tag/style.css">
    <div class="butter-tag" :gtfs_id="gtfsId" :stop_ids="formattedStopIds" :key="componentKey"></div>
  </div>
</template>

<script>

import Butter from 'butter-lib/dist.js';

function loadScript(url) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  // scriptタグをbodyタグに追加する
  document.body.appendChild(script);
}

// 使用例
loadScript('https://www.unpkg.com/butter-tag/dist.js');


export default {
  data() {
    return {
      gtfsId: 'ToeiBus',
      GTFSName: '東京都交通局',
      stopIdsInput: '0965-01',
      stationName: '新宿駅',
      componentKey: 0,
    };
  },
  computed: {
    formattedStopIds: function () {
      console.log("formattedStopIds", this.stopIdsInput.split(',').map(id => id.trim()));
      return JSON.stringify(this.stopIdsInput.split(',').map(id => id.trim()));
    }
  },
  async mounted() {
    await Butter.init();
  },
  methods: {
    updateData() {
      this.componentKey += 1;
      loadScript('https://www.unpkg.com/butter-tag/dist.js');
      this.stoplists();
    },
    async stoplists() {
      // get gtfs_id
      const hostData = (await Butter.getHostDataList())
      for (let i = 0; i < hostData.length; i++) {
        if (hostData[i].name == this.GTFSName) {
          this.gtfsId = hostData[i].gtfs_id;
          break;
        }
      }
      // get stop_ids
      this.stops = (await Butter.getStopsBySubstring(this.stationName));
      console.log("this stops", this.stops);
      this.stopIdsInput = '';
      for (let i = 0; i < this.stops.length; i++) {
        if (this.stops[i].gtfs_id == this.gtfsId && this.stops[i].stop_name.indexOf(this.stationName) != -1) {
          this.stopIdsInput = this.stopIdsInput + this.stops[i].stop_id + ',';
        }
      }
      this.stopIdsInput = this.stopIdsInput.slice(0, -1);
      console.log("this stopIdsInput", this.stopIdsInput);
    },
  }
}
</script>

<style scoped></style>