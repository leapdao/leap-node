/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Output } = require('leap-core');
const { checkInsAndOuts } = require('./utils');
const Account = require('ethereumjs-account');
const Transaction = require('ethereumjs-tx');
const Trie = require('merkle-patricia-tree');
const VM = require('ethereumjs-vm');
const utils = require('ethereumjs-util');
const isEqual = require('lodash/isEqual');
const getColors = require('../../api/methods/getColors');
const { NFT_COLOR_BASE } = require('../../api/methods/constants');

// ERC20
const erc20Code = Buffer.from(
  '6080604052600436106100775763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663095ea7b3811461007c57806323b872dd146100b457806340c10f19146100de57806370a0823114610102578063a9059cbb14610135578063dd62ed3e14610159575b600080fd5b34801561008857600080fd5b506100a0600160a060020a0360043516602435610180565b604080519115158252519081900360200190f35b3480156100c057600080fd5b506100a0600160a060020a03600435811690602435166044356101c2565b3480156100ea57600080fd5b506100a0600160a060020a0360043516602435610231565b34801561010e57600080fd5b50610123600160a060020a0360043516610246565b60408051918252519081900360200190f35b34801561014157600080fd5b506100a0600160a060020a0360043516602435610261565b34801561016557600080fd5b50610123600160a060020a036004358116906024351661026e565b6000600160a060020a038316151561019757600080fd5b50336000908152600160208181526040808420600160a060020a039690961684529490529290205590565b600160a060020a03831660009081526001602090815260408083203384529091528120548211156101f257600080fd5b600160a060020a0384166000908152600160209081526040808320338452909152902080548390039055610227848484610299565b5060019392505050565b600061023d838361033d565b50600192915050565b600160a060020a031660009081526020819052604090205490565b600061023d338484610299565b600160a060020a03918216600090815260016020908152604080832093909416825291909152205490565b600160a060020a0383166000908152602081905260409020548111156102be57600080fd5b600160a060020a03821615156102d357600080fd5b600160a060020a0380841660008181526020818152604080832080548790039055938616808352918490208054860190558351858152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a3505050565b600160a060020a038216151561035257600080fd5b600160a060020a038216600081815260208181526040808320805486019055805185815290517fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a350505600a165627a7a723058206df3867ee9dffa384f593c0823ce02e6bc8ffaa46073b1bf2d6ae19d59d36fa40029',
  'hex'
);
const REACTOR_ADDR = Buffer.from(
  '0000000000000000000000000000000000000001',
  'hex'
);

function setAccount(account, trie, address) {
  // store in the trie
  return new Promise((resolve, reject) => {
    trie.put(address, account.serialize(), (err, val) => {
      if (err) {
        return reject(err);
      }
      return resolve(val);
    });
  });
}

function setAccountCode(account, trie, code) {
  return new Promise((resolve, reject) => {
    account.setCode(trie, code, (err, codeHash) => {
      if (err) {
        return reject(err);
      }
      return resolve(codeHash);
    });
  });
}

// runs a transaction through the vm
function runTx(vm, raw) {
  // create a new transaction out of the js object
  const tx = new Transaction(raw);

  Object.defineProperty(tx, 'from', {
    // instead of tx.sign(Buffer.from(secretKey, 'hex'))
    // eslint-disable-next-line object-shorthand
    get() {
      return REACTOR_ADDR;
    },
  });

  return new Promise((resolve, reject) => {
    // run the tx \o/
    vm.runTx({ tx }, (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.vm.exceptionError) {
        return reject(results.vm.exceptionError);
      }
      return resolve(results);
    });
  });
}

const addColors = (map, colors, colorBase = 0) => {
  colors.forEach((color, i) => {
    map[i + colorBase] = Buffer.from(color.replace('0x', ''), 'hex');
  });
};

module.exports = async (state, tx, bridgeState) => {
  if (tx.type !== Type.SPEND_COND) {
    throw new Error('Spending Condition tx expected');
  }

  // check that script hashes to address
  checkInsAndOuts(
    tx,
    state,
    bridgeState,
    ({ address }, i) =>
      address === `0x${utils.ripemd160(tx.inputs[i].script).toString('hex')}`
  );

  const colorMap = {};
  addColors(colorMap, await getColors(bridgeState, false), 0);
  addColors(colorMap, await getColors(bridgeState, true), NFT_COLOR_BASE);

  // TODO make inputMap
  // convenience mapping from inputs to the previous outputs
  const inputMap = {};

  // creating a trie that just resides in memory
  const stateTrie = new Trie();
  // creating a new VM instance
  const vm = new VM({ state: stateTrie });
  // creating the reactor account with some wei
  const reactorAccount = new Account();
  reactorAccount.balance = '0xf00000000000000001';
  await setAccount(reactorAccount, stateTrie, REACTOR_ADDR);

  // deploying colors and mint tokens
  let results;
  let nonceCounter = 0;
  for (let i = 0; i < tx.inputs.length; i += 1) {
    inputMap[tx.inputs[i].prevout.getUtxoId()] =
      state.unspent[tx.inputs[i].prevout.hex()];
    const erc20Account = new Account();
    await setAccountCode(erc20Account, stateTrie, erc20Code); // eslint-disable-line no-await-in-loop
    const inputId = tx.inputs[i].prevout.getUtxoId();
    // eslint-disable-next-line no-await-in-loop
    await setAccount(
      erc20Account,
      stateTrie,
      colorMap[inputMap[inputId].color]
    );

    // minting amount of output to address of condition
    const amountHex = utils.setLengthLeft(
      utils.toBuffer(inputMap[inputId].value),
      32
    );
    // eslint-disable-next-line no-await-in-loop
    await runTx(vm, {
      nonce: nonceCounter,
      gasPrice: '0x00',
      gasLimit: '0xffffffffffff',
      to: colorMap[inputMap[inputId].color],
      data: `0x40c10f19000000000000000000000000${tx
        .sigHash()
        .replace('0x', '')}${amountHex.toString('hex')}`,
    });
    nonceCounter += 1;
  }

  // deploying conditions
  tx.inputs.forEach(async input => {
    const conditionAccount = new Account();
    await setAccountCode(conditionAccount, stateTrie, input.script);
    // TODO: what if there are multiple condition scripts in one tx?
    await setAccount(conditionAccount, stateTrie, tx.sigHash());
  });

  const logOuts = [];
  // running conditions with msgData
  for (let i = 0; i < tx.inputs.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    results = await runTx(vm, {
      nonce: nonceCounter,
      gasPrice: tx.inputs[i].gasPrice,
      gasLimit: 6000000, // TODO: set gas Limit to (inputs - outputs) / gasPrice
      to: tx.sigHash(),
      data: tx.inputs[i].msgData,
    });
    nonceCounter += 1;

    let spent = results.gasUsed.toNumber() * tx.inputs[i].gasPrice;
    const out = inputMap[tx.inputs[i].prevout.getUtxoId()];
    // itterate through all transfer events and sum them up per color
    results.vm.logs.forEach(log => {
      if (log[0].equals(colorMap[out.color])) {
        const transferAmount = utils.bufferToInt(log[2]);
        spent += transferAmount;
        const toAddr = `0x${log[1][2].slice(12, 32).toString('hex')}`;
        logOuts.push(new Output(transferAmount, toAddr, out.color));
      }
    });
    if (+out.value !== spent) {
      return Promise.reject(
        new Error(
          `balance missmatch for ${out.address}. inputs: ${
            out.value
          }, output: ${spent}`
        )
      );
    }
  }
  // TODO: compact logOuts
  if (!isEqual(tx.outputs, logOuts)) {
    return Promise.reject(
      new Error(
        `outputs do not match computation results. \n outputs ${
          tx.outputs
        } \n calculated: ${logOuts}`
      )
    );
  }
  return Promise.resolve();
};
