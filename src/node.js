const { Period, Outpoint } = require('parsec-lib');
const ContractEventsSubscription = require('./eventsRelay/ContractEventsSubscription');
const { readSlots } = require('./utils');

module.exports = class Node {
  constructor(db, web3, bridge, networkId) {
    this.db = db;
    this.web3 = web3;
    this.bridge = bridge;
    this.replay = true;
    this.blockHeight = 0;
    this.currentState = null;
    this.networkId = networkId;
    this.currentPeriod = new Period();
    this.previousPeriod = null;
    this.deposits = {};
    this.exits = {};
    this.slots = [];
  }

  async init() {
    this.lastBlockSynced = await this.db.getLastBlockSynced();
    await this.watchContractEvents();
  }

  async watchContractEvents() {
    this.slots = await readSlots(this.bridge);

    const eventsSubscription = new ContractEventsSubscription(
      this.web3,
      this.bridge
    );
    eventsSubscription.on('NewDeposit', events => {
      events.forEach(
        ({ returnValues: { depositId, depositor, color, amount } }) => {
          this.deposits[depositId] = {
            depositor,
            color,
            amount,
          };
        }
      );
    });
    eventsSubscription.on('ExitStarted', events => {
      events.forEach(
        ({ returnValues: { txHash, outIndex, color, exitor, amount } }) => {
          const outpoint = new Outpoint(txHash, outIndex);
          this.exits[outpoint.getUtxoId()] = {
            txHash,
            outIndex,
            exitor,
            color,
            amount,
          };
        }
      );
    });
    await eventsSubscription.init();

    const updateSlots = async () => {
      this.slots = await readSlots(this.bridge);
    };
    eventsSubscription.on('ValidatorJoin', updateSlots);
    eventsSubscription.on('ValidatorLogout', updateSlots);
    eventsSubscription.on('ValidatorLeave', updateSlots);
    eventsSubscription.on('ValidatorUpdate', updateSlots);
  }
};
