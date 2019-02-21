const { NFT_COLOR_BASE } = require('./constants');
const { range } = require('../../utils');

const getTokensRange = (bridgeState, from, to) => {
  return Promise.all(
    range(from, to - 1).map(i =>
      bridgeState.exitHandlerContract.methods.tokens(i).call()
    )
  ).then(tokens => tokens.map(o => o.addr.toLowerCase()));
};

const getColors = async (bridgeState, nft) => {
  if (nft) {
    const tokenCount = Number(
      await bridgeState.exitHandlerContract.methods.nftTokenCount().call()
    );
    if (tokenCount !== bridgeState.tokens.erc721.length) {
      bridgeState.tokens.erc721 = await getTokensRange(
        bridgeState,
        NFT_COLOR_BASE + bridgeState.tokens.erc721.length,
        NFT_COLOR_BASE + tokenCount
      );
    }
  } else {
    const tokenCount = Number(
      await bridgeState.exitHandlerContract.methods.erc20TokenCount().call()
    );
    if (tokenCount !== bridgeState.tokens.erc20.length) {
      bridgeState.tokens.erc20 = await getTokensRange(
        bridgeState,
        bridgeState.tokens.erc20.length,
        tokenCount
      );
    }
  }

  return nft ? bridgeState.tokens.erc721 : bridgeState.tokens.erc20;
};

module.exports = getColors;
