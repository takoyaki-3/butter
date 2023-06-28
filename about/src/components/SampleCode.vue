<template>
  <v-container>
    <v-row class="text-left">
      <v-col
        class="mb-5"
        cols="12"
      >
        <h2>
          BuTTER Module Sample Code
        </h2>
        <p>BuTTER Moduleを用いたサンプルコード及び実行例を紹介します。</p>

        <h3>インポートと初期化：Butter.init()</h3>
        <p>BuTTERライブラリの初期化を行います。最初に呼び出してください。</p>
        <pre><code class="language-javascript">import Butter from 'https://butter.takoyaki3.com/v0.0.0/dist.js';
Butter.init()</code></pre>


<h3>対応データ一覧取得：Butter.getHostDataList()</h3>
        <p>対応データ一覧を取得します。この関数はホストのデータリストを取得するために使用されます。</p>
        <pre><code class="language-javascript">const hostData = await Butter.getHostDataList()
console.log(hostData)</code></pre>

<h3>停留所取得：Butter.getBusStops(gtfs_id)</h3>
        <p>特定のGTFS IDに関連するバス停を取得します。</p>
        <pre><code class="language-javascript">const stops = await Butter.getBusStops("your_gtfs_id", "your_version_id")
console.log(stops)</code></pre>

<h3>バスの情報取得：Butter.getTrips(gtfs_id)</h3>
        <p>特定のGTFS IDに関連するバス情報を取得します。</p>
        <pre><code class="language-javascript">const trips = await Butter.getTrips("your_gtfs_id", "your_version_id")
console.log(trips)</code></pre>

<h3>停留所名から検索：Butter.getStopsBySubstring(substring)</h3>
        <p>特定の文字列を含むバス停を取得します。</p>
        <pre><code class="language-javascript">const stops = await Butter.getStopsBySubstring("substring")
console.log(stops)</code></pre>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    name: 'SampleCode',
    data: () => ({
    }),
  }
</script>
