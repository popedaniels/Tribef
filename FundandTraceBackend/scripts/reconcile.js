// CLI entry: node scripts/reconcile.js [days]
require("dotenv").config();
const mongoose = require("mongoose");
const { runReconciliation } = require("../services/reconciliation");
const logger = require("../utility/logger");

(async () => {
  const days = Number(process.argv[2] || 1);
  try {
    if (!process.env.MONGOURL) throw new Error("MONGOURL is required");
    await mongoose.connect(process.env.MONGOURL, { serverSelectionTimeoutMS: 5000 });
    const report = await runReconciliation({ days });

    const discrepancies = Object.entries(report.gateways || {}).filter(
      ([, r]) => (r.missingInDb || []).length > 0 || (r.amountMismatches || []).length > 0
    );
    if (discrepancies.length > 0) {
      console.error("DISCREPANCIES FOUND:");
      discrepancies.forEach(([gw, r]) =>
        console.error(
          `- ${gw}: ${r.missingInDb.length} missing in DB, ${r.amountMismatches.length} amount mismatches`
        )
      );
      process.exitCode = 1;
    } else {
      console.log(`Reconciliation clean for the last ${days} day(s).`);
    }
  } catch (err) {
    logger.error({ err }, "Reconciliation CLI failed");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
