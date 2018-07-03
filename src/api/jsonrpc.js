const express = require('express');
const cors = require('cors');
const jsonrpc = require('connect-jsonrpc');
const WsJsonRpcServer = require('rpc-websockets').Server;

const { INVALID_PARAMS } = jsonrpc;
const { Tx, Block, Util } = require('parsec-lib');

const sendTx = require('../txHelpers/sendTx');
const { unspentForAddress } = require('../utils');

const api = express();

api.use(
  cors({
    origin: '*',
  })
);

/*
* Starts JSON RPC server
*/
module.exports = async (node, config, lotionPort, db) => {
  const getNetwork = async () => node.networkId;

  const getBalance = async (address, tag = 'latest') => {
    if (tag !== 'latest') {
      /* eslint-disable no-throw-literal */
      throw {
        code: INVALID_PARAMS,
        message: 'Only balance for latest block is supported.',
      };
      /* eslint-enable no-throw-literal */
    }
    const balance = node.currentState.balances[address] || 0;
    return `0x${balance.toString(16)}`;
  };

  const getBlockNumber = async () => {
    return `0x${node.blockHeight.toString(16)}`;
  };

  const getUnspent = async address => {
    const { unspent } = node.currentState;
    return unspentForAddress(unspent, address);
  };

  const sendRawTransaction = async rawTx => {
    const data = Buffer.from(rawTx.data);
    const tx = Tx.fromRaw(data);
    await sendTx(lotionPort, `0x${data.toString('hex')}`);
    return tx.hash();
  };

  const txResponse = async (tx, blockHash, height, txPos) => {
    let from = '';
    if (tx.inputs && tx.inputs.length > 0 && tx.inputs[0].prevout) {
      const prevTxHash = tx.inputs[0].prevout.hash;
      const outputIndex = tx.inputs[0].prevout.index;
      const txDoc = await db.getTransaction(Util.toHexString(prevTxHash));
      if (txDoc) {
        from = Tx.fromJSON(txDoc.txData).outputs[outputIndex].address;
      }
    }
    return {
      hash: tx.hash(),
      from,
      raw: tx.hex(),
      blockHash,
      blockNumber: `0x${height.toString(16)}`,
      transactionIndex: txPos,
      // assuming first output is transfer, second one is change
      value: tx.outputs ? tx.outputs[0].value : null,
      to: tx.outputs ? tx.outputs[0].address : null,
      gas: '0x0',
      gasPrice: '0x0',
    };
  };

  const getTransactionByHash = async hash => {
    const txDoc = await db.getTransaction(hash);
    if (!txDoc) return null; // return null as Infura does

    const { txData, blockHash, height, txPos } = txDoc;
    return await txResponse(Tx.fromJSON(txData), blockHash, height, txPos); // eslint-disable-line no-return-await
  };

  const getBlockByHash = async (hash, showFullTxs = false) => {
    if (!hash) return null;
    const blockDoc = await db.getBlock(hash);
    if (!blockDoc) return null;

    const { blockData, height } = blockDoc;
    const block = Block.fromJSON(blockData);
    const txs = !showFullTxs
      ? block.txHashList
      : await Promise.all(
          block.txList.map((tx, pos) => txResponse(tx, hash, height, pos))
        );
    return {
      number: `0x${height.toString(16)}`,
      hash,
      parentHash: block.parent,
      size: `0x${block.hex().length.toString(16)}`,
      timestamp: `0x${block.timestamp.toString(16)}`,
      transactions: txs,
      uncles: [],
    };
  };

  const getBlockByNumber = async (heightOrTag, showFullTxs = false) => {
    let height = heightOrTag;
    if (heightOrTag === 'latest') {
      height = node.blockHeight;
    } else if (typeof height === 'string' && height.indexOf('0x') === 0) {
      height = parseInt(height, 16);
    }
    const blockDoc = await db.getBlock(height);
    return getBlockByHash(blockDoc, showFullTxs);
  };

  const withCallback = method => {
    return (...args) => {
      const cb = args.pop();
      method(...args)
        .then(result => cb(null, result))
        .catch(e => cb(e));
    };
  };

  const withParams = method => {
    return params => method(...params);
  };

  const nodeApi = {
    net_version: getNetwork,
    eth_blockNumber: getBlockNumber,
    eth_getBalance: getBalance,
    eth_sendRawTransaction: sendRawTransaction,
    eth_getTransactionByHash: getTransactionByHash,
    eth_getTransactionReceipt: getTransactionByHash,
    eth_getBlockByHash: getBlockByHash,
    eth_getBlockByNumber: getBlockByNumber,
    parsec_unspent: getUnspent,
  };

  api.use(
    jsonrpc(
      Object.keys(nodeApi).reduce((set, key) => {
        set[key] = withCallback(nodeApi[key]);
        return set;
      }, {})
    )
  );

  return {
    listenHttp: async ({ host, port }) => {
      return new Promise(resolve => {
        const server = api.listen(port || 8545, host || 'localhost', () => {
          resolve(server.address());
        });
      });
    },
    listenWs: ({ host, port }) => {
      const wsServer = new WsJsonRpcServer({
        port: port || 8546,
        host: host || 'localhost',
      });

      // register an RPC method
      Object.keys(nodeApi).forEach(key => {
        wsServer.register(key.toString(), withParams(nodeApi[key]));
      });

      return new Promise(resolve => {
        wsServer.on('listening', () => {
          return resolve({
            address: wsServer.wss.options.host,
            port: wsServer.wss.options.port,
          });
        });
      });
    },
  };
};
