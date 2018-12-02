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

const exitABI = require('../abis/exitHandler');
const bridgeABI = require('../abis/bridgeAbi');

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

const fetchAdditionalAddresses = async config => {
  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(config.rootNetwork));
  const exitHandlerContract = new web3.eth.Contract(
    exitABI,
    config.exitHandlerAddr
  );
  const bridgeAddr = await exitHandlerContract.methods.bridge().call();
  const bridgeContract = new web3.eth.Contract(bridgeABI, bridgeAddr);
  const operatorAddr = await bridgeContract.methods.operator().call();
  return {
    ...config,
    bridgeAddr,
    operatorAddr,
  };
};

module.exports = async configPath => {
  let config = urlRegex.test(configPath)
    ? await fetchNodeConfig(configPath)
    : await readConfigFile(configPath);

  if (!config.exitHandlerAddr) {
    throw new Error('exitHandlerAddr is required');
  }

  config = fetchAdditionalAddresses(config);

  return config;
};
