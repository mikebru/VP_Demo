<template>
  <div class="sliders">
    <div class="slider-column" v-for="(obj, color) in colors" :key="color">
      <p>{{color}}</p>
      <RangeSlider
        class="range-slider"
        orientation="vertical"
        min="0"
        max="255"
        :displayReset="false"
        :width="width"
        :height="height"
        :fillColor="obj.displayColor"
        :displayKnob="false"
        :value="innerColor.rgb[color]"
        @input="onInput(color, $event)"
        :style="{marginLeft: (margin/2)+'px', marginRight: (margin/2)+'px'}"
      >
      </RangeSlider>
      <CustomInput :max="255" @input="onInput(color, $event)" :value="innerColor.rgb[color]"/>
    </div>
  </div>
</template>

<script>
import RangeSlider from "rangeslider";
import { iro } from "colorpicker";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "RgbInput",
  props: {
    value: {
      type: iro.Color
    },
    width: {
      type: [String, Number],
      default: 25
    },
    height: {
      type: [String, Number]
    },
    margin: {
      type: [String, Number],
      default: 10
    }
  },
  data() {
    return {
      innerColor: this.value,
      colors: {
        "r": {displayColor: "#db4343"},
        "g": {displayColor: "#43db57"},
        "b": {displayColor: "#4384db"}
      }
    }
  },
  methods: {
    onInput(color, value) {
      if (isNaN(value) || value.length == 0) return;
      const rgb = this.innerColor.rgb;
      rgb[color] = parseInt(value);
      this.innerColor.rgb = rgb;
      this.$emit("input", {color: this.innerColor});
    }
  },
  watch: {
    value(newValue) {
      this.innerColor = newValue;
    }
  },
  components: {
    RangeSlider,
    CustomInput
  }
}
</script>

<style scoped lang="scss">
// Todo: Align text and inputs properly
.sliders {
  display: flex;
  justify-content: space-evenly;
}
.slider-column p {
  padding-right: 5px;
  margin-top: 0;
  margin-bottom: 5px;
}
.slider-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}
input {
  margin-top: 7px;
  text-align: center;
  width: 50px;
  padding-right: 5px;
  padding-left: 4px;
}
input:focus {
  background-color: #0000005c;
}
.range-slider {
  margin-bottom: 3px;
}
</style>