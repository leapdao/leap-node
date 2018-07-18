/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const getSlotsByAddr = require('./getSlotsByAddr');

const readFile = promisify(fs.readFile);

module.exports = async (params, node, account) => {
  // console.log(params);

  console.log(`Last block synced: ${node.lastBlockSynced}`);

  const validatorKeyPath = path.join(
    params.lotionPath,
    'config',
    'priv_validator.json'
  );

  const validatorKey = JSON.parse(await readFile(validatorKeyPath, 'utf-8'));
  const validatorID = Buffer.from(
    validatorKey.pub_key.value,
    'base64'
  ).toString('hex');
  const mySlots = await getSlotsByAddr(node.slots, account.address);

  mySlots.forEach(slot => {
    if (
      slot.tendermint.replace('0x', '').toLowerCase() !==
      validatorID.toLowerCase()
    ) {
      console.log(
        `You need to update validator ID in slot ${slot.id} to ${validatorID}`
      );
    }
  });

  if (mySlots.length === 0) {
    console.log('=====');
    console.log('You need to become a validator first');
    console.log('Open http://localhost:3001 and follow instruction');
    console.log(`Validator address: ${account.address}`);
    console.log(`Validator ID: ${validatorID}`);
    console.log('=====');
  }
};
