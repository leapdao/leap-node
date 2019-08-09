const { logNode } = require('../utils/debug');

const addBlock = require('./addBlock');
const updatePeriod = require('./updatePeriod');
const updateValidators = require('./updateValidators');
const updateEpoch = require('./updateEpoch');

module.exports = (bridgeState, db, nodeConfig = {}, sender) => async (
  state,
  chainInfo
) => {
  bridgeState.checkCallsCount = 0;
  await updatePeriod(state, chainInfo, bridgeState, nodeConfig, sender);
  await addBlock(state, chainInfo, {
    bridgeState,
    db,
  });
  if (!nodeConfig.no_validators_updates && state.slots.length > 0) {
    await updateValidators(state, chainInfo);
  }

  updateEpoch(state, chainInfo);
  logNode(
    'Height: %d, epoch: %d, epochLength: %d',
    chainInfo.height,
    state.epoch.epoch,
    state.epoch.epochLength
  );

  // state is merk here. TODO: assign object copy or something immutable
  bridgeState.currentState = state;
  bridgeState.blockHeight = chainInfo.height;

  if (chainInfo.height % 32 === 0) {
    // catch this, it is not fatal if it fails here
    logNode('Saving state');
    try {
      await bridgeState.saveState();
    } catch (e) {
      logNode(e);
    }
  }
};
