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
const {
  BigInt,
  multiply,
  add,
  subtract,
  lessThan,
  greaterThan,
} = require('jsbi-utils');
const isEqual = require('lodash/isEqual');
const getColors = require('../../api/methods/getColors');
const {
  NFT_COLOR_BASE,
  NST_COLOR_BASE,
} = require('../../api/methods/constants');
const {
  ERC20_BYTECODE,
  ERC721_BYTECODE,
  ERC1948_BYTECODE,
} = require('./ercBytecode');
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
  'hex'
);

const ERC1948_MINT_FUNCSIG = Buffer.from(
  '1e458bee000000000000000000000000',
  'hex'
);

// increaseAllowance(address spender, uint256 addedValue)
const ERC20_INCREASE_ALLOWANCE_FUNCSIG = Buffer.from(
  '39509351000000000000000000000000',
  'hex'
);

// approve(address to, uint256 tokenId)
const ERC721_APPROVE_FUNCSIG = Buffer.from(
  '095ea7b3000000000000000000000000',
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

// 6 mil as gas limit
const GAS_LIMIT = BigInt(6000000);
const GAS_LIMIT_HEX = `0x${GAS_LIMIT.toString(16)}`;

// fixed value until we get support for it in the transaction format
const FIXED_GAS_PRICE = BigInt(142);

function setAccount(account, address, stateManager) {
  return new Promise((resolve, reject) => {
    stateManager.putAccount(address, account, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

function setAccountCode(code, address, stateManager) {
  return new Promise((resolve, reject) => {
    stateManager.putContractCode(address, code, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

// runs a transaction through the vm
function runTx(vm, raw, from) {
  // create a new transaction out of the js object
  const tx = new Transaction(raw);

  Object.defineProperty(tx, 'from', {
    // instead of tx.sign(Buffer.from(secretKey, 'hex'))
    // eslint-disable-next-line object-shorthand
    get() {
      return from || REACTOR_ADDR;
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

  // colorMap for a color to address mapping
  const colorMap = {};

  addColors(colorMap, await getColors(bridgeState, false), 0);
  addColors(colorMap, await getColors(bridgeState, true), NFT_COLOR_BASE);
  addColors(
    colorMap,
    await getColors(bridgeState, false, true),
    NST_COLOR_BASE
  );

  const toMint = [];
  const LEAPTokenColor = 0;
  const txInputLen = tx.inputs.length;
  // signature for replay protection
  const sigHashBuf = tx.sigHashBuf();

  let spendingInput;
  let spendingInputUnspent;
  let spendingAddrBuf;
  let spendingAddress;

  // this is a bag of N(F/S)Ts to remember and update owners
  const nftBag = {};
  // this is a bag of ERC20s to help transform inputs to outputs
  const tokenBag = {};

  for (let i = 0; i < txInputLen; i += 1) {
    const input = tx.inputs[i];
    const unspent = state.unspent[input.prevout.hex()];

    if (!unspent) {
      throw new Error(`unspent: ${input.prevout.hex()} does not exists`);
    }

    const tokenValueBuf = utils.setLengthLeft(
      utils.toBuffer(`0x${BigInt(unspent.value).toString(16)}`),
      32
    );
    const contractAddr = colorMap[unspent.color];
    const contractAddrStr = `0x${contractAddr.toString('hex')}`;
    if (isNFT(unspent.color) || isNST(unspent.color)) {
      const tokenId = `0x${tokenValueBuf.toString('hex')}`;
      nftBag[contractAddrStr] = !nftBag[contractAddrStr]
        ? {}
        : nftBag[contractAddrStr];
      nftBag[contractAddrStr][tokenId] = unspent.address;
    } else if (i > 0) {
      tokenBag[contractAddrStr] = !tokenBag[contractAddrStr]
        ? {}
        : tokenBag[contractAddrStr];
      if (!tokenBag[contractAddrStr][unspent.address]) {
        tokenBag[contractAddrStr][unspent.address] = BigInt(unspent.value);
      } else {
        tokenBag[contractAddrStr][unspent.address] = add(
          tokenBag[contractAddrStr][unspent.address],
          BigInt(unspent.value)
        );
      }
    }

    if (!contractAddr) {
      // just to make sure
      throw new Error(`No contract for color: ${unspent.color}`);
    }

    if (input.script) {
      if (!input.msgData) {
        throw new Error('You need to supply both the script and message data');
      }

      // For now we require LEAP token (color = 0) for paying gas.
      // In the future we may want a new transaction type for
      // proposing other tokens to be eligible for paying gas to a specifiec ratio to
      // the LEAP token.
      if (unspent.color !== LEAPTokenColor) {
        throw new Error('Only color 0 is supported to pay for gas right now.');
      }

      // TODO:
      // we only allow one spending condition in an transaction, do we want to throw if we find more?
      spendingInput = input;
      spendingInputUnspent = unspent;
      spendingAddrBuf = utils.ripemd160(spendingInput.script);
      spendingAddress = `0x${spendingAddrBuf.toString('hex')}`;

      // continue, input of spending condition is just for gas and will not be minted
      // but any leftover after subtracting gas is returned to the owner as the last output.

      // eslint-disable-next-line no-continue
      continue;
    }

    // XXX: owner
    let addrBuf = Buffer.from(unspent.address.replace('0x', ''), 'hex');
    const spendingIsOwner = addrBuf.equals(spendingAddrBuf);

    let callData;
    let bytecode;
    let allowance;

    if (!spendingIsOwner) {
      if (unspent.address !== input.signer) {
        throw new Error(
          `output owner ${unspent.address} unequal input signer: ${
            input.signer
          }`
        );
      }
      allowance = {};
    } else {
      addrBuf = sigHashBuf;
    }

    if (isNST(unspent.color)) {
      callData = Buffer.concat([
        ERC1948_MINT_FUNCSIG,
        addrBuf,
        tokenValueBuf,
        utils.toBuffer(unspent.data),
      ]);
      bytecode = ERC1948_BYTECODE;

      if (allowance) {
        allowance = {
          from: addrBuf,
          callData: Buffer.concat([
            ERC721_APPROVE_FUNCSIG,
            sigHashBuf,
            tokenValueBuf,
          ]),
        };
      }
    } else if (isNFT(unspent.color)) {
      callData = Buffer.concat([ERC721_MINT_FUNCSIG, addrBuf, tokenValueBuf]);
      bytecode = ERC721_BYTECODE;

      if (allowance) {
        allowance = {
          from: addrBuf,
          callData: Buffer.concat([
            ERC721_APPROVE_FUNCSIG,
            sigHashBuf,
            tokenValueBuf,
          ]),
        };
      }
    } else {
      callData = Buffer.concat([ERC20_MINT_FUNCSIG, addrBuf, tokenValueBuf]);
      bytecode = ERC20_BYTECODE;

      if (allowance) {
        allowance = {
          from: addrBuf,
          callData: Buffer.concat([
            ERC20_INCREASE_ALLOWANCE_FUNCSIG,
            sigHashBuf,
            tokenValueBuf,
          ]),
        };
      }
    }

    toMint.push({
      contractAddr,
      callData,
      bytecode,
      color: unspent.color,
      allowance,
    });
  }
  // creating a new VM instance
  const vm = new VM({ hardfork: 'petersburg' });

  // deploy spending condition
  await setAccountCode(spendingInput.script, sigHashBuf, vm.stateManager);

  // creating the reactor account with some wei for minting
  const reactorAccount = new Account();

  reactorAccount.balance = '0xf00000000000000001';
  await setAccount(reactorAccount, REACTOR_ADDR, vm.stateManager);

  // for deploying colors and mint tokens
  let nonceCounter = 0;

  // keep track of deployed contracts
  const deployed = {};
  const nonces = {};

  // now deploy the contracts and mint all tokens
  while (toMint.length) {
    const obj = toMint.pop();
    const addrHex = obj.contractAddr.toString('hex');

    if (deployed[`0x${addrHex}`] === undefined) {
      deployed[`0x${addrHex}`] = obj.color;
      // eslint-disable-next-line no-await-in-loop
      await setAccountCode(obj.bytecode, obj.contractAddr, vm.stateManager);
    }

    // eslint-disable-next-line no-await-in-loop
    await runTx(vm, {
      nonce: nonceCounter,
      gasLimit: GAS_LIMIT_HEX,
      to: obj.contractAddr,
      data: obj.callData,
    });
    nonceCounter += 1;

    // for approval / allowance
    if (obj.allowance) {
      const owner = obj.allowance.from.toString('hex');
      // eslint-disable-next-line no-bitwise
      const nonce = nonces[owner] | 0;

      if (nonce === 0) {
        const acc = new Account();
        acc.balance = '0xf00000000000000001';
        // eslint-disable-next-line no-await-in-loop
        await setAccount(acc, obj.allowance.from, vm.stateManager);
      }

      // eslint-disable-next-line no-await-in-loop
      await runTx(
        vm,
        {
          nonce,
          gasLimit: GAS_LIMIT_HEX,
          to: obj.contractAddr,
          data: obj.allowance.callData,
        },
        obj.allowance.from
      );

      // update nonce
      nonces[owner] = nonce + 1;
    }
  }

  // need to commit to trie, needs a checkpoint first 🤪
  await new Promise(resolve => {
    vm.stateManager.checkpoint(() => {
      vm.stateManager.commit(() => {
        resolve();
      });
    });
  });

  const evmResult = await runTx(vm, {
    nonce: nonceCounter,
    gasLimit: GAS_LIMIT_HEX, // TODO: set gas Limit to (inputs - outputs) / gasPrice
    to: sigHashBuf,
    // NOPE: the plasma address is replaced with sighash, to prevent replay attacks
    data: spendingInput.msgData,
  });

  const logOuts = [];

  // iterate through all events
  evmResult.vm.logs.forEach(log => {
    const originAddr = `0x${log[0].toString('hex')}`;
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

      const tokenOwner = nftBag[originAddr][nstTokenId];
      logOuts.push(
        new Output(BigInt(nstTokenId), tokenOwner, originColor, nstToData)
      );
      return;
    }

    if (topics[0].equals(ERC20_ERC721_TRANSFER_EVENT)) {
      let fromAddr = topics[1].slice(12, 32);
      let toAddr = topics[2].slice(12, 32);

      // replace injected sigHash with plasma address
      if (toAddr.equals(sigHashBuf)) {
        toAddr = spendingAddress;
      } else {
        toAddr = `0x${toAddr.toString('hex')}`;
      }
      if (fromAddr.equals(sigHashBuf)) {
        fromAddr = spendingAddress;
      } else {
        fromAddr = `0x${fromAddr.toString('hex')}`;
      }

      // todo: support transfer of ERC1948
      if (!isNFT(originColor) && data.length === 0) {
        // this hack assumes that an ERC1949 is minted
        // and that Transfer Event is emmited before UpdateData Event
        // so in only puts the new owner into the nftBag
        nftBag[originAddr][`0x${topics[3].toString('hex')}`] = toAddr;
        return;
      }
      // ? ERC721(tokenId) : ERC20(transferAmount)
      const transferAmount = isNFT(originColor)
        ? BigInt(`0x${topics[3].toString('hex')}`)
        : BigInt(`0x${data.toString('hex')}`, 16);

      if (isNFT(originColor) || isNST(originColor)) {
        logOuts.push(new Output(transferAmount, toAddr, originColor));
      } else {
        tokenBag[originAddr][fromAddr] = subtract(
          tokenBag[originAddr][fromAddr],
          transferAmount
        );
        if (!tokenBag[originAddr][toAddr]) {
          tokenBag[originAddr][toAddr] = BigInt(0);
        }
        tokenBag[originAddr][toAddr] = add(
          tokenBag[originAddr][toAddr],
          transferAmount
        );
      }
    }
  });
  for (const originAddr in tokenBag) {
    if (Object.prototype.hasOwnProperty.call(tokenBag, originAddr)) {
      for (const owner in tokenBag[originAddr]) {
        if (Object.prototype.hasOwnProperty.call(tokenBag[originAddr], owner)) {
          if (greaterThan(tokenBag[originAddr][owner], BigInt(0))) {
            logOuts.push(
              new Output(
                tokenBag[originAddr][owner],
                owner,
                deployed[originAddr]
              )
            );
          }
        }
      }
    }
  }

  const gasUsed = BigInt(evmResult.gasUsed);
  // XXX: Fixed gasPrice for now. We include it again in the tx format as the next breaking change.
  const gasPrice = FIXED_GAS_PRICE;

  const minGasPrice = BigInt(
    bridgeState.minGasPrices[bridgeState.minGasPrices.length - 1]
  );

  if (lessThan(gasPrice, minGasPrice)) {
    return Promise.reject(
      new Error(
        `tx gasPrice ${gasPrice.toString()} less than minGasPrice: ${minGasPrice.toString()}`
      )
    );
  }

  const gasChange = subtract(
    BigInt(spendingInputUnspent.value),
    multiply(gasPrice, gasUsed)
  );

  if (lessThan(gasChange, BigInt(0))) {
    throw new Error(
      'Not enough input for spending condition to cover gas costs'
    );
  }

  // Now return the leftovers
  logOuts.push(
    new Output(
      gasChange,
      spendingInputUnspent.address,
      spendingInputUnspent.color
    )
  );

  // TODO: compact logOuts
  if (!isEqual(tx.outputs, logOuts)) {
    const txOuts = tx.outputs
      .map(output => JSON.stringify(output.toJSON()))
      .join(',');
    const logs = logOuts
      .map(output => JSON.stringify(output.toJSON()))
      .join(',');
    const err = new Error(
      `outputs do not match computation results. \n outputs ${txOuts} \n calculated: ${logs}`
    );
    err.logOuts = logOuts;
    return Promise.reject(err);
  }
  return Promise.resolve(logOuts);
};
