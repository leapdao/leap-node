---
title: "web3.eth"
---

- [eth_blockNumber](#eth_blocknumber)
- [eth_getBalance](#eth_getbalance)
- [eth_getBlockByHash](#eth_getblockbyhash)
- [eth_getBlockByNumber](#eth_getblockbynumber)
- [eth_getTransactionByHash](#eth_gettransactionbyhash)
- [eth_getTransactionReceipt](#eth_gettransactionreceipt)
- [eth_sendRawTransaction](#eth_sendrawtransaction)


# eth_blockNumber

Returns the number of most recent block.

**Parameters**

None

**Returns**

- `Quantity` - integer of the current block number the client is on.

**Example**

Request
```bash
curl --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x4b7" // 1207
}
```

***

# eth_getBalance

Returns the balance of the account of given address.

**Parameters**

0. `Address` - 20 Bytes - address to check for balance.

```js
params: ["0x407d73d8a49eeb85d32cf465507dd71d507100c1"]
```

**Returns**

- `Quantity` - integer of the current balance in PSC cents.

**Example**

Request
```bash
curl --data '{"method":"eth_getBalance","params":["0x407d73d8a49eeb85d32cf465507dd71d507100c1"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x0234c8a3397aab58"
}
```

***

# eth_getBlockByHash

Returns information about a block by hash.

**Parameters**

0. `Hash` - Hash of a block.
0. `Boolean` - If `true` it returns the full transaction objects, if `false` only the hashes of the transactions.

```js
params: [
  "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
  true
]
```

**Returns**

- `Object` - A block object, or `null` when no block was found.
    - `number`: `Quantity` - The block number. `null` when its pending block
    - `hash`: `Hash` - 32 Bytes - hash of the block. `null` when its pending block
    - `parentHash`: `Hash` - 32 Bytes - hash of the parent block
    - `size`: `Quantity` - integer the size of this block in bytes
    - `timestamp`: `Quantity` - the unix timestamp for when the block was collated
    - `transactions`: `Array` - Array of transaction objects, or 32 Bytes transaction hashes depending on the last given parameter

**Example**

Request
```bash
curl --data '{"method":"eth_getBlockByHash","params":["0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",true],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "number": "0x1b4", // 436
    "hash": "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
    "parentHash": "0x9646252be9520f6e71339a8df9c55e4d7619deeb018d2a3f2d21fc165dde5eb5",
    "size": "0x27f07", // 163591
    "timestamp": "0x54e34e8e", // 1424182926
    "transactions": [{ ... }, { ... }, ...]
  }
}
```

***

# eth_getBlockByNumber

Returns information about a block by block number.

**Parameters**

0. `Quantity` | `Tag` - integer of a block number, or the string `'latest'`.
0. `Boolean` - If `true` it returns the full transaction objects, if `false` only the hashes of the transactions.

```js
params: [
  "0x1b4", // 436
  true
]
```

**Returns**

- See [eth_getBlockByHash](#eth_getblockbyhash)

**Example**

Request
```bash
curl --data '{"method":"eth_getBlockByNumber","params":["0x1b4",true],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

***


# eth_getTransactionByHash

Returns the information about a transaction requested by transaction hash.

**Parameters**

0. `Hash` - 32 Bytes - hash of a transaction.

```js
params: ["0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"]
```


**Returns**

- `Object` - A transaction object, or `null` when no transaction was found:
    - `hash`: `Hash` - 32 Bytes - hash of the transaction.
    - `blockHash`: `Hash` - 32 Bytes - hash of the block where this transaction was in. `null` when its pending.
    - `blockNumber`: `Quantity` | `Tag` - block number where this transaction was in. `null` when its pending.
    - `transactionIndex`: `Quantity` - integer of the transactions index position in the block. `null` when its pending.
    - `from`: `Address` - 20 Bytes - address of the sender.
    - `to`: `Address` - 20 Bytes - address of the receiver. Taken from the first output. `null` if there is no outputs.
    - `value`: `Quantity` - value transferred in PSC cents. Taken from the first output. `null` if there is no outputs.
    - `gasPrice`: `Quantity` - gas price provided by the sender in Wei.
    - `gas`: `Quantity` - gas provided by the sender.
    - `raw`: `Data` - raw transaction data

**Example**

Request
```bash
curl --data '{"method":"eth_getTransactionByHash","params":["0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "hash": "0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b",
    "blockHash": "0xbeab0aa2411b7ab17f30a99d3cb9c6ef2fc5426d6ad6fd9e2a26a6aed1d1055b",
    "blockNumber": "0x15df", // 5599
    "transactionIndex": "0x1", // 1
    "from": "0x407d73d8a49eeb85d32cf465507dd71d507100c1",
    "to": "0x853f43d8a49eeb85d32cf465507dd71d507100c1",
    "value": "0x7f110", // 520464
    "gas": "0x7f110", // 520464
    "gasPrice": "0x09184e72a000",
  }
}
```

***


# eth_getTransactionReceipt

Returns the receipt of a transaction by transaction hash. Currently works the same as
[eth_getTransactionByHash](#eth_getTransactionByHash)


See [eth_getTransactionByHash](#eth_getTransactionByHash)

***


# eth_sendRawTransaction

Creates new message call transaction or a contract creation for signed transactions.

**Parameters**

0. `Data` - The signed transaction data.

```js
params: ["0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675"]
```

**Returns**

- `Hash` - 32 Bytes - the transaction hash, or the zero hash if the transaction is not yet available

Use [eth_getTransactionReceipt](#eth_gettransactionreceipt) to get the contract address, after the transaction was mined, when you created a contract.

**Example**

Request
```bash
curl --data '{"method":"eth_sendRawTransaction","params":["0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
}
```

***
