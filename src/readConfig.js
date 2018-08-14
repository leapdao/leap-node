const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

module.exports = async configPath => {
  const config = JSON.parse(await readFile(configPath));

  if (!config.bridgeAddr) {
    console.error('bridgeAddr is required');
    process.exit(0);
  }

  return config;
};
