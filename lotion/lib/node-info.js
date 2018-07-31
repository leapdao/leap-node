const fs = require('fs');
const { join } = require('path');

module.exports = lotionPath => {
  const validatorKeyInfo = JSON.parse(
    fs.readFileSync(join(lotionPath, 'config/priv_validator.json'))
  );

  const pubkeyAminoPrefix = Buffer.from('1624DE6220', 'hex');
  return {
    pubKey: Buffer.concat([
      pubkeyAminoPrefix,
      Buffer.from(validatorKeyInfo.pub_key.value, 'base64'),
    ]).toString('base64'),
  };
};
