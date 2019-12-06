# Full node for Leap Network

[![codecov](https://codecov.io/gh/leapdao/leap-node/branch/master/graph/badge.svg)](https://codecov.io/gh/leapdao/leap-node)
[![Docker Repository on Quay](https://quay.io/repository/leapdao/leap-node/status "Docker Repository on Quay")](https://quay.io/repository/leapdao/leap-node)

Leap Network is an implementation of [Plasma](http://learnplasma.org) framework based on [More Viable Plasma](https://github.com/omisego/elixir-omg/blob/master/docs/morevp.md) and [Plasma Leap](https://ethresear.ch/t/plasma-leap-a-state-enabled-computing-model-for-plasma/3539) extensions.

![image](https://user-images.githubusercontent.com/163447/70314944-96be4880-1829-11ea-81ef-66a7647af41e.png)

## Table Of Contents

* [What it is](#what-it-is)
  * [For dApp developers](#for-dapp-developers)
  * [For validators](#for-validators)
* [Getting Started](#getting-started)
  * [Quick start](#quick-start)
  * [Prerequisites](#prerequisites)
  * [Install](#install)
  * [Run](#run)
* [Available Networks](#available-networks)
  * [Testnet](#testnet)
  * [Mainnet](#mainnet)
* [Configuration](#configuration)
* [Documentation](#documentation)
* [Development](#development)
* [Contributing](#contributing)
* [License](#license)

## What it is

### For dApp developers

If you create a dapp using Leap Network you can either use an existing public node or start your own leap-node instance.

Running your own node is encouraged as it increases decentralization — you can autonomously monitor the network is not compromised and your funds are safe.

If you don't want to run a full node or just curious, you don't need this repo — you can freely use our public node to connect to and jump straight to our document.

<!-- TODO: better docs -->
[Documentation for dApp developers](https://docs.leapdao.org/)

### For validators

You will definitely need to run a leap-node instance, if you want to become a validator on Leap Network. Validating Leap Network is a way to earn money by ensuring the network security and thus delivering a public good.

<!-- TODO: better docs -->
[Read more on becoming a Validator](https://docs.leapdao.org/connect/#becoming-a-validator)

## Getting Started

### Quick start

```sh
# Install latest leap-node from NPM. You may need different version depending on the network you connect to.
npm install -g leap-node

# Start the node connecting to testnet. It will take a few hours to sync with the tip of the network.
DEBUG=tendermint,leap-node* leap-node --config=https://testnet-node.leapdao.org
```

### Prerequisites

* Node.js 8+ (Node.js 12 is not supported [yet](https://github.com/leapdao/leap-node/issues/346))
* build-essential

### Install

Install latest leap-node from NPM. You may need different version depending on the network you connect to:

```sh
npm install -g leap-node
```

### Run

To run the node you execute a leap-node with commandline arguments.

The bare minimum of arguments required are:

* `--config` to specify a path to local JSON file with network configuration or a JSON RPC url of another leap-node to get configuration from
* `--rootNetwork` to specify a root chain provider url (e.g. your own ethereum node or infura)

Chain ID of the root chain provider should match the rootNetworkId in the network configuration file (e.g. 4 for Rinkeby).

```sh
DEBUG=tendermint,leap-node* leap-node [ARGS] --config=<path-to-config.json> --rootNetwork=<root-network-provider-url>
```

<!-- TODO: link better docs here -->
Once started and synced with the network, the node exposes a Leap JSON RPC on a port 8645. You can [use](https://docs.leapdao.org/) your node now or [apply to become a validator](https://docs.leapdao.org/connect/#becoming-a-validator).

## Available Networks

### Testnet

Config file: [presets/leap-testnet.json](presets/leap-testnet.json)

[All the details](https://github.com/leapdao/leap-contracts/releases/tag/testnet)

### Mainnet

Config file: [presets/leap-mainnet.json](presets/leap-mainnet.json)

[All the details](https://github.com/leapdao/leap-contracts/releases/tag/v1.1.0-mainnet-v2)

## Configuration

<!-- TODO: better docs -->
See [docs.leapdao.org](https://docs.leapdao.org/how-to-use/) for advanced configuration.

## Documentation

See [docs.leapdao.org](https://docs.leapdao.org)

## Development

See [DEVELOPMENT](DEVELOPMENT.md)

## Contributing

<!-- TODO: proper files -->
Please read [CONTRIBUTING.md](https://github.com/leapdao/meta/blob/master/CONTRIBUTION.md) for details on our process for submitting pull requests to us, and please ensure
you follow the [CODE_OF_CONDUCT.md](https://github.com/leapdao/meta/blob/master/CODE_OF_CONDUCT.md).

## License

This project is licensed under the MPL-2.0 License - see the [LICENSE.md](LICENSE.md) file for details.
