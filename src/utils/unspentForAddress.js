/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = function unspentForAddress(unspent, address, color) {
  return Object.keys(unspent)
    .map(k => ({
      outpoint: k,
      output: unspent[k],
    }))
    .filter(
      u =>
        u.output &&
        u.output.address.toLowerCase() === address.toLowerCase() &&
        (color !== undefined ? u.output.color === color : true)
    )
    .sort((a, b) => {
      return a.output.value - b.output.value;
    });
};
