/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const ethUtil = require('ethereumjs-util');

const GENESIS =
  '0x4920616d207665727920616e6772792c20627574206974207761732066756e21';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const map = mapFn => arr => arr.map(mapFn);

const seq = mapFn => async arr => {
  for (const item of arr) {
    await mapFn(item); // eslint-disable-line no-await-in-loop
  }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const addrCmp = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);

const range = (s, e) => Array.from(new Array(e - s + 1), (_, i) => i + s);

const readSlots = async bridge => {
  const epochLength = await bridge.methods.epochLength().call();
  const slots = await Promise.all(
    range(0, epochLength).map(slotId => bridge.methods.slots(slotId).call())
  );

  return slots.map(
    (
      {
        owner,
        stake,
        signer,
        tendermint,
        activationEpoch,
        newOwner,
        newStake,
        newSigner,
        newTendermint,
      },
      i
    ) => ({
      id: i,
      owner,
      stake,
      signer,
      tendermint,
      activationEpoch,
      newOwner,
      newStake,
      newSigner,
      newTendermint,
    })
  );
};

const getSlotIdByAddr = async (web3, bridge, address) => {
  const slots = await readSlots(bridge);
  return slots.findIndex(slot => addrCmp(slot.signer, address));
};

const getSlotsByAddr = (slots, address) => {
  return slots.filter(slot => addrCmp(slot.signer, address));
};

async function sendTransaction(web3, method, to, account) {
  const data = method.encodeABI();
  const gas = Math.round(
    (await method.estimateGas({ from: account.address })) * 1.2
  );
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
}

function getCurrentSlotId(slots, height) {
  const activeSlots = slots.filter(s => s.owner !== EMPTY_ADDRESS);
  const index = height % activeSlots.length;
  return activeSlots[index].id;
}

exports.map = map;
exports.seq = seq;
exports.delay = delay;
exports.range = range;
exports.addrCmp = addrCmp;
exports.getSlotIdByAddr = getSlotIdByAddr;
exports.getSlotsByAddr = getSlotsByAddr;
exports.readSlots = readSlots;
exports.getCurrentSlotId = getCurrentSlotId;
exports.sendTransaction = sendTransaction;
exports.GENESIS = GENESIS;
exports.EMPTY_ADDRESS = EMPTY_ADDRESS;
