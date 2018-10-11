const { Output } = require('parsec-lib');
const { getColor } = require('./getColors');
const { INVALID_PARAMS } = require('./constants');

module.exports = async (bridgeState, txObj, tag) => {
  if (tag !== 'latest') {
    /* eslint-disable no-throw-literal */
    throw {
      code: INVALID_PARAMS,
      message: 'Only call for latest block is supported.',
    };
    /* eslint-enable no-throw-literal */
  }

  const method = txObj.data.substring(0, 10);
  switch (method) {
    // balanceOf(address)
    case '0x70a08231': {
      const color = parseInt(await getColor(bridgeState, txObj.to), 16);
      const address = `0x${txObj.data.substring(txObj.data.length - 40)}`;
      const balances = bridgeState.currentState.balances[color] || {};
      if (Output.isNFT(color)) {
        const nfts = balances[address] || [];
        return `0x${nfts.length.toString(16)}`;
      }

      const balance = balances[address] || 0;
      return `0x${balance.toString(16)}`;
    }

    // tokenOfOwnerByIndex(address,uint256)
    case '0x2f745c59': {
      const color = parseInt(await getColor(txObj.to), 16);
      const address = `0x${txObj.data.substring(10, 50)}`;
      const index = `0x${txObj.data.substring(50)}`;
      const balances = bridgeState.currentState.balances[color] || {};
      if (Output.isNFT(color)) {
        const nfts = balances[address] || [];
        if (!nfts[index]) {
          /* eslint-disable no-throw-literal */
          throw {
            code: INVALID_PARAMS,
            message: 'Index overflow',
          };
          /* eslint-enable */
        }
        return `0x${nfts[index].toString(16)}`;
      }

      /* eslint-disable no-throw-literal */
      throw {
        code: INVALID_PARAMS,
        message: 'Only for NFT',
      };
      /* eslint-enable */
    }
    default:
  }
  /* eslint-disable no-throw-literal */
  throw {
    code: INVALID_PARAMS,
    message: `Method call ${method} is not supported`,
  };
  /* eslint-enable */
};
