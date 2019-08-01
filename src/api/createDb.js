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
      const txKey = `tx!${tx.hash()}`;
      dbOpsBatch.put(
        txKey,
        JSON.stringify({
          txData: tx.toJSON(),
          blockHash: block.hash(),
          height: block.height,
          txPos,
        })
      );

      // create 'utxoId → tx' index
      tx.inputs
        .filter(i => i.isSpend())
        .map(i => `${i.prevout.txid()}:${i.prevout.index}`)
        .forEach(utxo => dbOpsBatch.put(`out!${utxo}`, txKey));
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
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          return jsonStr;
        }
      })
      .catch(e => {
        if (e.type === 'NotFoundError') return null;
        throw e;
      });
  };

  /*
   * Returns block data for a given hash
   */
  const getBlock = hash => {
    return getNullable(`block!${hash}`);
  };

  /*
   * Returns tx data for a given hash
   */
  const getTransaction = hash => {
    return getNullable(`tx!${hash}`);
  };

  /*
   * Returns tx data for tx spending a given utxo
   */
  const getTransactionByPrevOut = outpoint => {
    return getNullable(`out!${outpoint}`).then(txKey => {
      if (!txKey) return null;
      return getNullable(txKey);
    });
  };

  /*
   * Returns the `BridgeState.currentState` or null
   */
  const getChainState = () => {
    return getNullable('chainState');
  };

  /*
   * Saves the `BridgeState.currentState`
   */
  const storeChainState = async state => {
    await levelDb.put('chainState', JSON.stringify(state));
  };

  return {
    getLastBlockSynced,
    storeBlock,
    getBlock,
    getTransaction,
    getTransactionByPrevOut,
    getChainState,
    storeChainState,
  };
};

module.exports = createDb;
