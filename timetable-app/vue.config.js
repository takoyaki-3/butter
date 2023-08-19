const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  outputDir: '../dist/timetable',
  transpileDependencies: [
    'vuetify'
  ]
})
