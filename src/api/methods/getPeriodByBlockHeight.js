const { Period } = require('leap-core');

module.exports = async (bridgeState, db, heightOrTag) => {
  let height = heightOrTag;
  if (heightOrTag === 'latest') {
    height = bridgeState.blockHeight;
  } else if (typeof height === 'string' && height.startsWith('0x')) {
    height = parseInt(height, 16);
  }
  const [periodStart, periodEnd] = Period.periodBlockRange(height);
  const periodData = await db.getPeriodData(periodStart);
  if (!periodData) return null; // return null as Infura does
  return periodData.map(d => ({ periodStart, periodEnd, ...d }));
};
