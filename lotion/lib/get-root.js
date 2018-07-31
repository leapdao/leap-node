const { createHash } = require('crypto');
const { stringify } = require('deterministic-json');

module.exports = async function getAppStateHash(store) {
  const hash = createHash('sha256')
    .update(stringify(store))
    .digest();

  return hash;
};
