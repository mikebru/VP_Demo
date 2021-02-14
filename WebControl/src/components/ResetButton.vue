<template>
    <i ref="icon" @mousedown="onReset" class="fas fa-undo"></i>
</template>

<script>
import UnrealService from "@/UnrealService.js";
export default {
  name: "ResetButton",
  methods: {
    mounted() {
      if (this.$options.alignReset) {
        const alignment = this.$options.alignReset;
        if (alignment === "top") {
          this.$refs.icon.style.top = 0;
        } else if (alignment === "bottom") {
          this.$refs.icon.style.bottom = 0;
        } else {
          this.$refs.icon.style.top = alignment;
        }
      }
      if (this.$options.rightDistance) {
        this.$refs.icon.style.right = this.$options.rightDistance + "px";
      } else {
        this.$refs.icon.style.right = "-10px";
      }
    },
    onReset() {
      UnrealService.clicking = true;
      setTimeout(() => UnrealService.clicking = false, 400);
      this.$emit("reset");
    },
  }
}
</script>

<style scoped lang="scss">
i {
  position: absolute;
  opacity: 0.7;
  padding: 7px;
  border-radius: 10px;
}
i:hover {
  opacity: 1;
  background-color: #00000059;
}
i:active {
  color: $primary-color;
}
</style>