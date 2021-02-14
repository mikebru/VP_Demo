import Manager from './src/manager';

const factory = new Manager();
export default {
    create: function (options) {
        return factory.create(options);
    },
    triggerResize: function() {
      for (let i = 0; i < factory.length; i++) {
        factory[i].triggerResize();
      }
    },
    factory: factory
};
