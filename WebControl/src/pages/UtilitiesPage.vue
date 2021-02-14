<template>
<ObjectGroup id="utilities-group" class="wrapper" name="Utilities" :supportObjectPath="false">
  <div class="utilities">
    <div class="row">
      <p>Server url</p>
      <CustomInput
        type="text"
        v-model="config.serverUrl"
        ref="serverUrl"
      />
    </div>
  </div>
</ObjectGroup>
</template>

<script>
import config  from "@/config.js";
import UnrealService from "@/UnrealService.js";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "UtilitiesPage",
  data() {
    return {
      config,
      overscan: 0,
      feather: 0,
      frustumVisible: false
    }
  },
  methods: {
    clearStorage() {
      window.localStorage.clear();
    },
    onOverscanChange(val) {
      UnrealService.callFunction(config.cameraSettings, "SetFrustumOverscan", {OverscanMultiplier: val}, 0, /*sync=*/false);
    },
    onFeatherChange(val) {
      UnrealService.callFunction(config.cameraSettings, "SetFrustumFeather", {FeatherPercent: val}, 0, /*sync=*/false);
    },
    onFrustumVisibilityChange(val) {
      UnrealService.callFunction(config.cameraSettings, "SetFrustumVisibility", {bVisible: val}, 0);
    },
    async poll() {
      const response = await UnrealService.callFunction(config.cameraSettings, "GetFrustumSettings", {}, 0, /*sync=*/true, /*generateTransaction=*/false);
      if (response) {
        ({Overscan: this.overscan, Feather: this.feather, Visible: this.frustumVisible} = await response);
      }
    },
    onResetPolling() {
      config.pollingDelay = 300;
      this.$forceUpdate();
    },
    onResetTimeout() {
      config.requestTimeout = 5000;
      this.$forceUpdate();
    }
  },
  components: {
    CustomInput
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
.slider {
  width: 80%;
}
p {
  flex-shrink: 0;
  margin-bottom: 0;
}
input {
  width: 100%;
  margin: 10px;
}
.utilities {
  width: 100%;
  padding: 15px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;

  > div {
    width: 50%;
    display: flex;
    align-items: baseline;
  }
}
.wrapper {
  width: 90% !important;
  display: flex;
  max-width: 1600px;
  align-items: center;
  flex-direction: column;
  margin: 20px auto;
  padding-bottom :20px;
  height: fit-content !important;
}
.page-title {
  font-size: 30px;
  color: $primary-color;
}
.server-url {
  width: 100%;
}
input {
  text-align: center;
}
.row {
  margin-top: 5px;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.extra-settings {
  width: 100%;
}
</style>

<style>
#utilities-group .object-group-content-wrapper {
  width: 100%;
}
</style>