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
        <p><b>※現在、BuTTER Moduleのみ公開しています。その他は開発中のため、今しばらくお待ちください。</b></p>
      </v-col>
    </v-row>

    <v-row class="text-center">
      <v-col
        class="mb-5"
        cols="4"
      >
        <h2>BuTTER Module</h2>
        <p class="text-left">BuTTER内部で利用しているライブラリをMITライセンスにて公開しています。BuTTER Moduleを利用すると、バスの時刻表やバス停、リアルタイムのバス情報を利用したアプリケーションやWebサイトを簡単に作成できます。</p>
      </v-col>

      <v-col
        class="mb-5"
          cols="4"
        >
        <h2>BuTTER Web API</h2>
        <p class="text-left">BuTTER Moduleの関数群をHTTPSにより呼び出せるようにしたAPIです。APIのエンドポイントは適宜変更となるため、JSONにより公開されているエンドポイントリストを確認してください。</p>        
      </v-col>

      <v-col
        class="mb-5"
          cols="4"
        >
        <h2>BuTTER Tag</h2>
        <p class="text-left">WebページのHTMLに埋め込むだけで指定したバス停の時刻表やバスの位置情報を組み込むことができるタグです。</p>
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
    data: () => ({
      ecosystem: [
        {
          text: 'vuetify-loader',
          href: 'https://github.com/vuetifyjs/vuetify-loader',
        },
        {
          text: 'github',
          href: 'https://github.com/vuetifyjs/vuetify',
        },
        {
          text: 'awesome-vuetify',
          href: 'https://github.com/vuetifyjs/awesome-vuetify',
        },
      ],
      importantLinks: [
        {
          text: 'Documentation',
          href: 'https://vuetifyjs.com',
        },
        {
          text: 'Chat',
          href: 'https://community.vuetifyjs.com',
        },
        {
          text: 'Made with Vuetify',
          href: 'https://madewithvuejs.com/vuetify',
        },
        {
          text: 'Twitter',
          href: 'https://twitter.com/vuetifyjs',
        },
        {
          text: 'Articles',
          href: 'https://medium.com/vuetify',
        },
      ],
      whatsNext: [
        {
          text: 'Explore components',
          href: 'https://vuetifyjs.com/components/api-explorer',
        },
        {
          text: 'Select a layout',
          href: 'https://vuetifyjs.com/getting-started/pre-made-layouts',
        },
        {
          text: 'Frequently Asked Questions',
          href: 'https://vuetifyjs.com/getting-started/frequently-asked-questions',
        },
      ],
    }),
  }
</script>
