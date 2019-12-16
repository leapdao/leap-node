module.exports = {
  // The color must be provided by the configuration
  color: undefined,

  // Filter out the heartbeat NFT from `plasma_getUnspent`
  filter: true,

  // In milliseconds, time between heartbeats
  period: 60 * 1000,

  // In milliseconds, time to wait before sending a new heartbeat
  // if the previous one failed
  periodOnError: 5 * 1000,
};
