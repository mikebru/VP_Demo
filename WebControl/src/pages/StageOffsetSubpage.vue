<template>
<div id="stage-offset">
    <div class="top-left">
      <span class="tutorial-text"><i class="fas fa-arrow-left"></i> Sub-tabs </span>
    </div>
    <p class="tutorial-text">Before you start, make sure that your editor Viewport is in realtime mode and that the "Use less CPU when in background" option is disabled.</p>
    <p class="tutorial-text">When this is done, move over to the WebControl display in the template map.</p>
    <ObjectGroup
      ref="stageRotation"
      name="Stage Manipulation"
      :initialPath="initialPath"
      @resize="onResize"
    >
      <div slot-scope="scope">
        <p class="movement">Movement</p>
        <div class="joysticks">
          <Joystick
            ref="xyJoystick"
            knobTitle="x y"
            :size="150"
            :displayReset="false"
            @move="onMove(scope.objectPath, 'xy', $event)"
          ></Joystick>
          <div class="column">
            <Joystick
              ref="zJoystick"
              knobTitle="z"
              :lockY="true"
              :size="150"
              :displayReset="false"
              @move="onMove(scope.objectPath, 'z', $event)"
            ></Joystick>
          </div>
        </div>
        <RangeSlider
          class="slider"
          step="0.01"
          min="0.2"
          max="10"
          v-model="movementScale"
          :displayReset="false"
          :displayValue="false"
        >
        </RangeSlider>
        <div class="slider-labels"><p>Slower</p><p>Faster</p></div>
        <Joystick
          ref="rotationJoystick"
          knobTitle="rotation"
          class="rotation-joystick"
          :lockX="true"
          :size="150"
          :displayReset="false"
          @move="onRotate(scope.objectPath, $event)"
        ></Joystick>
        <RangeSlider
          class="slider"
          step="0.01"
          min="1"
          max="3.7"
          v-model="fineRotationScale"
          :displayReset="false"
          :displayValue="false"
          >
        </RangeSlider>
        <div class="slider-labels"><p>Slower</p><p>Faster</p></div>
      </div>
    </ObjectGroup>
</div>
</template>

<script>
import ObjectGroup from "@/components/ObjectGroup.vue"
import RangeSlider from "rangeslider";
import Joystick from "@/components/Joystick.vue";
import UnrealService from "@/UnrealService.js";
import config from "@/config.js";

export default {
  name: "StageOffsetSubpage",
  data: function () {
    return {
      movementScale: 5.1,
      fineRotationScale: 2.4,
    }
  },
  computed: {
    initialPath() {
      return config.stageOrigin;
    }
  },
  methods: {
    onMove(objectPath, axis, value) {
      let payload = {};
      if (axis === "xy") {
        payload.y = value.xForce * this.movementScale;
        payload.x = value.yForce * this.movementScale;
      } else {
        payload.z = value.yForce * this.movementScale;
      }
      UnrealService.callFunction(objectPath, "AddActorWorldOffset", {
        "DeltaLocation": payload
      }, 0, /*sync=*/true);
    },
    onRotate(objectPath, value) {
      let delta = value.xForce;
      if (delta < 0) {
        delta = Math.max(-15, delta);
      } else {
        delta = Math.min(delta, 15);
      }
      UnrealService.callFunction(objectPath, "AddActorWorldRotation", {
        "DeltaRotation": {
          "Yaw": delta / 2000 * (Math.pow(10, this.fineRotationScale))
        }
      }, 0, /*sync=*/true);
    },
    onResize() {
      this.$refs.xyJoystick.triggerRefresh();
      this.$refs.zJoystick.triggerRefresh();
      this.$refs.rotationJoystick.triggerRefresh();
    },
    dropToGround() {
      UnrealService.callFunction(this.$refs.stageRotation.objectPath, "DropStageToGround", {}, 2);
    }
  },
  components: {
    ObjectGroup,
    RangeSlider,
    Joystick
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "@/styles/common.scss";
.rotation-slider {
  margin-top: 10px;
  width: 500px;
}
.rotation-slider-title {
  margin: 0;
}
#stage-offset {
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
}
@media only screen and (min-width: 1800px) {
  #stage-offset {
    width: 50%;
    height: 70%;
  }
}
.slider {
  margin-top: 20px;
  width: 100%;
}
.joysticks {
  display: flex;
  margin: 10px 0;
  justify-content: space-evenly;
  width: 500px;
}
.slider-labels {
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
  align-items: center;
}
.movement {
  opacity: 0.7;
  margin: 0;
  margin-top: 15px;
}
.drop-button {
  margin-top: 15px;
  margin-left: auto;
}
.rotation-joystick {
  margin-left: auto;
  margin-right: auto;
}
.slider.range-slider {
  padding-right: 0;
  padding-left: 0;
}
.top-left {
  position: absolute;
  top: 70px;
  left: 70px;
}
</style>