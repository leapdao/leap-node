/* eslint-disable no-await-in-loop */

const createABCIServer = require('abci');
const decodeTx = require('./tx-encoding.js').decode;
const jsondiffpatch = require('jsondiffpatch');
const getRoot = require('./get-root.js');
const { stringify } = require('deterministic-json');

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
  for (const key in newValidators) {
    if (validators[key] === undefined) {
      validators[key] = newValidators[key];
      diffs.push(validators[key]);
    } else if (
      typeof newValidators[key] === 'number' &&
      validators[key].power !== newValidators[key]
    ) {
      validators[key].power = newValidators[key];
      diffs.push(validators[key]);
    }
  }
  return diffs;
}

class AbciApp {}

module.exports = function configureABCIServer({
  txMiddleware,
  blockMiddleware,
  store,
  // initialAppHash,
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
      const tx = decodeTx(rawTx);
      const [isValid, log] = await runTx(
        txMiddleware,
        store,
        tx,
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
      const tx = decodeTx(rawTx);
      const [isValid, log] = await runTx(
        txMiddleware,
        store,
        tx,
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
    blockMiddleware.forEach(blockHandler => {
      blockHandler(store, chainInfo);
    });
    const appHash = await getRoot(store);
    return { data: appHash };
  };

  abciApp.initChain = async ({ validators }) => {
    validators.forEach(tmValidator => {
      const address = tmValidator.address.toString('base64');
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

  abciApp.query = () => {
    try {
      return {
        value: Buffer.from(stringify(store)),
        height: chainInfo.height - 1,
        proof: '',
        key: '',
        index: 0,
        code: 0,
        log: '',
      };
    } catch (e) {
      return { code: 2, log: `invalid query: ${e.message}` };
    }
  };

  abciApp.info = async () => {
    const rootHash = await getRoot(store);
    return { lastBlockAppHash: rootHash };
  };

  const abciServer = createABCIServer(abciApp);
  return abciServer;
};
