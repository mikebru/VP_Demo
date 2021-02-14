/**
 * Proxy for the local storage that allows to store any value as a string.
 */
const handler = {
  get: function(target, name) {
    return target[name] ? JSON.parse(target[name]).value : null;
  },
  set: function(target, name, value) {
    target[name] = JSON.stringify({
      value: value
    });

    return true;
  }
};

const cacheProxy = new Proxy(window.localStorage, handler);

export default cacheProxy;