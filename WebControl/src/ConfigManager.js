import UnrealService from "@/UnrealService.js";

/**
 * Manages the configuration and persists config data to the browser cache.
 */
class ConfigManager {
  constructor(config, cache){
    this.config = config;
    this.cache = cache;
  }

  /**
   * Query the Unreal remote control server to load the missing configuration.
   */
  queryMissingConfig() {
    this._loadAssets();
    return this._findManagers();
  }

  /**
   * Fetch the actors from the current level.
   */
  async updateLevelActors() {
    const {ReturnValue: actorsInfo} = await UnrealService.callFunction(this.config.remoteControlUtility, "GetAllLevelActorsInfo", {}, 0, /*sync=*/false, /*generateTransaction=*/false);
    this.cache.levelActors = actorsInfo.map((actor) => {
      let returnedActor = {};
      for (let key of Object.keys(actor)) {
        // Hack since user defined structs define fields with weird names.
        if (key.startsWith("Path")) {
          returnedActor.path = actor[key];
        } else if (key.startsWith("DisplayName")) {
          returnedActor.displayName = actor[key];
        } else {
          returnedActor.classDisplayName = actor[key];
        }
      }
      return returnedActor;
    });
  }

  _loadAssets() {
    this.config.lightCardTypes.forEach(lightCardType => {
      lightCardType.loadedImage = require(`@/assets/lightcards/${lightCardType.imageName}`);
    });
  }

   async _findManagers() {
    const {ReturnValue: objectPaths} = await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorLevelLibrary", "GetAllLevelActors", {}, 3, /*sync=*/true, /*generateTransaction=*/false, /*polling=*/true);
    const requests = Object.keys(this.config.managerClasses).map((manager) => {
      return this._getByClass(objectPaths, this.config.managerClasses[manager], manager);
    });
    
    return Promise.all(requests);
  }

  async _getByClass(paths, targetClass, configName) {
    const response = await UnrealService.callFunction("/Script/EditorScriptingUtilities.Default__EditorFilterLibrary", "ByClass", {
      TargetArray: paths,
      ObjectClass: targetClass
    }, 0);
    
    if (response && response.ReturnValue) {
       this.config[configName] = response.ReturnValue[0];
    }
  }
}

export default ConfigManager;