# Development

* [Prerequisites](#prerequisites)
* [Debug via Blink Developer Tools / node-inspector](#debug-via-blink-developer-tools--node-inspector)
* [Config file options](#config-file-options)
* [Feature flags](#feature-flags)
  * [How to add a new flag](#how-to-add-a-new-flag)
  * [How to configure feature flags](#how-to-configure-feature-flags)
* [Run in the cloud](#run-in-the-cloud)
  * [Initial setup (one time per developer machine)](#initial-setup-one-time-per-developer-machine)
  * [Create/update AWS EC2 cluster](#createupdate-aws-ec2-cluster)
* [Dive in development](#dive-in-development)

## Install

You may need Python 2.X (required by node-gyp, only for building).

```sh
yarn
```

## Run

To connect to the testnet

```sh
DEBUG=tendermint,leap-node* node index.js --config=https://testnet-node.leapdao.org
```

## Run local network

Use [leap-sandox](leapdao/leap-sandbox). It is the easiest way to start local leap network at the moment.

[Alternative guide](https://github.com/parsec-labs/parsec-contracts/wiki/Setting-up-local-development-environment) (may be outdated)

## Debug via Blink Developer Tools / node-inspector

Start node with `--inspect` and port `9999` for example:

`$ node --inspect=9999 /path/to/leap-node <usual args>`

You can connect to the debugger via `chrome://inspect` in the Chrom{ e, ium } browser,
or with tools like [node-inspector](https://github.com/node-inspector/node-inspector).

Connecting to Remote host using ssh:

`$ ssh -vNL9999:127.0.0.1:9999 <user@remote host>...`

Your local port `9999` forwards now to the remote host on address `127.0.0.1` and port `9999`.

## Config file options

```js
  "bridgeAddr": "0x7b8342412883f4b34f335d4e1391ec190eb887ca",
  "operatorAddr": "0x9b83018de826c0343af6e682c24e7c91a421755c",
  "exitHandlerAddr": "0x0b32eb1aaa9b0804852f4fe1b2e6100edb4533d8",
  "rootNetwork": "https://rinkeby.infura.io",
  "rootNetworkId": 4,
  "network": "leap-testnet-gamma",
  "networkId": 1341,
```

* `bridgeAddr` — leap [Bridge](https://github.com/leapdao/leap-contracts) contract address
* `operatorAddr` — leap [Operator](https://github.com/leapdao/leap-contracts) contract address
* `exitHandlerAddr` — leap [ExitHandler](https://github.com/leapdao/leap-contracts) contract address
* `rootNetwork` — (optional, maybe specified via CLI args) root chain provider url (e.g. `https://rinkeby.unfura.io`)
* `rootNetworkId` — NetworkId (called also `chainId`) of the network.
* `network` — leap network name
* `networkId` - leap network ID
* `flagHeights` — (optional) `flag → height` mapping to enable feature flags only on certain heights (see [feature flags section](#feature-flags))
* `genesis` — genesis string in Tendermint format
* `peers` — array of peers in Tendermint format

## Feature flags

If you want to introduce breaking changes (it can break existing networks) in tx checks you should wrap these changes into condition with feature flag to avoid [resync problems](https://github.com/leapdao/leap-node/issues/334).

```es6
if (bridgeState.flags.tx_should_fail_on_zero_input) {
  if (valueOf(input) === 0) {
    throw new Error('WTF');
  }
}
```

### How to add a new flag

1. Add it into `FLAGS` array [here](src/flags/index.js#L3)
2. That’s all, you can use it. It will be `true` by default

### How to configure feature flags

1. Add `flagHeights` section into the network config
2. Add activation height:

    ```js
    {
      ...,
      "flagHeights": {
        "tx_should_fail_on_zero_input": 5000,
      }
    }
    ```

3. Until this height flag will be `false`, after (inclusively) — `true`

## Run in the cloud

> ⚠️ this section is probably outdated

You can use [Terraform](https://www.terraform.io/) to spin up an Amazon EC2 instances with the node. You will need an SSH keypair to access the EC2 instance. Generate a new keypair or use an existing one.

### Initial setup (one time per developer machine)

```sh
terraform init setup/cloud
```

This will read an existing cluster state from `leap-node-state` S3 bucket (make sure you have one).

### Create/update AWS EC2 cluster

```sh
terraform apply -var ssh_public_file="~/.ssh/leap-testnet.pub" -var ssh_private_file="~/.ssh/leap-testnet" -var network="leap-testnet-gamma" -var count=4 -var leap_node_version=3.1.0-0 setup/cloud
```

This will set up 4 EC2 instances (and all the required infrastructure) running `leap-node` version `3.1.0-0` using `presets/leap-testnet-gamma.json` network config. If instances are already running, it will update them if `leap_node_version` or network file changed.

Some useful commands once it is up and running:

* check the logs: `ssh ubuntu@<ec2 host> journalctl -u leap-node`
* start/stop/restart/status: `ssh ubuntu@<ec2 host> sudo service leap-node start/stop/restart/status`