/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const PromiEvent = require('web3-core-promievent');
const { logNode } = require('./debug');
const getRootGasPrice = require('./getRootGasPrice');

module.exports = async (web3, method, to, account, opts = {}) => {
  let gas;
  try {
    gas = Math.round(
      (await method.estimateGas({ from: account.address })) * 1.21
    );
  } catch (e) {
    const methodSig = `${method._method.name}(${method.arguments.join(', ')})`; // eslint-disable-line no-underscore-dangle
    logNode(
      '[sendTransaction] estimateGas fails, probably failing transaction: ',
      methodSig
    );
    const result = new PromiEvent();
    result.reject(e);
    return { receiptPromise: result.eventEmitter };
  }

  const gasPrice = await getRootGasPrice(web3).catch(() => null);
  const data = method.encodeABI();
  const tx = {
    ...opts,
    to,
    data,
    gas,
    gasPrice,
  };
  const signedTx = await web3.eth.accounts.signTransaction(
    tx,
    account.privateKey
  );
  const txResult = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  return { receiptPromise: txResult };
};
