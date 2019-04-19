/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Output } = require('leap-core');
const Transaction = require('ethereumjs-tx');
const VM = require('ethereumjs-vm');
const utils = require('ethereumjs-util');
const { BigInt, divide, subtract, lessThan } = require('jsbi-utils');
const isEqual = require('lodash/isEqual');
const { checkInsAndOuts, groupValuesByColor } = require('./utils');
const getColors = require('../../api/methods/getColors');
const { NFT_COLOR_BASE, NST_COLOR_BASE } = require('../../api/methods/constants');
const { ERC20_BYTECODE, ERC721_BYTECODE, ERC1948_BYTECODE } = require('./ercBytecode');
const { isNFT, isNST } = require('./../../utils');

const { Account } = VM.deps;

const REACTOR_ADDR = Buffer.from(
  '0000000000000000000000000000000000000001',
  'hex'
);

const ERC20_MINT_FUNCSIG = Buffer.from(
  '40c10f19000000000000000000000000',
  'hex'
);

const ERC721_MINT_FUNCSIG = Buffer.from(
  '40c10f19000000000000000000000000',
  'hex',
);

const ERC1948_MINT_FUNCSIG = Buffer.from(
  '1e458bee000000000000000000000000',
  'hex'
);

const ERC20_ERC721_TRANSFER_EVENT = Buffer.from(
  'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  'hex'
);

const ERC1948_DATA_UPDATED_EVENT = Buffer.from(
  '8ec06c2117d45dcb6bcb6ecf8918414a7ff1cb1ed07da8175e2cf638d0f4777f',
  'hex'
);

function setAccount(account, address, stateManager) {
  return new Promise((resolve, reject) => {
    stateManager.putAccount(address, account, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

function setAccountCode(code, address, stateManager) {
  return new Promise((resolve, reject) => {
    stateManager.putContractCode(address, code, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
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

  // We only search for the first script and ignoring others,
  // because we ideally only allow one spending condition per tx?!
  // XXX
  const txInputLen = tx.inputs.length;
  let spendingInput;
  for (let i = 0; i < txInputLen; i += 1) {
    const input = tx.inputs[i];

    if (input.script) {
      spendingInput = input;
      break;
    }
  }

  if (!spendingInput.script && !spendingInput.msgData) {
    throw new Error('You need to supply both the script and message data');
  }

  const spendingAddress = `0x${utils.ripemd160(spendingInput.script).toString('hex')}`;

  // check that script hashes to address
  checkInsAndOuts(
    tx,
    state,
    bridgeState,
    ({ address }) =>
      address === spendingAddress
  );

  // signature for replay protection
  const sigHashBuf = tx.sigHashBuf();
  // creating a new VM instance
  const vm = new VM({ hardfork: 'petersburg' });

  // deploy spending condition
  await setAccountCode(spendingInput.script, sigHashBuf, vm.stateManager);

  // creating the reactor account with some wei for minting
  const reactorAccount = new Account();
  reactorAccount.balance = '0xf00000000000000001';
  await setAccount(reactorAccount, REACTOR_ADDR, vm.stateManager);

  // colorMap for a color to address mapping
  const colorMap = {};
  addColors(colorMap, await getColors(bridgeState, false), 0);
  addColors(colorMap, await getColors(bridgeState, true), NFT_COLOR_BASE);
  addColors(colorMap, await getColors(bridgeState, false, true), NST_COLOR_BASE);

  const tokenDataMap = {};
  // convenience mapping from inputs to the previous outputs
  const inputMap = {};

  for (let i = 0; i < txInputLen; i += 1) {
    const unspent = state.unspent[tx.inputs[i].prevout.hex()];
    const tokenId = utils.setLengthLeft(
      utils.toBuffer(`0x${BigInt(unspent.value).toString(16)}`),
      32
    ).toString('hex');

    inputMap[tx.inputs[i].prevout.getUtxoId()] = unspent;
    tokenDataMap[`0x${tokenId}`] = unspent.data;
  }

  // for deploying colors and mint tokens
  let nonceCounter = 0;

  const insValues = Object.values(inputMap).reduce(groupValuesByColor, {});
  const outsValues = tx.outputs.reduce(groupValuesByColor, {});
  const toMint = [];

  // eslint-disable-next-line guard-for-in
  for (const color in insValues) {
    const contractAddr = colorMap[color];
    const inputValues = insValues[color];
    const outputValues = outsValues[color];
    const nst = isNST(color);
    const nft = isNFT(color);

    let callData;
    let bytecode;

    if (nst || nft) {
      for (const valueSet of outputValues) {
        const tokenId = utils.setLengthLeft(
          utils.toBuffer(`0x${BigInt(valueSet).toString(16)}`),
          32
        );

        if (nst) {
          const tokenData = utils.toBuffer(tokenDataMap[`0x${tokenId.toString('hex')}`]);
          callData = Buffer.concat([ERC1948_MINT_FUNCSIG, sigHashBuf, tokenId, tokenData]);
          bytecode = ERC1948_BYTECODE;
        }
        if (nft) {
          callData = Buffer.concat([ERC721_MINT_FUNCSIG, sigHashBuf, tokenId]);
          bytecode = ERC721_BYTECODE;
        }

        toMint.push({ contractAddr, callData, bytecode, color });
      }
    } else {
      // usually we burn the output, so that token.balance(address(this)) returns the balance after gas subtracted.
      // this is a special case where there is a color input, but no color output.
      // in that case we mint it, and token.balance(address(this)) will return it.
      const value = utils.setLengthLeft(
        utils.toBuffer(`0x${BigInt(outputValues || inputValues).toString(16)}`),
        32
      );

      callData = Buffer.concat([ERC20_MINT_FUNCSIG, sigHashBuf, value]);
      bytecode = ERC20_BYTECODE;
      toMint.push({ contractAddr, callData, bytecode, color });
    }
  }

  // now deploy the contracts and mint all tokens
  const deployed = {};
  while (toMint.length) {
    const obj = toMint.pop();

    if (deployed[obj.contractAddr] === undefined) {
      // we get the color as string somehow from up of the call-chain
      // TODO: replace call-chain with block-chain
      deployed[obj.contractAddr.toString('hex')] = parseInt(obj.color, 10);
      // eslint-disable-next-line no-await-in-loop
      await setAccountCode(obj.bytecode, obj.contractAddr, vm.stateManager);
    }

    // eslint-disable-next-line no-await-in-loop
    await runTx(vm, {
      nonce: nonceCounter,
      gasLimit: '0xffffffffffff',
      to: obj.contractAddr,
      data: obj.callData,
    });
    nonceCounter += 1;
  }

  // need to commit to trie, needs a checkpoint first 🤪
  await new Promise((resolve) => {
    vm.stateManager.checkpoint(() => {
      vm.stateManager.commit(() => {
        resolve();
      });
    });
  });

  const evmResult = await runTx(vm, {
    nonce: nonceCounter,
    gasLimit: 6000000, // TODO: set gas Limit to (inputs - outputs) / gasPrice
    to: sigHashBuf, // the plasma address is replaced with sighash, to prevent replay attacks
    data: spendingInput.msgData,
  });

  const logOuts = [];

  // iterate through all transfer events and sum them up per color
  evmResult.vm.logs.forEach(log => {
    const originAddr = log[0].toString('hex');
    const topics = log[1];
    const data = log[2];
    const originColor = deployed[originAddr];

    if (originColor === undefined) {
      return;
    }

    if (isNST(originColor) && topics[0].equals(ERC1948_DATA_UPDATED_EVENT)) {
      const nstTokenId = `0x${topics[1].toString('hex')}`;
      // const nstFromData = data.slice(0, 32);
      const nstToData = `0x${data.slice(32, 64).toString('hex')}`;

      logOuts.push(
        new Output(
          BigInt(nstTokenId),
          spendingAddress,
          originColor,
          nstToData
        )
      );
      return;
    }

    if (topics[0].equals(ERC20_ERC721_TRANSFER_EVENT)) {
      // everything else, ERC20, ERC721
      let toAddr = topics[2].slice(12, 32);
      // replace injected sigHash with plasma address
      if (toAddr.equals(sigHashBuf)) {
        toAddr = spendingAddress;
      } else {
        toAddr = `0x${toAddr.toString('hex')}`;
      }
      // ? ERC721(tokenId) : ERC20(transferAmount)
      const transferAmount =
        isNFT(originColor) ? BigInt(`0x${topics[3].toString('hex')}`) : BigInt(`0x${data.toString('hex')}`, 16);

      logOuts.push(new Output(transferAmount, toAddr, originColor));
    }
  });

  // For now we require LEAP token (color = 0) for paying gas.
  // In the future we may want a new transaction type for
  // proposing other tokens to be eligible for paying gas to a specifiec ratio to
  // the LEAP token.
  const LEAPTokenColor = 0;
  const gasUsed = BigInt(evmResult.gasUsed);
  // does not have to be in the output either -> fails here
  const gasPrice = divide(
    subtract(insValues[LEAPTokenColor], outsValues[LEAPTokenColor] || BigInt(0)),
    gasUsed
  );

  const minGasPrice = BigInt(
    bridgeState.minGasPrices[bridgeState.minGasPrices.length - 1]
  );

  if (lessThan(gasPrice, minGasPrice)) {
    return Promise.reject(
      new Error(
        `tx gasPrice ${gasPrice.toString()} less than minGasPRice: ${minGasPrice.toString()}`
      )
    );
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
