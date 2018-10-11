const { INVALID_PARAMS, NFT_COLOR_BASE } = require('./constants');
const getColors = require('./getColors');

module.exports = async (bridgeState, address) => {
  const erc20Colors = await getColors(bridgeState);
  const nftColors = await getColors(bridgeState, true);

  const erc20Color = erc20Colors.indexOf(address);
  const nftColor = nftColors.indexOf(address);

  if (erc20Color === -1 && nftColor === -1) {
    /* eslint-disable no-throw-literal */
    throw {
      code: INVALID_PARAMS,
      message: 'Unknown token address',
    };
    /* eslint-enable no-throw-literal */
  }

  const color = erc20Color === -1 ? NFT_COLOR_BASE + nftColor : erc20Color;
  return `0x${color.toString(16)}`;
};
