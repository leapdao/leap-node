[![codecov](https://codecov.io/gh/leapdao/leap-node/branch/master/graph/badge.svg)](https://codecov.io/gh/leapdao/leap-node)
[![Docker Repository on Quay](https://quay.io/repository/leapdao/leap-node/status "Docker Repository on Quay")](https://quay.io/repository/leapdao/leap-node)

# Leap DAO validation node

https://docs.leapdao.org/

## Prerequisite

- Node.js 8+
- build-essential
- Python 2.X (required by node-gyp, only for building)

## Install

`npm install leap-node -g` or `yarn global add leap-node`

## Run locally

`leap-node [ARGS] --config=path-to-config.json`

### Debug

To enable logs use `DEBUG` env variable (see: https://www.npmjs.com/package/debug). Debug namepaces:

- `tendermint`
- `leap-node`
- `leap-node:period`
- `leap-node:tx`
- `abci` (built-in from js-abci)

Example: `DEBUG=tendermint,leap-node:tx leap-node`

### Available cli arguments

- `no-validators-updates` — disabling validators set updates (default: false)
- `port` — tx endpoint port (default: 3000)
- `rpcaddr` — host for http RPC server (default: localhost)
- `rpcport` — port for http RPC server (default: 8645)
- `wsaddr` — host for websocket RPC server (default: localhost)
- `wsport` — port for websocket RPC server (default: 8646)
- `p2pPort` — port for p2p connection (default: random)
- `config` — path to config file or node's JSON RPC url (eg https://testnet-2.leapdao.org)
- `version` — print version of the node

### Config file options
  "bridgeAddr": "0x7b8342412883f4b34f335d4e1391ec190eb887ca",
  "operatorAddr": "0x9b83018de826c0343af6e682c24e7c91a421755c",
  "exitHandlerAddr": "0x0b32eb1aaa9b0804852f4fe1b2e6100edb4533d8",
  "rootNetwork": "https://rinkeby.infura.io",
  "network": "leap-testnet-gamma",
  "networkId": 1341,

- `bridgeAddr` — leap [Bridge](https://github.com/leapdao/leap-contracts) contract address
- `operatorAddr` — leap [Operator](https://github.com/leapdao/leap-contracts) contract address
- `exitHandlerAddr` — leap [ExitHandler](https://github.com/leapdao/leap-contracts) contract address
- `rootNetwork` — Ethereum provider url (e.g. `https://rinkeby.infura.io`)
- `genesis` — genesis string
- `network` — plasma network name
- `networkId` - network ID. Possible values: `1340` - Leap mainnet, `1341` - Leap testnet.
- `peers` — array of peers

### Config presets

Dev config file: `leap-node --config=./presets/leap-testnet-gamma.json`

Testnet config file: `leap-node --config=http://node1.testnet.leapdao.org:8645`

Mainnet config file: N/A

## Run in the cloud

You can use [Terraform](https://www.terraform.io/) to spin up an Amazon EC2 instances with the node. You will need an SSH keypair to access the EC2 instance. Generate a new keypair or use an existing one.

### Initial setup (one time per developer machine)

```
terraform init setup/cloud
```

This will read an existing cluster state from `leap-node-state` S3 bucket (make sure you have one).

### Create/update AWS EC2 cluster

```
terraform apply -var ssh_public_file="~/.ssh/leap-testnet.pub" -var ssh_private_file="~/.ssh/leap-testnet" -var network="leap-testnet-gamma" -var count=4 -var leap_node_version=3.1.0-0 setup/cloud
```

This will set up 4 EC2 instances (and all the required infrastructure) running `leap-node` version `3.1.0-0` using `presets/leap-testnet-gamma.json` network config. If instances are already running, it will update them if `leap_node_version` or network file changed.


Some useful commands once it is up and running:

- check the logs: `ssh ubuntu@<ec2 host> journalctl -u leap-node`
- start/stop/restart/status: `ssh ubuntu@<ec2 host> sudo service leap-node start/stop/restart/status`

## Dive in development

https://github.com/parsec-labs/parsec-contracts/wiki/Setting-up-local-development-environment

## Staking UI

Dev: https://bridge-dev.leapdao.org/

Testnet: http://testnet.leapdao.org/

Mainnet: N/A
