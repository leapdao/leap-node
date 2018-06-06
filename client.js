/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const Web3 = require('web3');
const axios = require('axios');

const config = require('./config.json');
const makeTransfer = require('./src/txHelpers/makeTransfer');
const sendTx = require('./src/txHelpers/sendTx');

const web3 = new Web3('https://rinkeby.infura.io');
const parsecWeb3 = new Web3('http://localhost:8645');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const account = web3.eth.accounts.privateKeyToAccount(privKey);

const getState = async () => {
  const url = `http://localhost:${config.port}/state`;
  const { data } = await axios.get(url);
  return data;
};

async function run() {
  console.log('------');
  console.log((await getState()).balances);
  console.log('------');

  console.log(`From account: ${account.address}`);
  console.log(`Balance: ${await parsecWeb3.eth.getBalance(account.address)}`);

  let latestBlockData = await parsecWeb3.eth.getBlock('latest');
  console.log(`Latest block: ${JSON.stringify(latestBlockData, null, 2)}`);

  console.log(latestBlockData.number);
  latestBlockData = await parsecWeb3.eth.getBlock(latestBlockData.number);
  console.log(
    `Latest block by number: ${JSON.stringify(latestBlockData, null, 2)}`
  );
  const transfer1 = await makeTransfer(
    await getState(),
    account.address,
    '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad',
    1000,
    { privKey: account.privateKey }
  );
  await sendTx(config.port, transfer1.hex());
  console.log('Transfer:', transfer1.hex());
  console.log(transfer1.hash());
  const txData = await parsecWeb3.eth.getTransaction(transfer1.hash());
  const blockData = await parsecWeb3.eth.getBlock(txData.blockHash);
  console.log(`getTransaction: ${JSON.stringify(txData, null, 2)}`);
  console.log(`Block data: ${JSON.stringify(blockData, null, 2)}`);
  console.log('------');
  console.log((await getState()).balances);
  console.log('------');

  const transfer2 = await makeTransfer(
    await getState(),
    account.address,
    '0x9caa3424cb91900ef7ac41a7b04a246304c02d3a',
    1000,
    { privKey: account.privateKey }
  );
  await sendTx(config.port, transfer2.hex());
  console.log('Transfer:', transfer2.hex());
  console.log('------');
  console.log((await getState()).balances);
  console.log('------');
}

run();
