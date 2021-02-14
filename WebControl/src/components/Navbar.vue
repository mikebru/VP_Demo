<template>
<div class="nav-wrapper" :class="{vertical: vertical}">
  <nav>
    <div class="nav-items">
      <div v-hammer:tap="() => makeActive(items[0])" class="header-wrapper" v-if="!vertical">
        <slot name="header" ></slot>
      </div>
      <div class="generated">
        <a
          href="#"
          v-for="item in items"
          :key="item.name"
          v-hammer:tap="() => makeActive(item)"
          :class="active === item ? 'active' : ''"
        >
          <i
            class="fas"
            :class="item.iconName"
          />
          <p v-if="!vertical">{{item.name}}</p>
        </a>
      </div>
    </div>
  </nav>
  <div class="content">
    <component v-bind:is="active ? active.component : null" ></component>
  </div>
</div>
</template>

<script>
import UnrealService from "@/UnrealService.js";
import cache from "@/cache.js";

export default {
  name: "Navbar",
  props: {
    items: Array,
    vertical: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    makeActive(page) {
      cache[this.computeBasePath() + this.$options.name] = page.name;
      UnrealService.abortRequests();
      this.active = page;
    }
  },
  data() {
    return {
      active: this.items ? this.items.find(item => item.name === cache[this.computeBasePath() + this.$options.name]) || this.items[0] : null,
    }
  },
  computed: {
    showHeader() {
      return true;
    }
  }
}
</script>

<style scoped lang="scss">
.nav-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.header-wrapper {
  flex-shrink: 0 !important;

  p {
    display: none;
  }
}
.header-wrapper:hover {
  cursor: pointer;
}
.content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
a, a:visited {
  outline:none;
  color: $accent-color;
}
a:hover{
  text-decoration:none;
}
a {
  text-decoration:none !important;
}
nav {
  display: flex;
  background-color: #242731;
  padding-left: 10px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  width: 100%;
  flex-shrink: 0;
  color: $accent-color;
}

.nav-items {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}
.nav-items a {
  display: inline-flex;
  align-items: center;
  padding: 7px 7px;
  height: 100%;
  padding-left: 15px;
  padding-right: 25px;
  font-size: 19px;
}
.nav-items a:last-child {
  padding-right: 30px;
}
.nav-items a p {
  display: none;
}
.generated {
  height: 100%;
  display: flex;
  align-items: center;
}
a i {
  font-size: x-large;
  padding: 5px;
}
.active {
  background-color: $background-color;
}
@media only screen and (min-width: 750px) {
  .header-wrapper {
    p {
      display: initial;
    }
  }
  p {
    display: initial;
  }
  .nav-items a {
    padding-left: 15px;
    padding-right: 25px;
  }
}
@media only screen and (min-width: 1100px) {
  .nav-items a p {
    display: initial;
    white-space: nowrap;
    margin-left: 5px;
  }
}
// Handle vertical scrollbar
.nav-wrapper.vertical {
  flex-direction: row;
  nav {
    height: 100%;
    width: min-content;
    flex-direction: column;
    padding-left: 0px;
  }
  .nav-items {
    display: flex;
    flex-direction: column;
  }
  .nav-items a {
    display: flex;
    height: min-content;
    justify-content: center;
    border-left: 7px solid transparent;
    padding: 12px 10px;

    i {
      font-size: x-large;
    }
  }
  .nav-items .active {
    border-left: 7px solid $primary-color;
  }
  .content {
    width: 100%;
  }
  .generated {
    height: initial;
    display: initial;
  }
}
</style>