/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const connect = require('lotion-connect');
const { Tx, Input, Outpoint } = require('parsec-lib');

const ContractEventsSubscription = require('./ContractEventsSubscription');
const { seq } = require('../utils');

module.exports = async (GCI, web3, bridge) => {
  const client = await connect(GCI);

  const handleDeposit = async event => {
    const deposit = await bridge.methods
      .deposits(event.returnValues.depositId)
      .call();
    const tx = Tx.deposit(
      event.returnValues.depositId,
      Number(deposit.amount),
      deposit.owner
    );
    await client.send({ encoded: tx.hex() });
  };
  const handleDeposits = seq(handleDeposit);

  const handleExit = async event => {
    const { txHash, outIndex } = event.returnValues;
    const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
    await client.send({ encoded: tx.hex() });
  };
  const handleExits = seq(handleExit);

  const eventSubscription = new ContractEventsSubscription(web3, bridge);
  const {
    NewDeposit: deposits = [],
    ExitStarted: exits = [],
  } = await eventSubscription.init();

  await handleDeposits(deposits);
  eventSubscription.on('NewDeposit', handleDeposits);

  await handleExits(exits);
  eventSubscription.on('ExitStarted', handleExits);

  return eventSubscription;
};
