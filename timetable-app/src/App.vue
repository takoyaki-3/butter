<template>
  <v-app style="background:lightgoldenrodyellow">
    <v-app-bar app color="brown" dark>
      <div class="d-flex align-center">
        BuTTER 時刻表
      </div>

      <v-spacer></v-spacer>

      <v-btn href="https://github.com/takoyaki-3/butter" target="_blank" text>
        <span class="mr-2">GitHub</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <HelloWorld />
    </v-main>
  </v-app>
</template>

<script>
import HelloWorld from './components/HelloWorld';

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  data: () => ({
    //
  }),
};
</script>
