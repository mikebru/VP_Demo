<template>
<div id="animation-page">
    <div>
    <p class="tutorial-text">Don't worry if Sequencer pops up in your editor! It's needed for this example.</p>
    <p class="tutorial-text">Any level sequence you add to the level will appear in this list.</p>
    </div>
    <div class="wrapper">
      <div class="sequence-grid-title">
        <p>Level sequences</p>
      </div>
      <div class="sequence-selector scrollable">
        <div class="sequence-cards-grid">
          <div class="sequence-card" v-for="sequence in sequences" :key="sequence.name" v-hammer:tap="() => onClickSequence(sequence)" :class="{active: sequence === activeSequence}" ref="sequenceCard">
            <p>{{sequence.duration}}</p>
            <div class="sequence-card-content">
              <i class="fas fa-film"></i>
            </div>
            <div class="sequence-card-title"><p>{{sequence.name}}</p></div>
          </div>
        </div>
      </div>
    </div>
    <ObjectGroup
      :name="'Animation playback' + (activeSequence ? ' - ' + activeSequence.name : '')"
      class="animation-playback"
      :enabled="!!activeSequence"
      :checkForPathError="false"
      :supportObjectPath="false"
    >
      <div class="playback-group-content">
        <RangeSlider
          class="playback-slider"
          orientation="horizontal"
          min="0"
          :max="animationLength"
          :value="currentTime"
          @input="onScrub"
          step="0.1"
          :displayValueOnClick="true"
          :displayValue="false"
          :displayReset="false"
        >
          <template v-slot:knob>
          </template>
        </RangeSlider>
        <div class="playback-buttons">
          <span v-hammer:tap="onRestart"><i class="fas fa-step-backward"></i></span>
          <span v-if="playing" v-hammer:tap="onPause"><i class="fas fa-pause"></i></span>
          <span v-else v-hammer:tap="onPlay"><i class="fas fa-play"></i></span>
          <span><i class="fas fa-step-backward" style="visibility: hidden;"></i></span>
          <span v-if="false" class="loop-button" :class="{greyed: activeSequence && !activeSequence.looping}"><i class="fas fa-sync" v-hammer:tap="onClickLoop"></i></span>
        </div>
      </div>
    </ObjectGroup>
</div>
</template>

<script>
import RangeSlider from "rangeslider";
import UnrealService from "@/UnrealService.js";

export default {
  name: "AnimationSubpage",
  data() {
    return {
      animationLength: 100,
      playing: false,
      sequences: [],
      activeSequence: null,
      currentTime: 0
    }
  },
  created() {
    this.populateList();
    this.$options.interval = setInterval(this.updateScrub, 100);
  },
  beforeDestroy() {
    clearInterval(this.$options.interval);
  },
  methods: {
    async populateList() {
      const {ReturnValue: objectPaths} = await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorLevelLibrary", "GetAllLevelActors", {}, 0, /*sync=*/false, /*generateTransaction=*/false);
      const {ReturnValue: levelSequences} = await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorFilterLibrary", "ByClass", {
        TargetArray: objectPaths,
        ObjectClass: "/Script/LevelSequence.LevelSequenceActor"
      });

      for (let path of new Set(levelSequences).values()) {
        let {ReturnValue: displayName} = await UnrealService.callFunction("/Script/Engine.Default__KismetSystemLibrary", "GetDisplayName", {
         Object: path
        }, 0, /*sync=*/false, /*generateTransaction=*/false);

        const {LevelSequence: {AssetPathName: levelSequence}} = await UnrealService.getProperty(path, "LevelSequence", 10);

        let { ReturnValue: Length } = await UnrealService.callFunction("/Script/SequencerScripting.Default__MovieSceneSequenceExtensions", "GetPlaybackEnd", {
          Sequence: levelSequence
        }, 0, /*sync=*/false, /*generateTransaction=*/false);

        
        this.sequences.push({name: displayName, path: path, length: Length, levelSequence: levelSequence});
      }

      this.activeSequence = this.sequences[0];
      if (this.activeSequence) {
        this.animationLength = this.activeSequence.length;

        await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorAssetLibrary", "LoadAsset", {
          AssetPath: this.activeSequence.levelSequence
        }, 0, /*sync=*/false, /*generateTransaction=*/false);

        await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "OpenLevelSequence", {
          LevelSequence: this.activeSequence.levelSequence
        }, 0, /*sync=*/false, /*generateTransaction=*/false);
      }
    },
    onClickLoop() {
      if (this.activeSequence) {
        this.activeSequence.looping = !this.activeSequence.looping
      }
    },
    async onPlay() {
      if (!this.activeSequence) return;

      if (this.currentTime == this.activeSequence.length - 1) {
        this.onRestart();
      }

      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "Play");
    },
    async onPause() {
      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "Pause");
    },
    async onRestart() {
      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "Pause");
      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "SetCurrentTime", {NewFrame: 0});
      this.currentTime = 0;
    },
    async updateScrub() {
      if (!this.activeSequence) return;

      if (this.currentTime === this.activeSequence.length - 1) {
        this.onRestart();
        return;
      }
      if (this.activeSequence.levelSequence && !UnrealService.clicking) {
        let response = null;
        response = await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "GetCurrentTime", {}, 0, /*sync=*/false, /*generateTransaction=*/false);
        if (response) {
          this.currentTime = response.ReturnValue;
        }
        response = await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "IsPlaying", {}, 0, /*sync=*/true, /*generateTransaction=*/false);
        if (response) {
          this.playing = response.ReturnValue;
        }
      }
    },
    async onClickSequence(sequence) {
      this.activeSequence = sequence;
      this.animationLength = sequence.length;

      await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorAssetLibrary", "LoadAsset", {
        AssetPath: this.activeSequence.levelSequence
      });

      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "OpenLevelSequence", {
        LevelSequence: sequence.levelSequence
      });
    },
    async onScrub(val) {
      await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "SetCurrentTime", {
        NewFrame: val
      }, 0);
    },
    async poll() {
      if (this.activeSequence && this.activeSequence.levelSequence && !UnrealService.clicking) {
        const response = await UnrealService.callFunction("/Script/LevelSequenceEditor.Default__LevelSequenceEditorBlueprintLibrary", "IsPlaying", {}, 0, /*sync=*/true, /*generateTransaction=*/false);
        if (response) {
          this.playing = response.ReturnValue;
        }
      }
    }
  },
  mounted() {
  },
  components: {
    RangeSlider
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/common.scss";
.wrapper {
  @include wannabe-object-group();
}
.sequence-grid-title {
  @include wannabe-group-header();
}
#animation-page {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 20px 0;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
.sequence-selector {
  width: 100%;
  max-height: 100%;
  padding-left: 20px;
  padding-right: 20px;
  overflow-y: auto;
  padding-top: 20px;

  > p {
    margin-left: 20px;
    text-align: left;
    font-size: 18px;
    color: $primary-color;
  }
}
.sequence-cards-grid {
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
.sequence-card {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  width: 200px;
  flex-wrap: wrap;
  position: relative;
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
.sequence-card.active {
  background-color: #5d708b;
  opacity: 1.0;
}
.sequence-card:hover {
  cursor: pointer;
}
.sequence-card-content {
  color: #00000054;
  font-size: 60px;
  width: 100%;
}
.sequence-card-title {
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
.sequence-card:hover {
  p {
    word-wrap: break-word;
  }
}
.animation-playback {
  width: 60%;
  margin-bottom: 20px;
  margin-top: 20px;
  min-height: fit-content;
}
.playback-slider {
  margin-top: 10px;
  padding: 0 20px;
  width: 100%;
}
.playback-group-content {
  width: 100%;
}
.playback-buttons {
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    display: flex;
    width: min-content;
    height: min-content;
    margin: 0 5px;
    border-radius: 50%;
    font-size: 18px;

    i {
      color: $accent-color;
    }
  }
  span:active {
    background-color: grey;
  }
}
.fa-play, .fa-pause {
  border-radius: 50%;
  border: 2px solid $accent-color;
  padding: 15px;
  font-size: x-large !important;
}
.fa-play {
  padding-left: 17px;
  padding-right: 13px;
}
.loop-button {
  background-color: #636363;
}
.loop-button.greyed, .loop-button.greyed i {
  opacity: 0.5;
  background-color: transparent;
}
</style>