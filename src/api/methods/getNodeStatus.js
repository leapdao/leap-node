module.exports = async (bridgeState, app) => {
  const status = await app.status();
  if (status.sync_info.catching_up) {
    return 'catching-up';
  }

  if (bridgeState.checkCallsCount > 0) {
    return 'waiting-for-period';
  }

  return 'ok';
};
