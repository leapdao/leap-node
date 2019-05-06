/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const getColors = async (bridgeState, nft) => {
  return nft ? bridgeState.tokens.erc721 : bridgeState.tokens.erc20;
};

module.exports = getColors;
