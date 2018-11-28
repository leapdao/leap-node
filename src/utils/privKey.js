/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

exports.readPrivKey = async (app, config, cliArgs) => {
  if (cliArgs.privateKey && (await exists(cliArgs.privateKey))) {
    config.privKey = await readFile(cliArgs.privateKey);
    return;
  }

  const privFilename = path.join(app.lotionPath(), '.priv');
  if (await exists(privFilename)) {
    config.privKey = await readFile(privFilename);
  }
};

exports.writePrivKey = async (app, cliArgs, privateKey) => {
  const privFilename = path.join(app.lotionPath(), '.priv');
  if (
    (!cliArgs.privateKey || !(await exists(cliArgs.privateKey))) &&
    !(await exists(privFilename))
  ) {
    await writeFile(privFilename, privateKey);
  }
};
