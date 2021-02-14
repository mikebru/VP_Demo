<template>
  <Navbar
    id="color-correction-nav"
    :items="navItems"
    :vertical="true"
  >
  </Navbar>
</template>

<script>
import PostProcessControl from "@/pages/PostProcessControlSubpage.vue"
import Navbar from "@/components/Navbar.vue";

export default {
  name: "ColorCorrectionPage",
  data() {
    return {
      navItems: [
        {name:'Light temperature', iconName:'fa-thermometer-three-quarters', component: PostProcessControl},
      ]
    }
  },
  components: {
    Navbar
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#color-correction-nav {
  width: 100%;
  height: 100%;
}
</style>
