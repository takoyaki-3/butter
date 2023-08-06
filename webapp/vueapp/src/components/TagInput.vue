
<template>
  <div>
    <label for="gtfs_id">GTFS ID: </label>
    <input type="text" v-model="gtfsId" id="gtfs_id"><br><br>

    <label for="stop_ids">Stop IDs (comma separated): </label>
    <input type="text" v-model="stopIdsInput" id="stop_ids"><br><br>

    <link rel="stylesheet" href="https://www.unpkg.com/butter-tag@1.0.1/style.css">
    <div class="butter-tag" :gtfs_id="gtfsId" :stop_ids="formattedStopIds"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      gtfsId: 'ToeiBus',
      stopIdsInput: '0605-07',
    };
  },
  computed: {
    formattedStopIds: function() {
      return JSON.stringify(this.stopIdsInput.split(',').map(id => id.trim()));
    }
  }
}
</script>

<style scoped>
</style>
    