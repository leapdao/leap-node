/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Tx, Input, Outpoint } = require('leap-core');
const { BigInt } = require('jsbi-utils');
const TinyQueue = require('tinyqueue');

const sendTx = require('./txHelpers/sendTx');
const { handleEvents } = require('./utils');

const minDelay = 2000;

module.exports = class EventsRelay {
  constructor(delay, txServerPort) {
    this.relayBuffer = new TinyQueue([], (a, b) => {
      return a.blockNumber - b.blockNumber;
    });
    this.relayDelay = delay;

    this.txServerPort = txServerPort;
    this.onNewBlock = this.onNewBlock.bind(this);
  }
  async onNewBlock(blockNumber) {
    if (this.relayBuffer.length === 0) {
      return;
    }

    const events = [];

    while (
      this.relayBuffer.peek().blockNumber <=
      blockNumber - this.relayDelay
    ) {
      const event = this.relayBuffer.pop();

      events.push(event);

      if (this.relayBuffer.length === 0) {
        break;
      }
    }

    const handleJoin = async event => {
      const {
        slotId,
        tenderAddr,
        eventCounter,
        signerAddr,
      } = event.returnValues;
      const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
      setTimeout(() => {
        sendTx(this.txServerPort, tx.hex());
      }, minDelay);
    };

    const handler = handleEvents({
      NewDeposit: async ({ returnValues: event }) => {
        const color = Number(event.color);
        const value = BigInt(event.amount);
        const tx = Tx.deposit(event.depositId, value, event.depositor, color);
        setTimeout(() => {
          sendTx(this.txServerPort, tx.hex());
        }, minDelay);
      },
      EpochLength: async event => {
        const { epochLength } = event.returnValues;
        const tx = Tx.epochLength(Number(epochLength));
        setTimeout(() => {
          sendTx(this.txServerPort, tx.hex());
        }, minDelay);
      },
      MinGasPrice: async event => {
        const { minGasPrice } = event.returnValues;
        const tx = Tx.minGasPrice(BigInt(minGasPrice));
        setTimeout(() => {
          sendTx(this.txServerPort, tx.hex());
        }, minDelay);
      },
      ExitStarted: async event => {
        const { txHash, outIndex } = event.returnValues;
        const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
        setTimeout(() => {
          sendTx(this.txServerPort, tx.hex());
        }, minDelay);
      },
      ValidatorJoin: handleJoin,
      ValidatorUpdate: handleJoin,
      ValidatorLogout: async event => {
        const tx = Tx.validatorLogout(
          event.returnValues.slotId,
          event.returnValues.tenderAddr,
          event.returnValues.eventCounter,
          Number(event.returnValues.epoch) + 1,
          event.returnValues.newSigner
        );
        setTimeout(() => {
          sendTx(this.txServerPort, tx.hex());
        }, minDelay);
      },
    });

    await handler(events);
  }
};
