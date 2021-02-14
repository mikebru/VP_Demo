<template>
  <input :placeholder="placeholder" :value="formatted" @input="onInput" @keyup="onKeyUp" :disabled="disabled">
</template>

<script>
export default {
  name: "CustomInput",
  props: {
    value: {
      type: [String, Number],
      default: ""
    },
    max: {
      type: [String, Number],
      default: ""
    },
    min: {
      type: [String, Number],
      default: ""
    },
    placeholder: {
      type: [String, Number],
      default: ""
    },
    disabled: {
      type: [String, Boolean],
      default: false
    }
  },
  data() {
    return {
      currentValue: this.value,
      lastValue: this.value
    }
  },
  computed: {
    formatted() {
      if (isNaN(this.currentValue) || this.currentValue === "") {
        return this.currentValue;
      }
      if (typeof this.currentValue === "number") return Math.round(this.currentValue * 1000) / 1000;
      return Math.round(parseFloat(this.currentValue) * 1000) / 1000;
    }
  },
  created() {
    document.addEventListener("click", this.onClick);
    document.addEventListener("touchstart", this.onClick);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("touchstart", this.onClick);
  },
  methods: {
    onInput(e) {
      this.$emit("change", e.srcElement.value);
    },
    onClick(e) {
      if (e.target !== this.$el && !["P", "INPUT", "I"].includes(e.target.nodeName)) {
        this.$el.blur();
      }
    },
    onKeyUp(e) {
      if (e.key === "Enter") {
        this.$emit("input", e.srcElement.value);
        this.lastValue = e.target.value;
        this.$el.blur();
      } else if (e.key === "Escape") {
        this.currentValue = this.lastValue;
        this.$forceUpdate();
        this.$emit("input", this.lastValue);
        this.$el.blur();
      }
    },
    blur() {
      this.$el.blur();
    },
    focus() {
      this.$el.focus();
    },
    setSelectionRange(begin, end) {
      this.$el.setSelectionRange(begin, end);
      this.$el.focus();
    }
  },
  watch: {
    value(val) {
      this.currentValue = val;
      if (document.activeElement !== this.$el) {
        this.lastValue = this.currentValue;
      }
    }
  }
};
</script>

<style scoped lang="scss">
input, textarea {
  padding-top: 10px;
  padding-bottom: 10px;
  padding: 8px 0px 8px 5px;
  background-color: #00000040;
  border: transparent;
  color: $accent-color;
  caret-color: $accent-color;

  border-radius: 5px;
  user-select: text;
  min-height: fit-content;
}
input:focus {
  background-color: #ffffff0f;
  border-radius: 5px;
}
textarea:focus, input:focus{
  outline: none;
}
::placeholder {
  color: $accent-color;
  opacity: 0.5;
}
/* Hide HTML5 Up and Down arrows. */
input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>