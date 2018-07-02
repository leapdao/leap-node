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

  const transfer1 = await makeTransfer(
    await getState(),
    account.address,
    '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad',
    1000,
    { privKey: account.privateKey }
  );
  await sendTx(config.port, transfer1.hex());
  console.log('Transfer:', transfer1.hex());
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
