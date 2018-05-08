/* eslint-disable class-methods-use-this */
const { Tx, Type, Block } = require('parsec-lib');
const BridgeABI = require('./bridgeABI');

function isUnspent(tx) {
  console.log(tx);
  return true;
}

module.exports = class Node {
  constructor(web3, bridgeAddr, privKey) {
    this.transactionsData = {};
    this.blocksData = {};
    this.chain = [];
    this.block = null;
    this.bridgeAddr = bridgeAddr;
    this.privKey = privKey;
    this.bridge = web3.eth.contract(BridgeABI).at(this.bridgeAddr);
    this.bridge.genesis.call((err, genesis) => {
      this.block = new Block(genesis, 0);
    });
  }

  /*
   * Returns current block hash
   * @return String
   */
  async getCurrentBlock() {
    return '0x0';
  }

  async getBlockNumber() {
    return 0;
  }

  // ToDo: add block number support
  /*
   * Returns block object with transactions
   * @param hash String
   * @return Object
   */
  async getBlock(hash) {
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
   * @param tx Object
   * @return String hash
   */
  async sendRawTransaction(txData) {
    const tx = Tx.parse(txData);

    if (tx.type !== Type.TRANSFER) {
      throw new Error('Wrong transaction type');
    }

    // check sender address with ins txs «owner» to be sure they can spend it
    const inputTxs = tx.ins
      .map(input => this.transactionsData[input.prevTx])
      .filter(a => a)
      .filter(isUnspent);

    if (inputTxs.length !== tx.ins.length) {
      throw new Error('Wrong inputs');
    }

    // ToDo: get hash somewhere
    this.transactionsData[tx.hash] = tx;

    this.block.addTx(tx.hash);

    return '0x0';
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
    this.block = new Block(this.block.hash(), this.block.height + 1);
  }
};
