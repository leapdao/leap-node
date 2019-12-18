const { logNode } = require('../utils/debug');
const pulse = require('./pulse');

async function loop(bridgeState, sender) {
  const { period, periodOnError } = bridgeState.config.heartbeat;
  try {
    await pulse(bridgeState, sender);
    setTimeout(() => loop(bridgeState, sender), period);
  } catch (e) {
    logNode('Failed to send heartbeat', e.toString());
    setTimeout(() => loop(bridgeState, sender), periodOnError);
  }
}

module.exports = loop;
