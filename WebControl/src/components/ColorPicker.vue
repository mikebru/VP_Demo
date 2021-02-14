<template>
<div>
  <div class="overlay" v-if="bigMode" ref="overlay" v-hammer:tap="onClickBigMode">
  </div>
  <div ref="columnRef" class="column">
    <IroWrapper
      @color:change="onColorChange($event)"
      :value="colorValue"
      @input:end="onInputEnd"
      v-if="active === 'colorWheel'"
      :height="bigMode ? this.size * scaleFactor : this.size"
      :width="bigMode ? this.size * scaleFactor : this.size"
      :border-width="1.5"
      :sliderMargin="colorPickerSliderMargin"
      :sliderHeight="colorPickerSliderHeight"
      :displayAlpha="displayAlpha"
      :handleRadius="handleRadius"
      @mount="onColorPickerMount"
      class="wrapper"
    ></IroWrapper>
    <RgbInput
      v-else-if="active === 'rgb'"
      :value="colorValue"
      :margin="sliderMargin"  
      :height="sliderHeight"
      :width="sliderWidth"
      @input="onColorChange($event)"
    >
    </RgbInput>
    <HsvInput
      v-else
      :value="colorValue"
      :margin="sliderMargin"
      :height="sliderHeight"
      :width="sliderWidth"
      @input="onColorChange($event)"
    >
    </HsvInput>
    <div class="bottom-row">
      <div class="input-selectors">
        <div class="input-selector" v-hammer:tap="() => makeActive('colorWheel')" :class="active === 'colorWheel' ? 'active' : ''">
          <i class="fas fa-palette"></i>
        </div>
        <div class="input-selector" v-hammer:tap="() => makeActive('rgb')" :class="active === 'rgb' ? 'active' : ''">
          <p>RGB</p>
        </div>
        <div class="input-selector" v-hammer:tap="() => makeActive('hsv')" :class="active === 'hsv' ? 'active' : ''">
          <p>HSV</p>
        </div>
        <div class="input-selector" v-hammer:tap="onClickBigMode" :class="bigMode ? 'active' : ''">
          <i class="fa fa-expand"></i>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { IroWrapper } from "colorpicker";
import RgbInput from "@/components/RgbInput.vue";
import HsvInput from "@/components/HsvInput.vue";
import ResetMixin from "@/mixins/ResetMixin.js";
import throttle from "lodash.throttle";
import { iro }  from 'colorpicker';
import config from "@/config.js";

export default {
  name: "ColorPicker",
  alignReset: "top",
  mixins: [ResetMixin],
  props: {
    defaultMode: {
      type: String,
      default: "colorWheel"
    },
    value: {
      type: iro.Color
    },
    customResetColor: {
      type: [String],
      default: "#ffffff"
    },
    customResetAlpha: {
      type: [String, Number],
      default: 100
    },
    displayAlpha: {
      type: [String, Boolean],
      default: false
    },
    size: {
      type: [String, Number],
      default: 200
    }
  },
  data() {
    return {
      active: this.defaultMode,
      colorValue: this.value,
      innerSize: this.size,
      bigMode: false,
      colorPickerMounted: true
    }
  },
  computed: {
    scaleFactor() {
      return config.colorPickerScaleFactor;
    },
    sliderWidth() {
      return this.bigMode ? this.size * this.scaleFactor / 7 : this.size / 7;
    },
    sliderHeight() {
      return this.bigMode ? this.size * this.scaleFactor : this.size - 15;
    },
    sliderMargin() {
      return this.bigMode ? this.size * this.scaleFactor / 4 : this.size / 5;
    },
    colorPickerSliderMargin() {
      return 10;
    },
    colorPickerSliderHeight() {
      return this.bigMode ? this.size * this.scaleFactor / 10 : this.size / 10;
    },
    handleRadius() {
      return this.bigMode ? 8 * this.scaleFactor : 8;
    }
  },
  created() {
    this.onColorChange = throttle(this.onColorChange, 20); 
  },
  mounted() {
    this.$options.initialColumnStyle = this.$refs.columnRef.style;
  },
  methods: {
    onColorChange(change) {
      this.colorValue = change.color;
      this.$emit("input", change)
    },
    reset() {
      this.colorValue.hexString = this.customResetColor;
      this.colorValue.alpha = this.customResetAlpha;
      this.$emit("input", {color: this.colorValue });
      this.$emit("reset");
    },
    onInputEnd() {
      setTimeout(() => {
        this.$emit("input", {color: this.colorValue });  
      }, 50)
    },
    makeActive(mode) {
      this.active = mode;
    },
    onColorPickerMount() {
      if (this.bigMode) {
        if (this.colorPickerMounted) return;
        this.colorPickerMounted = true;
        const screenX = screen.width / 2;
        const screenY = screen.height / 2;
        this.$refs.columnRef.style.position = "fixed";
        const rect = this.$refs.columnRef.getBoundingClientRect();
        // Scaled object will be at x + this.size
        const targetX = screenX - rect.x - (rect.width / 2);
        const targetY = screenY - rect.y - (rect.height / 2);
        this.$refs.columnRef.style.transform = `translate(${targetX }px, ${targetY}px)`;

      } else {
        this.colorPickerMounted = false;
        this.$refs.columnRef.style.position = "unset";
        this.$refs.columnRef.style.transform = `translate(0px, 0px)`;
      }
    },
    onClickBigMode() {
      this.bigMode = !this.bigMode;
      // Hacky code for when expand the color picker when it's in rgb or hsv mode
      if (this.active != "colorWheel" || this.colorPickerMounted) this.$nextTick(() => this.onColorPickerMount());
    }
  },
  watch: {
    value(newValue) {
      this.colorValue.hsv = newValue.hsv;
    }
  },
  components: {
    IroWrapper,
    RgbInput,
    HsvInput
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  margin-top: 20px;
}
.input-selectors {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}
.input-selector {
  height: 35px;
  margin: 5px 0;
  border: 1px solid black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 15px;
  background-color: #242731;

  * {
    color: $accent-color;
    margin: 0;
  }
}
.input-selector:hover {
  cursor: pointer;
}
.input-selectors i {
  padding: 0 5px;
}
.active {
  background-color: rgba(white, 0.3);
  border-radius: 0;
}
.input-selector:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  border-right: none;
}
.input-selector:nth-child(3) {
  border-left: transparent;
}
.input-selector:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-left: none;
}
.bottom-row {
  display: flex;
  align-items: baseline;
}
.column {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 11;
}
.overlay {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(black, 0.7);
  z-index: 10;
}
</style>