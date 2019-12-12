/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const getRootGasPrice = require('./getRootGasPrice');

module.exports = async (web3, method, to, account, opts = {}) => {
  const gas = Math.round(
    (await method.estimateGas({ from: account.address })) * 1.21
  );
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
