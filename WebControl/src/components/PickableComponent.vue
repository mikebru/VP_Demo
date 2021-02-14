<template>
<div class="pickable-wrapper">
  <MultiSelect
    class="vue-select"
    v-model="selected"
    :options="options"
    :placeholder="`Pick an asset (${assetClassName})`"
    track-by="objectPath"
    label="displayName"
    ref="multiSelect"
    @select="onSelect"
    :custom-label="customLabel"
  >
  <template slot="singleLabel" slot-scope="props">
    {{props.option.displayName}}
  </template>
  <template slot="option" slot-scope="props">
    <div class="option-row">
      <p class="display-name">{{props.option.displayName}}<p>
      <p class="object-path">{{props.option.objectPath}}</p>
    </div>
  </template>
  </MultiSelect>
  <i class="fas fa-edit" v-hammer:tap="onToggle"></i>
</div>
</template>

<script>
import MultiSelect from "vue-multiselect";
import UnrealService from "@/UnrealService.js";
export default {
  name: "Test",
  props: {
    initialItem: {
      type: String,
      default: ""
    },
    assetClassName: {
      type: String,
      default: "No asset class provided"
    },
    assetClassPath: {
      type: String,
      default: "No class path"
    }
  },
  data() {
    return {
      selected: null,
      options: []
    }
  },
  async created() {
    // Fetch options;
    let response = await UnrealService.callFunction("/Script/RemoteControlComponents.Default__RemoteControlComponentsBlueprintLibrary", "GetObjectsOfClass", { ObjectClass: this.assetClassPath }, 0, /*sync=*/false, /*generateTransaction=*/false);
    if(response) {
      let objects = response.ReturnValue;
      objects.forEach(object => {
        this.options.push( { objectPath: object.ObjectPath, displayName: object.DisplayName } );
      });
    }
  },
  methods: {
    customLabel ({ displayName, objectPath }) {
      return `${displayName} – ${objectPath}`
    },
    onToggle() {
      this.$refs.multiSelect.toggle();
    },
    onSelect(item) {
      this.$emit("input", item);
    }
  },
  components: {
    MultiSelect
  }
}
</script>

<style scoped lang="scss">
.pickable-wrapper {
  background-color: rgba(black, 0.5);
  border-radius: 5px;
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;

  > i {
    align-self: flex-start;
    margin: 0 0 0 8px;
  }
}
.object-path {
  opacity: 0.7;
}
.option-row {
  display: flex;
  justify-content: space-between;

  p {
    margin: 0;
    justify-self: flex-end;
  }

  p:last-child {
    margin-left: 20px;
  }
}
</style>

<style lang="scss">
.vue-select {
  font-size: 15px;
  .multiselect__content-wrapper {
    overflow-y: auto;
  }
  .multiselect__option--highlight {
    background-color: #bb4525;
  }
  ul {
    -webkit-padding-start: 0px;
    margin: 0;
  }
  li {
    background-color: #ffffff0f;
    width: 100%;
    text-align: left;
  }
  .multiselect__content {
    width: 100%;
  }
  .multiselect__element {
    height: 100% !important;
    width: 100% !important;

    span {
      padding: 10px 10px;
      display: inline-block;
      height: 100% !important;
      width: 100% !important;
    }
  }
  input, textarea {
    padding-top: 10px;
    padding-bottom: 10px;
    padding: 8px 0px 8px 5px;
    background-color: #00000040;
    border: transparent;
    color: $accent-color;
    caret-color: $accent-color;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    user-select: text;
    min-height: fit-content;
    margin: 0;
  }
  input:focus {
    background-color: #ffffff0f;
  }
  textarea:focus, input:focus{
    outline: none;
  }
  ::placeholder {
    color: $accent-color;
    opacity: 0.5;
  }
  /* Hide HTML5 Up and Down arrows. */
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
}
</style>