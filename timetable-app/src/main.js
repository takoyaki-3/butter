import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App),
  mounted() {
    this.$nextTick(() => {
      const blocks = document.querySelectorAll('pre code');
      blocks.forEach((block) => {
        hljs.highlightBlock(block);
      });
    });
  },
}).$mount('#app')
