module.exports = hex =>
  Buffer.from(hex.replace('0x', ''), 'hex').toString('base64');
