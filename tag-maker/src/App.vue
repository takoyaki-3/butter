<template>
  <v-app style="background:lightgoldenrodyellow">
    <v-app-bar app color="brown" dark>
      <div class="d-flex align-center">
        BuTTER Tag Maker
      </div>

      <v-spacer></v-spacer>

      <v-btn href="https://docs.google.com/spreadsheets/d/1WOyObvy7wez5tfRozYSTRYUA6Kunf1zRfK5Bkhvpl5Q/edit#gid=0" target="_blank" text>
        <span class="mr-2">利用規約</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
      <v-btn href="https://github.com/takoyaki-3/butter" target="_blank" text>
        <span class="mr-2">GitHub</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <TagInput />
    </v-main>
  </v-app>
</template>

<script>
import TagInput from './components/TagInput';

export default {
  name: 'App',

  components: {
    TagInput,
  },

  data: () => ({
    //
  }),
};
</script>
