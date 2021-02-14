import ResetButtonClass from "@/components/ResetButton.vue";
import Vue from "vue";

export default {
  props: {
    displayReset: {
      type: [String, Boolean],
      default: true
    }
  },
  mounted() {
    if (this.displayReset) {
      const ResetButton = Vue.extend(ResetButtonClass);
      const instance = new ResetButton();
      instance.$mount();
      instance.$options.alignReset = this.$options.alignReset;
      instance.$options.rightDistance = this.$options.rightDistance;
      instance.mounted();
      this.$el.style.position = "relative";
      this.$el.appendChild(instance.$el);
      instance.$on("reset", this.reset);
    }
  },
  methods: {
    reset() {
      // Send an event if the component doesn't have a reset method.
      this.$emit("reset");
      // eslint-disable-next-line no-console
      //console.warn("You should implement a reset function when using the reset mixin!");
    }
  }
};
