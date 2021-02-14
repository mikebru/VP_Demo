<template>
  <Navbar
    :vertical="true"
    id="light-page-nav"
    :items="navItems"
  >
  </Navbar>
</template>

<script>
import TrackingMarkerSubpage from "@/pages/TrackingMarkerSubpage.vue";
import Navbar from "@/components/Navbar.vue";

export default {
  name: "GreenScreenPage",
  data() {
    return {
      navItems: [{name: "Tracking Markers", iconName:"fa-plus-square", component: TrackingMarkerSubpage}],
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
