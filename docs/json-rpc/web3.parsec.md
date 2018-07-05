---
title: "web3.parsec"
---

# parsec_unspent

Returns the list of UTXOs for a given address.

## Parameters

`Address` - 20 Bytes - address to get UTXOs for.

```js
params: ["0x407d73d8a49eeb85d32cf465507dd71d507100c1"]
```

## Returns

- `Array` - Array of `Object`
  - `outpoint`: `String` - Hex-encoded binary of the outpoint
  - `output`: `Object` - Output Object
    - `address`: `Address` - 20 bytes - address of the output
    - `value`: `Quantity` - value of the output in PSC cents

## Example

Request
```bash
curl --data '{"method":"parsec_unspent","params":["0x407d73d8a49eeb85d32cf465507dd71d507100c1"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    {
      "outpoint": "0x777777777777777777777777777777777777777777777777777777777777777700",
      "output": {
        "address": "0x853f43d8a49eeb85d32cf465507dd71d507100c1",
        "value": "0x7f110"
      }
    }
  ]
}
```
