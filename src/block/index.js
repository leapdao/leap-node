const { logNode } = require('../debug');

const addBlock = require('./addBlock');
const updatePeriod = require('./updatePeriod');
const updateValidators = require('./updateValidators');
const updateEpoch = require('./updateEpoch');

module.exports = (bridgeState, db, noValidatorsUpdates) => async (
  state,
  chainInfo
) => {
  bridgeState.checkCallsCount = 0;
  await updatePeriod(state, chainInfo, bridgeState);
  await addBlock(state, chainInfo, {
    bridgeState,
    db,
  });
  if (!noValidatorsUpdates && state.slots.length > 0) {
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
};
