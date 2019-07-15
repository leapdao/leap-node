/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { Tx } = require('leap-core');
const getTxValueAndSource = require('./utils/getTxValueAndSource');

module.exports = async (db, hash) => {
  const txDoc = await db.getTransaction(hash);
  if (!txDoc) return null;

  const { txData, blockHash, height, txPos } = txDoc;

  const { from, to } = await getTxValueAndSource(db, Tx.fromJSON(txData));

  return {
    transactionHash: hash,
    transactionIndex: txPos,
    blockHash,
    blockNumber: `0x${height.toString(16)}`,
    from,
    to,
    cumulativeGasUsed: '0x0',
    gasUsed: '0x0',
    contractAddress: null,
    logs: [],
    logsBloom: '0x',
    status: 1,
  };
};
