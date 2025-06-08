/**
 * -----------------------------------------------------------
 * GarlicRemind - Logger Utility
 * -----------------------------------------------------------
 *
 * Description:
 * Provides consistent and colored console output for logging
 * info, warnings, successes, and errors. Also acts as a
 * centralized error handler utility.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const chalk = require("chalk");

const logger = {
  info: (...msg) => console.log(chalk.blue("[INFO]"), ...msg),
  warn: (...msg) => console.warn(chalk.yellow("[WARN]"), ...msg),
  success: (...msg) => console.log(chalk.green("[SUCCESS]"), ...msg),
  error: (...msg) => console.error(chalk.red("[ERROR]"), ...msg),
  fatal: (err) => {
    console.error(chalk.bgRed.white(" FATAL ERROR "), err);
    process.exit(1);
  },
};

module.exports = logger;
