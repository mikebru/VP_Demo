<template>
<div class="color-section">
  <div class="param-selector">
    <ul>
      <div
        v-for="parameter in items"
        v-hammer:tap="() => selectedItem = parameter"
        class= "list-item inner"
        :key="parameter.label"
        :class="{active: selectedItem === parameter}">
          <li>{{parameter.label}}</li>
          <span
            class="dot"
            :style="{ backgroundColor: parameter.color.hexString}"
          ></span>
      </div>
    </ul>
  </div>
  <div class="color-picker-wrapper">
    <ColorPicker
      @input="onColorChange"
      :value="selectedItem.color"
      :useBoost="false"
      :displayReset="false"
    ></ColorPicker>
  </div>
</div>
</template>

<script>
import ColorPicker from "@/components/ColorPicker.vue";
import { iro } from "colorpicker";
import ResetMixin from "@/mixins/ResetMixin.js";

export default {
  name: "ColorPickerList",
  alignReset: "top",
  mixins: [
    ResetMixin
  ],
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedItem: null
    }
  },
  created() {
    this.selectedItem = this.items[0];
  },
  methods: {
    onColorChange(change) {
      this.$emit("change", this.selectedItem, change);
    },
    reset() {
      this.$emit("change", this.selectedItem, {color: new iro.Color(this.selectedItem.default || "#ffffff")});
    },
  },
  components: {
    ColorPicker
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
ul {
  padding-inline-start: 0px;
}
.list-item {
  @include color-param();
}
</style>