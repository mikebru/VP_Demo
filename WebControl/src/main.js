import Vue from "vue";
import App from "@/App.vue";
import ObjectGroup from "@/components/ObjectGroup.vue";
import noBounce from  "nobounce";
import config from "@/config.js";
import ConfigManager from "@/ConfigManager.js"
import PollingMixin from "@/mixins/PollingMixin.js";
import cache from "@/cache.js";
import { VueHammer } from 'vue2-hammer';

! async function initializeWebApp() {
  const configManager = new ConfigManager(config, cache);
  var interval = setInterval(async () => {
    try {
      await configManager.queryMissingConfig();
      clearInterval(interval);
    } catch(e) {
      const error = "Unable to connect to the remote control server.";
      // eslint-disable-next-line no-console
      console.log(error);
    }}, 1000
  );

  if (config.fetchActors) {
    setInterval(configManager.updateLevelActors.bind(configManager), config.fetchActorsInterval);
  }

  noBounce.enable();
  Vue.config.productionTip = false

  // Add a global Polling mixin
  Vue.mixin(PollingMixin);

  // Add a global ObjectGroup component
  Vue.component("ObjectGroup", ObjectGroup)

  // Setup VueHammer (Touch controls helper)
  VueHammer.config.tap = {
    time: 1000
  };
  Vue.use(VueHammer);

  new Vue({
    render: function (h) { return h(App) }
  }).$mount("#app")
}();