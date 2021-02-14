<template>
  <div id="capture-page-content">
    <div class="column">
      <p class="tutorial-text">Creating custom widgets allows you to interact with actors in different interesting ways.</p>
      <ObjectGroup
        name="Mannequin Position"
        ref="objectGroup"
        :supportObjectPath="false"
      >
        <div class="joystick-section">
          <Joystick
            :lockY="true"
            :size="125"
            knobTitle="height"
            @move="onMove($event)"
            @reset="resetHeight()"
          >
          </Joystick>
          <RangeSlider
            class="slider"
            step="0.01"
            min="0.01"
            max="15"
            v-model="heightSliderScale"
            :displayReset="false"
            :displayValue="false"
          ></RangeSlider>
          <div class="slider-labels"><p>Slower</p><p>Faster</p></div>
          <div class="position-info">
            <div><span>Height: </span><CustomInput ref="heightInput" @input="onHeightChange($event)" :value="height" @keyup="onKeyUp('heightInput', $event)"/></div>
            <div><span>Forward position: </span><CustomInput ref="forwardInput" @input="onLateralChange($event)" :value="lateralPosition" @keyup="onKeyUp('forwardInput', $event)"/></div>
            <div><span>Lateral position: </span><CustomInput ref="lateralInput" @input="onForwardChange($event)" :value="forwardPosition" @keyup="onKeyUp('lateralInput', $event)"/></div>
          </div>
        </div>
        <div>
          <p>Front of wall</p>
          <PositionCanvas @change="onChange" :x="xPosition" :y="yPosition"></PositionCanvas>
        </div>
      </ObjectGroup>
    </div>
  </div>
</template>

<script>
import Joystick from "@/components/Joystick.vue";
import PositionCanvas from "@/components/PositionCanvas.vue";
import UnrealService from "@/UnrealService.js";
import config from "@/config.js";
import RangeSlider from "rangeslider";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "LightCaptureSubpage",
  data() {
    return {
      forwardPosition: 0,
      lateralPosition: 0,
      height: 0,
      stageX: 1,
      stageY: 1,
      stageXScale: 1,
      stageYScale: 1,
      stage: null,
      x: 0.5,
      y: 0.5,
      heightSliderScale: 0.5,
      rootComponent: ""
    }
  },
  async created() {
    if (config.stageExtents) {
      this.stageX = config.stageExtents.horizontal;
      this.stageY = config.stageExtents.forward;
    } else {
      ({BoxExtent: {X: this.stageX, Y: this.stageY }} = await UnrealService.callFunction(config.stageOrigin, "GetActorBounds", {}));
    }
    UnrealService.callFunction(config.stageOrigin, "GetActorRelativeScale3D", {}).then(res => {
      ({ReturnValue: {X: this.stageXScale, Y: this.stageYScale}} = res);
    });

    ({ReturnValue: this.rootComponent} = await UnrealService.callFunction(config.mannequin, "K2_GetRootComponent"));
  },
  computed: {
    xPosition() {
      return (this.forwardPosition * this.stageXScale / this.stageX) / 2 + 0.5;
    },
    yPosition() {
      return (this.lateralPosition * this.stageYScale / this.stageY) / 2 + 0.5;
    },
    managerPath() {
      return window.localStorage[this.computeBasePath()] || config[this.computeBasePath()] || config.mannequin || this.$refs.objectGroup.objectPath;
    }
  },
  methods: {
    round(val) {
      return Math.round(val*100) /100;
    },
    onChange(e) {
      this.lateralPosition = this.round((e.y - 0.5) * 2 * this.stageY / this.stageYScale);
      this.forwardPosition = this.round((e.x - 0.5) * 2 * this.stageX /this.stageXScale);
      this.updatePosition();
    },
    updatePosition() {
      let payload = {};
      payload.x = this.forwardPosition;
      payload.y = this.lateralPosition;
      payload.z = this.height;
      UnrealService.callFunction(this.managerPath, "SetActorRelativeLocation", {
        "NewRelativeLocation": payload
      }, 0, /*sync=*/true);
    },
    onHeightChange(val) {
      let numValue = parseInt(val);
      if (isNaN(numValue)) {
        return;
      }

      if(numValue < 0)  {
        numValue = 0;
      }
      
      this.height = numValue;
      this.updatePosition();
    },
    onForwardChange(val) {
      let numValue = parseInt(val);
      if (isNaN(numValue)) {
        return;
      }

      this.forwardPosition = numValue;
      this.updatePosition();
    },
    onLateralChange(val) {
      let numValue = parseInt(val);
      if (isNaN(numValue)) {
        return;
      }

      this.lateralPosition = numValue;
      this.updatePosition();
    },
    onMove(event) {
      event.yForce *= this.heightSliderScale;
      let newHeight = this.round(this.height + event.yForce);
      
      if(newHeight < 0) {
        this.height = 0;
        this.updatePosition();
      }
      else {
        this.height = newHeight;
        let payload = {};
        payload.z = event.yForce;
      
        UnrealService.callFunction(this.managerPath, "AddActorLocalOffset", {
            "DeltaLocation": payload
        }, 0, /*sync=*/true);
      }
    },
    resetHeight() {
      this.height = 100;
      this.lateralPosition = 0;
      this.forwardPosition = 0;
      let payload = {};
      payload.x = this.forwardPosition;
      payload.y = this.lateralPosition;
      payload.z = this.height;
      UnrealService.callFunction(this.managerPath, "SetActorRelativeLocation", {
        "NewRelativeLocation": payload
      });
    },
    async poll() {
      if ([this.$refs.heightInput, this.$refs.forwardInput, this.$refs.lateralInput].includes(document.activeElement)) return;
      if (!this.rootComponent.length) return;
      try {
        let response = await UnrealService.callFunction(this.rootComponent, "GetRelativeTransform", {}, 0, /*sync=*/true, /*generateTransaction=*/false);
        if (UnrealService.clicking || !response || !response.ReturnValue) return;
        let {ReturnValue: {Translation: {X: forwardPosition, Y: lateralPosition, Z: height}}} = response;
        this.forwardPosition = this.round(forwardPosition);
        this.lateralPosition = this.round(lateralPosition);
        this.height = this.round(height);
      } catch(e) {
        return;
      }
    },
    onKeyUp(refName, e) {
      if (e.key === "Enter" || e.key === "Escape") {
        this.$refs[refName].blur();
      }
    }
  },
  components: {
    Joystick,
    PositionCanvas,
    RangeSlider,
    CustomInput
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";

#capture-page-content {
  padding: 20px;
  display: flex;
  justify-content: space-evenly;
}
canvas {
  border: 1px solid $accent-color;
}
.height-joystick-title {
  margin: 0;
}
.joystick-section {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 20px;
}
.position-info {
  margin-top: 10px;
  min-width: 150px;
  padding: 10px;
  text-align: left;
  background-color: #00000050;
  border-radius: 7px;
  display: flex;
  flex-direction: column;

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  input, textarea {
    width: 25%;
  }
}
.slider.range-slider {
  margin-top: 10px;
  padding-right: 5px;
  padding-left: 5px;
  width: 100%;
}
.slider-labels {
  margin-top: 5px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  p {
    margin: 0;
    color: #cececeaf;
  }
}
.column {
  display: flex;
  flex-direction: column;
}
</style>
