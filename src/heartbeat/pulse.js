const { logNode } = require('../utils/debug');
const { Tx, Input, Outpoint, Output } = require('leap-core');
const getUnspent = require('../api/methods/getUnspent');

module.exports = async (bridgeState, { send }) => {
  const heartbeatColor = await bridgeState.operatorContract.methods
    .heartbeatColor()
    .call();
  const [nft] = await getUnspent(
    bridgeState,
    bridgeState.account.address,
    heartbeatColor
  );

  if (nft) {
    const transfer = Tx.transfer(
      [new Input(Outpoint.fromRaw(nft.outpoint))],
      [
        new Output(
          nft.output.value,
          bridgeState.account.address,
          heartbeatColor
        ),
      ]
    );
    transfer.signAll(bridgeState.account.privateKey);
    await send(transfer);
  } else {
    logNode('Cannot find Heartbeat NFT in UTXO.');
  }
};
