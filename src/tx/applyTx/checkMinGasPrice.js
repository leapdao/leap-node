/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.MIN_GAS_PRICE) {
    throw new Error('minGasPrice tx expected');
  }

  if (
    BigInt(bridgeState.minGasPrices[state.gas.minPriceIndex + 1]) !==
    BigInt(tx.options.minGasPrice)
  ) {
    throw new Error('Wrong minGasPrice');
  }

  state.gas.minPriceIndex += 1;
  state.gas.minPrice = BigInt(tx.options.minGasPrice).toString();
};
