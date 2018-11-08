/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, no-console, no-loop-func */

const Web3 = require('web3');
const axios = require('axios');
const { helpers, Output, Tx, Outpoint } = require('leap-core');

const makeTransfer = require('../src/txHelpers/makeTransfer');
const unspentForAddress = require('../src/utils/unspentForAddress');
const sendTx = require('../src/txHelpers/sendTx');

const web3 = new Web3('https://rinkeby.infura.io');
const plasmaWeb3 = new Web3('http://localhost:8645');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const account = web3.eth.accounts.privateKeyToAccount(privKey);

const ADDR_2 = '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad';
const ADDR_3 = '0xe69d7406f2de9032c0512c1b75938a5db92123f7';

const PORT = 3000;

const getState = async () => {
  const url = `http://localhost:${PORT}/state`;
  const { data } = await axios.get(url);
  return data;
};

async function run() {
  for (let i = 0; i < 10; i += 1) {
    console.log('------');
    console.log((await getState()).balances);
    console.log('------');

    console.log(`From account: ${account.address}`);
    console.log(`Balance: ${await plasmaWeb3.eth.getBalance(account.address)}`);

    let latestBlockData = await plasmaWeb3.eth.getBlock('latest');
    console.log(`Latest block: ${JSON.stringify(latestBlockData, null, 2)}`);

    console.log(latestBlockData.number);
    latestBlockData = await plasmaWeb3.eth.getBlock(latestBlockData.number);
    console.log(
      `Latest block by number: ${JSON.stringify(latestBlockData, null, 2)}`
    );
    const transfer1 = await makeTransfer(
      await getState(),
      account.address,
      ADDR_2,
      1000 + Math.round(100 * Math.random()),
      0,
      account.privateKey
    );
    await sendTx(PORT, transfer1.hex());
    console.log('Transfer:', transfer1.hex());
    console.log(transfer1.hash());
    const txData = await plasmaWeb3.eth.getTransaction(transfer1.hash());
    const blockData = await plasmaWeb3.eth.getBlock(txData.blockHash);
    console.log(`getTransaction: ${JSON.stringify(txData, null, 2)}`);
    console.log(`Block data: ${JSON.stringify(blockData, null, 2)}`);
    console.log('------');
    console.log((await getState()).balances);
    console.log('------');

    const transfer2 = await makeTransfer(
      await getState(),
      account.address,
      ADDR_2,
      1000,
      0,
      account.privateKey
    );
    await sendTx(PORT, transfer2.hex());
    console.log('Transfer:', transfer2.hex());
    console.log('------');
    console.log((await getState()).balances);
    console.log('------');

    const consolidateAddress = async address => {
      console.log(await getState());
      const balance = await plasmaWeb3.eth.getBalance(address);
      const unspent = unspentForAddress(
        (await getState()).unspent,
        address,
        0
      ).map(u => ({
        output: u.output,
        outpoint: Outpoint.fromRaw(u.outpoint),
      }));
      const consolidateInputs = helpers.calcInputs(
        unspent,
        address,
        balance,
        0
      );
      const consolidateOutput = new Output(balance, address, 0);
      const consolidate = Tx.consolidate(consolidateInputs, consolidateOutput);
      await sendTx(PORT, consolidate.hex());
      console.log(await getState());
    };

    await consolidateAddress(ADDR_3);

    latestBlockData = await plasmaWeb3.eth.getBlock('latest');
    console.log(latestBlockData.number);
  }
}

run();
