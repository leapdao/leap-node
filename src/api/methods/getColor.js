const { INVALID_PARAMS, NFT_COLOR_BASE, NST_COLOR_BASE } = require('./constants');
const getColors = require('./getColors');
const { addrCmp } = require('../../utils');

const colorIndex = (colors, address) =>
  colors.findIndex(c => addrCmp(c, address));

module.exports = async (bridgeState, address) => {
  const erc20Colors = await getColors(bridgeState, false);
  const erc20Color = colorIndex(erc20Colors, address);
  if (erc20Color > -1) {
    return `0x${erc20Color.toString(16)}`;
  }

  const nstColors = await getColors(bridgeState, false, true);
  const nstColor = colorIndex(nstColors, address);
  if (nstColor > -1) {
    return `0x${(NST_COLOR_BASE + nstColor).toString(16)}`;
  }

  const nftColors = await getColors(bridgeState, true);
  const nftColor = colorIndex(nftColors, address);
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
