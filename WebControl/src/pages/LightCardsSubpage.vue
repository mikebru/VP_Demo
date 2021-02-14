<template>
  <div class="main-wrapper">
    <p class="tutorial-text">These controls make it possible to add and interact with light cards to your virtual set.</p>
    <transition name="fade">
      <div class="overlay" ref="overlay" v-show="openCreateLightOverlay"></div>
    </transition>
    <Dialog
      v-show="deletingLight"
      @close="onDeleteDialogClose"
      title="Delete light"
    >
      <p>Are you sure you want to delete light {{lightToDeleteName}}?</p>
    </Dialog>
    <div class="card-list">
      <div class="light-list scrollable" ref="lightList">
        <div
          v-for="item in lights"
          class="item"
          :class="{'active': selectedItem==item}"
          :key="item.path"
          @click="onSelectItem($event, item)"
        >
          <div class="inner-item">
            <p>{{item.displayName}}</p>
            <i class="fas fa-times delete-icon" @click.capture="onClickDelete(item)"></i>
          </div>
        </div>
      </div>
      <radial-menu
        ref="radialMenu"
        id="radial-menu"
        :itemSize="50"
        :defaultOpen="true"
        :linear="true"
        :class="{hidden: !showCreateButton}"
        @open="onClickOpenCreate"
        @close="openCreateLightOverlay = false"
      >
      </radial-menu>
    </div>
    <div class="content-wrapper">
      <transition name="fade">
        <div class="element-grid-wrapper" v-show="openCreateLightOverlay">
          <ElementGrid
            class="element-grid scrollable"
            :items="lightCardTypes"
            :displayItemTitle="false"
            @click="onSelectLightType"
          >
          </ElementGrid>
        </div>
      </transition>
      <ObjectGroup
        class="object-group"
        v-if="selectedItem"
        ref="lightDetails"
        :name="selectedItem.displayName"
        :renamable="true"
        :supportObjectPath="false"
        :initialPath="selectedItem.path"
        @title:submit="onRename"
      >
        <template v-slot:headerExtensions>
          <i class="fas"  v-hammer:tap="onClickToggleVisibility" :class="selectedItem.bIsVisible ? 'fa-eye' : 'fa-eye-slash'"></i>
          <i class="fas fa-undo reset-all"  v-hammer:tap="() => onClickResetAll(selectedItem)"></i>
          <i class="fas fa-times delete-icon"  v-hammer:tap="() => onClickDelete(selectedItem)"></i>
        </template>
        <div class="selected-item">
          <div class="left-row">
            <div class="lightcard-info">
              <p>{{currentImageName}}</p>
              <div id="image-wrapper" class="lightcard-image-wrapper" v-hammer:tap="editLightType">
                <div :style="imageStyle">
                  <img class="lightcard-image" :src="currentImage" alt="">
                </div>
                <i class="fas fa-edit"></i>
              </div>
              <ColorPicker
                @input="onColorChange($event)"
                :value="selectedItem.Color"
                ref="colorPicker"
              >
              </ColorPicker>
            </div>
          </div>
          <div class="upper-row">
            <div class="joysticks">
              <div class="joystick">
                <Joystick
                  @move="onMove($event)"
                  :lockY="lock === 'Lat'"
                  :lockX="lock === 'Long'"
                  :displayReset="false"
                >
                </Joystick>
                <div class="lock-buttons">
                  <div
                    class="inline"
                    v-for="lockName in ['Lat', 'Long']"
                    :key="lockName"
                    :class="{locked: lock === lockName}"
                     v-hammer:tap="() => {if (lock === lockName) {lock = ''} else { lock = lockName}}"
                  >
                    <i
                      class="fas"
                      :class="[lock === lockName ? 'fa-lock' : 'fa-lock-open']"
                    ></i>
                    <p>{{lockName}}</p>
                  </div>
                </div>
              </div>
              <Knob
                class="distance-knob"
                min="0.01"
                infinite="true"
                @delta="onDistanceChange"
                @reset="onResetDistance()"
                name="Distance"
                :size="150"
                :displayReset="true"
              >
              </Knob>
            </div>
            <table>
            <tbody>
              <tr
                v-for="param in sliderParams"
                :key="param.name"
              > 
                <td valign="top" class="slider-title">{{param.name}}</td>
                <td class="slider-row">
                  <RangeSlider
                    class="range-slider"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    v-model="selectedItem[param.name]"
                    :disabled="param.name === 'Exposure' && ['Square', 'Circle'].includes(selectedItem.lightCardName)"
                    @reset="onReset(param)"
                    @input="onSliderChange(param.propName || param.name, $event)"
                  />
                </td>
              </tr>
              <tr
                v-for="(param, index) in scaleParams"
                :key="param.name"
              > 
                <td valign="top" class="slider-title">{{param.name}}</td>
                <td class="slider-row">
                  <RangeSlider
                    class="range-slider"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    @reset="onResetScale(param)"
                    :value="selectedItem[param.name]"
                    @input="onScaleSliderChange(param, $event)"
                  />
                  <div
                    class="lock-holder"
                    v-if="index === 0 "
                  >
                    <p>&#8626;</p>
                    <i
                      class="fa"
                      :class="[scaleLock? 'fa-lock' : 'fa-lock-open']"
                       v-hammer:tap="onClickScaleLock"
                    ></i>
                    <p>&#8624;</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </ObjectGroup>
    </div>
  </div>
</template>

<script>
import ColorPicker from "@/components/ColorPicker.vue";
import RangeSlider from "rangeslider";
import Joystick from "@/components/Joystick.vue";
import UnrealService from "@/UnrealService.js";
import RadialMenu from "radialmenu";
import Knob from "knober";
import config from "@/config.js";
import cache from "@/cache.js";
import Dialog from "@/components/Dialog.vue";
import { iro } from "colorpicker";
import ElementGrid from "@/components/ElementGrid.vue";

export default {
  name: "LightCardsSubpage",
  data() {
    return {
      lights: [],
      textureParameters: [
        { name: "Spin", defaultValue: 0, min: 0, max: 360, step: 1},
        { name: "Falloff", defaultValue: 0,  min: 0, max: 1, step: 0.01, propName: "Feather"},
        { name: "Transparency", defaultValue: 0.0, min: 0, max: 1, step: 0.01, propName: "Transparency"},
        { name: "Scale X", defaultValue: 0.5, min: 0.1, max: 5, step: 0.01, propName: "XScale"},
        { name: "Scale Y", defaultValue: 0.5, min: 0.1, max: 5, step: 0.01, propName: "YScale"},
      ],
      selectedItem: null,
      lightIntensity: 0,
      attenuationRadius: 0,
      falloff: 0,
      creatingLight: false,
      lock: "",
      lightCardManager: "",
      tabs: {lightCard: "Light Card"},
      lightToDelete: null,
      lastDistanceDirection: false,
      deletingLight: false,
      currentImage: "",
      openCreateLightOverlay: false,
      showCreateButton: true,
      scaleLock: cache["lockScale"] || false
    }
  },
  computed: {
    lightToDeleteName() {
      if (this.lightToDelete) {
        return this.lightToDelete.displayName;
      }
      return "";
    },
    lightCardTypes() {
      return config.lightCardTypes;
    },
    lightCardImage() {
      if (!this.selectedItem) {
        return "";
      }

      const lightCardType = this.lightCardTypes[this.selectedItem.lightCardIndex];
      if (lightCardType) {
        return lightCardType.loadedImage;
      }
      return "";
    },
    getLightCardName() {
      if (!this.selectedItem) {
        return "";
      }
      return this.selectedItem.lightCardName;
    },
    imageStyle() {
      const color = this.selectedItem.Color.rgb;
      return {
        width: "256px",
        height: "128px",
        opacity: 1,
        borderRadius: "20px",
        filter: 'hue-rotate(-7deg) saturate(0.9) brightness(1.3)',
        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
      };
    },
    sliderParams() {
      return this.textureParameters.slice(0,3);
    },
    scaleParams() {
      return this.textureParameters.slice(3);
    },
    managerPath() {
      return window.localStorage[this.computeBasePath()] || config[this.computeBasePath()] || config.lightCardManager;
    }
  },
  created() {
    this.lights = cache.lightCards || [];
    this.lights.forEach(light => {
      const newColor = new iro.Color();
      if (light.hsv && light.hsv.h) {
        newColor.hsv = light.hsv;
      } else {
        newColor.hsv = {h: 0, s: 0, v: 100};
      }
      light.Color = newColor;
    });

    this.$options.interval = setInterval(this.fetchLights, 2000);
    this.fetchLights();
  },
  beforeDestroy() {
    document.removeEventListener("click", this.onClickDocument);
    document.removeEventListener("touchstart", this.onClickDocument);
    clearInterval(this.$options.interval);
  },
  methods: {
    async fetchLights() {
      const response = await UnrealService.callFunction(this.managerPath, "EnumerateLightCards", {}, 0, /*sync=*/true, /*generateTransaction=*/false);
      // Todo: Error notification
      if (!response) return;
      const { LightCards } = response;
      if (LightCards) {
        this.lights.forEach(light   => {
          // Remove deleted lights
          if (!LightCards.find(el => el === light.path)) {
            const lightIndex = this.lights.indexOf(light);
            this.lights.splice(this.lights.indexOf(light), 1);
            if (light === this.selectedItem) {
              this.selectNextLight(lightIndex);
            }
          }
        });

        LightCards.forEach(light => {
          const newColor = new iro.Color();
          newColor.hexString = "#ffffff";
          let label = "temporaryLabel";
          UnrealService.callFunction(light, "GetActorLabel", {}, 0, /*sync=*/true, /*generateTransaction=*/false)
          .then(res => {
            if (!res) return;

            label = res.ReturnValue;
            const lightObj = {
              path: light,
              hsv: newColor.hsv,
              displayName: label,
              Exposure: 1,
              Color: newColor,
              lightCardIndex: 0,
              lightCardName: this.lightCardTypes[0].name
            };
            
            for (let param of this.textureParameters.map(param => param.name)) {
              this.$set(lightObj, param, this.textureParameters.find(el => el.name === param).defaultValue);
            }
            
            if (!this.lights.find(light => light.path === lightObj.path)) {
              this.lights.push(lightObj);
            }
            
            if (!this.selectedItem && this.lights[0]) {
              this.onSelectItem(null, this.lights[0]);
            }
          });
        });

        cache.lightCards = this.lights;
      }
    },
    setObjectPath(newPath) {
      if (this.$refs.lightDetails) {
        this.$refs.lightDetails.setObjectPath(newPath);
      }
    },
    getObjectPath() {
      if (this.$refs.lightDetails) {
        return this.$refs.lightDetails.objectPath;
      } else {
        return "";
      }
    },
    onMove(value) {
      UnrealService.callFunction(this.getObjectPath(), "ModifyLatLong", {
        "longitudeDelta": value.xForce * 0.5,
        "latitudeDelta": value.yForce * 0.5
      }, 0, /*sync=*/true)
    },
    poll(){
      if (!this.selectedItem && this.lights[0]) {
        this.onSelectItem(null, this.lights[0]);
      }
      const item = this.selectedItem;
      if (!item || (this.$refs.lightDetails && this.$refs.lightDetails.renaming)) return;
      UnrealService.getProperty(item.path, "", 0, /*sync=*/true).then(result  => {
        if (UnrealService.clicking || UnrealService.requestQueue.length || !result) return;
        // eslint-disable-next-line no-unused-vars
        const { Exposure, Color, XYScale, Spin, Feather, Transparency, LightCard, bHidden, InternalLightCardIndex, DisplayName } = result;
        const rgb = {
          R: Color.R * 255,
          G: Color.G * 255,
          B: Color.B * 255
        };

        const newColor = new iro.Color();
        newColor.rgb = {r: rgb.R, g: rgb.G, b: rgb.B};

        this.$set(item, "Color", newColor);
        item.lightCardIndex = InternalLightCardIndex;
        item.Color = newColor;
        item.hsv = newColor.hsv;
        item.Exposure = Exposure;
        item.Spin = Spin;
        item.bIsVisible = !bHidden;
        item["Scale X"] = XYScale.X;
        item["Scale Y"] = XYScale.Y;
        item.Falloff = Feather;
        item.Transparency = Transparency;
        item.lightCardName = this.lightCardTypes[item.lightCardIndex].name;
        cache.lightCards = this.lights;    
        this.currentImageName = this.getLightCardName;
        this.currentImage = this.lightCardImage;
      });
    },
    createLight(lightType) {
    
      let newLightName = this.lightCardTypes[lightType].name;
      UnrealService.callFunction(this.managerPath, "SpawnLightCardByIndex", { "LightIndex":lightType, "LightName": newLightName
      })
      .then(result => {
        result = result.LightCard;
      
        const newColor = new iro.Color();
        newColor.hexString = "#ffffff";
        const newItem = {
          Exposure: 1,
          Color: newColor,
          lightCardIndex: lightType,
          lightCardName: this.lightCardTypes[lightType].name
        };
            
        for (let param in this.textureParameters) {
          newItem[param] = this.textureParameters[param].defaultValue;
        }
        
        if (result && result.length) {
          UnrealService.callFunction(result, "GetActorLabel").then(res => {
            if (res) {
              newItem.displayName = res.ReturnValue;
              this.$forceUpdate();
            }
          }, /*sync=*/false, /*generateTransaction=*/false);
          newItem.path = result;
          this.lights.push(newItem);
          this.onSelectItem(null, newItem);
          // Update the ObjectGroup path after rendering it.
          this.$nextTick().then(() => {
            this.$refs.lightDetails.setObjectPath(newItem.path);
            this.$refs.lightList.scrollLeft = this.$refs.lightList.scrollWidth;
          });

          // Enumerator values get out of sync too easily, instead we pass the integer index when we spawn
          // and convert that to an enum by casting.
          // UnrealService.setProperty(newItem.path, "LightCard", {
          //   "LightCard": "NewEnumerator" + lightType
          // }, 10);

          cache.lightCards = this.lights;
        } else {
          // eslint-disable-next-line no-console
          console.warn("Couldn't create a new light.");
        }
      })
    },
    onSelectItem(event, item) {
      if (event && event.target.nodeName === "I") {
        return;
      }
      // Prevent the web app from sending an initial value
      UnrealService.clicking = false;

      this.selectedItem = item;
      this.currentImageName = this.getLightCardName;
      this.currentImage = this.lightCardImage;
      this.$nextTick(() => this.$refs.lightDetails.setObjectPath(item.path));
    },
    onColorChange(event) {
      const rgb = event.color.rgb;
      const payload = {
        R: rgb.r / 255,
        G: rgb.g / 255,
        B: rgb.b / 255
      };

      this.selectedItem.Color = event.color.clone();
      this.selectedItem.hsv = event.color.hsv;
      cache.lightCards = this.lights;
      if (UnrealService.clicking) {
        UnrealService.setProperty(this.selectedItem.path, "Color", {
          "Color": payload
        }, 0, /*sync=*/true);
      }
    },
    onSliderChange(paramName, value) {
      const payload = {};
      payload[paramName] = value;

      cache.lightCards = this.lights;
      UnrealService.setProperty(this.selectedItem.path, paramName, payload, 0, /*sync=*/true)
    },
    onClickDelete(light) {
      this.deletingLight = true;
      this.lightToDelete = light;
    },
    onDeleteDialogClose(deleteLight) {
      if (deleteLight) {
        this.deleteLight();
      }
      this.deletingLight = false;

      // Clear name until after the dialog transition has ended.
      setTimeout(() => this.lightToDelete = null, 300);
    },
    deleteLight() {
      if (this.lightToDelete) {
        UnrealService.callFunction(this.managerPath, "DestroyLightCard", {
          "LightCard": this.lightToDelete.path
        });
        let index = this.lights.indexOf(this.lightToDelete);
        this.lights.splice(index, 1);
        this.selectNextLight(index);
        config.lightCards = this.lights;

        setTimeout(() => this.lightToDelete = null, 300);
      }
    },
    onDistanceChange(delta) {
      // Debounce inputs.
      if (delta > 0) {
        delta = 1;
        if (!this.lastDistanceDirection) {
          this.lastDistanceDirection = true;
          return;
        }
      } else {
        if (this.lastDistanceDirection) {
          this.lastDistanceDirection = false;
          return;
        }
        delta = -1
      }

      UnrealService.callFunction(this.selectedItem.path, "ModifyDistance", {
        DistanceDelta: delta * 20 // todo: * scale
      }, 0)
    },
    onResetDistance() {
      UnrealService.setProperty(this.selectedItem.path, "", {
        Distance: 350
      });
    },
    onReset(param) {
      if(param.name === 'Exposure' && ['Square', 'Circle'].includes(this.selectedItem.lightCardName)) {
        return;
      }
      const propName = param.name;
      this.selectedItem[param.name] = param.defaultValue;
      let payloadPropName = param.propName || propName;
      const payload = {};
      const value = this.selectedItem[propName];
      payload[payloadPropName] = value;
      
      UnrealService.setProperty(this.selectedItem.path, payloadPropName, payload, 5);
    },
    async onClickToggleVisibility() {
      this.selectedItem.bIsVisible = !this.selectedItem.bIsVisible || false;
      
      const payload = {
        bHidden: !this.selectedItem.bIsVisible
      };

      UnrealService.setProperty(this.selectedItem.path, "bHidden", payload);
    },
    onClickResetAll() {
      this.sliderParams.forEach(this.onReset);
      this.scaleParams.forEach(this.onResetScale);
      this.selectedItem.bIsVisible = true;
      this.selectedItem.Color.hexString = "#ffffff";
      this.$refs.colorPicker.reset();
      
      UnrealService.setProperty(this.selectedItem.path, "", {
        Distance: 350,
        Latitude: 0,
        Longitude: 0,
        bHidden: false,
        Color: {R: 1, G: 1, B: 1}
      }, 5);
    },
    async onRename(newName) {
      if (!newName.length) return;
      const oldPath = this.selectedItem.path;
      const newPath = oldPath.substr(0, oldPath.lastIndexOf(".")) + "." + newName;

      const {ReturnValue: valid} = await UnrealService.callFunction("/Script/Engine.Default__KismetSystemLibrary", "IsValid", {
        Object: newPath
      });

      if (!valid) {
        cache.lightCards = this.lights;
        await UnrealService.callFunction(oldPath, "SetActorLabel", {
          NewActorLabel: newName
        });
        this.selectedItem.displayName = newName;
        this.selectedItem.path = newPath;
      }
    },
    selectNextLight(previousIndex) {
      this.onSelectItem(null, this.lights[previousIndex] || this.lights[Math.max(previousIndex - 1, 0)]);
    },
    onSelectLightType(light) {
      const lightIndex = this.lightCardTypes.indexOf(light);
      document.removeEventListener("click", this.onClickDocument);
      document.removeEventListener("touchstart", this.onClickDocument);
      this.$refs.radialMenu.isOpen = false;

      if (this.creatingLight) {
        this.createLight(lightIndex);
        this.creatingLight = false;
        this.openCreateLightOverlay = false;
      } else {
        this.openCreateLightOverlay = false;
        this.showCreateButton = true;
        this.currentImage = light.loadedImage;
        this.currentImageName = this.selectedItem.lightCardName = light.name;
        this.selectedItem.lightCardIndex = lightIndex;
        
        UnrealService.callFunction(this.selectedItem.path, "SetLightCardType", {
           "Index": lightIndex
        }, 10);

        cache.lightCards = this.lights;
        // Set light
      }
    },
    editLightType() {
      this.openCreateLightOverlay = true;
      this.showCreateButton = false;
      setTimeout(() => {
        document.addEventListener("click", this.onClickDocument);
        document.addEventListener("touchstart", this.onClickDocument);
      }, 100);
    },
    onClickDocument(e) {
      if (!this.creatingLight || (e.target.nodeName !== "IMG" && e.target.id !== "image-wrapper" && e.target.className !== "lightcard-image" && e.target.className !== "vue-radial-menu-container open")) {
        this.openCreateLightOverlay = false;        
        this.$refs.radialMenu.isOpen = false;
        document.removeEventListener("click", this.onClickDocument);
        document.removeEventListener("touchstart", this.onClickDocument);
        if (!this.showCreateButton) this.showCreateButton = true;
      }
    },
    onScaleSliderChange(param, value) {
      const payload = {};

      if (this.scaleLock) {
        this.selectedItem["Scale X"] = this.selectedItem["Scale Y"] = value;
        payload["XYScale"] = {
          X: value,
          Y: value
        };
      } else {
        this.selectedItem[param.name] = value;
        if (param.name === "Scale X") {
          payload["XYScale"] = {X: value};
        } else if (param.name === "Scale Y") {
          payload["XYScale"] = {Y: value};
        }
      }
      cache.lightCards = this.lights;
      UnrealService.setProperty(this.selectedItem.path, "XYScale", payload, 0, /*sync=*/true)
    },
    onClickScaleLock() {
      this.scaleLock = !this.scaleLock;
      cache["scaleLock"] = this.scaleLock;
    },
    onResetScale(param) {
      this.onScaleSliderChange(param, param.defaultValue);
    },
    onClickOpenCreate() {
      this.creatingLight = true;
      this.openCreateLightOverlay = true;
      setTimeout(() => {
        document.addEventListener("click", this.onClickDocument);
        document.addEventListener("touchstart", this.onClickDocument);
      }, 100);
    }
  },
  components: {
    ColorPicker,
    RangeSlider,
    Joystick,
    RadialMenu,
    Knob,
    Dialog,
    ElementGrid
  }
}
</script>

<style scoped lang="scss">
$light-card-width: 120px;

.main-wrapper {
  position: relative;
  padding-top: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
}
.card-list {
  position: relative;
  width: 100%;
  min-height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 0;
}
.light-list {
  background-color: #0000001a;
  height: 125px;
  width: 80vw;
  margin: 0;
  border-radius: 15px;
  padding-inline-start: 20px;
  padding: 5px 20px;
  box-shadow: inset 0 0 11px 0px #0000003b;
  white-space: nowrap; 
  overflow-x: auto;
}
.light-list > div {
  height: 80px;
  margin: 15px 5px;
  display: inline-block;
  min-width: fit-content;
}
.overlay {
  z-index: 2;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
}
.item {
  flex-shrink: 0;
  padding: 10px;
  background-color: $card-background-color;
  border-radius: 5px;
  box-shadow: 0px 1px 10px 0px rgba(0,0,0,0.75);
  width: $light-card-width;
}
.item p {
  margin: 0;
  text-align: left;
  color: $accent-color;
}
.item:hover {
  background-color: #ffffff0f;
  cursor: pointer;
}
.inner-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  i {
    margin-left: 15px;
  }
}
.vue-radial-menu-wrapper {
  background-color: #525c6f;
  box-shadow: 1px 1px 5px 1px #00000080;
  transform: scale(1.2, 1.2) translateY(-40%);
  z-index: 2;
}
.vue-radial-menu-wrapper:hover {
  background-color: #525c6f;
}
.selected-item {
  display: flex;
  align-items: center;
}
.left-row {
  margin-right: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}
.upper-row {
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: center;
  margin: 15px 0;
}
.slider-title {
  text-align: left;
  white-space: nowrap;
}
.slider-row {
  width: 100%;
  position: relative;

  .lock-holder {
    position: absolute;
    right: -22px;
    top: 17px;
    opacity: 0.7;

    i {
      color: $accent-color;
    }
    i.fa-lock-open {
      padding-left: 6px;
    }

    p {
      position: absolute;
      left: 8px;
      margin: 29px 0;
    }
    p:first-child {
      top: 0;
    }
    p:last-child {
      bottom: 0;
    }
  }
}
table {
  width: 100%;
  min-width: 500px;
}
td {
  padding: 5px 0;
  vertical-align: center;
}
.range-slider {
  width: 90%;
}
.joysticks {
  position: relative;
  display: inline-flex;
  justify-content: space-evenly;
  width: 100%;
  margin-bottom: 20px;
}
.active {
  border-left: 5px solid $primary-color;
}
.delete-icon {
  color: $accent-color;
  margin-left: auto;
  font-size: 20px;
}
.delete-icon:hover {
  color: $primary-color;
}
.light-type-selector {
  position: absolute;
  top: 0;
  left: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
}
.joystick {
  position: relative;
  padding-top: 10px;
}
.lock-buttons {
  display: flex;
  justify-content: space-evenly;

  div {
    padding: 5px 5px;
  }

  p {
    margin: 5px 0;
    opacity: 0.3;

  }

  i {
    font-size: 19px;
    padding: 0 5px;
    color: $accent-color;
    opacity: 0.3;
  }
}
.lock-buttons div:hover {
  background-color: #ffffff2e;
  border-radius: 5px;
  cursor: pointer;
}
.lock-buttons > div.locked {
  > * {
    opacity: 1;
  }
  i {
    color: $primary-color;
    opacity: 1;
  }
}
.inline {
  display: flex;
  align-items: baseline;
}
.distance-control {
  p {
    margin: 0;
    margin-bottom: 10px;
    opacity: 0.5;
  }
}
.object-group {
  width: 90%;
  max-width: 1200px;
}
@media only screen and (max-height: 1200px) {
  .content-wrapper {
    margin-top: -50px;
  }
}
.reset-all {
  color: $accent-color;
}
.reset-all:hover {
  color: $primary-color;
}
.element-grid-wrapper {
  position: absolute;
  top: 40px;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;
  display: flex;
  justify-content: center;
}
.lightcard-image {
  height: fit-content;
  width: fit-content;
  overflow: hidden;
  border-radius: 20px;
}
.lightcard-image-wrapper {
  position: relative;
  cursor: pointer;
  margin-bottom: 20px;

  img {
    mix-blend-mode: multiply;
  }
  i {
    position: absolute;
    right: 0;
    bottom: 0;
    color: $accent-color;
    font-size: 20px;
    border-radius: 8px;
    padding-right: 6px;
    padding-left: 12px;
    padding-top: 9px;
    margin-bottom: 4px;
  }
  i:hover {
    color: $accent-color;
  }
}
.hidden {
  opacity: 0;
  transition: opacity 0.295s;
  pointer-events: none;
}
.lightcard-info {
  padding: 8px 15px;
  background-color: rgba(0,0,0,0.3);
  border-radius: 10px;
  box-shadow: inset 0px 0px 4px 2px rgba(0,0,0,0.2);
  
  p {
    text-align: left;
    width: fit-content;
    margin: 0;
    padding: 5px 10px;
    border-radius: 3px;
  }
}
</style>

<style lang="scss">
@import "@/styles/common.scss";
.element-grid-wrapper {
  @include grid(256px, 128px);
}
</style>