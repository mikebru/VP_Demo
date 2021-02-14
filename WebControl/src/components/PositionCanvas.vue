<template>
<canvas ref="canvas" :width="size" :height="size"></canvas>
</template>

<script>
import throttle from "lodash.throttle";

HTMLElement.prototype.getPosition = function()
{
	var el = this;
	var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { y: rect.top + scrollTop, x: rect.left + scrollLeft, width: rect.width, height: rect.height };
}
Window.prototype.addEventListeners = function(eventNames, listener)
{
	var el = this;
	var events = eventNames.split(" ");
	for (var i=0, iLen=events.length; i<iLen; i++)
	{
		el.addEventListener(events[i], listener, {passive: true});
	}
}
Window.prototype.removeEventListeners = function(eventNames, listener)
{
	var el = this;
	var events = eventNames.split(" ");
	for (var i=0, iLen=events.length; i<iLen; i++)
	{
		el.removeEventListener(events[i], listener, {passive: true});
	}
}
export default {
  name: "PositionCanvas",
  props: {
    size: {
      type: [String, Number],
      default: 400
    },
    x: {
      type: [String, Number],
      default: 0
    },
    y: {
      type: [String, Number],
      default: 0
    }
  },
  data() {
      return {
        mouseX: 0,
        mouseY: 0,
        mousedown: false,
        mousedownOverride: false
      }
  },
  created() {
    this.sendUpdate = throttle(this.sendUpdate, 40)
  },
  mounted() {
    this.mouseX = this.x * this.size;
    this.mouseY = this.y * this.size;

    window.addEventListeners.call(this.canvas, "mousedown touchstart", this.onMouseDown);
    window.addEventListeners("mouseup touchend", this.onMouseUp);
    window.addEventListeners("mousemove touchmove", this.updatePosition);

    this.render()
  },
  beforeDestroy() {
    window.removeEventListeners.call(this.canvas, "mousedown touchstart", this.onMouseDown);
    window.removeEventListeners("mouseup touchend", this.onMouseUp);
    window.removeEventListeners("mousemove touchmove", this.updatePosition);
  },
  computed: {
    canvas() {
      return this.$refs.canvas;
    },
    ctx() {
      return this.canvas.getContext("2d");
    }
  },
  methods: {
    onMouseDown(e) {
      this.mousedown = true;
      this.mousedownOverride = false;
      this.updatePosition(e);
    },
    onMouseUp() {
      this.mousedown = false;
      this.mousedownOverride = false;
    },
    render(){
      requestAnimationFrame(this.render)
      this.draw()
    },
    sendUpdate(x, y) {
      this.$emit("change", {x: x / this.size, y: y / this.size});
    },
    draw(){
      // clear canvas
      const ctx = this.ctx;
      const canvas = this.canvas;
      const mouseX = this.mouseX;
      const mouseY = this.mouseY;

      ctx.fillStyle="#24222d";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(canvas.width/2, 0);
      ctx.lineTo(canvas.width/2, canvas.height);
      ctx.strokeStyle = "#bebebe";
      ctx.stroke();
      ctx.closePath();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height/2);
      ctx.lineTo(canvas.width, canvas.height/2);
      ctx.strokeStyle = "#bebebe";
      ctx.stroke();
      ctx.closePath();

      // Position selector
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 10, 0, 2 * Math.PI);
      ctx.strokeStyle = "#d67358";
      ctx.fillStyle = "#d67358"
      ctx.fill();

      ctx.stroke();
    },
    updatePosition(e) {
      const m_pos = e.touches ? {x: e.touches[0].pageX, y: e.touches[0].pageY} : {x: e.pageX, y: e.pageY};
      const rect = this.canvas.getBoundingClientRect();
      let x = m_pos.x - rect.left;
      let y = m_pos.y - rect.top;
      const canvas = this.canvas;

      if(this.mousedownOverride || this.mousedown && x > 0 && x < this.canvas.width && y > 0 && y < this.canvas.height) {
        this.mousedownOverride = true;
        if (x < 0) x = 0;
        if (x > canvas.width) x = canvas.width;
        if (y < 0) y = 0;
        if (y > canvas.height) y = canvas.height;
        this.mouseX = x;
        this.mouseY = y;

        this.sendUpdate(x, y);
      }
    }
  },
  watch: {
    x(val) {
      this.mouseX = val * this.size;
    },
    y(val) {
      this.mouseY = val * this.size;
    }
  }
}
</script>

<style scoped lang="scss">

</style>
