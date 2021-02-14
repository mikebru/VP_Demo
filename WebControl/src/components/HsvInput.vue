<template>
  <div class="sliders">
    <div class="slider-column" v-for="(obj, key) in params" :key="key">
      <p>{{key}}</p>
      <RangeSlider
        class="range-slider"
        orientation="vertical"
        min="0"
        :max="key === 'h' ? 360 : 100"
        :width="width"
        :displayReset="false"
        :displayKnob="key == 'h'"
        :value="innerColor.hsv[key]"
        :railGradient="obj.gradient"
        :fillColor="obj.fillColor"
        :height="height"
        knobColor="white"
        @input="onInput(key, $event)"
        :style="{marginLeft: (margin/2)+'px', marginRight: (margin/2)+'px'}"
      >
    </RangeSlider>

    <CustomInput :value="innerColor.hsv[key]" @input="onInput(key, $event)"/>
    </div>
  </div>
</template>

<script>
import RangeSlider from "rangeslider";
import { iro } from "colorpicker";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "HsvInput",
  props: {
    value: {
      type: iro.Color
    },
    height: {
      type: [String, Number]
    },
    width: {
      type: [String, Number],
      default: 25
    },
    margin: {
      type: [String, Number],
      default: 10
    }
  },
  data() {
    return {
      innerColor: this.value,
      params: {
        "h": { gradient: "linear-gradient(to top, rgba(255,0,0,1) 0%, rgba(255,204,0,1) 13%, rgba(255,255,0,1) 20%, rgba(225,255,0,1) 26%, rgba(13,255,0,1) 41%, rgba(0,255,238,1) 51%, rgba(0,217,255,1) 59%, rgba(0,64,255,1) 71%, rgba(255,0,196,1) 86%, rgba(255,0,196,1) 86%, rgba(255,0,123,1) 95%, rgba(237,0,0,1) 100%)", fillColor: "transparent"},
        "s": {},
        "v": {}
      }
    }
  },
  methods: {
    onInput(param, value) {
      if (isNaN(value) || value.length == 0) return;
      const hsv = this.innerColor.hsv;
      hsv[param] = Math.round(parseInt(value));
      this.innerColor.hsv = hsv;
      const channelObj = {};
      channelObj[param] = value;
      this.$emit("input", {channel: channelObj, color: this.innerColor});
    }
  },
  watch: {
    value(newValue) {
      this.innerColor = newValue;
    },
  },
  components: {
    RangeSlider,
    CustomInput
  }
}
</script>

<style scoped lang="scss">
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