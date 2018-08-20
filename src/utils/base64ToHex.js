module.exports = base64 => Buffer.from(base64, 'base64').toString('hex');
