/* eslint-disable no-await-in-loop */

const createABCIServer = require('js-abci');
const jsondiffpatch = require('jsondiffpatch');

const { getAddress } = require('../../src/utils');

async function runTx(
  txMiddleware,
  store,
  tx,
  chainInfo,
  allowMutation = false
) {
  let stateMutated = false;
  // TODO: mutate store then use merk.rollback instead of cloning state
  const newChainInfo = jsondiffpatch.clone(chainInfo);
  const newState = jsondiffpatch.clone(store);
  const proxy = {
    get: (target, name) => {
      if (typeof target[name] === 'object' && target[name] !== null) {
        return new Proxy(target[name], proxy);
      }
      return target[name];
    },
    set: (target, name, newValue) => {
      const oldValue = target[name];
      target[name] = newValue;
      if (newValue !== oldValue) {
        stateMutated = true;
      }
      return true;
    },
  };
  const hookedState = new Proxy(newState, proxy);
  const hookedChainInfo = new Proxy(chainInfo, proxy);
  // run middleware stack
  try {
    for (const txHandler of txMiddleware) {
      await txHandler(hookedState, tx, hookedChainInfo, !allowMutation);
    }
  } catch (e) {
    return [false, e.toString()];
  }
  if (allowMutation) {
    Object.assign(chainInfo, newChainInfo);
    Object.assign(store, newState);
  } else {
    // merk.rollback(store)
  }
  return [
    stateMutated,
    stateMutated ? '' : 'transaction must mutate state to be valid',
  ];
}

function updateAndDiffValidators(validators, newValidators) {
  const diffs = [];
  const pubKeys = {};
  const push = (validator) => {
    diffs.push({
      pubKey: {
        type: validator.pubKey.type,
        data: Buffer.from(validator.pubKey.data, 'base64'),
      },
      power: validator.power,
    });
  };

  for (const key in newValidators) {
    const numberOrObj = newValidators[key];
    let validator = validators[key];

    if (
      typeof numberOrObj === 'number' &&
      validator &&
      validator.power !== numberOrObj
    ) {
      validator.power = numberOrObj;
    } else {
      validator = numberOrObj;
      validators[key] = validator;
    }

    // can also be 0
    if (validator) {
      pubKeys[validator.pubKey.data] = validator;
    }
  }

  // why do we have different validator addrs with the same pubKey?
  for (const key in pubKeys) {
    push(pubKeys[key]);
  }

  return diffs;
}

class AbciApp {}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  store,
  initChainMiddleware,
  periodMiddleware,
}) {
  const chainInfo = {
    height: 1,
    validators: {},
  };
  const lastValidatorState = {};
  const abciApp = new AbciApp();
  abciApp.checkTx = async req => {
    const rawTx = req.tx;
    try {
      const [isValid, log] = await runTx(
        txMiddleware,
        store,
        rawTx,
        chainInfo,
        false
      );
      const code = isValid ? 0 : 2;
      return { code, log };
    } catch (e) {
      return { code: 2, log: 'Invalid tx encoding for checkTx' };
    }
  };

  abciApp.deliverTx = async req => {
    const rawTx = req.tx;
    try {
      const [isValid, log] = await runTx(
        txMiddleware,
        store,
        rawTx,
        chainInfo,
        true
      );
      if (isValid) {
        return { code: 0 };
      }

      return { code: 2, log };
    } catch (e) {
      return { code: 2, log: 'Invalid tx encoding for deliverTx' };
    }
  };

  abciApp.commit = async () => {
    chainInfo.height += 1;
    for (const blockHandler of blockMiddleware) {
      await blockHandler(store, chainInfo);
    }

    return {};
  };

  abciApp.initChain = async ({ validators }) => {
    validators.forEach(tmValidator => {
      const address = getAddress(tmValidator.pubKey.data.toString('hex'));
      chainInfo.validators[address] = {
        address,
        pubKey: {
          type: tmValidator.pubKey.type,
          data: tmValidator.pubKey.data.toString('base64'),
        },
        power: Number(tmValidator.power),
      };
    });
    Object.assign(lastValidatorState, chainInfo.validators);
    initChainMiddleware.forEach(handler => {
      handler(chainInfo);
    });
    return {};
  };

  abciApp.endBlock = () => {
    return {
      validatorUpdates: updateAndDiffValidators(
        lastValidatorState,
        chainInfo.validators
      ),
    };
  };

  abciApp.checkBridge = async ({ height }) => {
    const rsp = {};
    for (let i = 0; i < periodMiddleware.length; i += 1) {
      await periodMiddleware[i](rsp, chainInfo, height);
    }
    return { status: rsp.status };
  };

  abciApp.info = async () => {
    if (store.blockHeight) {
      chainInfo.height = store.blockHeight;
      return { lastBlockHeight: store.blockHeight };
    }

    return {};
  };

  const abciServer = createABCIServer(abciApp);
  return abciServer;
};
