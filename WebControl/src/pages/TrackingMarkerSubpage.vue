<template>
<div class="wrapper">
  <p class="tutorial-text">You can adjust the color of your green screen by using this color picker.</p>
  <div>
  <ObjectGroup
    name="Background Screen"
    ref="trackingMarkerGroup"
    :initialPath="initialPath"
  >
    <div class="column-layout green-screen-tab-content">
      <div class="column">
        <div class="inline-center">
          <div class="inline-left"> <p class="ndisplay-text">(nDisplay)<p> <p>Show Background</p> </div>
          <Checkbox :value="bFillFrustum" @input="onFrustumFillChange"/>
        </div>
        <div class="inline-center">
          <div class="inline-left"> <p class="ndisplay-text">(nDisplay)<p> <p>Show Tracking Markers</p> </div>
          <Checkbox :value="bShowMarkers" @input="onShowMarkersChange"/>
        </div>
        <div class="column-layout">
          <ColorPickerList
            id="tracking-marker-color-picker"
            class="color-picker"
            @change="onColorChange"
            :items="colorItems"
          />
        </div>
      </div>
    </div>
  </ObjectGroup>
  </div>
</div>
</template>

<script>
import { iro } from "colorpicker";
import UnrealService from "@/UnrealService.js";
import config from "@/config.js";
import cache from "@/cache.js";
import ColorPickerList from "@/components/ColorPickerList";
import Checkbox from "@/components/Checkbox.vue";

/*eslint-disable no-unused-vars*/
export default {
  name: "TrackingMarkerSubpage",
  data() {
    return {
      knobs: {
        MarkerDensity: {
          name: "Marker Density",
          value: 5
        },
        MarkerSize: {
          name: "Marker Size",
          value: 100
        },
        OffsetX: {
          name: "Offset X",
          value: 0
        },
        OffsetY: {
          name: "Offset Y",
          value: 0
        }
      },
      thickness: cache[this.computeBasePath() + "MarkerThickness"],
      defaultThickness: 0.5,
      bFillFrustum: cache[this.computeBasePath() + "FillFrustum"] || false,
      bShowMarkers: cache[this.computeBasePath() + "ShowMarkers"] || false,
      colorItems: [
        { label: "Background Color", paramName: "FrustumColor", default: "#004C00" },
      ],
      greenScreen: "",
      lastChromakeyMarker: config.defaultChromakeyMarker
    }
  },
  created() {
    Object.entries(this.knobs).forEach(entry => {
      entry[1].default = entry[1].value;
      entry[1].value = cache[this.computeBasePath() + entry[0]] || entry[1].value;
    });

    this.colorItems.forEach(item => {
      this.$set(item, "color", new iro.Color(cache[this.computeBasePath() + item.paramName] || item.default || "#ffffff"));
    });
  },
  computed: {
    initialPath() {
      return config.stageOrigin;
    }
  },
  methods: {
    onKnobChanged(value, name) {
      const objectPath = this.$refs.trackingMarkerGroup.objectPath;
      let offset = value > 0 ? 1 : -1;
      if (name == "MarkerDensity") {
        offset /= 25;
      } else if (name == "MarkerSize") {
        offset *= 2;
      } else if (name == "OffsetX") {
          offset /= -5;
      } else {
        offset /= 5;
      }
      
      this.knobs[name].value += offset;
      cache[this.computeBasePath() + this.knobs[name].name] = this.knobs[name].value;
      
      const payload = {};
      payload[name] = this.knobs[name].value;
      UnrealService.setProperty(objectPath, name,payload, 0);
    },
    onColorChange(item, change) {
      const rgb = change.color.rgb;
      cache[this.computeBasePath() + item.paramName] = change.color.hsv;

      const rgbPayload = {
        R: rgb.r / 255,
        G: rgb.g / 255,
        B: rgb.b / 255,
        A: 1
      };

      item.color = change.color.clone();
      const payload = {};
      payload[item.paramName] = rgbPayload;
      if (UnrealService.clicking) {
        UnrealService.setProperty(this.$refs.trackingMarkerGroup.objectPath, "BackgroundColor", {"BackgroundColor": rgbPayload}, 0, /*sync=*/true, /*generateTransaction=*/false);
      }
    },
    onFrustumColorChange(change) {
      const rgb = change.color.rgb;
      cache[this.computeBasePath() + "FrustumColor"] = change.color.hsv;
      this.frustumColor.rgb = rgb;
      const payload = {
        R: rgb.r / 255,
        G: rgb.g / 255,
        B: rgb.b / 255,
        A: 1
      };
      
      if (UnrealService.clicking) {
        UnrealService.setProperty(this.$refs.trackingMarkerGroup.objectPath, "BackgroundColor", {"BackgroundColor": payload}, 0, /*sync=*/true, /*generateTransaction=*/false);
      }
    },
    onFrustumFillChange(val) {
      cache[this.computeBasePath() + "FillFrustum"] = val;
      UnrealService.callFunction(config.nDisplayGreenScreen, "SetVisibility", { bNewVisibility: val }, 0, /*sync=*/true, /*generateTransaction=*/true, /*polling=*/true);
    },
    onShowMarkersChange(val) {
      cache[this.computeBasePath() + "ShowMarkers"] = val;
      const newPath = val ? this.lastChromakeyMarker : "";
       UnrealService.setProperty(config.nDisplayStageSettings, "ChromakeMarker", { ChromakeMarker: newPath }, 0, /*sync=*/true, /*generateTransaction=*/true, /*polling=*/true);
    },
    async poll() {
      let response = await UnrealService.getProperty(this.$refs.trackingMarkerGroup.objectPath, "BackgroundColor", 0, /*sync=*/true, /*generateTransaction=*/false);
      if (UnrealService.clicking || !response) return;

      let NewMarkerColor = null;
      let NewFrustumColor = null;
      
      ({ 
        BackgroundColor: NewFrustumColor
      } = await response);

      const FrustumItem = this.colorItems.find(el => el.paramName === "FrustumColor");
      FrustumItem.color = new iro.Color({r: NewFrustumColor.R*255, g: NewFrustumColor.G*255, b: NewFrustumColor.B*255});

      response = await UnrealService.getProperty(config.nDisplayStageSettings, "ChromakeMarker", 0, /*sync=*/true, /*generateTransaction=*/false);
      if (response) {
        const markerPath = response.ChromakeMarker;
        this.bShowMarkers = markerPath.length > 0;
        if (markerPath.length > 0) {
          this.lastChromakeyMarker = markerPath;
        }
      }
      
      response = await UnrealService.callFunction(config.nDisplayGreenScreen, "IsVisible", {}, 0, /*sync=*/true, /*generateTransaction=*/false, /*polling=*/true);
      if (response)
      {
        this.bFillFrustum = response.ReturnValue;
      }
    },
    onInput(name, textValue) {
      const objectPath = this.$refs.trackingMarkerGroup.objectPath;
      const value = parseFloat(textValue);
      if (isNaN(value)) return;
      this.knobs[name].value = value;
      cache[this.computeBasePath() + this.knobs[name].name] = this.knobs[name].value;
      
      const payload = {};
      payload[name] = this.knobs[name].value;
      UnrealService.setProperty(objectPath, name, payload, 0);
    }
  },
  components: {
    ColorPickerList,
    Checkbox
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "@/styles/common.scss";
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin:  30px;
}
.tracking-group {
  max-height: 800px;
  max-width: 1700px;
}
.knob-wrapper {
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 30px;
}
.position-tab {
  display: flex;
  margin-left: 30px;
  margin-right: 20px;
  margin-bottom: 15px;
  margin-top: 5px;
}
.column-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5px;
}
.row-layout {
  display: flex;
  flex-direction: row;
}
.slider-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;

  input {
    margin-top: 10px;
    width: 40px;
  }
}
.color-tab {
  margin: 20px;
}
.knob-group input {
  margin-top: 10px;
}
.row {
  margin-top: 5px;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.inline-center {
  margin-bottom: auto;
  display: flex;
  align-items: center;
  padding-left: 5px;
  justify-content: space-between;
  width: 100%;
  margin-right: 20px;
}
.inline-left {
  display:flex;
}
.range-slider {
  width: 100%;
}
.slider-label {
  margin-bottom: 5px;
}
.color-picker {
  border-top: 2px solid rgba($accent-color, 0.5);
  margin-top: 15px;
}
.green-screen-tab-content {
  padding: 0 60px;
}
.ndisplay-text {
  opacity: 0.5;
  margin-right: 20px;
}
</style>

<style>
#tracking-marker-color-picker .fa-undo {
  margin-top: 100px;
  margin-right: 20px;
}
</style>