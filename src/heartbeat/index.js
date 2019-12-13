const pulse = require('./pulse');

async function loop(bridgeState, sender) {
  try {
    await pulse(bridgeState, sender);
    setTimeout(() => loop(bridgeState, sender), 60000);
  } catch (e) {
    console.error('Failed to send heartbeat', e.toString());
    setTimeout(() => loop(bridgeState, sender), 5000);
  }
}

module.exports = (bridgeState, sender) => {
  if (!bridgeState.config.heartbeatColor) {
    console.log('Cannot find Heartbeat color, liveliness service not started.');
  } else {
    setTimeout(() => loop(bridgeState, sender), 60000);
  }
};
