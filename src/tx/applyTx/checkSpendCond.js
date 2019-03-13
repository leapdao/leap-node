/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Output } = require('leap-core');
const Account = require('ethereumjs-account');
const Transaction = require('ethereumjs-tx');
const Trie = require('merkle-patricia-tree');
const VM = require('ethereumjs-vm');
const utils = require('ethereumjs-util');
const { BigInt, equal, add, multiply } = require('jsbi-utils');
const isEqual = require('lodash/isEqual');
const { checkInsAndOuts, groupValuesByColor } = require('./utils');
const getColors = require('../../api/methods/getColors');
const { NFT_COLOR_BASE } = require('../../api/methods/constants');

// commpiled https://github.com/leapdao/spending-conditions/blob/master/contracts/ERC20Min.sol
const erc20Code = Buffer.from(
  '608060405234801561001057600080fd5b506004361061005d577c0100000000000000000000000000000000000000000000000000000000600035046340c10f19811461006257806370a08231146100a2578063a9059cbb146100da575b600080fd5b61008e6004803603604081101561007857600080fd5b50600160a060020a038135169060200135610106565b604080519115158252519081900360200190f35b6100c8600480360360208110156100b857600080fd5b5035600160a060020a0316610128565b60408051918252519081900360200190f35b61008e600480360360408110156100f057600080fd5b50600160a060020a038135169060200135610143565b60006001331461011557600080fd5b61011f8383610150565b50600192915050565b600160a060020a031660009081526020819052604090205490565b600061011f3384846101e4565b600160a060020a038216151561016557600080fd5b600160a060020a03821660009081526020819052604090205461018e908263ffffffff6102b116565b600160a060020a0383166000818152602081815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b600160a060020a03821615156101f957600080fd5b600160a060020a038316600090815260208190526040902054610222908263ffffffff6102ca16565b600160a060020a038085166000908152602081905260408082209390935590841681522054610257908263ffffffff6102b116565b600160a060020a038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b6000828201838110156102c357600080fd5b9392505050565b6000828211156102d957600080fd5b5090039056fea165627a7a72305820b48eed6297042d728d0fddfa2756bf34e6a1faa2965516c2d03dbfc53e01065d0029',
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

module.exports = async (state, tx, bridgeState, nodeConfig = {}) => {
  if (tx.type !== Type.SPEND_COND) {
    throw new Error('Spending Condition tx expected');
  }
  if (nodeConfig.network && nodeConfig.network.noSpendingConditions) {
    throw new Error('Spending Conditions are not supported on this network');
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
  for (let i = 0; i < tx.inputs.length; i += 1) {
    inputMap[tx.inputs[i].prevout.getUtxoId()] =
      state.unspent[tx.inputs[i].prevout.hex()];
  }

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
  const insValues = Object.values(inputMap).reduce(groupValuesByColor, {});
  // eslint-disable-next-line  guard-for-in
  for (const color in insValues) {
    const erc20Account = new Account();
    await setAccountCode(erc20Account, stateTrie, erc20Code); // eslint-disable-line no-await-in-loop
    // eslint-disable-next-line no-await-in-loop
    await setAccount(erc20Account, stateTrie, colorMap[color]);

    // minting amount of output to address of condition

    const outsValues = tx.outputs.reduce(groupValuesByColor, {});
    const amountHex = utils.setLengthLeft(
      utils.toBuffer(`0x${BigInt(outsValues[color]).toString(16)}`),
      32
    );
    // eslint-disable-next-line no-await-in-loop
    await runTx(vm, {
      nonce: nonceCounter,
      gasPrice: '0x00',
      gasLimit: '0xffffffffffff',
      to: colorMap[color],
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
      to: tx.sigHash(), // the plasma address is replaced with sighash, to prevent replay attacks
      data: tx.inputs[i].msgData,
    });
    nonceCounter += 1;

    let spent = multiply(
      BigInt(results.gasUsed),
      BigInt(tx.inputs[i].gasPrice)
    );

    const out = inputMap[tx.inputs[i].prevout.getUtxoId()];
    // itterate through all transfer events and sum them up per color
    results.vm.logs.forEach(log => {
      if (log[0].equals(colorMap[out.color])) {
        const transferAmount = BigInt(`0x${log[2].toString('hex')}`, 16);
        spent = add(spent, transferAmount);
        let toAddr = `0x${log[1][2].slice(12, 32).toString('hex')}`;
        // replace injected sigHash with plasma address
        if (toAddr === tx.sigHash()) {
          toAddr = `0x${utils.ripemd160(tx.inputs[i].script).toString('hex')}`;
        }
        logOuts.push(new Output(transferAmount, toAddr, out.color));
      }
    });
    if (!equal(BigInt(out.value), spent)) {
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
    const txOuts = tx.outputs
      .map(output => JSON.stringify(output.toJSON()))
      .join(',');
    const logs = logOuts
      .map(output => JSON.stringify(output.toJSON()))
      .join(',');
    return Promise.reject(
      new Error(
        `outputs do not match computation results. \n outputs ${txOuts} \n calculated: ${logs}`
      )
    );
  }
  return Promise.resolve();
};
