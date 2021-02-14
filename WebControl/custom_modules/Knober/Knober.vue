<template>
  <div>
    <p ref="knobTitle" class="knob-title">{{name}}</p>
      <canvas
        ref="canvas"
        class="shadow-wrapper"
        :width="Number(this.size)"
        :height="Number(this.size)">
      </canvas>
      <CustomInput v-if="!infinite" ref="input" :value="currentValue" @input="onInput"/>
  </div>
</template>

<script>
import throttle from 'lodash.throttle'
import ResetMixin from "@/mixins/ResetMixin.js";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: 'vue-knober',
  alignReset: "bottom",
  rightDistance: -20,
  mixins: [ResetMixin],
  data: function () {
    return {
      margin: 0,
      chassisSize: 0,
      knobSize: 0,
      ctx: null,
      initialAngle: -30,
      currentValue: this.value,
      clicking: false,
      lastAngle: 0,
      listeners: []
    }
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    size: {
      type: [String, Number],
      default: 250
    },
    value: {
      type: [String, Number],
      default: 0
    },
    min: {
      type: [String, Number],
      default: 0
    },
    max: {
      type: [String, Number],
      default: 255
    },
    primaryColor: {
      type: String,
      default: '#d67358'
    },
    diffColor: {
      type: String,
      default: 'd67358'
    },
    quenchColor: {
      type: String,
      default: 'white'
    },
    backgroundColor: {
      type: String,
      default: '#393e46'
    },
    shadowColor: {
      type: String,
      default: 'black'
    },
    fontColor: {
      type: String,
      default: '#999'
    },
    infinite: {
      type: [String, Boolean],
      default: false
    }
  },
  computed: {
    range () {
      return this.max - this.min
    },
    roundedValue() {
      return Math.round(this.currentValue * 100) / 100;
    }
  },
  created () {
    const size = Number(this.size)
    this.margin = 0;
    this.chassisSize = size / 2 - this.margin
    this.knobSize = this.chassisSize * 0.4
  },
  methods: {
    calculateRenderParams (x, y) {
      const size = this.size
      const coorX = x - size / 2
      const coorY = y - size / 2
      const r = Math.sqrt(Math.pow(Math.abs(coorX), 2) + Math.pow(Math.abs(coorY), 2))
      let angle = Math.atan2(coorY, coorX) * 180 / Math.PI - 180

      if (angle < -180) {
        angle = Math.abs(angle + 360)
      }

      return {
        r,
        angle,
        coorX,
        coorY
      }
    },
    move: throttle(function (config) {
      let { angle, r, coorX, coorY } = config
      if (angle < -180) {
        angle = Math.abs(angle + 360)
      }

      this.draw(angle, r, coorX, coorY)

      const val = this.calculateValue(angle)
      if (r > this.knobSize && val && this.clicking) {
        this.initialAngle = angle
        this.currentValue = Number(val)
      }
    }, 40, { 'trailing': false }),
    calculateValue (angle) {

      const base = (this.range / 240)
      let newVal

      if (angle > 0 || this.infinite) {
        newVal = base * (angle + 30)
      } else if (angle >= -30) {
        newVal = base * (30 + angle)
      } else if (angle <= -150) {
        newVal = base * (210 + angle + 180)
      } else if (angle >= -90 && !this.infinite) {
        newVal = 0
      } else if (!this.infinite) {
        newVal = base * 240
      }

      newVal = Number(newVal && newVal.toFixed(1))
      return newVal + Number(this.min)
    },
    press(config, force = false) {
      const { angle } = config
      const val = this.calculateValue(angle)
      this.blockEvent = false

      if (!this.clicking && !force) {
        return
      }

      let tempAngle  = angle;
      if (tempAngle < 0) {
        tempAngle += 360;
      }
      if (this.infinite) {
        this.$emit("delta", tempAngle - this.lastAngle);
      }
      this.lastAngle = tempAngle;

      if (val) {
        this.initialAngle = angle
        this.currentValue = Number(val)
      }
    },
    drawKnob (angle, r) {
      const self = this
      const size = self.knobSize
      const ctx = this.ctx

      if (angle === undefined) {
        angle = this.initialAngle
      } else if (angle < -30 && angle >= -90) {
        angle = -30
      } else if (angle > -150 && angle < -90) {
        angle = -150
      }

      if (r > self.knobSize) {
        if (r >= self.knobSize && angle < 0) {
          if (angle <= -30 && angle >= -90) {
            angle = -30
          } else if (angle > -150 && angle < -90) {
            angle = -150
          }
        }
      }

      drawBackground()
      if (!r || r > this.knobSize) {
        drawTick()
      }
      // drawSwitch();

      function drawBackground () {
        const blur = r < self.knobSize ? size * 0.2 : size * 0.5
        const offset = r < self.knobSize ? size * 0.05 : size * 0.1
        ctx.save()
        ctx.translate(self.size / 2, self.size / 2)
        ctx.beginPath()
        ctx.arc(0, 0, size, 0, Math.PI * 2, true)
        ctx.shadowBlur = blur
        ctx.shadowColor = self.shadowColor
        ctx.shadowOffsetX = offset
        ctx.shadowOffsetY = offset
        ctx.fillStyle = self.backgroundColor
        ctx.fill()
        ctx.closePath()
        ctx.restore()
      }
      function drawTick () {
        ctx.save()
        ctx.translate(self.size / 2, self.size / 2)
        ctx.rotate(angle * Math.PI / 180)
        ctx.rotate(0)
        ctx.beginPath()
        ctx.moveTo(-size * 0.6, 0)
        ctx.lineTo(-size * 0.9, 0)
        ctx.lineWidth = self.size * 0.015
        ctx.strokeStyle = self.primaryColor
        ctx.stroke()
        ctx.closePath()

        ctx.restore()
      }
      /*eslint-disable-next-line no-unused-vars*/
      function drawSwitch () {
        const switchSize = self.knobSize * 0.3
        let color = self.quenchColor

        if (r < self.knobSize) {
          if (self.currentValue > 0) {
            color = '#fe4365'
          } else {
            color = self.primaryColor
          }
        }

        ctx.save()
        ctx.translate(self.size / 2, self.size / 2)
        ctx.rotate(-125 * Math.PI / 180)
        ctx.beginPath()
        ctx.arc(0, 0, self.knobSize * 0.3, 0, Math.PI * 2 - 5, true)
        ctx.lineWidth = switchSize * 0.2
        ctx.strokeStyle = color
        ctx.shadowBlur = switchSize * 0.3
        ctx.shadowColor = color
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.translate(self.size / 2, self.size / 2)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, -switchSize * 1.2)
        ctx.lineWidth = switchSize * 0.2
        ctx.strokeStyle = color
        ctx.shadowBlur = switchSize * 0.3
        ctx.shadowColor = color
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
      }

    },
    drawDashboard(angle, r) {
      const self = this
      const ctx = self.ctx
      const size = self.size
      const chassisSize = self.chassisSize

      angle = angle + 30

      if (angle < 0) {
        angle = 360 + angle
      }

      drawChassis()
      drawTicks()

      function drawChassis () {
        ctx.save()
        ctx.translate(size / 2, size / 2)
        ctx.beginPath()
        ctx.arc(0, 0, chassisSize, 0, Math.PI * 2, true)
        ctx.fillStyle = self.backgroundColor
        ctx.fill()
        ctx.closePath()
        ctx.restore()
      }

      function drawTicks () {
        const gap = 240 / 30

        ctx.save()
        ctx.translate(size / 2, size / 2)
        ctx.rotate(-30 * Math.PI / 180)

        let i = 0
        let max = 30;
        if (self.infinite) {
          max = 44;
        }

        while (i <= max) {
          const start = -self.knobSize - chassisSize * 0.1
          const end = i % 3 === 0 ? -chassisSize * 0.9 : -chassisSize * 0.75
          const weight = i % 3 === 0 ? 2 : 1.5
          const _angle = i * gap

          let color = self.quenchColor
          let shadowColor = '#fff'

          const setColor = (c, shadow) => () => {
            color = c
            shadowColor = shadow
          }
          const setDiffColor = setColor(self.diffColor, self.diffColor)
          const setPrimaryColor = setColor(self.primaryColor, self.primaryColor)

          if (angle) {
            if (r > self.knobSize) {
              if (angle > 240) {
                if (_angle <= self.initialAngle + 30 && self.currentValue > 0) {
                  setPrimaryColor()
                } else if (angle < 300) {
                  setPrimaryColor()
                }
              } else {
                if (self.currentValue <= self.min) {
                  if (_angle < self.initialAngle + 30 && _angle < angle) {
                    setPrimaryColor()
                  } else if (_angle <= self.initialAngle + 30 || _angle <= angle) {
                    setDiffColor()
                  }
                } else {
                  if (_angle <= self.initialAngle + 30 && _angle <= angle) {
                    setPrimaryColor()
                  } else if (_angle <= self.initialAngle + 30 || _angle <= angle) {
                    setDiffColor()
                  }
                }
              }
            } else {
              if (_angle <= self.initialAngle + 30 && self.currentValue !== 0) {
                setDiffColor()
              }
            }
          } else {
            if (self.currentValue <= self.min) {
              if (_angle < self.initialAngle + 30) {
                setPrimaryColor()
              }
            } else {
              if (_angle <= self.initialAngle + 30) {
                setPrimaryColor()
              }
            }
          }

          ctx.rotate(i === 0 ? 0 : gap * Math.PI / 180)
          ctx.beginPath()
          ctx.moveTo(start, 0)
          ctx.lineTo(end, 0)
          ctx.lineWidth = weight

          if (!self.infinite) {
            ctx.shadowBlur = chassisSize * 0.05
            ctx.shadowColor = shadowColor
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0
          }

          if (!self.infinite) {
            ctx.strokeStyle = color
          } else {
            ctx.strokeStyle = "#d67358"
          }
          ctx.stroke()

          ctx.closePath()
          i++
        }

        ctx.restore()
      }
    },
    drawlabel (angle, r) {
      if (!this.infinite) {
        this.placeLabel();
        return;
      }
      const ctx = this.ctx
      let val = this.currentValue

      if (angle && angle <= 240 && r > this.knobSize) {
        const _val = this.calculateValue(angle)
        _val && (val = _val)
      }

      ctx.save()

      ctx.translate(this.size / 2, this.size / 2 + this.chassisSize * 0.8)

      ctx.fillStyle = this.fontColor
      ctx.textAlign = 'center'
      ctx.font = `${this.chassisSize * 0.3}px Arial`
      ctx.fillText(val.toFixed(1), 0, 0)

      ctx.restore()
    },
    draw (angle, r, coorX, coorY) {
      this.ctx.clearRect(0, 0, this.size, this.size)
      this.drawDashboard(angle, r, coorX, coorY)
      this.drawKnob(angle, r, coorX, coorY)
      if (!this.infinite) {
        this.drawlabel(angle, r, coorX, coorY)
      }
    },
    watchCurrentValueHandler (val) {
      const renderScale = 240
      let angle = renderScale / this.range * (val - this.min) - 30
      if (angle > 180) {
        angle -= 360
      }

      this.initialAngle = angle
      this.draw()
    },
    mobilePosition (e) {
      const { pageX, pageY } = e.changedTouches[0]
      const { x, y } = this.$refs.canvas.getBoundingClientRect()
      return [pageX - (window.scrollX + x), pageY - (window.scrollY + y)]
    },
    isClickInKnob () {
      return true;
    },
    onInput(value) {
      const val = parseFloat(value);
      if (isNaN(val) || !val) {
        return;
      }

      this.currentValue = val;
      this.$emit('input', val);
    },
    placeLabel() {
      const input = this.$refs.input.$el;
      input.style.width = "4em";
      const computedWidth = input.getBoundingClientRect().width;
      input.style.font = `${this.chassisSize * 0.25}px Arial`;
      input.style.top = this.size / 2 + this.chassisSize * 0.8 + "px";
      input.style.left = this.size / 2 - (computedWidth / 2) + "px";
    }
  },
  mounted () {
    this.press = throttle(this.press, 40);
    if (!this.infinite) {
      this.placeLabel();
    }

    let titleHeight = parseInt(getComputedStyle(this.$refs.knobTitle).marginTop) + this.$refs.knobTitle.offsetHeight;
    this.$emit("knob-title-size", titleHeight);
    this.ctx = this.$refs.canvas.getContext('2d')

    window.addEventListener('mousemove', (e) => {
      if (!this.$refs.canvas) return;
      var rect = this.$refs.canvas.getBoundingClientRect()
      this.press(this.calculateRenderParams(e.pageX - rect.left, e.pageY - rect.top))
    }, false)

    window.addEventListener('mouseup', () => {
      this.clicking = false;
    }, false)

    window.addEventListener('touchmove', (e) => {
      const { pageX, pageY } = e.changedTouches[0]
      if (!this.$refs.canvas) return;
      var rect = this.$refs.canvas.getBoundingClientRect()
      this.press(this.calculateRenderParams(pageX - rect.left, pageY - rect.top))
    }, false)

    window.addEventListener('touchend', (e) => {
      if (this.clicking) {
        const { pageX, pageY } = e.changedTouches[0]
        if (!this.$refs.canvas) return;
        var rect = this.$refs.canvas.getBoundingClientRect()
        this.press(this.calculateRenderParams(pageX - rect.left, pageY - rect.top))
      }
      this.clicking = false
    })

    this.$refs.canvas.addEventListener('mousedown', (e) => {
      var rect = this.$refs.canvas.getBoundingClientRect()
      this.press(this.calculateRenderParams(e.pageX - rect.left, e.pageY - rect.top))
      if (this.isClickInKnob(this.calculateRenderParams(e.pageX - rect.left, e.pageY - rect.top))) {
        this.clicking = true
      }
    }, false)

    this.$refs.canvas.addEventListener('click', (e) => this.press(this.calculateRenderParams(e.offsetX, e.offsetY), true), false)

    this.$refs.canvas.addEventListener('touchstart', (e) => {
      const { pageX, pageY } = e.changedTouches[0]
      var rect = this.$refs.canvas.getBoundingClientRect()
      if (this.isClickInKnob(this.calculateRenderParams(pageX - rect.left, pageY - rect.top))) {
        this.clicking = true
      }
    }, {passive: true})

    this.$watch(
      'value',
      (val) => {
        this.currentValue = val
        this.blockEvent = true
      },
      { immediate: true }
    )

    this.$watch(
      'currentValue',
      (val) => {
        if (!this.blockEvent) {
          this.$emit('input', val)
        }
        const renderScale = 240
        const angle = renderScale / this.range * (val - this.min) - 30
        this.initialAngle = angle
        this.draw()
      },
      { immediate: true }
    )

    this.$watch(
      'size',
      () => {
        const size = Number(this.size)
        this.margin = 0;
        this.chassisSize = size / 2 - this.margin
        this.knobSize = this.chassisSize * 0.4
        
        this.draw()
      },
      { immediate: true }
    )
  },
  components: {
    CustomInput
  }
}
</script>

<style scoped lang="scss">
.shadow-wrapper {
  border-radius: 50%;
  box-shadow: 0px 0px 16px 2px rgba(0,0,0,0.50);
  position: relative;
}
canvas {
  touch-action: none;
}
.knob-title {
  margin: 0;
  margin-bottom: 12px;
  padding-left: 2px;
  letter-spacing: 1.2px;
  font-weight: normal;
  color: $accent-color;
}
input {
  position: absolute;
  left: 0;
  text-align: center;
  padding: 1px;
}
</style>

