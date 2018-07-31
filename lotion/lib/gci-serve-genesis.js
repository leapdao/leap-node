const { serve } = require('jpfs');

module.exports = genesis => {
  const { hash, close } = serve(genesis);
  return { close, GCI: hash };
};
