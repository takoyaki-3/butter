<template>
  <v-container>
    <v-row class="text-center">

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          BuTTER Tag Maker
        </h1>
        <p class="text-left">
          BuTTER (Bus Time-Table by Edge-Rumtime) は、数行のBuTTER TagをWebページに貼り付けることで最新の時刻表をWebページに埋め込むことができるツールです。また、それに付随したライブラリ、データ変換ツール、WebAPIを提供しています。
        </p>
      </v-col>
    </v-row>

    <DemoSpace/>
  </v-container>
</template>

<script>
  import DemoSpace from './DemoSpace.vue'
  export default {
    name: 'HelloWorld',
    components: {
      DemoSpace,
    },
    data: () => ({
    }),
  }
</script>
