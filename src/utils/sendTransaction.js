/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = async function sendTransaction(web3, method, to, account) {
  const gas = Math.round(
    (await method.estimateGas({ from: account.address })) * 1.2
  );
  const data = method.encodeABI();
  const tx = {
    to,
    data,
    gas,
  };
  console.log({ tx });
  const signedTx = await web3.eth.accounts.signTransaction(
    tx,
    account.privateKey
  );
  console.log({ signedTx });
  const txResult = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log({ txResult });
  return txResult;
};
