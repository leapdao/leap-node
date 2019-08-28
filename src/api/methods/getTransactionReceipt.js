/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { bufferToHex } = require('ethereumjs-util');
const { Tx } = require('leap-core');
const getPrevTx = require('./utils/getPrevTx');

module.exports = async (db, hash) => {
  const txDoc = await db.getTransaction(hash);
  if (!txDoc) return null;

  const { txData, blockHash, height, txPos, logs } = txDoc;

  const tx = Tx.fromJSON(txData);

  const prevTx = await getPrevTx(db, tx);

  const blockNumber = `0x${height.toString(16)}`;

  const txLogs = (logs || []).map((log, i) => ({
    transactionLogIndex: 0,
    transactionIndex: txPos,
    blockNumber,
    transactionHash: hash,
    address: bufferToHex(Buffer.from(log[0])),
    topics: log[1].map(e => bufferToHex(Buffer.from(e))),
    data: bufferToHex(Buffer.from(log[2])),
    logIndex: i,
    blockHash,
  }));

  return {
    transactionHash: hash,
    transactionIndex: txPos,
    blockHash,
    blockNumber,
    from: tx.from(prevTx),
    to: tx.to(),
    raw: tx.hex(),
    cumulativeGasUsed: '0x0',
    gasUsed: '0x0',
    contractAddress: null,
    logs: txLogs,
    logsBloom: '0x',
    status: '0x1',
  };
};
