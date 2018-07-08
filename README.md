# PARSEC Labs validation node

https://parseclabs.readthedocs.io/en/latest/

## Prerequisite

- Node.js 8+

## Install

`npm install parsec-node -g` or `yarn global add parsec-node`

## Run

`parsec [ARGS] --config=path-to-config.json`

### Available cli arguments

- `no-validators-updates` — disabling validators set updates (default: false)
- `port` — tx endpoint port (default: 3000)
- `rpcaddr` — host for http RPC server (default: localhost)
- `rpcport` — port for http RPC server (default: 8545)
- `wsaddr` — host for websocket RPC server (default: localhost)
- `wsport` — port for websocket RPC server (default: 8546)
- `p2pPort` — port for p2p connection (default: random)
- `config` — path to config file

### Config file options

- `bridgeAddr` — parsec bridge contract address
- `rootNetwork` — ethereum provider url
- `genesis` — genesis string
- `network` — network id
- `peers` — array of peers

### Config presets

Dev config file: N/A

Testnet config file: N/A

Mainnet config file: N/A

## Staking UI

Dev: http://stake-dev.parseclabs.org/

Testnet: N/A

Mainnet: N/A
