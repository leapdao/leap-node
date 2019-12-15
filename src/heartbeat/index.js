const { logNode } = require('../utils/debug');
const pulse = require('./pulse');

async function loop(bridgeState, sender) {
  try {
    await pulse(bridgeState, sender);
    setTimeout(() => loop(bridgeState, sender), 60000);
  } catch (e) {
    logNode('Failed to send heartbeat', e.toString());
    setTimeout(() => loop(bridgeState, sender), 5000);
  }
}

module.exports = (bridgeState, sender) => {
  if (!bridgeState.config.heartbeatColor) {
    logNode('Cannot find Heartbeat color, liveliness service not started.');
  } else {
    setTimeout(() => loop(bridgeState, sender), 60000);
  }
};
