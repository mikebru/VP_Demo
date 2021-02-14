<template>
  <Navbar
    :vertical="true"
    id="light-page-nav"
    :items="navItems"
  >
  </Navbar>
</template>

<script>
import LightCaptureSubpage from "@/pages/LightCaptureSubpage.vue";
import StageOffsetSubpage from "@/pages/StageOffsetSubpage.vue";
import Navbar from "@/components/Navbar.vue";

export default {
  name: "StagePage",
  data() {
    return {
      navItems: [{name: "Stage Position", iconName:"fa-arrows-alt", component: StageOffsetSubpage}, {name: "Lighting Capture Position", iconName:"fa-crosshairs", component: LightCaptureSubpage}],
    }
  },
  components: {
    Navbar
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#light-page-nav {
  width: 100%;
  height: 100%;
}
</style>
