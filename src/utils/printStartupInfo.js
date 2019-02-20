/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

// const { promisify } = require('util');
// const fs = require('fs');
// const path = require('path');
// const colors = require('colors');
// const getSlotsByAddr = require('./getSlotsByAddr');
// const readSlots = require('./readSlots');
// const readFile = promisify(fs.readFile);
const { logNode } = require('../utils/debug');

module.exports = async (params, bridgeState) => {
  logNode(`Last block synced: ${bridgeState.lastBlockSynced}`);

  // const validatorKeyPath = path.join(
  //   params.lotionPath,
  //   'config',
  //   'priv_validator.json'
  // );

  // const validatorKey = JSON.parse(await readFile(validatorKeyPath, 'utf-8'));
  // const validatorID = Buffer.from(
  //   validatorKey.pub_key.value,
  //   'base64'
  // ).toString('hex');
  // const slots = await readSlots(bridgeState.operatorContract);
  // const mySlots = getSlotsByAddr(slots, bridgeState.account.address);

  // mySlots.forEach(slot => {
  //   if (
  //     slot.tenderKey.replace('0x', '').toLowerCase() !==
  //     validatorID.toLowerCase()
  //   ) {
  //     console.log(
  //       `You need to update validator ID in slot ${slot.id} to ${validatorID}`
  //     );
  //   }
  // });

  // if (mySlots.length === 0) {
  //   console.log('\n');
  //   console.log(
  //     `  ${'You need to become a validator first'.underline.bold.red}`
  //   );
  //   console.log(
  //     `  Open ${colors.bold(
  //       `https://bridge-dev.leapdao.org/${
  //         bridgeState.bridgeContract.options.address
  //       }`
  //     )} and buy a slot`
  //   );
  //   console.log(
  //     `  ${colors.bold('Validator address:')}\t${bridgeState.account.address}`
  //   );
  //   console.log(`  ${colors.bold('Validator ID:')}\t\t${validatorID}`);
  //   console.log('\n');
  // }

  logNode(
    `Network: ${bridgeState.config.network}, Network ID: ${
      bridgeState.networkId
    }`
  );
};
