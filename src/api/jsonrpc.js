const express = require('express');
const cors = require('cors');
const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const WsJsonRpcServer = require('rpc-websockets').Server;

const { Util } = require('leap-core');

const getMethods = require('./methods');

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
module.exports = async (bridgeState, tendermintPort, db, app) => {
  const withParams = method => {
    return params => method(...params);
  };

  const { nodeApi, methodsWithCallback } = getMethods(
    bridgeState,
    db,
    app,
    tendermintPort
  );

  api.use(
    jayson
      .server(methodsWithCallback, {
        reviver: (_, value) => Util.fromJSON(JSON.stringify(value)),
        replacer: (_, value) => JSON.parse(Util.toJSON(value)),
      })
      .middleware()
  );

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
