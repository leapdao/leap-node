---
title: "web3.net"
---

- [net_version](#net_version)

# net_version

Returns the current network protocol version.

#### Parameters

None

#### Returns

- `String` - The current network protocol version

#### Example

Request
```bash
curl --data '{"method":"net_version","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
```

Response
```js
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "8995"
}
```
