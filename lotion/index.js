/* eslint-disable no-await-in-loop */

const getPort = require('get-port');
const fs = require('fs-extra');
const level = require('level');
const axios = require('axios');
const { join } = require('path');
const ABCIServer = require('./lib/abci-app.js');
const Tendermint = require('./lib/tendermint.js');
const rimraf = require('rimraf');
const generateNetworkId = require('./lib/network-id.js');
const os = require('os');
const { EventEmitter } = require('events');

const LOTION_HOME = process.env.LOTION_HOME || join(os.homedir(), '.lotion');

async function getPorts(peeringPort, rpcPort, abciAppPort) {
  const p2pPort =
    process.env.P2P_PORT || peeringPort || (await getPort(peeringPort));
  const tendermintPort =
    process.env.TENDERMINT_PORT || rpcPort || (await getPort(rpcPort));
  const abciPort = process.env.ABCI_PORT || abciAppPort || (await getPort());

  return { tendermintPort, abciPort, p2pPort };
}

function getGenesis(genesisPath) {
  return fs.readFileSync(genesisPath, { encoding: 'utf8' });
}

function Lotion(opts = {}) {
  const peers = opts.peers || [];
  const logTendermint = opts.logTendermint || false;
  const createEmptyBlocks =
    typeof opts.createEmptyBlocks === 'undefined'
      ? true
      : opts.createEmptyBlocks;
  const devMode = opts.devMode || false;
  const { unsafeRpc, readonlyValidator } = opts;
  const txMiddleware = [];
  const queryMiddleware = [];
  const blockMiddleware = [];
  const periodMiddleware = [];
  const initChainMiddleware = [];
  const postListenMiddleware = [];
  const txEndpoints = [];
  const keys =
    typeof opts.keys === 'string'
      ? JSON.parse(fs.readFileSync(opts.keys, { encoding: 'utf8' }))
      : opts.keys;
  const genesis =
    typeof opts.genesis === 'string'
      ? JSON.parse(getGenesis(opts.genesis))
      : opts.genesis;

  const bus = new EventEmitter();
  let appInfo;
  let abciServer;
  let tendermint;
  let lotionPath;

  const networkId =
    opts.networkId ||
    generateNetworkId(
      txMiddleware,
      blockMiddleware,
      queryMiddleware,
      devMode,
      genesis
    );
  lotionPath = join(LOTION_HOME, 'networks', networkId);

  if (devMode) {
    lotionPath += Math.floor(Math.random() * 1e9);
    rimraf.sync(lotionPath);
    process.on('SIGINT', () => {
      rimraf.sync(lotionPath);
      process.exit();
    });
  }
  fs.mkdirpSync(lotionPath);

  bus.on('listen', () => {
    postListenMiddleware.forEach(f => {
      f(appInfo);
    });
  });

  const appMethods = {
    use: middleware => {
      if (middleware instanceof Array) {
        middleware.forEach(appMethods.use);
      } else if (typeof middleware === 'function') {
        appMethods.useTx(middleware);
      } else if (middleware.type === 'tx') {
        appMethods.useTx(middleware.middleware);
      } else if (middleware.type === 'query') {
        appMethods.useQuery(middleware.middleware);
      } else if (middleware.type === 'block') {
        appMethods.useBlock(middleware.middleware);
      } else if (middleware.type === 'period') {
        appMethods.usePeriod(middleware.middleware);
      } else if (middleware.type === 'initChain') {
        appMethods.useInitChain(middleware.middleware);
      } else if (middleware.type === 'post-listen') {
        appMethods.usePostListen(middleware.middleware);
      }
      return appMethods;
    },
    useTx: txHandler => {
      txMiddleware.push(txHandler);
    },
    useBlock: blockHandler => {
      blockMiddleware.push(blockHandler);
    },
    usePeriod: periodHandler => {
      periodMiddleware.push(periodHandler);
    },
    useInitChain: initChainHandler => {
      initChainMiddleware.push(initChainHandler);
    },
    useQuery: queryHandler => {
      queryMiddleware.push(queryHandler);
    },
    usePostListen: postListener => {
      // TODO: rename "post listen", there's probably a more descriptive name.
      postListenMiddleware.push(postListener);
    },
    listen: (store) => {
      return new Promise(async resolve => {
        // set up abci server, then tendermint node
        const { tendermintPort, abciPort, p2pPort } = await getPorts(
          opts.p2pPort,
          opts.tendermintPort,
          opts.abciPort
        );

        const { tendermintAddr } = opts;
        const tendermintRpcUrl = `http://localhost:${tendermintPort}`;

        abciServer = ABCIServer({
          txMiddleware,
          blockMiddleware,
          queryMiddleware,
          store,
          periodMiddleware,
          initChainMiddleware,
        });
        abciServer.listen(abciPort, 'localhost');

        try {
          tendermint = await Tendermint({
            lotionPath,
            tendermintAddr,
            tendermintPort,
            abciPort,
            p2pPort,
            logTendermint,
            createEmptyBlocks,
            networkId,
            peers,
            genesis,
            keys,
            unsafeRpc,
            readonlyValidator,
          });
        } catch (e) {
          console.log('error starting tendermint node:');
          console.log(e);
          // exit here, it makes no sense to keep running without tendermint
          process.exit(1);
        }

        await tendermint.synced;

        appInfo = {
          tendermintPort,
          abciPort,
          p2pPort,
          lotionPath,
          genesisPath: join(lotionPath, 'config', 'genesis.json'),
        };

        bus.emit('listen');
        resolve(appInfo);
      });
    },
    close: () => {
      abciServer.close();
      tendermint.close();
    },
    info: () => appInfo,
    lotionPath: () => lotionPath,
    status: async () => {
      const { tendermintPort } = await getPorts(undefined, opts.tendermintPort);
      const tendermintRpcUrl = `http://localhost:${tendermintPort}`;
      return axios
        .get(`${tendermintRpcUrl}/status`)
        .then(rsp => rsp.data.result);
    },
  };

  return appMethods;
}

module.exports = Lotion;
