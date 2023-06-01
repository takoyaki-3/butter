<template>
  <div id="map" style="height: 100vh; width: 100%;">
    <l-map :zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker v-for="(mark, index) in markers" :key="index" :lat-lng="mark"></l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

export default {
  props: {
    markers: {
      type: Array,
      required: false
    }
  },
  components: {
    LMap,
    LTileLayer,
    LMarker,
  },
  data() {
    return {
      zoom: 13,
      center: [35.6895, 139.6917],
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  },
  watch: {
    markers: function (newMarkers) {
      console.log(newMarkers);
    },
  },
};
</script>

<style>
/* 必要なスタイルを追加 */
#map {
  height: 100%;
  width: 100%;
}
</style>
