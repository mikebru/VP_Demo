import UnrealService from "@/UnrealService.js";
import config from "@/config.js";

export default {
  mounted() {
    if (this.poll) this.poll();
  },
  created() {
    if (this.poll) {
      this.interval = setInterval(() => {
        if (!UnrealService.requestQueue.length && config.enablePolling && document.activeElement.nodeName !== "INPUT") {
          this.poll();
        }
      }, config.pollingDelay);
    }
  },
  methods: {
    computeBasePath() {
      let obj = this.$parent;
      let parentNames = [this.$options.name];

      while(obj) {
        if (obj.$options.name) {
          parentNames.push(obj.$options.name);
        }
        obj = obj.$parent;
      }

      let path = "";
      for (let i = parentNames.length - 1; i > -1; i--) {
        path += parentNames[i] + "/";
      }

      return path;
    },
  },
  beforeDestroy() {
    clearInterval(this.interval)
  }
}