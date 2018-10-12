const { INVALID_PARAMS, NFT_COLOR_BASE } = require('./constants');
const getColors = require('./getColors');

module.exports = async (bridgeState, address) => {
  const erc20Colors = await getColors(bridgeState, false);
  const erc20Color = erc20Colors.indexOf(address.toLowerCase());
  if (erc20Color > -1) {
    return `0x${erc20Color.toString(16)}`;
  }

  const nftColors = await getColors(bridgeState, true);
  const nftColor = nftColors.indexOf(address.toLowerCase());
  if (nftColor > -1) {
    return `0x${(NFT_COLOR_BASE + nftColor).toString(16)}`;
  }

  /* eslint-disable no-throw-literal */
  throw {
    code: INVALID_PARAMS,
    message: 'Unknown token address',
  };
  /* eslint-enable no-throw-literal */
};
