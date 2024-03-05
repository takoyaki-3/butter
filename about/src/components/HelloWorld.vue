<template>
  <v-container>
    <v-row class="text-center">

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Welcome to BuTTER
        </h1>
        <p class="text-left">
          BuTTER (Bus Time-Table by Edge-Rumtime) は、数行のBuTTER TagをWebページに貼り付けることで最新の時刻表をWebページに埋め込むことができるツールです。また、それに付随したライブラリ、データ変換ツール、WebAPIを提供しています。
        </p>
      </v-col>
    </v-row>

    <v-row class="text-center">
      <v-col
        class="mb-5"
        cols="4"
      >
        <h2>BuTTER Module</h2>
        <p class="text-left">
          BuTTER内部で利用しているライブラリをMITライセンスにて公開しています。BuTTER Moduleを利用すると、バスの時刻表やバス停、リアルタイムのバス情報を利用したアプリケーションやWebサイトを簡単に作成できます。</p>
        <v-btn
          color="primary"
          dark
          @click="redirectToNPM"
        >
        npmパッケージを見る
        </v-btn>
      </v-col>

      <v-col
        class="mb-5"
          cols="4"
        >
        <h2>BuTTER Web API</h2>
        <p class="text-left">
          BuTTER Moduleの関数群をHTTPSにより呼び出せるようにしたAPIです。APIのエンドポイントは適宜変更となるため、JSONにより公開されているエンドポイントリストを確認してください。</p>
        <v-btn
          color="primary"
          dark
          @click="redirectToButterAPIReference"
        >
        APIリファレンス
        </v-btn>
      </v-col>

      <v-col
        class="mb-5"
          cols="4"
        >
        <h2>BuTTER Tag</h2>
        <p class="text-left">
          WebページのHTMLに埋め込むだけで指定したバス停の時刻表やバスの位置情報を組み込むことができるタグです。</p>
        <v-btn
          color="primary"
          dark
          @click="redirectToButterTagMaker"
        >
        BuTTERETagを作成する
        </v-btn>
      </v-col>
    </v-row>

    <DemoSpace/>
    <SampleCode/>
  </v-container>
</template>

<script>
  import SampleCode from './SampleCode'
  import DemoSpace from './DemoSpace.vue'
  export default {
    name: 'HelloWorld',
    components: {
      SampleCode,
      DemoSpace,
    },
    data: () => {
      return {
        stop_id: 'バス停名',
        gtfs_id: 'GTFS_ID',
        stop_name: 'バス停名',
        gtfs_name: 'GTFS_ID',
      }
    },
    methods: {
      redirectToButterTagMaker() {
        window.location.href = 'https://tag-maker.butter.takoyaki3.com';
      },
      redirectToButterAPIReference() {
        window.location.href = './api.html';
      },
      redirectToNPM() {
        window.location.href = 'https://www.npmjs.com/package/butter-lib';
      },
    }
  }
</script>
