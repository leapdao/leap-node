const { logNode } = require('../utils/debug');

const loop = require('./loop');
const defaults = require('./defaults');

function updateConfig({ heartbeat = {} }) {
  return { ...defaults, ...heartbeat };
}

module.exports = (bridgeState, sender) => {
  bridgeState.config.heartbeat = updateConfig(bridgeState.config);
  if (bridgeState.config.heartbeat.color) {
    setTimeout(
      () => loop(bridgeState, sender),
      bridgeState.config.heartbeat.period
    );
  } else {
    logNode('Cannot find Heartbeat color, liveliness service not started.');
  }
};
