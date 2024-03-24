import fs from "fs-extra";
import { resolve } from "path";
import log from 'loglevel'
import { LLMConfig, translateCsvString, translateJsonDataToCsvString } from "../src/translate";
import { setupEnv } from "../src/setupEnv"

// translate files in tmp
async function translateFolder(
  config: LLMConfig,
  folder: string = "./tmp/untranslated",
  destFolder: string = "./tmp/translated",
  removeOld: boolean = false
) {
  const fileList = fs
    .readdirSync(folder)
    .filter((file) => file.endsWith(".json") || file.endsWith(".csv"));
  log.info("Found " + fileList.length + " files to translate");

  for (const file of fileList) {
    log.info("Translating " + file);
    const filePath = resolve(folder, file);
    if (file.endsWith(".json")) {
      log.warn("JSON file is currently not supported");
      continue;
    }
    if (file.endsWith(".csv")) {
      const csvString = await fs.readFile(filePath, "utf-8");
      const translatedCsvString = await translateCsvString(csvString, config);
      await fs.writeFile(
        resolve(destFolder, file),
        translatedCsvString,
        "utf-8"
      );
      log.info(`Output to ${resolve(destFolder, file)}`);
    }
  }
}

async function main() {
  const config = setupEnv();
  await translateFolder(config);
}

main().then(() => {
  process.exit(0)
}).catch((err) => {
  log.error(err);
  process.exit(1);
})
