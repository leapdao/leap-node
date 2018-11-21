module.exports = async period => {
  return {
    timestamp: period.merkleRoot() === '0x000011' ? Date.now().toString() : '0',
  };
};
