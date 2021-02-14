<template>
  <div class="object-group">
    <div class="group-header">
        <div class="group-header-top">
          <div class="title-wrapper">
            <CustomInput class="textbox" ref="titleInput" v-if="renaming" :value="titleText" @change="onTitleTextChange" placeholder="Enter a name"/>
            <p v-else class="object-group-title" v-hammer:tap="onClickRename">{{name}}</p>
            <i v-if="renamable && !renaming" class="fas fa-edit" v-hammer:tap="onClickRename"></i>
            <i v-if="renaming" id="submit-rename" class="fas fa-check" v-hammer:tap="submitRename"></i>
            <i v-if="renaming" class="fas fa-times" v-hammer:tap="cancelRename"></i>
          </div>
          <div>
            <i :class="{ open: showDropdown, hidden: !supportObjectPath || !config.developerMode }" v-hammer:tap="onTargetClick" class="fas fa-cog">
            </i>
            <slot name="headerExtensions"></slot>
          </div>
        </div>
        <div class="tab-holder" v-if="activeTab">
          <p
            v-for="tab in tabTitles"
            :key="tab"
            :class="{active: activeTab === tab}"
            v-hammer:tap="() => activeTab = tab"
          >
            {{tab}}
          </p>
        </div>
    </div>
    <div class="object-group-content-wrapper" :class="{tabbed: !!activeTab, showingExtra: showingExtraContent}">
      <div class="overlay-wrapper" v-if="!enabled || (pathError && checkForPathError)">
        <div class="object-group-overlay"><p v-show="supportObjectPath">{{overlayText}}</p></div>
      </div>
      <div class="object-group-content" :class="{faded: !enabled || (pathError && checkForPathError)}">
        <div class="inner-content">
          <slot :objectPath="objectPath"></slot>
          <div
            v-for="(title, propName) in tabTitles"
            :key="title"
            v-show="activeTab === title"
          >
            <slot
              :objectPath="objectPath"
              :name="propName"
            >
            </slot>
          </div>
        </div>
        <hr v-if="showingExtraContent">
        <div class="extra-content-wrapper" :class="{open: showingExtraContent}">
          <slot name="extraContent" v-if="showingExtraContent">
            <!-- This div is used to detect the presence of an extra content slot -->
            <div></div>
          </slot>
        </div>
      </div>
    </div>
    <div class="expander" v-if="!!this.$slots.extraContent" v-hammer:tap="onExtraClick">
      <i :class="[showingExtraContent ? 'fa-angle-double-up' : 'fa-angle-double-down', 'fas']"></i>
    </div>
    <transition name="fade">
      <Modal v-if="showDropdown" @close="onModalClose" :initialObjectPath="objectPath" :computedObjectPath="computedObjectPath">
      </Modal>
    </transition>
  </div>
</template>

<script>
import config from "@/config.js";
import Modal from "@/components/Modal.vue";
import UnrealService from "@/UnrealService.js";
import CustomInput from "@/components/CustomInput.vue";
import { mixin as clickaway } from "vue-clickaway";

export default {
  name: "ObjectGroup",
  mixins: [clickaway],
  props: {
    name: String,
    enabled: {
      type: Boolean,
      default: true
    },
    tabTitles: {
      type: Object,
      default: null
    },
    fitContent: {
      type: Boolean,
      default: true
    },
    initialPath: {
      type: String,
      default: ""
    },
    checkForPathError: {
      type: [String, Boolean],
      default: true
    },
    supportObjectPath: {
      type: [String, Boolean],
      default: true
    },
    renamable: {
      type: [String, Boolean],
      default: false
    }
  },
  created() {
    document.addEventListener("keyup", this.onKeyUp);

    if (this.tabTitles !== null) {
      this.activeTab = this.tabTitles[Object.keys(this.tabTitles)[0]];
    }

    this.objectPath = window.localStorage[this.computedObjectPath] || config[this.computedObjectPath] || this.initialPath;
  },
  beforeDestroy() {
    document.removeEventListener("keyup", this.onKeyUp);
  },
  data: function () {
    return {
      config,
      showDropdown: false,
      showingExtraContent: false,
      objectPath: "",
      activeTab: null,
      basePath: this.computeBasePath(),
      overlayText: "",
      titleText: this.name,
      pathError: false,
      renaming: false
    }
  },
  computed: {
    computedObjectPath() {
      return this.basePath + this.name;
    }
  },
  methods: {
    setObjectPath(newPath) {
      this.objectPath = newPath;
      if (this.supportObjectPath) {
        this.validateObjectPath().then(valid => {
          this.pathError = !valid;
          if (valid) {
            if (newPath !== config[this.computedObjectPath]) {
              window.localStorage[this.computedObjectPath] = newPath;
            }
          }
        });
      }
    },
    onTargetClick () {
      this.showDropdown = !this.showDropdown;
    },
    onExtraClick () {
      this.showingExtraContent = !this.showingExtraContent;
      this.$emit("resize");
    },
    onModalClose(path) {
      if (path) {
        // Don't retry on requests for an old path.
        UnrealService.abortRequests();
        this.setObjectPath(path);
        this.$emit("path:change", path);
      }
      this.showDropdown = false;
    },
    validateObjectPath() {
      return new Promise( async resolve => {
        if (!this.objectPath) {
          this.overlayText = "Object path is empty.";
          resolve(false);
        } else {
          try {
            const {ReturnValue: valid} = await UnrealService.callFunction("/Script/Engine.Default__KismetSystemLibrary", "IsValid", {
              Object: this.objectPath
            });
            if (!valid) {
              this.overlayText = `Path: ${this.objectPath} is invalid.`;
              resolve(false);
            } else {
              resolve(true);
            }
          } catch(e) {
            this.overlayText = `Path: ${this.objectPath} is invalid.`;
            resolve(false);
          }
        }
      });
    },
    onTitleTextChange(value) {
      this.titleText = value;
      this.$emit("title:change", value);
    },
    onKeyUp(e) {
      if (e.key === "Enter") {
        this.submitRename();
      } else if (e.key === "Escape") {
        this.cancelRename();
      }
    },
    onClickRename() {
      if (!this.renamable) return;
      this.renaming = true;
      this.titleText = this.name;
      document.addEventListener("touchstart", this.onInputClickAway);

      this.$nextTick(() => {
        const input = this.$refs.titleInput;
        input.focus();
        input.setSelectionRange(0, input.value.length);
      });
    },
    onInputClickAway(e) {
      if (!["P", "INPUT", "I"].includes(e.target.nodeName)) {
        if (this.$refs.titleInput) {
          this.$refs.titleInput.blur();
          this.renaming = false;
          document.removeEventListener("touchstart", this.onInputClickAway);
        }
      } else if (e.target.id === "submit-rename") {
        this.submitRename();
      }
    },
    submitRename() {
      if (!this.renaming) return;
      let input = this.$refs.titleInput;
      this.$emit("title:submit", input.currentValue);
      this.$refs.titleInput.blur();
      this.renaming = false;
      document.removeEventListener("touchstart", this.onInputClickAway);
    },
    cancelRename() {
      if (!this.renaming) return;
      this.$refs.titleInput.blur();
      this.renaming = false;
      document.removeEventListener("touchstart", this.onInputClickAway);
    }
  },
  mounted() {
    if (this.supportObjectPath) {
      this.validateObjectPath().then(res => this.pathError = !res);
    }
  },
  components: {
    Modal,
    CustomInput
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
$border-radius: 7px;

.object-group {
  display: flex;
  margin: 1px;
  flex-direction: column;
  position: relative;
  background-color: $card-background-color;
  border-radius: $border-radius;
  box-shadow: 0px 3px 10px 0px rgba(0,0,0,0.75);
}
.group-header {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.group-header-top {
  @include group-header();
}
.inner-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  height: 100%;
  width: 100%;
}
.object-group-content-wrapper {
  position: relative;
  padding: 10px 20px;
  margin-top: auto;
  margin-bottom: auto;
}
.object-group-content-wrapper.showingExtra { 
  padding-bottom: 30px;
}
.object-group-content-wrapper.tabbed {
  box-shadow: 0px -6px 10px 0px #0000003d;
}
.object-group-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.object-group-title {
  color: $primary-color;
  font-size: 18px;
  overflow: hidden;
  word-wrap: break-word;
}
i {
  padding: 10px;
  color: $accent-color;
  opacity: 0.7;
}
i:hover {
  cursor: pointer;
  opacity: 1;
  color: $primary-color;
}
.overlay-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 2;

}
.object-group-overlay {
  background-color: #515151d3;
  border-radius: 7px;
  background-image: repeating-linear-gradient(135deg, transparent, transparent 35px, #00000060 35px, #0000005f 50px);
  font-size: 20px;
  user-select: text;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-left: auto;
  margin-right: auto;

  p {
    word-break: break-all;
    background-color: #000000aa;
    padding: 10px;
    border-radius: 5px;
    margin: 10px;
    font-size: normal;
    font-size: initial;
    user-select: text;
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
}
.tab-holder {
  display: flex;
  background-color: #00000029;;
  z-index: 2;
  $card-border-radius: 15px;

  p {
    margin: 0;
    padding: 10px 20px;
    border-top-left-radius: $card-border-radius;
    border-top-right-radius: $card-border-radius;

    background-color: #ffffff0d;
  }
  p:hover {
    cursor: pointer;
    background-color: #ffffff1c;
    box-shadow: 0px -6px 10px 0px #0000003d;
  }
  p.active {
    background-color: $card-background-color;
    box-shadow: 0px -6px 10px 0px #0000003d;
  }
}
.hidden {
  visibility: hidden;
}
.expander {
  background-color: #ffffff21;
  border-bottom-left-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
  width: 100%;
  position: absolute;
  bottom: 0;

  i {
    color: #ffffff70;
    padding: 5px;
  }
}
.expander:hover {
  cursor: pointer;
  background-color: #ffffff70;
}
hr {
  width: 100%;
  border-color: #ffffff63;
}
.title-wrapper {
  display: flex;
  align-items: baseline;

  i {
    color: $accent-color;
    opacity: 0.7;
  }

  i.fa-edit {
    margin-left: 10px;
  }
}
.faded {
  opacity: 0.5;
}
.extra-content-wrapper {
  max-height: 0;
  opacity: 0;
}
.extra-content-wrapper.open {
  max-height: 2000px;
  opacity: 1;
  transition: max-height 2s ease-out, opacity 0.7s ease-out;
}

</style>
