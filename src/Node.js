/* eslint-disable class-methods-use-this */
const { Tx, Type, Block } = require('parsec-lib');
const BridgeABI = require('./bridgeABI');

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

module.exports = class Node {
  constructor(web3, bridgeAddr, privKey) {
    this.transactionsData = {};
    this.blocksData = {};
    this.chain = [];
    this.baseHeight = 0;
    this.block = null;
    this.bridgeAddr = bridgeAddr;
    this.privKey = privKey;
    this.web3 = web3;
    this.bridge = web3.eth.contract(BridgeABI).at(this.bridgeAddr);
  }

  /*
   * Join, read chain state and other init stuff here
   */
  async init() {
    const [hash, height] = await this.bridge.getTip([
      this.web3.eth.accounts[0],
    ]);
    if (hash === '0x') {
      throw new Error(
        'Looks like you not joined. You can join here: https://parser-node-join-dapp.io'
      );
    }

    this.block = new Block(hash, Number(height));
  }

  /*
   * Returns current block hash
   * @return String
   */
  async getCurrentBlock() {
    return this.block.hash();
  }

  async getBlockNumber() {
    return this.chain.length + this.baseHeight;
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
    this.transactionsData[tx.hash] = tx;
    this.block.addTx(tx.hash);

    return tx.hash;
  }

  /*
   * Submits current block to the bridge
   */
  async submitBlock() {
    await this.bridge.submitBlock(
      this.block.parent,
      this.block.merkelRoot(),
      ...this.block.sign(this.privKey)
    );
    const hash = this.block.hash();
    this.chain.push(hash);
    this.blocksData[hash] = this.block;
    this.block = new Block(this.block.hash(), this.block.height + 1);
  }
};
