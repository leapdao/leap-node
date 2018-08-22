const express = require('express');
const cors = require('cors');
const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const WsJsonRpcServer = require('rpc-websockets').Server;

const { Tx, Block, Util } = require('parsec-lib');

const sendTx = require('../txHelpers/sendTx');
const { unspentForAddress, range, isNFT } = require('../utils');

// JSON RPC 2.0 invalid params error code
const INVALID_PARAMS = -32602;

const api = express();

api.use(
  cors({
    origin: '*',
  })
);

api.use(jsonParser());

/*
* Starts JSON RPC server
*/
module.exports = async (bridgeState, lotionPort, db, app) => {
  const getNetwork = async () => bridgeState.networkId;

  const getBalance = async (address, tag = 'latest') => {
    if (tag !== 'latest') {
      /* eslint-disable no-throw-literal */
      throw {
        code: INVALID_PARAMS,
        message: 'Only balance for latest block is supported.',
      };
      /* eslint-enable no-throw-literal */
    }
    const balances = bridgeState.currentState.balances['0'] || {};
    const balance = balances[address] || 0;
    return `0x${balance.toString(16)}`;
  };

  const getBlockNumber = async () => {
    return `0x${bridgeState.blockHeight.toString(16)}`;
  };

  const getUnspent = async address => {
    const { unspent } = bridgeState.currentState;
    return unspentForAddress(unspent, address);
  };

  let tokens = [];
  const getColors = async () => {
    const tokenCount = await bridgeState.contract.methods.tokenCount().call();
    if (tokenCount !== tokens.length) {
      const tokenData = range(0, tokenCount - 1).map(i =>
        bridgeState.contract.methods.tokens(i).call()
      );

      tokens = (await Promise.all(tokenData)).map(o => o.addr.toLowerCase());
    }

    return tokens;
  };

  const getColor = async address => {
    const colors = await getColors();

    const color = colors.indexOf(address);
    if (color === -1) {
      /* eslint-disable no-throw-literal */
      throw {
        code: INVALID_PARAMS,
        message: 'Unknown token address',
      };
      /* eslint-enable no-throw-literal */
    }

    return `0x${color.toString(16)}`;
  };

  const getNodeStatus = async () => {
    const status = await app.status();
    if (status.sync_info.catching_up) {
      return 'catching-up';
    }

    if (bridgeState.checkCallsCount > 0) {
      return 'waiting-for-period';
    }

    return 'ok';
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
      value: tx.outputs && tx.outputs.length ? tx.outputs[0].value : 0,
      to: tx.outputs && tx.outputs.length ? tx.outputs[0].address : null,
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
      height = bridgeState.blockHeight;
    } else if (typeof height === 'string' && height.indexOf('0x') === 0) {
      height = parseInt(height, 16);
    }
    const blockDoc = await db.getBlock(height);
    return getBlockByHash(blockDoc, showFullTxs);
  };

  const executeCall = async (txObj, tag) => {
    if (tag !== 'latest') {
      /* eslint-disable no-throw-literal */
      throw {
        code: INVALID_PARAMS,
        message: 'Only call for latest block is supported.',
      };
      /* eslint-enable no-throw-literal */
    }

    const method = txObj.data.substring(0, 10);
    switch (method) {
      // balanceOf(address)
      case '0x70a08231': {
        const color = parseInt(await getColor(txObj.to), 16);
        const address = `0x${txObj.data.substring(10, 50)}`;
        const balances = bridgeState.currentState.balances[color] || {};
        if (isNFT(color)) {
          const nfts = balances[address] || [];
          return `0x${nfts.length.toString(16)}`;
        }

        const balance = balances[address] || 0;
        return `0x${balance.toString(16)}`;
      }

      // tokenOfOwnerByIndex(address,uint256)
      case '0x2f745c59': {
        const color = parseInt(await getColor(txObj.to), 16);
        const address = `0x${txObj.data.substring(10, 50)}`;
        const index = `0x${txObj.data.substring(50)}`;
        const balances = bridgeState.currentState.balances[color] || {};
        if (isNFT(color)) {
          const nfts = balances[address] || [];
          if (!nfts[index]) {
            /* eslint-disable no-throw-literal */
            throw {
              code: INVALID_PARAMS,
              message: 'Index overflow',
            };
            /* eslint-enable */
          }
          return `0x${nfts[index].toString(16)}`;
        }

        /* eslint-disable no-throw-literal */
        throw {
          code: INVALID_PARAMS,
          message: 'Only for NFT',
        };
        /* eslint-enable */
      }
      default:
    }
    /* eslint-disable no-throw-literal */
    throw {
      code: INVALID_PARAMS,
      message: `Method call ${method} is not supported`,
    };
    /* eslint-enable */
  };

  const withCallback = method => {
    return function handler(args, cb) {
      method(...args)
        .then(result => cb(null, result))
        .catch(e => cb(this.error(e.code, e.message)));
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
    eth_call: executeCall,
    parsec_unspent: getUnspent,
    parsec_getColor: getColor,
    parsec_getColors: getColors,
    parsec_status: getNodeStatus,
  };

  const apiMethodsWithCallback = Object.keys(nodeApi).reduce((set, key) => {
    set[key] = withCallback(nodeApi[key]);
    return set;
  }, {});

  api.use(jayson.server(apiMethodsWithCallback).middleware());

  return {
    listenHttp: async ({ host, port }) => {
      return new Promise(resolve => {
        const server = api.listen(port || 8645, host || 'localhost', () => {
          resolve(server.address());
        });
      });
    },
    listenWs: ({ host, port }) => {
      const wsServer = new WsJsonRpcServer({
        port: port || 8646,
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
