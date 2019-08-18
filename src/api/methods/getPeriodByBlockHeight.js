const { Period } = require('leap-core');

module.exports = async (db, blockHeight) => {
  const [periodStart, periodEnd] = Period.periodBlockRange(blockHeight);
  const periodData = await db.getPeriodData(periodStart);
  if (!periodData) return null; // return null as Infura does
  return periodData.map(d => ({ periodStart, periodEnd, ...d }));
};
