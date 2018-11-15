const { NFT_COLOR_BASE } = require('./constants');
const { range } = require('../../utils');

let erc20Tokens = [];
let nftTokens = [];

const getTokensRange = (bridgeState, from, to) => {
  return Promise.all(
    range(from, to - 1).map(i => bridgeState.contract.methods.tokens(i).call())
  ).then(tokens => tokens.map(o => o.addr.toLowerCase()));
};

const getColors = async (bridgeState, nft) => {
  if (nft) {
    const tokenCount = Number(
      await bridgeState.contract.methods.nftTokenCount().call()
    );
    if (tokenCount !== nftTokens.length) {
      nftTokens = await getTokensRange(
        bridgeState,
        NFT_COLOR_BASE,
        NFT_COLOR_BASE + tokenCount
      );
    }
  } else {
    const tokenCount = Number(
      await bridgeState.contract.methods.erc20TokenCount().call()
    );
    if (tokenCount !== erc20Tokens.length) {
      erc20Tokens = await getTokensRange(bridgeState, 0, tokenCount);
    }
  }

  return nft ? nftTokens : erc20Tokens;
};

module.exports = getColors;
