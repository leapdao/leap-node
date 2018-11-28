const _ = require('lodash');
/* eslint-disable */

let mocks = {};

class Web3 {
  constructor() {
    this.eth = new Proxy(
      {},
      {
        get: (obj, prop) => {
          return async () => {
            const eth = mocks.eth || {};
            return eth[prop];
          };
        },
      }
    );

    return new Proxy(this, {
      get: (obj, prop) => {
        return (
          obj[prop] ||
          (async () => {
            return mocks[prop];
          })
        );
      },
    });
  }
}

Web3.__setMethodMock = (path, mock) => {
  _.set(mocks, path, mock);
};

module.exports = Web3;
