<template>
  <div id="app">
    <div id="form-container">
    <SearchForm @formSubmitted="handleFormSubmit" />
    </div>
    <div id="map-container">
    <MapComponent ref="mapComponent" @mapReady="console.log('Map is ready!')" />
    </div>
  </div>
</template>

<script>
import MapComponent from './components/MapComponent.vue'
import SearchForm from './components/SearchForm.vue'
import Butter from "butter"
//import L from "leaflet"

// バス停アイコン
// var busStopIcon = L.icon({
//   iconUrl: 'bus_stop_icon.png',
//   iconSize: [32, 32],
//   iconAnchor: [16, 16]
// });

// let busStopMarkers = [];

export default {
  name: 'App',
  components: {
    MapComponent,
    SearchForm,
  },
  data() {
    return {
      formData: null,
    };
  },
  watch: {
    async formData(newValue) {
      if (newValue && this.$refs.mapComponent.map) {
        await this.handleFormSubmit(newValue);
      }
    },
  },
  methods: {
    async handleFormSubmit(formData) {
      this.formData = formData;
      console.log(this.$refs.mapComponent.map);
      // Do something with the form data
      // 停留所可視化
      // this.$nextTick(async () => {
      //   busStopMarkers.forEach(marker => this.$refs.mapComponent.map.removeLayer(marker));
      //   busStopMarkers = [];
      //   const radius = 500; // メートル単位
      //   const aroundStops = await window.Butter.utils.getStopsWithinRadius(formData.latitude, formData.longitude, radius);
      //   aroundStops.forEach((bus_stop) => {
      //     var marker = L.marker([bus_stop.stop_lat, bus_stop.stop_lon], { icon: busStopIcon })
      //       .bindPopup(bus_stop.stop_name);
      //     busStopMarkers.push(marker);
      //     marker.addTo(this.$refs.mapComponent.map);
      //   });
      // });
    }
  },
  mounted: async function () {
    // existing code...
    console.log(Butter)
  }
}
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#form-container {
  flex: 0 0 auto; /* これにより、フォームコンテナのサイズはその内容によって自動的に決まります */
}

#map-container {
  flex: 1 1 auto; /* これにより、地図コンテナは残りのスペース全体を占めます */
}
</style>
