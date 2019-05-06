/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const hasAddress = (utxo, address) => {
  if (address === undefined) return true;
  return utxo.address.toLowerCase() === address.toLowerCase();
};

const hasColor = (utxo, color) => {
  if (color === undefined) return true;
  return Number(utxo.color) === Number(color);
};

module.exports = function filterUnspent(unspent, address, color) {
  return Object.keys(unspent)
    .filter(
      k =>
        unspent[k] &&
        hasAddress(unspent[k], address) &&
        hasColor(unspent[k], color)
    )
    .map(k => ({
      outpoint: k,
      output: unspent[k],
    }))
    .sort((a, b) => {
      return a.output.value - b.output.value;
    });
};
