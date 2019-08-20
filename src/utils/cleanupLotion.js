/* eslint-disable no-console */

const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const rimraf = promisify(require('rimraf'));

const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

const writeBlankValidatorState = async dataPath => {
  await mkdir(dataPath);
  await writeFile(
    path.join(dataPath, 'priv_validator_state.json'),
    JSON.stringify({
      height: '0',
      round: '0',
      step: 0,
    })
  );
};

module.exports = async app => {
  console.log('Cleaning up...');
  const lotionPath = app.lotionPath();
  if (await exists(lotionPath)) {
    const configPath = path.join(lotionPath, 'config');
    const dataPath = path.join(lotionPath, 'data');
    await rimraf(dataPath);
    await rimraf(path.join(lotionPath, 'merk'));
    await rimraf(path.join(lotionPath, 'leap.db'));
    await rimraf(path.join(configPath, 'addrbook.json'));
    await rimraf(path.join(configPath, 'config.toml'));
    await rimraf(path.join(configPath, 'genesis.json'));
    await writeBlankValidatorState(dataPath);
  }
  console.log('Done ✅');
};
