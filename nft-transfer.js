/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, no-console, no-loop-func */

const axios = require('axios');
const { Output, Tx, Input, Outpoint } = require('parsec-lib');

const sendTx = require('./src/txHelpers/sendTx');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

const ADDR_2 = '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad';

const PORT = 3000;

const getState = async () => {
  const url = `http://localhost:${PORT}/state`;
  const { data } = await axios.get(url);
  return data;
};

async function run() {
  console.log((await getState()).balances);
  const transfer = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0xd5a673541d3cce876abf0348d004bdefa56f523821553680200bd79a984c93de',
          0
        )
      ),
    ],
    [new Output('3376735536791242681353', ADDR_2, 32769)]
  ).signAll(privKey);
  console.log(transfer.toJSON());
  await sendTx(PORT, transfer.hex());
  console.log((await getState()).balances);
}

run();
