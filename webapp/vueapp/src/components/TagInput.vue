
<template>
  <div>
    <label for="gtfs_id">GTFS ID: </label>
    <input type="text" v-model="gtfsId" id="gtfs_id"><br><br>

    <label for="stop_ids">Stop IDs (comma separated): </label>
    <input type="text" v-model="stopIdsInput" id="stop_ids"><br><br>

    <link rel="stylesheet" href="https://www.unpkg.com/butter-tag@1.0.6/style.css">
    <div class="butter-tag" :gtfs_id="gtfsId" :stop_ids="formattedStopIds"></div>
  </div>
</template>

<script>

function loadScript(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;

  // scriptがロードされた後にcallback関数を実行する
  script.onload = function() {
    callback();
  };

  // scriptタグをbodyタグに追加する
  document.body.appendChild(script);
}

// 使用例
loadScript('https://www.unpkg.com/butter-tag@1.0.6/dist.js', function() {
  // この部分は、スクリプトがロードされた後に実行されます
  console.log('Script loaded!');
});

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
    