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

const urlRegex = /^https{0,1}:\/\//;

module.exports = async configPath => {
  const config = urlRegex.test(configPath)
    ? await fetchNodeConfig(configPath)
    : await readConfigFile(configPath);

  if (!config.bridgeAddr) {
    throw new Error('bridgeAddr is required');
  }

  return config;
};
