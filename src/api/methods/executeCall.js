const { Output } = require('parsec-lib');
const BN = require('bn.js');
const getColor = require('./getColor');
const { INVALID_PARAMS } = require('./constants');

const formatUint256 = n => `0x${new BN(n, 10).toString(16).padStart(64, '0')}`;

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
        return formatUint256(nfts.length);
      }

      const balance = balances[address] || 0;
      return formatUint256(balance);
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
        return formatUint256(nfts[index]);
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
