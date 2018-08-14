---
title: How to use
---

## Prerequisite

- Node.js 8+
- build-essential
- Python 2.X (required by node-gyp, only for building)

## Install

`npm install parsec-node -g` or `yarn global add parsec-node`

## Run

`parsec [ARGS] --config=path-to-config.json`

### Available cli arguments

- `no-validators-updates` — disabling validators set updates (default: false)
- `port` — tx endpoint port (default: 3000)
- `rpcaddr` — host for http RPC server (default: localhost)
- `rpcport` — port for http RPC server (default: 9545)
- `wsaddr` — host for websocket RPC server (default: localhost)
- `wsport` — port for websocket RPC server (default: 9546)
- `p2pPort` — port for p2p connection (default: random)
- `config` — path to config file
- `version` — print version of the node

### Config file options

- `bridgeAddr` — parsec bridge contract address
- `rootNetwork` — ethereum provider url
- `genesis` — genesis string
- `network` — network id
- `peers` — array of peers

### Config presets

Dev config file: <a href="https://raw.githubusercontent.com/parsec-labs/parsec-node/master/presets/parsec-testnet-alpha.json" download>parsec-testnet-alpha.json</a>

Testnet config file: N/A

Mainnet config file: N/A
