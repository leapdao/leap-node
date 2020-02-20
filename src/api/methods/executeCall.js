const getColor = require('./getColor');
const { INVALID_PARAMS } = require('./constants');
const { isNFT, isNST } = require('../../utils');

const formatUint256 = n => `0x${n.toString(16).padStart(64, '0')}`;

/* eslint-disable no-throw-literal */
module.exports = async (bridgeState, txObj, tag) => {
  if (tag !== 'latest') {
    throw {
      code: INVALID_PARAMS,
      message: 'Only call for latest block is supported',
    };
  }

  const method = txObj.data.substring(0, 10);
  const paramsData = txObj.data.slice(34);
  switch (method) {
    // balanceOf(address)
    case '0x70a08231': {
      const color = parseInt(await getColor(bridgeState, txObj.to), 16);
      const address = `0x${paramsData}`;
      const balances = bridgeState.currentState.balances[color] || {};
      if (isNFT(color) || isNST(color)) {
        const nfts = balances[address] || [];
        return formatUint256(nfts.length);
      }

      const balance = BigInt(balances[address] || 0);
      return formatUint256(balance);
    }

    // tokenOfOwnerByIndex(address,uint256)
    case '0x2f745c59': {
      const color = parseInt(await getColor(bridgeState, txObj.to), 16);
      if (isNFT(color) || isNST(color)) {
        const address = `0x${paramsData.substring(0, 40)}`;
        const index = parseInt(paramsData.substring(40), 16);
        const balances = bridgeState.currentState.balances[color] || {};
        const nfts = balances[address] || [];
        if (!nfts[index]) {
          throw {
            code: INVALID_PARAMS,
            message: 'Index overflow',
          };
        }
        return formatUint256(nfts[index]);
      }

      throw {
        code: INVALID_PARAMS,
        message: 'Only for NFT',
      };
    }
    default:
      throw {
        code: INVALID_PARAMS,
        message: `Method call ${method} is not supported`,
      };
  }
};
/* eslint-enable */
