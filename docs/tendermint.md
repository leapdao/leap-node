# Custom tendermint in leap-node

We want to make sure there is no not-submitted periods older than 64 blocks ago. For this we added a custom `CheckBridge` ABCI to
Tendermint [1]. Yes, we are using forked Tendermint and, yes, this is disgusting.
CheckBridge ABCI handler is supposed to be called every 32 blocks and return successfully, otherwise the proposal is deferred (consensus engine is stopped). Out implementation of checkBridge ABCI handler [2] ensures there is a period submitted. This is the ultimate reason for all the clusterfuck — ensure that period is submitted.

Consider the following data:
```

blocks:  0 ..... 31 | 32 .... 63 | 64 ... 95 | 96 ... 127
periods: p1           p2           p3          p4
                                                   ↑
                                                   we are here at block 99
```

if after block 96 the period `p2` is not yet on the root chain, `CheckBridge` will stop consensus till `p2` is on the root chain.
Incoming transactions will keep piling in mempool and will be processed to the block once consensus resume.

---- 

* [1] LeapDAO Tendermint fork: [leapdao/tendermint](https://github.com/leapdao/tendermint)

* [2] `checkBridge` ABCI handler in leap-node: https://github.com/leapdao/leap-node/blob/master/src/period/index.js
