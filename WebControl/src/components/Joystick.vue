<template>
  <div class="zone" ref="zone">
  </div>
</template>

<script>
import nipplejs from 'joystick';
import ResetMixin from '@/mixins/ResetMixin.js';

export default {
  name: 'Joystick',
  alignReset: "bottom",
  mixins: [ResetMixin],
  props: {
    lockX: {
      type: [String, Boolean],
      default: false
    },
    lockY: {
      type: [String, Boolean],
      default: false
    },
    size: {
      type: [String, Number],
      default: 100
    },
    color: {
      type: String,
      default: '#ffffff7f'
    },
    knobTitle: {
      type: String,
      default: ""
    }
  },
  methods: {
    triggerRefresh() {
      this.$nextTick(() => nipplejs.triggerResize());
    },
  },
  data() {
    return {
      manager: null
    }
  },
  mounted () {
    let options = {
      zone: this.$refs.zone,
      lockX: this.lockX,
      lockY: this.lockY,
      color: this.color,
      knobTitle: this.knobTitle,
      size: this.size || 100,
      mode: 'static',
      position: { left: '50%', top: '50%' }
    }

    this.manager = nipplejs.create(options);
    this.manager.on('move',
      (e, data) => {
        this.xForce = !this.lockY ? Math.cos(data.angle.radian) * data.force : 0;
        this.yForce = !this.lockX ? Math.sin(data.angle.radian) * data.force : 0;
      });

    this.manager.on('start', () => {
      this.interval = setInterval(() => {
        this.$emit('move', { xForce: this.xForce, yForce: this.yForce});
      }, 15);
    });

    this.manager.on('end', () => {
      clearInterval(this.interval);
    });

    setTimeout(() => { // setTimeout to trigger this at the end of the event queue
      nipplejs.triggerResize();
    }, 100);

  },
  watch: {
    lockX(value) {
      this.manager.options.lockX = value;
    },
    lockY(value) {
      this.manager.options.lockY = value;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.zone {
  height: 150px;
  width: 150px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
.knob-title {
  color: black;
}
</style>
