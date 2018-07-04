const range = (s, e) => Array.from(new Array(e - s + 1), (_, i) => i + s);

module.exports = async bridge => {
  const epochLength = await bridge.methods.epochLength().call();
  const slots = await Promise.all(
    range(0, epochLength).map(slotId => bridge.methods.slots(slotId).call())
  );

  return slots.map(
    (
      {
        owner,
        stake,
        signer,
        tendermint,
        activationEpoch,
        newOwner,
        newStake,
        newSigner,
        newTendermint,
      },
      i
    ) => ({
      id: i,
      owner,
      stake,
      signer,
      tendermint,
      activationEpoch,
      newOwner,
      newStake,
      newSigner,
      newTendermint,
    })
  );
};
