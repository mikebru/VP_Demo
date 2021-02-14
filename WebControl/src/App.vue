<template>
  <div id="app">
    <Navbar :items="navItems">
      <template v-slot:header>
        <div class="logo-item">
          <img class="unreal-logo" src="./assets/unreal-logo.png">
        </div>
      </template>
    </Navbar>
  </div>
</template>

<script>
import ColorCorrectionPage from "@/pages/ColorCorrectionPage.vue";
import LightsPage from "@/pages/LightsPage.vue";
import StageOffsetPage from "@/pages/StageOffsetPage.vue";
import GreenScreenPage from "@/pages/GreenScreenPage.vue";
import AnimationPage from "@/pages/AnimationPage.vue";
import UtilitiesPage from "@/pages/UtilitiesPage.vue";
import Navbar from "@/components/Navbar.vue";

export default {
  name: "App",
  data: function () {
    return {
      navItems: [
        {name:"Stage", iconName:"fa-arrows-alt", component: StageOffsetPage},
        {name:"Lighting", iconName:"fa-lightbulb", component: LightsPage},
        {name:"Screen", iconName:"fa-plus-square", component: GreenScreenPage},
        {name:"Animation", iconName:"fa-play-circle", component: AnimationPage},
        {name:"Color Correction", iconName:"fa-palette", component: ColorCorrectionPage},
        {name:"Utilities", iconName:"fa-tools", component: UtilitiesPage}
      ]
    }
  },
  components: {
    Navbar
  }
}
</script>
<style scoped lang="scss">

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a {
  text-decoration:none !important;
}
i.fa-lightbulb {
  margin-left: 3px;
}
#logo-link {
  padding-top: 3px;
  p {
    display: none;
  }
}
.logo-item {
  display: inline-flex;
  align-items: center;
  font-size: 19px;
}
.logo-item img {
  padding: 0;
}
.unreal-logo {
  margin: 5px;
  width: 40px;
  height: 40px;
}
@media only screen and (min-width: 680px) {
  .unreal-logo {
    margin-top: 0;
    margin-left: 0;
    margin-right: 10px;
  }
}
</style>

<style lang="scss">
html, body {
  height: 100vh;
  max-width: 100%;
  overflow: hidden !important;
  background-color: $background-color;
  overscroll-behavior: none;
}
body {
  margin: 0;
  padding: 0;
}
* {
  color: $accent-color;
  user-select: none;
}
*, *:before, *:after {
  box-sizing: border-box;
}
a, a:visited {
  outline:none;
  color: $accent-color;
  text-decoration:none !important;
}
a:hover {
  text-decoration:none;
}
input, textarea {
  background-color: red;
}
ul {
  list-style-type: none;
}
::-webkit-scrollbar-track {
  background-color: rgba(255,255,255, 0.2);
  border-radius: 8px;
}
::-webkit-scrollbar {
  -webkit-appearance: none;
}
::-webkit-scrollbar:vertical {
  width: 12px;
}
::-webkit-scrollbar:horizontal {
  height: 12px;
}
::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #d67358bf;
}
</style>
