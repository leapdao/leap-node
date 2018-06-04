# PARSEC Labs plasma tx validation node

## Prerequisite

- Node.js 8+
- Yarn

## Install

1. `git clone git@github.com:parsec-labs/parsec-node.git && cd parsec-node`
2. `yarn`

```
ToDo: Install from npm with bin
```

## Run

`node index.js --bridgeAddr=ARG [OTHER_OPTIONS]`

Deployed bridge (rinkeby): `0xE5a9bDAFF671Dc0f9e32b6aa356E4D8938a49869`

### Available options

```
-p NUM, --port=NUM  REST API port.
--bridgeAddr=ARG    ParsecBridge contract address. REQUIRED
--help              Print this help and exit.
--network=ARG       Ethereum node URL. Default: https://rinkeby.infura.io
```