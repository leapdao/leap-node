/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const getPrevTx = require('./utils/getPrevTx');

module.exports = async (db, tx, blockHash, height, txPos) => {
  const prevTx = await getPrevTx(db, tx);

  const { value, color } = tx.value(prevTx);

  return {
    value: `0x${value.toString(16)}`,
    color,
    hash: tx.hash(),
    from: tx.from(prevTx),
    raw: tx.hex(),
    blockHash,
    blockNumber: `0x${height.toString(16)}`,
    transactionIndex: txPos,
    to: tx.to(),
    gas: '0x0',
    gasPrice: '0x0',
    nonce: 0,
    input: '0x',
  };
};
