const _ = require('lodash');
/* eslint-disable */

let mocks = {};

class Web3 {
  constructor() {
    return new Proxy(this, {
      get: (obj, prop) => (obj[prop] === undefined ? mocks[prop] : obj[prop]),
    });
  }
}

Web3.__setMethodMock = (path, mock) => {
  _.set(mocks, path, mock);
};

module.exports = Web3;
