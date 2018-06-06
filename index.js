/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('./src/bridgeABI');
const validateTx = require('./src/validateTx');
const accumulateTx = require('./src/accumulateTx');
const validateBlock = require('./src/validateBlock');
const eventsRelay = require('./src/eventsRelay');

const config = require('./config.json');

if (!config.bridgeAddr) {
  console.error('bridgeAddr is required'); // eslint-disable-line
  process.exit(0);
}

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(config.network));

const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

const app = lotion({
  initialState: {
    mempool: [],
    balances: {}, // stores account balances
    unspent: {}, // stores unspent outputs (deposits, transfers)
  },
  abciPort: 46658,
});

app.useInitializer(async state => {
  /*
   * Check if addr in validators list here (how? read all events?)
   * ----------------------------------------------------------
   * Join here if add is not a validator. How to set a stake?
   * Maybe we should handle it outside the node.
   * So validator should join somewhere (on join page)
   * and after that run the node? Or init handler can wait for
   * ValidatorJoin event with validator addr
   * ----------------------------------------------------------
   * How to update voting power in tendermint here?
   * As an option, ValidatorJoin/ValidatorLeave events
   * can be used to broadcast special tx (not from parsec-lib)
   *
   * Each node should check address from event with own
   * address (we need private key?). If it's match, then
   * node should update voting power of validator that run it.
   *
   * Voting power can be changed in useTx handler
   * by mutating validators object in chainInfo param
   *
   * Validator address/pubKey (pubKey base64 using for validators object keys)
   * can be found in $LOTION_PATH/config/priv_validator.json
   */
  console.log(state);
});

app.useTx(async (state, { encoded }) => {
  const tx = Tx.fromRaw(encoded);
  await validateTx(state, tx, bridge);
  accumulateTx(state, tx);
});

app.useBlock(validateBlock);

app.listen(config.port).then(params => {
  console.log(params); // eslint-disable-line
  eventsRelay(params.GCI, web3, bridge);
});
