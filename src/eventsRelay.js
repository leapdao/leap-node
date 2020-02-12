/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Tx, Input, Outpoint } = require('leap-core');
const TinyQueue = require('tinyqueue');

const { handleEvents } = require('./utils');
const { logBridge } = require('./utils/debug');

module.exports = class EventsRelay {
  constructor(delay, fromBlock, { sendDelayed }) {
    this.relayBuffer = new TinyQueue([], (a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return a.logIndex - b.logIndex;
      }
      return a.blockNumber - b.blockNumber;
    });
    this.relayDelay = delay;
    this.sendDelayed = sendDelayed;
    this.fromBlock = fromBlock;
    this.blockHeight = fromBlock;

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

      // skip if we relayed already
      if (event.blockNumber >= this.fromBlock) {
        events.push(event);
      }

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
      logBridge(
        `${event.event}. slotId: ${slotId} signerAddr: ${signerAddr} tenderAddr: ${tenderAddr}`
      );
      const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
      this.sendDelayed(tx);
    };

    const handler = handleEvents({
      NewDeposit: async ({ returnValues: event }) => {
        const color = Number(event.color);
        const value = BigInt(event.amount);
        const tx = Tx.deposit(event.depositId, value, event.depositor, color);
        this.sendDelayed(tx);
      },
      NewDepositV2: async ({ returnValues: event }) => {
        const color = Number(event.color);
        const value = BigInt(event.amount);
        const tx = Tx.deposit(
          event.depositId,
          value,
          event.depositor,
          color,
          event.data
        );
        this.sendDelayed(tx);
      },
      EpochLength: async event => {
        const { epochLength } = event.returnValues;
        const tx = Tx.epochLength(
          Number(epochLength),
          Number(event.blockNumber)
        );
        this.sendDelayed(tx);
      },
      MinGasPrice: async event => {
        const { minGasPrice } = event.returnValues;
        const tx = Tx.minGasPrice(BigInt(minGasPrice));
        this.sendDelayed(tx);
      },
      ExitStarted: async event => {
        const { txHash, outIndex } = event.returnValues;
        const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
        this.sendDelayed(tx);
      },
      ExitStartedV2: async event => {
        const { txHash, outIndex } = event.returnValues;
        const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
        this.sendDelayed(tx);
      },
      ValidatorJoin: handleJoin,
      ValidatorUpdate: handleJoin,
      ValidatorLogout: async event => {
        const {
          slotId,
          tenderAddr,
          eventCounter,
          epoch,
          newSigner,
        } = event.returnValues;
        logBridge(
          `ValidatorLogout. slotId: ${slotId} epoch: ${epoch} newSigner: ${newSigner} tenderAddr: ${tenderAddr}`
        );
        const tx = Tx.validatorLogout(
          slotId,
          tenderAddr,
          eventCounter,
          Number(epoch) + 1,
          newSigner
        );
        this.sendDelayed(tx);
      },
    });

    await handler(events);
    this.blockHeight = blockNumber;
  }
};
