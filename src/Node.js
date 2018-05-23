/* eslint-disable class-methods-use-this */
const { Tx, Type, Block } = require('parsec-lib');
const BridgeABI = require('./bridgeABI');
const ContractEventsSubscription = require('./ContractEventsSubscription');

function depositToTx(deposit) {
  console.log('NewDeposit', deposit);
  return new Tx(deposit.height).deposit(
    deposit.depositId,
    deposit.amount,
    deposit.owner
  );
}

function isUnspent(tx) {
  console.log(tx);
  return true;
}

function parseAndValidateTx(node, txData) {
  const tx = Tx.parse(txData);

  if (tx.type !== Type.TRANSFER) {
    throw new Error('Wrong transaction type');
  }

  // check sender address with ins txs «owner» to be sure they can spend it
  const inputTxs = tx.ins
    .map(input => node.transactionsData[input.prevTx])
    .filter(a => a)
    .filter(isUnspent);

  if (inputTxs.length !== tx.ins.length) {
    throw new Error('Wrong inputs');
  }

  return tx;
}

async function sendTransaction(web3, method, bridgeAddr, privKey) {
  const data = method.encodeABI();
  const gas = Math.round((await method.estimateGas()) * 1.2);
  const tx = {
    to: bridgeAddr,
    data,
    gas,
  };
  console.log({ tx });
  const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
  console.log({ signedTx });
  const txResult = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log({ txResult });
  return txResult;
}

module.exports = class Node {
  constructor(web3, bridgeAddr, privKey) {
    this.transactionsData = {};
    this.blocksData = {};
    this.chain = [];
    this.mempool = [];
    this.baseHeight = 0;
    this.block = null;
    this.bridgeAddr = bridgeAddr;
    this.privKey = privKey;
    this.web3 = web3;
    this.bridge = new web3.eth.Contract(BridgeABI, this.bridgeAddr);
    this.account = this.web3.eth.accounts.privateKeyToAccount(privKey);

    const eventsSubscription = new ContractEventsSubscription(
      web3,
      this.bridge
    );
    eventsSubscription.on('NewDeposit', this.handleNewDeposit.bind(this));
    eventsSubscription.on('NewHeight', this.handleNewHeight.bind(this));
  }

  async getOperators() {
    return [
      '0x7159fc66d7df6fa51c99eaf96c160fa8a9ec7287',
      '0x8ccfd031639d8d9f46133859ea80deaf5dee9be3',
      '0x634b47d61f93d2096672743c5e3bcdd25f18c350',
      '0x8db6b632d743aef641146dc943acb64957155388',
      '0x4436373705394267350db2c06613990d34621d69',
    ];
  }

  async getTip() {
    const operators = await this.getOperators();
    const { 0: hash, 1: height } = await this.bridge.methods
      .getTip(operators)
      .call();
    console.log('getTip', hash, Number(height) + 2);
    if (hash === '0x') {
      throw new Error('Something goes wrong. getTip returned empty hash');
    }

    return { hash, height: Number(height) + 2 };
  }

  /*
   * Join, read chain state and other init stuff here
   */
  async init() {
    console.log('init');
  }

  async handleNewHeight(event) {
    console.log('NewHeight', event);
  }

  async handleNewDeposit(event) {
    const deposit = await this.bridgeContract.methods
      .deposits(event.returnValues.depositId)
      .call();

    const tx = depositToTx({
      height: Number(deposit.height),
      owner: deposit.owner,
      amount: Number(deposit.amount),
      depositId: event.returnValues.depositId,
    });

    this.transactionsData[tx.hash()] = tx.toJSON();
    this.mempool.push(tx);
  }

  async getBlockNumber() {
    const { height } = await this.getTip();
    return height;
  }

  getBlockHashByNumber(number) {
    return this.chain[number - this.baseHeight];
  }

  /*
   * Returns block object with transactions
   * @param hashOrNumber String | Number
   * @return Object
   */
  async getBlock(hashOrNumber) {
    const hash =
      typeof hashOrNumber === 'number'
        ? this.getBlockHashByNumber(hashOrNumber)
        : hashOrNumber;
    return this.blocksData[hash];
  }

  /*
   * Returns transaction object
   * @param hash String
   * @return Object
   */
  async getTransaction(hash) {
    return this.transactionsData[hash];
  }

  /*
   * Adds transaction to the current block
   * @param txData String signed UTXO transaction
   * @return String hash
   */
  async sendRawTransaction(txData) {
    const tx = parseAndValidateTx(txData);
    this.transactionsData[tx.hash()] = tx.toJSON();
    this.mempool.push(tx);

    return tx.hash();
  }

  /*
   * Submits current block to the bridge
   */
  async submitBlock() {
    if (this.mempool.length === 0) {
      return;
    }
    const { hash, height } = await this.getTip();
    const blockReward = await this.bridge.methods.blockReward().call();
    const block = new Block(hash, height);
    this.mempool.forEach(tx => block.addTx(tx));
    block.addTx(new Tx().coinbase(blockReward, this.account.address));

    const args = [hash, block.merkleRoot(), ...block.sign(this.privKey)];
    console.log('submitBlock', args);
    const method = this.bridge.methods.submitBlock(...args);
    const txHash = await sendTransaction(
      this.web3,
      method,
      this.bridgeAddr,
      this.privKey
    );
    console.log(txHash);
    // this.chain.push(block.hash());
    this.blocksData[block.hash()] = block;
    this.mempool = [];
  }
};
