<template>
  <div id="map" style="height: 100vh; width: 100%;">
    <l-map :zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

export default {
  components: {
    LMap,
    LTileLayer,
  },
  data() {
    return {
      zoom: 10,
      center: [35.6895, 139.6917],
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
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
