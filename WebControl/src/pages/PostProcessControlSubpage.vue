<template>
  <div class="light-temperature">
      <p class="tutorial-text">These controls allow you to change the parameters of a post process volume that covers the WebControl area.</p>
      <ObjectGroup
        ref="temperatureObjects"
        v-for="(object) in postProcessGroups"
        :key="object.name"
        :name="object.name"
        class="knob-object-group"
        :initialPath="initialPath"
        @path:change="onPathChange">
        <template slot-scope="scope">
          <div ref="knob" class="knobs">
            <Knob
              name="Exposure"
              :size="knobSize"
              min="-3"
              max="3"
              :value="object.exposure"
              @input="updateExposure($event, scope.objectPath, object)"
              @reset="onResetExposure(scope.objectPath, object)"
            ></Knob>
            <Knob
              name="White Balance"
              min="1500"
              max="15000"
              :size="knobSize"
              :value="object.temperature"
              @input="updateTemperature($event, scope.objectPath, object)"
              @reset="onResetTemperature(scope.objectPath, object)"
            ></Knob>
          </div>
        </template>
      </ObjectGroup>
       <ObjectGroup
      class="color-picker-group"
      ref="colorGradingGroup"
      name="Color Grading"
      :initialPath="initialPath"
      >
      <template v-slot:headerExtensions>
        <i class="fas fa-undo reset-all" title="Reset all" v-hammer:tap="onClickResetAll"></i>
      </template>
      <div class="inner-content" slot-scope="scope">
        <div class="param-selector">
          <ul>
            <div
              class= "list-item master">
                <li>Master</li>
            </div>
            <div
              v-for="parameter in parameters[0].params"
              v-hammer:tap="() => onClick(parameter)"
              class= "list-item inner"
              :key="parameter.id"
              :class="{active: selectedParameter === parameter}">
                <li>{{parameter.id}}</li>
                <div class="dot-holder">
                  <span
                    class="dot"
                    :style="{ backgroundColor: parameter.color.hexString }"
                  >
                  </span>
                  <span
                    class="dot bg-dot"
                    :style="{ opacity: (100 - parameter.color.alpha) / 100 }"
                  >
                  </span>
                </div>
            </div>
            <div
              v-for="parameter in parameters.slice(1, parameters.length)"
              v-hammer:tap="() => onClick(parameter)"
              class= "list-item"
              :key="parameter.id"
              :class="[selectedParameter === parameter ? 'active' : '']">
                <li>{{parameter.id}}</li>
                <div class="dot-holder">
                  <span
                    class="dot"
                    :style="{ backgroundColor: parameter.color.hexString }"
                  >
                  </span>
                  <span
                    class="dot bg-dot"
                    :style="{ opacity: (100 - parameter.color.alpha) / 100 }"
                  >
                  </span>
                </div>
            </div>
          </ul>
        </div>
        <div class="color-picker-wrapper">
          <ColorPicker
            @input="onColorChange(scope.objectPath, $event)"
            :size="200"
            :value="selectedParameter.color"
            :customResetAlpha="50"
            :customResetColor="'7f7f7f'"
            :displayAlpha="true"
            @reset="resetColor(selectedParameter)"
        ></ColorPicker>
      </div>

      </div>
    </ObjectGroup>
    </div>
</template>

<script>
import Knob from "knober";
import UnrealService from "@/UnrealService.js";
import cache from "@/cache.js";
import config from "@/config.js";
import ColorPicker from "@/components/ColorPicker.vue";
import { iro } from "colorpicker";

export default {
  name: "PostProcessControlSubpage",
  settingName: "Settings",
  offsetParamName: "ColorOffset",
  data: function () {
    return {
      value: 0,
      knobSize: this.getKnobSize(),
      postProcessGroups: [
        {
          name: "Post Process Settings",
          exposure: 0,
          temperature: 6500
        }
      ],
      parameters: [
        { id: "Master",
          paramName: "Master",
          params: [
            { id: "Saturation", paramName: "ColorSaturation" },
            { id: "Contrast", paramName: "ColorContrast" },
            { id: "Gamma", paramName: "ColorGamma" },
            { id: "Gain", paramName: "ColorGain" },
            { id: "Offset", paramName: "ColorOffset" }
          ]
        },
        { id: "Shadow Gain", paramName: "ColorGainShadows" },
        { id: "Midtone Gain", paramName: "ColorGainMidtones" },
        { id: "Highlight Gain", paramName: "ColorGainHighlights" }
      ],
      selectedParameter: null,
      active: "colorWheel",
      mounted: false
    }
  },
  async created() {
     this.allParams.forEach(param => {
      const cachedColor = cache[this.computeBasePath() + param.paramName + ".value"];
      this.$set(param, "color", new iro.Color(cachedColor || "#ffffff"))
      if (!cachedColor) {
        param.color.alpha = 50;
      }
    });

    this.selectedParameter = this.allParams[0];
    //const {ReprojectedCineCamera: cineCamPath} = await UnrealService.getProperty(config.ppSettingsVolume, "ReprojectedCineCamera");
    /*this.$refs.temperatureObjects.forEach(tempObject => {
      //tempObject.setObjectPath(cineCamPath + ".CameraComponent");
      tempObject.setObjectPath(config.ppSettingsVolume);
    });*/
    
    
    this.postProcessGroups.forEach(group => {
      const path = this.computeBasePath() + group.name + ".";
      group.exposure = cache[path + "exposure"] || 0;
      group.temperature = cache[path + "temperature"] || 0;
    });

    //this.$refs.colorGradingGroup.objectPath = this.$refs.temperatureObjects[0].objectPath;
  },
  computed: {
    initialPath() {
      return config.ppSettingsVolume;
    },
    allParams() {
      return this.parameters[0].params.concat(this.parameters.slice(1, this.parameters.length));
    },
  },
  mounted() {
    for (let i = 0; i < this.postProcessGroups.length; i++) {
      const { objectPath } = this.$refs.temperatureObjects[i];
      this.enableModifications(objectPath);
    }

    this.mounted = true;
  },
  methods: {
    onPathChange(path) {
      this.enableModifications(path);
    },
    enableModifications(path) {
      const payload = {};
      payload[this.$options.settingName] = {
        "bOverride_AutoExposureBias" : true,
        "bOverride_WhiteTemp" : true,
        "bOverride_ColorSaturation": true,
        "bOverride_ColorContrast": true,
        "bOverride_ColorGamma": true,
        "bOverride_ColorGain": true,
        "bOverride_ColorOffset": true,
        "bOverride_ColorGainShadows": true,
        "bOverride_ColorGainMidtones": true,
        "bOverride_ColorGainHighlights": true
      };

      UnrealService.setProperty(path, this.$options.settingName, payload, /*retryCount=*/ 10);
    },
    getKnobSize() {
      if (screen.width > screen.height) {
        return screen.height / 4;
      } else {
        return screen.height / 6;
      }
    },
    updateExposure (value, objectPath, object) {
      this.updateValue(value, objectPath, object, "exposure", "AutoExposureBias");
    },
    updateTemperature (value, objectPath, object) {
      this.updateValue(value, objectPath, object, "temperature", "WhiteTemp");
    },
    updateValue (value, objectPath, object, paramName, unrealParamName) {
      object[paramName] = value;
      cache[this.computeBasePath() + object.name + "." + paramName] = value;
      const payload = {};
      payload[this.$options.settingName] = {};
      payload[this.$options.settingName][unrealParamName] = value;

      UnrealService.setProperty(objectPath, this.$options.settingName, payload, 0, /*sync=*/true);
    },
    onClick(param) {
      this.selectedParameter = param;
    },
    updateColor(parameter, objectPath, retry = false) {
      let {r, g, b} = parameter.color.rgb;
      let a = parameter.color.alpha;
      let payload = {};
      payload[this.$options.settingName] = {};
      
      if (parameter.paramName === this.$options.offsetParamName) {
        payload[this.$options.settingName][parameter.paramName] = this.rgba2offset({r, g, b, a});
      } else {
        payload[this.$options.settingName][parameter.paramName] = this.rgba2xyz({r, g, b, a});
      }
      // Only send an update if everything is mounted to make sure we don't overwrite values before polling them.
      if (UnrealService.clicking && this.mounted) {
        UnrealService.setProperty(objectPath, this.$options.settingName, payload, retry ? 5 : 0);
      }
    },
    onColorChange(objectPath, change) {
      this.selectedParameter.color = change.color.clone();
      cache[this.computeBasePath() + this.selectedParameter.paramName + ".value"] = change.color.hsv;
      this.updateColor(this.selectedParameter, objectPath);
    },
    xyz2rgb(xyzObject) {
      let {X: r, Y: g, Z: b, W: a} = xyzObject;
      r = Math.round(r/2*255);
      g = Math.round(g/2*255);
      b = Math.round(b/2*255);
      a = Math.round(a/2*100);
      return { r, g, b, a };
    },
    rgba2xyz(rgba) {
      const {r, g, b, a} = rgba;
      return {
        X: r*2/255,
        Y: g*2/255,
        Z: b*2/255,
        W: a*2/100
      };
    },
    rgba2offset(rgba) {
      const {r, g, b, a} = rgba;
      return {
        X: r*2/255 - 1,
        Y: g*2/255 - 1,
        Z: b*2/255 - 1,
        W: a*2/100 - 1
      };
    },
    offset2rgb(xyzObject) {
      let {X: r, Y: g, Z: b, W: a} = xyzObject;

      r = ((r + 1) * 255) / 2;
      g = ((g + 1) * 255) / 2;
      b = ((b + 1) * 255) / 2;
      a = (a + 1) * 100 / 2; 
      return { r, g, b, a };
    },
    async poll() {
      for (let i = 0; i < this.postProcessGroups.length; i++) { 
        const { objectPath, pathError} = this.$refs.temperatureObjects[i];

        if (objectPath && !pathError) {
          const path = this.computeBasePath() + this.postProcessGroups[i].name + ".";

          const ReturnedObject = await UnrealService.getProperty(objectPath, this.$options.settingName, /*sync=*/true);
          const settings = ReturnedObject[this.$options.settingName];

          this.postProcessGroups[i].exposure = settings.AutoExposureBias;
          cache[path + "exposure"] = this.postProcessGroups[i].exposure;

          this.postProcessGroups[i].temperature = settings.WhiteTemp;
          cache[path + "temperature"] = this.postProcessGroups[i].temperature;
        }
      }

      const ReturnedObject = await UnrealService.getProperty(this.$refs.colorGradingGroup.objectPath, this.$options.settingName, /*sync=*/true);
      const settings = ReturnedObject[this.$options.settingName];

      if (UnrealService.clicking) return;
      if (settings) {
        for (let setting of this.allParams) {
          let color;
          if (setting.paramName === this.$options.offsetParamName) {
            (color = this.offset2rgb(settings[setting.paramName]));
          } else {
            (color = this.xyz2rgb(settings[setting.paramName]));
          }

          let newColor = new iro.Color();
          newColor.rgb = color;
          newColor.alpha = color.a;
          this.$set(setting, "color", newColor);
          cache[this.computeBasePath() + setting.paramName + ".value"] = newColor.hsv;
        }
      }
    },
    onResetExposure(path, object) {
       this.updateExposure(1, path, object);
    },
    onResetTemperature(path, object) {
      this.updateTemperature(6500, path, object);
    },
    resetColor(param) {
      let resetColor = new iro.Color({r: 127, g: 127, b: 127});
      resetColor.alpha = 50;
      param.color = resetColor.clone();
      cache[this.computeBasePath() + param.paramName + ".value"] = param.color.hsv;
      this.updateColor(param, this.$refs.colorGradingGroup.objectPath, /*retry=*/true);
    },
    onClickResetAll() {
      this.allParams.forEach(param => {
        this.resetColor(param);
      });
    },
    async onFocusActor() {
      const payload = {
        ActorToPilot: config.ppSettingsVolume,
      };
      await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorLevelLibrary", "PilotLevelActor", payload, 2, /*sync=*/true)
    }
  },
  components: {
    Knob,
    ColorPicker
  }
}
</script>

<style scoped lang="scss">
.knobs {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 100%;

  div {
    margin: 0 10px;
  }
}
.knob-object-group {
  width: 100%;
  margin: 5px;
}
.knobs {
  flex-direction: row;
}
.light-temperature {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  margin-left: auto;
  margin-right: auto;
}
.light-temperature > div {
  width: 50%;
  height: 50%;
}

@media only screen and (orientation: portrait) {
  .light-temperature {
    width: 100%;
    justify-content: space-around;
    margin: unset;
  }
  .knobs {
    flex-direction: row;
  }
}

@media only screen and (max-width: 1200px) {
  .light-temperature > div {
    width: 100%;
  }
}

@import "@/styles/common.scss";
.color-picker-group {
  max-width: 1000px;
}
ul {
  text-align: left;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
li {
  margin-bottom: 5px;
}
.list-item {
  @include color-param();
}
.list-item.inner {
  margin-left: 30px;
  padding-right: 38px;
}
.list-item.master {
  border-bottom: 1px solid #ffffff7a;
  margin-left: 10px;
  border-radius: 0;
  border-left: none;
  padding-bottom: 0;
  margin-bottom: 10px;
}
.list-item.master:hover {
  cursor: default;
}
.color-grading-wrapper {
  max-width: 1500px;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
}
.param-selector {
  width: 100%;
  height: 100%;
}
.color-picker-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.bg-dot {
  position: absolute;
  left: 0;
  opacity: 0;
  background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
.dot-holder{
  position: relative;
}

.tutorial-text {
  margin: 0;
}

.tutorial-text.link {
  text-decoration: underline;
  color: $accent-color;
  opacity: 1;
}

.knob-object-group {
  margin: -10px;
}
</style>
