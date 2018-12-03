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

const privKeyPath = async (app, cliArgs) => {
  const exists = promisify(fs.exists);

  if (cliArgs.privateKey && (await exists(cliArgs.privateKey))) {
    return cliArgs.privateKey;
  }

  return path.join(app.lotionPath(), '.priv');
};

exports.readPrivKey = async (app, cliArgs) => {
  const exists = promisify(fs.exists);
  const readFile = promisify(fs.readFile);
  const filePath = await privKeyPath(app, cliArgs);

  if (await exists(filePath)) {
    return readFile(filePath, 'utf-8');
  }

  return undefined;
};

exports.writePrivKey = async (app, cliArgs, privateKey) => {
  const exists = promisify(fs.exists);
  const writeFile = promisify(fs.writeFile);
  const filePath = await privKeyPath(app, cliArgs);

  const privFilename = path.join(app.lotionPath(), '.priv');
  if (!(await exists(filePath))) {
    await writeFile(privFilename, privateKey);
  }
};
