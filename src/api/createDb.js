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
  const storeBlock = async (block, logsCache) => {
    const dbOpsBatch = levelDb.batch();
    block.txList.forEach((tx, txPos) => {
      const txHash = tx.hash();
      const txKey = `tx!${txHash}`;
      const value = {
        txData: tx.toJSON(),
        blockHash: block.hash(),
        height: block.height,
        txPos,
      };
      if (logsCache && logsCache[txHash]) {
        value.logs = [...logsCache[txHash]]; // copy array
        delete logsCache[txHash];
      }
      dbOpsBatch.put(txKey, JSON.stringify(value));

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
        if (jsonStr === null || jsonStr === undefined) return null;
        if (jsonStr.indexOf && jsonStr.indexOf('0x') === 0) return jsonStr;
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

  const getNodeState = () => {
    return getNullable('nodeState');
  };

  const storeNodeState = async state => {
    await levelDb.put('nodeState', JSON.stringify(state));
  };

  const getPeriodData = periodStart => getNullable(`period!${periodStart}`);

  const getPeriodDataByBlocksRoot = blocksRoot => {
    return getNullable(`period!${blocksRoot}`).then(periodDataKey => {
      if (!periodDataKey) return null;
      return getNullable(periodDataKey);
    });
  };

  const storeSubmission = async (periodStartHeight, submission) => {
    const existingRecord = await getPeriodDataByBlocksRoot(
      submission.blocksRoot
    );
    // skip saving if record with the same root exists, otherwise overwrite
    if (existingRecord && existingRecord.blocksRoot === submission.blocksRoot) {
      return Promise.resolve();
    }

    const dbOpsBatch = levelDb.batch();
    const key = `period!${periodStartHeight}`;
    dbOpsBatch.put(`period!${submission.blocksRoot}`, key);
    dbOpsBatch.put(key, JSON.stringify(submission));

    return new Promise(resolve => {
      dbOpsBatch.write(resolve);
    });
  };

  /*
   * Returns the last seen root chain block height. If there is no such a number, returns 0.
   */
  const getLastSeenRootChainBlock = () =>
    levelDb.get('lastSeenRootChainBlock').catch(() => 0);

  /*
   * Saves last seen root chain block height
   */
  const setLastSeenRootChainBlock = (blockHeight = 0) =>
    levelDb.put('lastSeenRootChainBlock', blockHeight);

  const setStalePeriodProposal = periodProposal =>
    levelDb.put('stalePeriodProposal', JSON.stringify(periodProposal));

  const getStalePeriodProposal = () => getNullable('stalePeriodProposal');

  return {
    getLastBlockSynced,
    storeBlock,
    getBlock,
    getTransaction,
    getTransactionByPrevOut,
    getChainState,
    getNodeState,
    storeChainState,
    storeSubmission,
    storeNodeState,
    getPeriodData,
    getLastSeenRootChainBlock,
    setLastSeenRootChainBlock,
    getPeriodDataByBlocksRoot,
    setStalePeriodProposal,
    getStalePeriodProposal,
  };
};

module.exports = createDb;
