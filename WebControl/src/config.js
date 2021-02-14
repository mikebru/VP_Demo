/**
 * Holds the web app's configuration.
 */
class Config {
  constructor(defaultConfig, userConfig) {
    this.cachedConfigDefaults = defaultConfig.cachedConfigDefaults;
    this.configDefaults = defaultConfig.configDefaults;
    this.userConfig = userConfig;

    this._initialize();
  }

  _initialize() {
    this._populateFromUserConfig();
    this._populateFromDefaultConfig();
  }
  
   // Using the default config, create getter and setters that access the cache before falling back on defaults.
  _populateFromDefaultConfig() {
    this._createDefaultServerURL();

    // Populate fields that can be cached.
    for (let prop in this.cachedConfigDefaults) {
      Object.defineProperty(this, prop, {
        get: this._cacheGet.bind(this, prop, this.cachedConfigDefaults[prop]),
        set: this._cacheSet.bind(this, prop)
      });
    }

    // Populate fields that won't be cached.
    Object.assign(this, this.configDefaults);
  }

  _populateFromUserConfig() {
    this.managerClasses = this.userConfig.managerClasses;
    
    for (let path of Object.keys(this.userConfig.objectPaths)) {
      this[path] = this.userConfig.objectPaths[path];
    }
  }

  _createDefaultServerURL() {
    if (!this.cachedConfigDefaults.serverUrl) {
      let serverUrl = window.location.origin;
      if (window.location.origin.split(":").length > 2) {
        serverUrl = serverUrl.replace("localhost", "127.0.0.1");
        this.cachedConfigDefaults.serverUrl = serverUrl.substr(0, window.location.origin.lastIndexOf(':')) + ":8080";
      }
    }
  }

  /**
   * Get the value from local storage
   */
  _cacheGet(prop, defaultValue) {
    // Try returning the inner value first
    const innerPropName = "_" + prop;
    if (!this[innerPropName]) {
      if(window.localStorage[prop]) {
        // Check in local storage and update inner value.
        try {
          this[innerPropName] = JSON.parse(window.localStorage[prop]).value;
        } catch (e) {
          /*eslint-disable no-empty*/
        }
      } else {
        // Value isn't in local storage, put it there.
        window.localStorage[prop] = JSON.stringify({
          value: defaultValue
        });
        this[innerPropName] = defaultValue;
      }
    }
    return this[innerPropName];
  }

  /**
   * Modify the private property and update local storage
   */
  _cacheSet(prop, value) {
    if (value === this["_" + prop]) return;
    this["_" + prop] = value;
    window.localStorage[prop] = JSON.stringify({
      value: value
    });
  }
}

// eslint-disable-next-line no-undef
export default new Config(require("../defaultConfig.json"), require("../userConfig.json"));