const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  outputDir: '../dist/tag-maker',
  transpileDependencies: [
    'vuetify'
  ]
})
