/* eslint-disable no-prototype-builtins */

const FLAGS = ['spend_cond_not_touched'];

module.exports = (bridgeState, flagHeights = {}) => {
  const proxy = new Proxy(flagHeights, {
    get(target, key) {
      if (!FLAGS.includes(key)) {
        throw new Error(`Unknow feature flag ${key}`);
      }

      if (!target.hasOwnProperty(key)) {
        return true;
      }

      const targetHeight = target[key];
      return bridgeState.blockHeight >= targetHeight;
    },
    set(_, key) {
      throw new Error(`Flags are read-only: ${key}`);
    },
  });

  return proxy;
};
