/* eslint-disable class-methods-use-this */

module.exports = class Node {
  /*
   * Returns current block hash
   * @return String
   */
  async getCurrentBlock() {
    return '0x0';
  }

  // ToDo: add block number support
  /*
   * Returns block object with transactions
   * @param hash String
   * @return Object
   */
  async getBlock(hash) {
    return {
      hash,
      parentHash: '0x0',
      size: 0,
      transactions: [
        {
          hash: '0x0',
          from: '0x0',
          to: '0x0',
          value: 0,
          input: '0x0',
        },
      ],
    };
  }

  /*
   * Returns transaction object
   * @param hash String
   * @return Object
   */
  async getTransaction(hash) {
    return {
      hash,
      from: '0x0',
      to: '0x0',
      value: 0,
      input: '0x0',
    };
  }

  /*
   * Adds transaction to the current block
   * @param tx Object
   * @return String hash
   */
  async sendTransaction(tx) {
    console.log(tx);
    return '0x0';
  }

  /*
   * Submits current block to the bridge
   */
  submitBlock() {}
};
