<template>
<div ref="mask" class="modal-mask" :class="{scrollable: inputFocused}" @dblclick="onBackgroundClick">
  <div ref="wrapper" class="modal-wrapper">
    <div class="modal-card">
      <div class="header-row">
        <p class="modal-title">Pick a target</p>
        <i class="fas fa-undo" title="Reset local storage." v-hammer:tap="resetPath"></i>
      </div>
      <hr>
      <div class="modal-content scrollable">
        <CustomInput
          ref="filter"
          class="filter"
          v-model="searchValue"
          @change="searchValue = $event"
          placeholder="Filter by name or path"
        />
        <ul class="object-list scrollable">
          <li
            class="scrollable"
            v-for="object in objectsToDisplay"
            :key="object.path"
            :class="{selected: selectedItem === object}"
            @click="() => selectedItem = object"
            v-on:dblclick="close"
          >
            <p v-html="object.generatedName" class="scrollable"></p>
          </li>
        </ul>
      </div>
      <div class="modal-footer">
        <p>Path:</p>
        <CustomInput
          ref="selectedPath"
          v-model="selectedItem.path"
          @change="selectedItem.path = $event"
          class="object-path"
          placeholder='Select or enter an object path.'/>
        <i class="far fa-check-circle" v-hammer:tap="close"></i>
        <i class="far fa-times-circle" v-hammer:tap="cancel"></i>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import config from "@/config.js";
import cache from "@/cache.js";
import CustomInput from "@/components/CustomInput.vue";

export default {
  name: "Modal",
  props: {
    initialObjectPath: {
      type: String,
      default: ""
    },
    classFilter: {
      type: String,
      default: ""
    },
    computedObjectPath: {
      type: String
    }
  },
  data() {
    return {
      searchValue: "",
      selectedItem: { path: this.initialObjectPath },
      objects: [],
      objectsToDisplay: [],
      inputFocused: false
    }
  },
  created() {
    this.fetchObjects();
    if (this.initialObjectPath) {
      const selectedObject = this.objects.find(obj => obj.path === this.initialObjectPath);
      if (selectedObject) {
        this.selectedItem = selectedObject;
      }
    }
    this.$options.interval = setInterval(this.fetchObjects, 300);
  },
  methods: {
    fetchObjects() {
      if (!cache || !cache.levelActors) return;

      const levelActors = cache.levelActors;
      if (levelActors.length != this.objects.length)
      {
        for (let i = this.objects.length - 1; i >= 0; i--) {
          if (!levelActors.find(actor => actor.path == this.objects[i].path))
          {
            this.objects.splice(i, 1);
          }
        }
      }
      
      // Keep the old selection even after updating.
      const oldSelectionIndex = this.objects.indexOf(this.selectedItem);

      levelActors.forEach(levelActor => {
        const existingObject = this.objects.find(obj => obj.path === levelActor.path);

        if (existingObject) {
          const updatedObject = Object.assign({}, existingObject);
          if (existingObject.name !== levelActor.displayName || existingObject.className !== levelActor.classDisplayName) {
            updatedObject.name = levelActor.displayName;
            updatedObject.className = levelActor.classDisplayName;

            // Force update the object
            const actorIndex = this.objects.indexOf(existingObject);
            this.$set(this.objects, actorIndex, updatedObject);
            this.$forceUpdate();
            if (oldSelectionIndex >= 0) {
              this.selectedItem = this.objects[oldSelectionIndex];
            }
          }
        } else {
          this.objects.push({
            name: levelActor.displayName,
            path: levelActor.path,
            className: levelActor.classDisplayName,
            generatedName: ""
          });        
        }
      });

    },
    onFocus() {
      this.inputFocused = true;
      let inputRef = this.$refs.selectedPath;
      inputRef.setSelectionRange(inputRef.value.length, inputRef.value.length);
      window.scrollTo(0, document.body.scrollHeight);
    },
    onBackgroundClick(e) {
      if (e.target === this.$refs.mask || e.target === this.$refs.wrapper) {
        this.cancel();
      }
    },
    cancel() {
      this.$emit("close");
    },
    close() {
      this.$emit("close", this.$refs.selectedPath.value);
    },
    onDocumentKeyUp(e) {
      e.preventDefault();
      if (document.activeElement.tagName === "INPUT") {
        if (e.key === "Enter") {
          if (document.activeElement === this.$refs.selectedPath) {
            this.close();
          }
        } else if (e.key === "Escape") {
          document.activeElement.blur();
        }
      } else {
        if (e.key === "Enter") {
          this.close();
        } else if (e.key === "Escape") {
          this.cancel();
        }
      }
    },
    filter() {
      // Todo: Make highlight work with lower or upper case match
      const lowerCaseSearch = this.searchValue.toLowerCase();
      this.objectsToDisplay = this.objects.filter(item => item.name.toLowerCase().includes(lowerCaseSearch) || item.className.toLowerCase().includes(lowerCaseSearch));
      this.objectsToDisplay.forEach(item => {
        const highlight = name => name.replace(this.searchValue, `<span style='background-color: #8c2222;'>${this.searchValue}</span>`);
        let classNameHtml = `<span style='color: #878787;'> (${highlight(item.className)})</span>`;
        item.generatedName = highlight(item.name) + classNameHtml;
      });
    },
    resetPath() {
      window.localStorage.removeItem(this.computedObjectPath);
      this.selectedItem.path = config[this.computedObjectPath];
    }
  },
  mounted() {
    document.addEventListener("keyup", this.onDocumentKeyUp);

    this.$refs.selectedPath.value = this.initialObjectPath;
    if (window.ontouchstart === null && navigator.maxTouchPoints === 1) {
      this.$nextTick(() => {
        //this.$refs.filter.focus();
      });
    }

    this.objectsToDisplay = this.objects;
  },
  beforeDestroy() {
    document.removeEventListener("keyup", this.onDocumentKeyUp);
    clearInterval(this.$options.interval);
  },
  watch: {
    searchValue() {
      this.filter();
    },
    objects() {
      this.filter();
    }
  },
  components: {
    CustomInput
  }
}
</script>

<style scoped lang="scss">
$table-height: 400px;
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: #00000096;
  width: 100%;
  height: 100%;

  * {
    z-index: 11;
  }
}
.modal-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media screen only and (min-width: 1800px) {
  .modal-wrapper {
    height: 70%;
  }
}
.modal-card {
  width: 70%;
  max-width: 700px;
  height: 600px;
  background-color: $card-background-color;
  box-shadow: 0px 0px 10px 2px black;
  padding: 15px;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}
hr {
  width: 100%;
  border: 1px solid #515e74;
}
.modal-title {
  text-align: left;
  margin: 0;
  margin-bottom: 5px;
  font-size: large;
  color: $primary-color;
}
.modal-content {
  min-height: 400px;
}
.modal-footer {
  display: inline-flex;
  align-items: center;
  opacity: 0.8;

  p {
    margin: 0;
    margin-right: 10px;
  }

  i {
    font-size: 28px;
    margin: 0;
    margin-left: 10px;
    color: #2fc73d;
  }
  i:hover {
    cursor: pointer;
  }
  .fa-times-circle {
    color: #5b6982;
  }
}
input.filter {
  margin-top: 4px;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
}
table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.object-list {
  position: relative;
  margin-top: 15px;
  max-height: $table-height;
  border-radius: 5px;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #00000017;
  box-shadow: inset 0px 0px 30px 0px rgba(0, 0, 0, 0.29);
  padding-left: 0;

  li {
    border: 2px solid transparent;
  }

  p {
    margin: 0;
    padding: 10px 0;
  }
}
td {
  text-align: left;
}
thead tr {
  th {
    padding-top: 7px;
    padding-bottom: 7px;
    border-bottom: 1px solid grey;
    font-size: normal;
    font-weight: 500;
  }
}
tbody {
  height: 100%;
  td {
    padding: 10px;
  }

  td:nth-child(2) {
    overflow: hidden;
    white-space: nowrap;
    width: 50%;
  }

  tr:hover {
    background-color: #536589;
  }
}
.overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-shadow: inset 1px -200px 74px -155px rgba(0,0,0,0.75);
}
span.highlighted {
  font-family: 'Roboto', sans-serif;
  font-weight: 300;
  font-size: 1.5em;
  background: linear-gradient(to bottom, red 5%, #4db6ac 5%, #4db6ac 95%, red 95%) !important;
  line-height: 2em;
}
.expander {
  height: 100%;
}
input.object-path {
  width: 100%;
}
.selected {
  border: 2px solid #c56f3f !important;
}
i.fa-undo {
  opacity: 0.7;
  padding: 7px;
  border-radius: 10px;
}
i.fa-undo:hover {
  opacity: 1;
  background-color: #00000059;
}
i.fa-undo:active {
  color: $primary-color;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>