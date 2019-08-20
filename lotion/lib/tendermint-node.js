const axios = require('axios');
const url = require('url');
const debug = require('debug')('tendermint');
const _spawnSync = require('child_process').spawnSync;
const _spawn = require('child_process').spawn;

const logging = process.env.TM_LOG;
const binPath = process.env.TM_BINARY || require.resolve('../bin/tendermint');

function flags(opts = {}, prefix = '') {
  const args = [];

  for (let [key, value] of Object.entries(opts)) {
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
  debug('executing: tendermint ' + args.join(' '));
  const res = _spawnSync(binPath, args);

  if (res.status !== 0) {
    throw Error(`tendermint exited with code ${res.status}`);
  }

  return res;
}

function spawn(command, opts) {
  const args = [command, ...flags(opts)];
  debug('spawning: tendermint ' + args.join(' '));
  const child = _spawn(binPath, args);

  setTimeout(() => {
    try {
      child.stdout.resume();
      child.stderr.resume();
    } catch (err) {}
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

function node(path, opts = {}) {
  if (typeof path !== 'string') {
    throw Error('"path" argument is required');
  }
  opts.home = path;

  const child = spawn('node', opts);
  const rpcPort = getRpcPort(opts);

  return setupChildProcess(child, rpcPort);
}

function setupChildProcess(child, rpcPort) {
  const tendermintRpcUrl = `http://localhost:${rpcPort}`;
  let started, synced;

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

function getRpcPort(opts, defaultPort = 26657) {
  if (!opts || ((!opts.rpc || !opts.rpc.laddr) && !opts.laddr)) {
    return defaultPort;
  }

  const parsed = url.parse(opts.laddr || opts.rpc.laddr);

  return parsed.port;
}

let waitForRpc = wait(async tendermintRpcUrl => {
  await axios.get(`${tendermintRpcUrl}/status`);

  return true;
});

let waitForSync = wait(async tendermintRpcUrl => {
  const status = (await axios.get(`${tendermintRpcUrl}/status`)).data.result;

  return (
    status.sync_info.catching_up === false &&
    Number(status.sync_info.latest_block_height) > 0
  );
});

function wait(condition) {
  return async function(client, child, timeout = 30 * 1000) {
    let start = Date.now();
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
      } catch (err) {}

      await sleep(1000);
    }
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  node,
  init: home => exec('init', { home }),
};
