/* eslint-disable no-console */

const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const rimraf = promisify(require('rimraf'));

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

module.exports = async app => {
  console.log('Cleaning up...');
  const lotionPath = app.lotionPath();
  if (await exists(lotionPath)) {
    const configPath = path.join(lotionPath, 'config');
    const dataPath = path.join(lotionPath, 'data');
    const privValidatorPath = path.join(configPath, 'priv_validator_key.json');
    const privValidator = JSON.parse(await readFile(privValidatorPath));
    await writeFile(
      privValidatorPath,
      JSON.stringify(
        {
          address: privValidator.address,
          pub_key: privValidator.pub_key,
          priv_key: privValidator.priv_key,
        },
        null,
        2
      )
    );

    await rimraf(dataPath);
    await rimraf(path.join(lotionPath, 'merk'));
    await rimraf(path.join(lotionPath, 'leap.db'));
    await rimraf(path.join(configPath, 'addrbook.json'));
    await rimraf(path.join(configPath, 'config.toml'));
    await rimraf(path.join(configPath, 'genesis.json'));
    fs.mkdirSync(dataPath);
    await writeFile(
      path.join(dataPath, 'priv_validator_state.json'),
      JSON.stringify({
        height: '0',
        round: '0',
        step: 0,
      })
    );
  }
  console.log('Done ✅');
};
