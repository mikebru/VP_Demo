<template>
<div id="event-page-content">
  <p class="tutorial-text">This page allows calling the event manager blueprint which runs console commands.</p>
  <p class="tutorial-text">You can add your own commands to the blueprint in the level.</p>
  <div class="selector-wrapper">
    <div class="event-grid-title">
      <p>Level events</p>
    </div>
    <div class="event-selector scrollable">
      <div class="event-cards-grid">
        <div class="event-card"
          v-for="event in events"
          v-hammer:tap="() => onClick(event)"
          :key="event.name"
          :class="{glow: event == activeEvent}"
          @animationend="activeEvent = null"
        >
          <div class="event-card-content">
            <i class="fas fa-haykal"></i>
          </div>
          <div class="event-card-title"><p>{{event.name}}</p></div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import UnrealService from "@/UnrealService.js";
import config from "@/config.js";

export default {
  name: "EventsSubpage",
  async created() {
    const response = await UnrealService.getProperty(this.eventManager, "EventNameToConsoleCommand");
    const {EventNameToConsoleCommand: events} = response;
    this.events = Object.keys(events).map(val => ({name: val}));
  },
  data() {
    return {
      activeEvent: null,
      events: null,
    }
  },
  computed: {
    eventManager() {
      return window.localStorage[this.computeBasePath()] || config[this.computeBasePath()] || config.eventManager;
    }
  },
  methods: {
    onClick(e) {
      this.activeEvent = e;
      UnrealService.getProperty(this.eventManager, "EventNameToConsoleCommand");
      UnrealService.callFunction(this.eventManager, "TriggerEvent", {
        EventName: this.activeEvent.name
      });
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
.selector-wrapper {
  @include wannabe-object-group();
}
.event-grid-title {
  @include wannabe-group-header();
}
#event-page-content {
  height: 90%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 2%;
  align-items: center;
  justify-content: space-around;
}
.glow {
  animation: glow 0.15s;
}
@keyframes glow {
  0% {
  }
  50% {
    z-index: 3;
    transform: scale(0.8, 0.8);
    background-color: #6a7f9a;
  }
  100% {
  }
}
.fa-exclamation {
  margin-bottom: 20px;
}


/// -- Move this to a component
.event-selector {
  height: fit-content;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  padding-left: 20px;
  padding-right: 20px;
  border-radius: 10px;
  overflow-y: auto;
  padding-top: 30px;
  > p {
    margin-left: 20px;
    text-align: left;
    font-size: 18px;
    color: $primary-color;
  }
}
.event-cards-grid {
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
.event-card {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3951;
  height: 150px;
  width: 200px;
  transition: box-shadow 0.2s;
  flex-wrap: wrap;
  position: relative;

  > p {
    position: absolute;
    top: 0;
    left: 15px;
    color: $accent-color;
  }

  background-color: #ffffff0f;
  box-shadow: 3px 3px 7px 0px #0000007a;
}
.event-card.active {
  border: 2px solid #ffffff5e;
}
.event-card:hover {
  cursor: pointer;
}
.event-card-content {
  color: #00000054;
  font-size: 60px;
  width: 100%;

}
.event-card-title {
  position: absolute;
  width: 100%;
  color: $accent-color;
  background-color: #3f5e89b0;
  border-top: 3px solid #475c79;
  font-size: 17px;
  padding: 7px 0;
  bottom: 0;
  overflow: hidden;
  height: auto;
  max-height: fit-content;

  > p {
    margin: 0;
  }
}
.event-card:hover {
  p {
    word-wrap: break-word;
  }
}
.tutorial-text {
  margin: 0;
}
</style>