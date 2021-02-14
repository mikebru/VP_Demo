<template>
    <span class="range-slider" :class="[{ disabled }, orientation==='vertical' ? 'vertical' : 'horizontal']" :style="sliderStyle">
      <drag-helper
        :disabled="disabled"
        @dragstart="dragStart"
        @drag="drag"
        @dragend="dragEnd">
        <span ref="inner" class="range-slider-inner" :style="sliderStyle">
          <CustomInput class="range-slider-hidden" type="text" :name="name" :value="actualValue" :disabled="disabled"/>
          <span class="range-slider-rail" :style="sliderRailStyle"></span>
          <span class="range-slider-fill" :style="sliderFillStyle"></span>
          <span v-if="displayKnob" class="range-slider-knob" ref="knob" :style="sliderKnobStyle" :class="{active: clicking}">
            <transition name="fade">
              <div v-if="displayValueOnClick && clicking" class="knob-value">{{actualValue.toFixed(0)}}</div>
            </transition>
            <slot name="knob"></slot>
          </span>
        </span>
      </drag-helper>
      <CustomInput ref="input" v-if="orientation=='horizontal' && displayValue" class="slider-value" @input="onInput" :value="roundedValue"/>
    </span>
</template>

<script>
import DragHelper from './DragHelper'
import { round } from './utils'
import ResetMixin from '@/mixins/ResetMixin.js';
import throttle from "lodash.throttle";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "RangeSlider",
  mixins: [ResetMixin],
  props: {
    name: String,
    value: [String, Number],
    disabled: {
      type: Boolean,
      default: false
    },
    displayValueOnClick: {
      type: Boolean,
      default: false
    },
    displayValue: {
      type: Boolean,
      default: true
    },
    min: {
      type: [String, Number],
      default: 0
    },
    max: {
      type: [String, Number],
      default: 100
    },
    width: {
      type: [String, Number],
      default: null
    },
    height: {
      type: [String, Number],
      default: null
    },
    step: {
      type: [String, Number],
      default: 1
    },
    orientation: {
      type: String,
      default: 'horizontal'
    },
    fillColor: {
      type: String,
      default: '#ffffffbd'
    },
    railGradient: {
      type: String,
      default: ""
    },
    railColor: {
      type: String,
      default: '#f7f7f721'
    },
    knobColor: {
      type: String,
      default: '#d67358'
    },
    displayKnob: {
      type: [Boolean, String],
      default: true
    }
  },
  data () {
    return {
      actualValue: null,
      dragStartValue: null,
      innerHeight: this.height,
      innerWidth: this.width,
      clicking: false
    }
  },
  created () {
    const { _min: min, _max: max } = this
    let defaultValue = Number(this.value)
    if (this.value == null || isNaN(defaultValue)) {
      if (min > max) {
        defaultValue = min
      } else {
        defaultValue = min
      }
    }
    this.actualValue = this.round(defaultValue);

    if (!this.width) {
      if (this.orientation === "vertical") {
        this.innerWidth = 4;
      } else {
        this.innerWidth = 130;
      }
    } else if (!this.height) {
      if (this.orientation === "vertical") {
        this.innerHeight = 130;
      } else {
        this.innerHeight = 4;
      }
    }
    this.emitInput = throttle(this.emitInput, 10);
  },
  computed: {
    _min () {
      return Number(this.min)
    },
    _max () {
      return Number(this.max)
    },
    _step () {
      return Number(this.step)
    },
    valuePercent () {
      return (this.actualValue - this._min) / (this._max - this._min) * 100
    },
    sliderFillStyle() {
      let style = {};

      if (this.orientation === "horizontal") {
        style.width = this.valuePercent + "%";
        style.height = this.height + "px";
      } else {
        style.height = this.valuePercent + "%";
        style.width = this.width +"px";
      }

      style.backgroundColor = this.fillColor;

      return style;
    },
    sliderKnobStyle() {
      return this.orientation === "horizontal" ? {
        left: this.valuePercent + "%",
        backgroundColor: this.knobColor,
        borderColor: this.knobColor
      } : {
        top: 100 - this.valuePercent + "%",
        backgroundColor: this.knobColor,
        borderColor: this.knobColor
      }
    },
    sliderRailStyle() {
      return {
        height: this.height + "px",
        width: this.width + "px",
        "background-image": this.railGradient
      }
    },
    sliderStyle() {
      return this.orientation === "horizontal" ? {
      } : {
        height: this.height + "px"
      }
    },
    roundedValue() {
      return Math.round(this.actualValue * 100) / 100;
    }
  },
  watch: {
    value (newValue) {
      const value = Number(newValue)
      if (newValue != null && !isNaN(value)) {
        this.actualValue = this.round(value);
      }
    },
    min () {
      this.actualValue = this.round(this.actualValue)
    },
    max () {
      this.actualValue = this.round(this.actualValue)
    }
  },
  methods: {
    dragStart (event, offset) {
      this.dragStartValue = this.actualValue
      this.clicking = true;
      if (event.target === this.$refs.knob) {
        return
      }
      // If the click is out of knob, move it to mouse position
      this.drag(event, offset)
    },
    drag (event, offset) {
      const { offsetWidth, offsetHeight } = this.$refs.inner
      let newValue;
      if (this.orientation === 'horizontal') {
        newValue = this.round(this.valueFromBounds(offset.left, offsetWidth))
      } else {
        newValue = this.max - this.round(this.valueFromBounds(offset.top, offsetHeight))
      }

      this.actualValue = newValue;
      this.emitInput(this.actualValue)
    },
    dragEnd (event, offset) {
      this.clicking = false;
      const { offsetWidth, offsetHeight } = this.$refs.inner
      if (this.orientation === 'horizontal') {
        this.actualValue = this.round(this.valueFromBounds(offset.left, offsetWidth))
      } else {
        this.actualValue = this.max - this.round(this.valueFromBounds(offset.top, offsetHeight))
      }
      if (this.dragStartValue !== this.actualValue) {
        this.emitChange(this.actualValue)
      }

      setTimeout(() => {
        this.emitInput(this.actualValue);
      }, 50);
    },
    emitInput (value) {
      this.$emit('input', value)
    },
    emitChange (value) {
      this.$emit('change', value)
    },
    valueFromBounds (point, width) {
      return (point / width) * (this._max - this._min) + this._min
    },
    round (value) {
      return round(value, this._min, this._max, this._step)
    },
    onInput(value) {
      const val = parseFloat(value);
      if (isNaN(val) || (!val && val !== 0)) {
        return;
      }

      this.actualValue = val;
      this.$emit('input', val);
    }
  },
  components: {
    DragHelper,
    CustomInput
  }
}
</script>

<style scoped lang="scss">
$slider-height: 20px !default;
$slider-width: 130px !default;
$rail-height: 4px !default;
$knob-size: 20px !default;
$rail-color: #f7f7f721 !default;
$rail-fill-color: #ffffffbd !default;
$knob-color: $primary-color !default;
$knob-border: 1px solid  $primary-color !default;
$knob-shadow: 1px 1px rgba(0, 0, 0, 0.2) !default;

.range-slider {
  display: inline-flex;
  padding: 0 ($knob-size / 2);
  height: $slider-height;
  width: $slider-width;
  align-items: center;
}
.range-slider.horizontal {
  padding-right: 35px;
}
.range-slider.disabled {
  opacity: 0.5;
}
.range-slider-inner {
  display: inline-block;
  position: relative;
  height: 100%;
  width: 100%;
}
.range-slider-rail,
.range-slider-fill {
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  height: $rail-height;
  border-radius: $rail-height / 2;
  transform: translateY(-50%);
}
.range-slider-rail {
  width: 100%;
  background-color: $rail-color;
}
.range-slider-fill {
  background-color: $rail-fill-color;
}
.range-slider-knob {
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  box-sizing: border-box;
  height: $knob-size;
  width: $knob-size;
  border: $knob-border;
  border-radius: 50%;
  background-color: $knob-color;
  box-shadow: $knob-shadow;
  transform: translate(-50%, -50%);
  transition: transform 0.5s;
  cursor: pointer;
}
.range-slider-knob:active, .range-slider-knob.active {
  transform: scale(1.3, 1.3) translate(-33%, -33%);
  transition: transform 0.1s;
}
.range-slider-hidden {
  display: none;
}
.vertical {
  display: inline-block;
  height: 200px;
  width: 5px;
}
.range-slider.vertical .range-slider-rail,
.range-slider.vertical .range-slider-fill {
  display: block;
  position: absolute;
  height: 200px;
  border-radius: 5px;
  width: 100%;
  top: 100%;
  transform: translate(-50%, -100%);
}
.knob-value {
  //width: fit-content;
  position: absolute;
  top: -200%;
  left: -50%;
  background-color: #1f2026c9;
  padding-left: 5px;
  padding-right: 5px;
  padding: 4px 7px;
  padding-top: 6px;
  border-radius: 5px;
}
.fade-enter-active, .fade-leave-active {
  transition: all .2s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
}
input, textarea {
  width: 5em;
  padding: 5px;
}
.slider-value {
  text-align: center;
  margin-left: 10px;
  font-size: 17px;
}
</style>
