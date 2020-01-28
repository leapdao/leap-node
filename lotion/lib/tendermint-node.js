const axios = require('axios');
const url = require('url');
const debug = require('debug')('tendermint');
const { spawnSync, spawn } = require('child_process');

const logging = process.env.TM_LOG;
const binPath = process.env.TM_BINARY || require.resolve('../bin/tendermint');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function wait(condition) {
  return async (client, child, timeout = 30 * 1000) => {
    const start = Date.now();
    /* eslint-disable no-constant-condition, no-await-in-loop */
    while (true) {
      if (timeout) {
        const elapsed = Date.now() - start;

        if (elapsed > timeout) {
          throw Error('Timed out while waiting');
        }
      }

      try {
        if (await condition(client)) {
          break;
        }
      } catch (err) {
        // eslint-ignore no-empty
      }

      await sleep(1000);
    }
    /* eslint-enable no-constant-condition, no-await-in-loop */
  };
}

function flags(opts = {}, prefix = '') {
  const args = [];

  for (const [key, value] of Object.entries(opts)) {
    if (value && typeof value === 'object') {
      // recurse for objects
      args.push(...flags(value, `${prefix}${key}.`));
    } else {
      args.push(`--${prefix}${key}=${value.toString()}`);
    }
  }

  return args;
}

async function exec(command, opts) {
  const args = [command, ...flags(opts)];
  debug(`executing: tendermint ${args.join(' ')}`);
  const res = spawnSync(binPath, args);

  if (res.status !== 0) {
    throw Error(`tendermint exited with code ${res.status}`);
  }

  return res;
}

function spawnTendermint(command, opts) {
  const args = [command, ...flags(opts)];
  debug(`spawning: tendermint ${args.join(' ')}`);
  const child = spawn(binPath, args);

  setTimeout(() => {
    try {
      child.stdout.resume();
      child.stderr.resume();
    } catch (err) {
      // eslint-ignore-line no-empty
    }
  }, 4000);

  if (logging) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  const promise = new Promise((resolve, reject) => {
    child.once('exit', resolve);
    child.once('error', reject);
  });

  child.then = promise.then.bind(promise);
  child.catch = promise.catch.bind(promise);

  return child;
}

function getRpcPort(opts, defaultPort = 26657) {
  if (!opts || ((!opts.rpc || !opts.rpc.laddr) && !opts.laddr)) {
    return defaultPort;
  }

  const parsed = url.parse(opts.laddr || opts.rpc.laddr);

  return parsed.port;
}

const waitForRpc = wait(async tendermintRpcUrl => {
  await axios.get(`${tendermintRpcUrl}/status`);

  return true;
});

const waitForSync = wait(async tendermintRpcUrl => {
  const status = (await axios.get(`${tendermintRpcUrl}/status`)).data.result;

  return (
    status.sync_info.catching_up === false &&
    Number(status.sync_info.latest_block_height) > 0
  );
});

function setupChildProcess(child, rpcPort) {
  const tendermintRpcUrl = `http://localhost:${rpcPort}`;
  let started;
  let synced;

  return Object.assign(child, {
    started: () => {
      if (started) {
        return started;
      }
      started = waitForRpc(tendermintRpcUrl, child, 0);
      return started;
    },
    synced: () => {
      if (synced) {
        return synced;
      }
      synced = waitForSync(tendermintRpcUrl, child, 0);
      return synced;
    },
  });
}

function node(path, opts = {}) {
  if (typeof path !== 'string') {
    throw Error('"path" argument is required');
  }
  opts.home = path;

  const child = spawnTendermint('node', opts);
  const rpcPort = getRpcPort(opts);

  return setupChildProcess(child, rpcPort);
}

module.exports = {
  node,
  init: home => exec('init', { home }),
};
