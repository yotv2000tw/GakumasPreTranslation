import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
import dotenv from "dotenv";

export function setupEnv() {
  dotenv.config();
  prefix.reg(log);
  prefix.apply(log, {
    timestampFormatter: function (date) {
      return date.toLocaleString();
    },
  });
  if (!(process.env.LOG_LEVEL == "info" || process.env.LOG_LEVEL == "debug")) {
    throw new Error("LOG_LEVEL must be 'info' or 'debug'");
  }
  log.setLevel(process.env.LOG_LEVEL);
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL || !process.env.MODEL) {
    log.warn("OPENAI_API_KEY, OPENAI_BASE_URL, and MODEL must be set in .env file");
    process.exit(1);
  }
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    model: process.env.MODEL,
  };
}

// export const config: LLMConfig = {
//   apiKey: process.env.OPENAI_API_KEY,
//   baseURL: process.env.OPENAI_BASE_URL,
//   model: process.env.MODEL,
// };
