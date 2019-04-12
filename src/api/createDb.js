const createDb = levelDb => {
  /*
   * Returns last synced block number from the db. If there is no such a number, returns 0
   */
  const getLastBlockSynced = () =>
    levelDb.get('lastBlockSynced').catch(maybeNotFound => 0); // eslint-disable-line no-unused-vars

  /*
   * Stores block and all it's txs into level db.
   * Sets lastBlockSynced value to the given block height.
   */
  const storeBlock = async block => {
    const dbOpsBatch = levelDb.batch();
    block.txList.forEach((tx, txPos) => {
      dbOpsBatch.put(
        `tx!${tx.hash()}`,
        JSON.stringify({
          txData: tx.toJSON(),
          blockHash: block.hash(),
          height: block.height,
          txPos,
        })
      );
    });

    dbOpsBatch.put(
      `block!${block.hash()}`,
      JSON.stringify({
        blockData: block.toJSON(),
        height: block.height,
      })
    );

    // index blocks by height for getBlockByNumber
    dbOpsBatch.put(`block!${block.height}`, block.hash());

    dbOpsBatch.put('lastBlockSynced', block.height);

    return new Promise(resolve => {
      dbOpsBatch.write(resolve);
    });
  };

  const getNullable = key => {
    return levelDb
      .get(key)
      .then(jsonStr => {
        // hash, not object
        if (jsonStr.indexOf('0x') === 0) return jsonStr;
        return JSON.parse(jsonStr);
      })
      .catch(e => {
        if (e.type === 'NotFoundError') return null;
        throw e;
      });
  };

  /*
   * Returns block data for given hash
   */
  const getBlock = hash => {
    return getNullable(`block!${hash}`);
  };

  /*
   * Returns tx data for given hash
   */
  const getTransaction = hash => {
    return getNullable(`tx!${hash}`);
  };

  return {
    getLastBlockSynced,
    storeBlock,
    getBlock,
    getTransaction,
  };
};

module.exports = createDb;
