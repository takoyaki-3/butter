<template>
  <v-container>
    <v-row class="text-center">

      <v-col class="mb-4">
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
