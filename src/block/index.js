const { logNode } = require('../utils/debug');

const addBlock = require('./addBlock');
const updateValidators = require('./updateValidators');
const updateEpoch = require('./updateEpoch');
const handleSlotActivation = require('../validator/handleSlotActivation');
const handlePeriod = require('../validator/handlePeriod');

module.exports = (bridgeState, db, nodeConfig = {}) => async (
  state,
  chainInfo
) => {
  const { height } = chainInfo;

  bridgeState.checkCallsCount = 0;

  if (height % 32 === 0 && !bridgeState.isReplay()) {
    // catch this, it is not fatal if it fails here
    logNode('Saving state');
    try {
      await bridgeState.saveState();
    } catch (e) {
      logNode(e);
    }
  }

  await handlePeriod(height, bridgeState);

  await handleSlotActivation(height, bridgeState);

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
    height,
    state.epoch.epoch,
    state.epoch.epochLength
  );

  // state is merk here. TODO: assign object copy or something immutable
  bridgeState.currentState = state;
  bridgeState.blockHeight = chainInfo.height;

  await bridgeState.saveNodeState();
  await bridgeState.saveLastSeenRootChainBlock();
};
