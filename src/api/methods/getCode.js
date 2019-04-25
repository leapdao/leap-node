const { INVALID_PARAMS } = require('./constants');
const BYTECODES = require('../../tx/applyTx/ercBytecode.js');

const CODE_ERC20 = `0x${BYTECODES.ERC20_BYTECODE.toString('hex')}`;
const CODE_ERC721 = `0x${BYTECODES.ERC721_BYTECODE.toString('hex')}`;
const CODE_ERC1948 = `0x${BYTECODES.ERC1948_BYTECODE.toString('hex')}`;

/* eslint-disable no-throw-literal */
module.exports = async (bridgeState, contractAddr, tag) => {
  if (tag !== 'latest') {
    throw {
      code: INVALID_PARAMS,
      message: 'Only call for latest block is supported',
    };
  }

  const tokenAddr = contractAddr.toLowerCase();

  let len = bridgeState.tokens.erc20.length;
  for (let i = 0; i < len; i += 1) {
    if (bridgeState.tokens.erc20[i].toLowerCase() === tokenAddr) {
      return CODE_ERC20;
    }
  }

  len = bridgeState.tokens.erc721.length;
  for (let i = 0; i < len; i += 1) {
    if (bridgeState.tokens.erc721[i].toLowerCase() === tokenAddr) {
      return CODE_ERC721;
    }
  }

  len = bridgeState.tokens.erc1948.length;
  for (let i = 0; i < len; i += 1) {
    if (bridgeState.tokens.erc1948[i].toLowerCase() === tokenAddr) {
      return CODE_ERC1948;
    }
  }

  throw {
    code: INVALID_PARAMS,
    message: 'Contract not found',
  };
};
/* eslint-enable */
