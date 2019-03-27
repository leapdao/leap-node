const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

module.exports = async (bridgeState, app) => {
  const validatorKeyPath = path.join(
    app.lotionPath(),
    'config',
    'priv_validator_key.json'
  );
  const validatorKey = JSON.parse(await readFile(validatorKeyPath, 'utf-8'));
  const validatorID = Buffer.from(
    validatorKey.pub_key.value,
    'base64'
  ).toString('hex');

  const data = {
    ethAddress: bridgeState.account.address,
    tendermintAddress: validatorID,
  };

  return data;
};
