const { INVALID_PARAMS } = require('./constants');

module.exports = async (bridgeState, address, tag = 'latest') => {
  if (tag !== 'latest') {
    /* eslint-disable no-throw-literal */
    throw {
      code: INVALID_PARAMS,
      message: 'Only balance for latest block is supported',
    };
    /* eslint-enable no-throw-literal */
  }
  const balances = bridgeState.currentState.balances['0'] || {};
  const balance = balances[address] || 0;
  return `0x${BigInt(balance).toString(16)}`;
};
