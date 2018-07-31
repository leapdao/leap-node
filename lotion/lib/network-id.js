const { createHash } = require('crypto');

module.exports = function generateNetworkId(...args) {
  const networkId = createHash('sha256');
  const data = args
    .map(el => {
      if (el instanceof Array) {
        return el.map(f => {
          if (typeof f === 'function') {
            return f.toString();
          }
          return '';
        });
      }
      return el;
    })
    .map(JSON.stringify)
    .join();

  return networkId.update(data).digest('hex');
};
