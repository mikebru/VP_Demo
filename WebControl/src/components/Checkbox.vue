<template>
<span
  v-hammer:tap="onClick"
>
<i
  class="fas"
  :class="active ? 'fa-check' : 'fa-times'"
></i>
</span>
</template>

<script>
export default {
  name: "Checkbox",
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      active: this.value
    }
  },
  methods: {
    onClick() {
      this.active = !this.active;
      this.$emit("input", this.active);
    }
  },
  watch: {
    value(val) {
      this.active = val;
    }
  }
}
</script>

<style scoped lang="scss">
.fa-check {
  color: #2aa266;
}
.fa-times {
  color: #ce3a3a;
}
span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  border: 3px solid #1d222b;
  background-color: #242933;
  border-radius: 5px;
}
span:hover {
  background-color: #2d3340;
}
i {
  font-size: 18px;
}
i.fa-times {
}
</style>