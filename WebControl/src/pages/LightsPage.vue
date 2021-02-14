<template>
  <Navbar
    :vertical="true"
    id="light-page-nav"
    :items="navItems"
  >
  </Navbar>
</template>

<script>
import LightCardsSubpage from "@/pages/LightCardsSubpage.vue";
import Navbar from "@/components/Navbar.vue";

export default {
  name: "LightsPage",
  data() {
    return {
      navItems: [
        {name:"Light Cards", iconName: "fa-lightbulb", component: LightCardsSubpage},
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
#light-page-nav {
  width: 100%;
  height: 100%;
}
</style>
