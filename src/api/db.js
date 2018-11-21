const path = require('path');
const level = require('level');
const createDb = require('./createDb');

module.exports = app => {
  const levelDb = level(path.join(app.lotionPath(), 'leap.db'));
  return createDb(levelDb);
};
