const { Output } = require('parsec-lib');
const getColor = require('./getColor');
const { INVALID_PARAMS } = require('./constants');

module.exports = async (bridgeState, txObj, tag) => {
  if (tag !== 'latest') {
    /* eslint-disable no-throw-literal */
    throw {
      code: INVALID_PARAMS,
      message: 'Only call for latest block is supported',
    };
    /* eslint-enable no-throw-literal */
  }

  const method = txObj.data.substring(0, 10);
  const paramsData = txObj.data.slice(34);
  switch (method) {
    // balanceOf(address)
    case '0x70a08231': {
      const color = parseInt(await getColor(bridgeState, txObj.to), 16);
      const address = `0x${paramsData}`;
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
      const color = parseInt(await getColor(bridgeState, txObj.to), 16);
      if (Output.isNFT(color)) {
        const address = `0x${paramsData.substring(0, 40)}`;
        const index = parseInt(paramsData.substring(40), 16);
        const balances = bridgeState.currentState.balances[color] || {};
        const nfts = balances[address] || [];
        if (!nfts[index]) {
          /* eslint-disable no-throw-literal */
          throw {
            code: INVALID_PARAMS,
            message: 'Index overflow',
          };
          /* eslint-enable */
        }
        return nfts[index];
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
