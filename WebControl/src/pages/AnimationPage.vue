<template>
  <Navbar
    :items="items"
    :vertical="true"
  >
  </Navbar>
</template>

<script>
import AnimationSubpage from "@/pages/AnimationSubpage.vue";
import EventsSubpage from "@/pages/EventsSubpage.vue";
import Navbar from "@/components/Navbar.vue";

export default {
  name: "AnimationPage",
  data() {
    return {
      items: [
        {name:"Animations", iconName:"fa-play-circle", component: AnimationSubpage},
        {name:"Events", iconName:"fa-exclamation", component: EventsSubpage}
      ]
    }
  },
  components: {
    Navbar
  }
}
</script>

<style scoped lang="scss">

</style>