/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const url = require('url');
const { helpers } = require('leap-core');
const Web3 = require('web3');
const { promisify } = require('util');
const { logNode } = require('./debug');

const readFile = promisify(fs.readFile);

const defaultConfig = {
  eventsDelay: 0,
  bridgeDelay: 0,
};

const fetchNodeConfig = async nodeUrl => {
  logNode(`Fetching config from: ${nodeUrl}`);
  const web3 = helpers.extendWeb3(new Web3(nodeUrl));
  const config = await web3.getConfig();
  if (config.p2pPort && config.nodeId) {
    const { hostname } = url.parse(nodeUrl);
    config.peers = config.peers || [];
    config.peers.push(`${config.nodeId}@${hostname}:${config.p2pPort}`);
    delete config.p2pPort;
    delete config.nodeId;
  }
  logNode(`Fetched config from: ${nodeUrl}`, config);
  return config;
};

const readConfigFile = async configPath => {
  return JSON.parse(await readFile(configPath));
};

const updateNetwork = async (config, cliRootNetwork) => {
  config.rootNetwork = cliRootNetwork || config.rootNetwork;
  if (!config.rootNetwork) {
    throw new Error(
      'rootNetwork is not defined, please specify it in the config file.'
    );
  }

  const web3 = new Web3(config.rootNetwork);

  const rootNetworkId = await web3.eth.net.getId();

  if (
    config.rootNetworkId !== undefined &&
    rootNetworkId !== config.rootNetworkId
  ) {
    throw new Error(
      `Chain Id mismatch, expected ${config.rootNetworkId}, found ${rootNetworkId}.`
    );
  }

  return { ...config, rootNetworkId };
};

const urlRegex = /^https{0,1}:\/\//;

module.exports = async (configPath, cliRootNetwork) => {
  let config = urlRegex.test(configPath)
    ? await fetchNodeConfig(configPath)
    : await readConfigFile(configPath);

  if (!config.exitHandlerAddr) {
    throw new Error('exitHandlerAddr is required');
  }

  config = await updateNetwork(config, cliRootNetwork);

  return Object.assign({}, defaultConfig, config);
};
