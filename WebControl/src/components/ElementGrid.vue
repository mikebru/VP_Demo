<template>
  <div class="element-selector scrollable">
    <p v-if="title.length" class="element-grid-title scrollable">{{title}}</p>
    <div class="element-cards-grid" ref="grid">
      <div class="element-card"
        v-for="(item, i) in items"
        :key="i"
        v-hammer:tap="() => onClick(item)"
        :class="{active: item == selectedItem}"
      >
        <div class="element-card-content">
          <slot>
            <img :src="item.loadedImage" alt="">
          </slot>
        </div>
        <div v-if="displayItemTitle" class="element-card-title"><p>{{item.name}}</p></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ElementGrid",
  props: {
    title: {
      type: String,
      default: ""
    },
    items: {
      type: Array,
      default: () =>[]
    },
    inSelectedItem: {
      type: Object,
      default: () => {}
    },
    displayItemTitle: {
      type: [Boolean, String],
      default: true
    },
    displayImage: {
      type: [Boolean, String],
      default: true
    }
  },
  data() {
    return {
      selectedItem: null
    }
  },
  methods: {
    onClick(item) {
      this.selectedItem = item;
      this.$emit("click", item);
    },
    scrollToBottom() {
     // this.$refs.grid.scrollTop = this.$refs.grid.scrollHeight;
    }
  },
  watch: {
    inSelectedItem(newValue) {
      this.selectedItem = newValue;
    }
  }
}
</script>

<style scoped lang="scss">
.element-selector {
  height: fit-content;
  width: 100%;
  max-height: 80%;
  max-width: 1200px;
  background-color: #0101011c;
  padding-left: 20px;
  padding-right: 20px;
  border-radius: 10px;
  overflow-y: auto;

  > p {
    margin-left: 20px;
    text-align: left;
    font-size: 18px;
    color: $primary-color;
  }
}
.element-cards-grid {
  height: fit-content;
  width: 100%;
  display: grid;
  overflow: hidden;
  grid-template-columns: repeat(auto-fill, 200px);
  grid-template-rows: repeat(auto-fill, 150px);
  justify-content: center;
  align-content: center;
  grid-column-gap: 15px;
  grid-row-gap: 15px;
  padding-top: 20px;
  padding-bottom: 20px;
}
.element-card {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 150px;
  width: 200px;
  opacity: 0.7;
  margin: 1px;

  > p {
    position: absolute;
    top: 0;
    left: 15px;
    color: $accent-color;
  }

  background-color: #ffffff0f;
  box-shadow: 3px 3px 7px 0px #0000007a;
}
.element-card.active {
  background-color: #5d708b;
  opacity: 1.0;
}
.element-card:hover {
  cursor: pointer;
}
.element-card-content {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.element-card-title {
  width: 100%;
  color: $accent-color;
  background-color: #b75233f7;
  font-size: 17px;
  padding: 7px 0;
  padding-bottom: 9px;
  overflow: hidden;

  > p {
    margin: 0;
  }
}
.element-card:hover {
  p {
    word-wrap: break-word;
  }
}
.element-grid-title {
  margin-bottom: 0;
  margin-top: 25px;
}
.template-icon {
  color: #00000054;
  font-size: 60px;
}
</style>