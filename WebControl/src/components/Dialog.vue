<template>
 <transition name="fade">
  <div ref="mask" class="modal-mask" v-hammer:tap="onBackgroundClick">
    <div ref="wrapper" class="modal-wrapper">
      <div class="modal-card">
        <div class="header-row">
          <p class="modal-title">{{title}}</p>
          <hr>
        </div>
        <div>
          <slot>
          </slot>
        </div>
        <div class="button-row">
          <p class="button delete" v-hammer:tap="() => close(true)">Ok</p>
          <p class="button" v-hammer:tap="cancel">Cancel</p>
        </div>
      </div>
    </div>
  </div>
</transition>
</template>

<script>
export default {
  name: "Modal",
  props: {
    title: {
      type: String,
      default: "You should name this modal."
    }
  },
  methods: {
    onBackgroundClick(e) {
      if (e.target === this.$refs.mask || e.target === this.$refs.wrapper) {
        this.cancel();
      }
    },
    cancel() {
      this.$emit("close");
    },
    close(value) {
      this.$emit("close", value);
    },
    onDocumentKeyUp(e) {
      if (e.key === "Enter") {
        this.close(true);
      } else if (e.key === "Escape") {
        this.cancel();
      }
    },
  },
  mounted() {
    document.addEventListener("keyup", this.onDocumentKeyUp);
  },
  beforeDestroy() {
    document.removeEventListener("keyup", this.onDocumentKeyUp);
  },
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
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
  background-color: $card-background-color;
  box-shadow: 0px 0px 10px 2px black;
  padding: 15px;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
}
hr {
  width: 100%;
  border: 1px solid #515e74;
}
.modal-title {
  text-align: left;
  margin: 0;
  margin-bottom: 10px;
  font-size: large;
  color: $primary-color;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
}
.button-row {
  margin-left: auto;
  display: flex;

  > p {
    margin-left: 10px;
  }

  .delete {
    border-color: $primary-color !important;
    color: $primary-color !important;
  }
}
</style>