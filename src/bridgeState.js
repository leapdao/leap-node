/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const Web3 = require('web3');
const TinyQueue = require('tinyqueue');
const { Period, Block, Outpoint } = require('leap-core');
const ContractsEventsSubscription = require('./utils/ContractsEventsSubscription');
const { handleEvents } = require('./utils');
const { GENESIS } = require('./utils/constants');
const { logBridge, logNode } = require('./utils/debug');

const bridgeABI = require('./abis/bridgeAbi');
const exitABI = require('./abis/exitHandler');
const singleOperatorABI = require('./abis/singleOperator');
let operatorABI = require('./abis/operator');
const proxyABI = require('./abis/proxy');
const { NFT_COLOR_BASE, NST_COLOR_BASE } = require('./api/methods/constants');
const flags = require('./flags');

module.exports = class BridgeState {
  constructor(db, privKey, config, relayBuffer) {
    this.config = config;
    this.web3 = new Web3(config.rootNetwork);

    this.exitHandlerContract = new this.web3.eth.Contract(
      exitABI.concat(proxyABI),
      config.exitHandlerAddr
    );
    this.bridgeContract = new this.web3.eth.Contract(
      bridgeABI.concat(proxyABI),
      config.bridgeAddr
    );
    // if theta mainnet or theta testnet, use old operator ABI
    if (
      config.rootNetworkId === 448747062 ||
      config.rootNetworkId === 218508104
    ) {
      operatorABI = singleOperatorABI;
    }
    this.operatorContract = new this.web3.eth.Contract(
      operatorABI.concat(proxyABI),
      config.operatorAddr
    );

    this.account = privKey
      ? this.web3.eth.accounts.privateKeyToAccount(privKey)
      : this.web3.eth.accounts.create();

    this.db = db;
    this.blockHeight = 0;
    this.currentState = null;
    this.networkId = config.networkId;
    this.currentPeriod = new Period(GENESIS);
    this.previousPeriod = null;
    this.deposits = {};
    this.exits = {};
    this.tokens = {
      erc20: [],
      erc721: [],
      erc1948: [],
    };
    this.epochLengths = [];
    this.minGasPrices = [];

    this.flags = flags(this, config.flagHeights);

    this.onNewBlock = this.onNewBlock.bind(this);
    this.eventsBuffer = new TinyQueue([], (a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return a.logIndex - b.logIndex;
      }
      return a.blockNumber - b.blockNumber;
    });
    this.bridgeDelay = config.bridgeDelay;
    this.relayBuffer = relayBuffer;
    this.logsCache = {};
    this.submissions = [];
    this.periodHeights = {};
    this.submittedPeriods = {};
    this.exitingUtxos = {};

    this.handleEvents = handleEvents({
      NewDeposit: ({ returnValues: event }) => {
        this.deposits[event.depositId] = {
          depositor: event.depositor,
          color: event.color,
          amount: event.amount,
        };
      },
      NewDepositV2: ({ returnValues: event }) => {
        logBridge(`NewDepositV2. color: ${event.color} amount: ${event.amount} owner: ${event.depositor}`);
        this.deposits[event.depositId] = {
          depositor: event.depositor,
          color: event.color,
          amount: event.amount,
          data: event.data,
        };
      },
      ExitStarted: ({ returnValues: event }) => {
        logBridge(`ExitStarted. color: ${event.color} amount: ${event.amount} utxoId: ${event.txHash}:${event.outIndex}`);
        const outpoint = new Outpoint(event.txHash, Number(event.outIndex));
        this.exits[outpoint.getUtxoId()] = {
          txHash: event.txHash,
          outIndex: Number(event.outIndex),
          exitor: event.exitor,
          color: event.color,
          amount: event.amount,
        };
      },
      ExitStartedV2: ({ returnValues: event }) => {
        logBridge(`ExitStartedV2. color: ${event.color} amount: ${event.amount} utxoId: ${event.txHash}:${event.outIndex}`);
        const outpoint = new Outpoint(event.txHash, Number(event.outIndex));
        this.exits[outpoint.getUtxoId()] = {
          txHash: event.txHash,
          outIndex: Number(event.outIndex),
          exitor: event.exitor,
          color: event.color,
          amount: event.amount,
          data: event.data,
        };
      },
      NewToken: ({ returnValues: event }) => {
        logBridge('NewToken. color: ', event.color, ' addr: ', event.tokenAddr);
        let array = this.tokens.erc20;

        if (event.color >= NST_COLOR_BASE) {
          array = this.tokens.erc1948;
        } else if (event.color >= NFT_COLOR_BASE) {
          array = this.tokens.erc721;
        }

        if (array.indexOf(event.tokenAddr) === -1) {
          array.push(event.tokenAddr);
        }
      },
      EpochLength: event => {
        logBridge('EpochLength. epochLength: ', event.returnValues.epochLength);
        const { blockNumber, returnValues } = event;
        this.epochLengths.push([
          Number(returnValues.epochLength),
          Number(blockNumber),
        ]);
      },
      MinGasPrice: ({ returnValues: event }) => {
        this.minGasPrices.push(Number(event.minGasPrice));
      },
      Submission: ({ returnValues: event }) => {
        logBridge(
          'Submission. blocksRoot: ', event.blocksRoot, ' periodRoot: ', event.periodRoot,
          ' slotId: ', event.slotId, ' validator: ', event.owner, ' casBitmap: ', event.casBitmap
        );
        this.lastBlocksRoot = event.blocksRoot;
        this.lastPeriodRoot = event.periodRoot;
        this.submittedPeriods[this.lastBlocksRoot] = true;
        const blockHeight = this.periodHeights[this.lastBlocksRoot] - 1;
        const [periodStart] = Period.periodBlockRange(blockHeight);
        this.submissions.push({
          periodStart,
          casBitmap: event.casBitmap,
          slotId: event.slotId,
          validatorAddress: event.owner,
        });
      },
    });

    this.handleExitingUtxos = handleEvents({
      ExitStarted: ({ returnValues: event }) => {
        const outpoint = new Outpoint(event.txHash, Number(event.outIndex));
        this.exitingUtxos[outpoint.hex()] = {
          txHash: event.txHash,
          outIndex: Number(event.outIndex),
          exitor: event.exitor,
          color: event.color,
          amount: event.amount,
        };
      },
    });
  }

  async init() {
    logNode('Syncing events...');
    this.lastBlockSynced = await this.db.getLastBlockSynced();
    const genesisBlock = await this.bridgeContract.methods
      .genesisBlockNumber()
      .call();
    const contracts = [
      this.operatorContract,
      this.bridgeContract,
      this.exitHandlerContract,
    ];
    this.eventsSubscription = new ContractsEventsSubscription(
      this.web3,
      contracts,
      this.eventsBuffer,
      parseInt(genesisBlock, 10)
    );
    const blockNumber = await this.web3.eth.getBlockNumber();
    await this.eventsSubscription.init();
    await this.onNewBlock(blockNumber);
    await this.initBlocks();

    if (this.lastBlocksRoot && this.lastPeriodRoot) {
      this.currentPeriod = new Period(this.lastBlocksRoot);
    }

    this.exitEventSubscription = new ContractsEventsSubscription(
      this.web3,
      [this.exitHandlerContract],
      [],
      blockNumber - this.bridgeDelay,
      'ExitStarted'
    );
    this.exitEventSubscription.on('newEvents', this.handleExitingUtxos);
    this.exitEventSubscription.init();

    logNode('Synced');
  }

  async initBlocks() {
    const blockOptions = {
      timestamp: Math.round(Date.now() / 1000),
    };
    const blocks = [new Block(0, blockOptions), new Block(1, blockOptions)];

    blocks.forEach(b => this.currentPeriod.addBlock(b));
    await Promise.all(blocks.map(b => this.db.storeBlock(b)));
  }

  async onNewBlock(blockNumber) {
    if (this.eventsBuffer.length === 0) {
      return;
    }

    const events = [];

    while (
      this.eventsBuffer.peek().blockNumber <=
      blockNumber - this.bridgeDelay
    ) {
      const event = this.eventsBuffer.pop();

      events.push(event);

      if (this.eventsBuffer.length === 0) {
        break;
      }
    }

    await this.handleEvents(events);

    // now push to second buffer
    for (const event of events) {
      this.relayBuffer.push(event);
    }
  }

  async saveSubmissions() {
    if (!this.submissions.length) return;
    this.db.storePeriods(this.submissions).then(() => {
      this.submissions = [];
    });
  }

  async saveState() {
    this.currentState.blockHeight = this.blockHeight;
    this.db.storeChainState(this.currentState);
  }

  async loadState() {
    const res = await this.db.getChainState();
    this.currentState = res || {
      blockHeight: 0,
      mempool: [],
      balances: {}, // stores account balances like this { [colorIndex]: { address1: 0, ... } }
      owners: {}, // index for NFT ownerOf call
      unspent: {}, // stores unspent outputs (deposits, transfers)
      processedDeposit: 0,
      slots: [],
      epoch: {
        epoch: 0,
        lastEpochHeight: 0,
        epochLength: null,
        epochLengthIndex: -1,
      },
      gas: {
        minPrice: 0,
        minPriceIndex: -1,
      },
    };

    return this.currentState;
  }
};
