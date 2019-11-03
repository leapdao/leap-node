/* eslint-disable no-prototype-builtins */

function flagValue(bridgeState, flagHeights, flag) {
  if (!flagHeights.hasOwnProperty(flag)) {
    return true;
  }

  const targetHeight = flagHeights[flag];
  return bridgeState.blockHeight >= targetHeight;
}

module.exports = (flags = []) => (bridgeState, flagHeights = {}) => {
  const proxy = new Proxy(flagHeights, {
    get(target, key) {
      if (key === 'toJSON') {
        return () =>
          flags.reduce((flagValues, flag) => {
            flagValues[flag] = flagValue(bridgeState, target, flag);
            return flagValues;
          }, {});
      }

      if (!flags.includes(key)) {
        throw new Error(`Unknow feature flag ${key}`);
      }

      return flagValue(bridgeState, target, key);
    },
    set(_, key) {
      throw new Error(`Flags are read-only: ${key}`);
    },
  });

  return proxy;
};
