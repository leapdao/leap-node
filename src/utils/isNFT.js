/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const {
  NFT_COLOR_BASE,
  NST_COLOR_BASE,
} = require('./../api/methods/constants');

module.exports = color => {
  return color >= NFT_COLOR_BASE && color < NST_COLOR_BASE;
};
