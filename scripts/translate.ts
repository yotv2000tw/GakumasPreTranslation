import fs from "fs-extra";
import { resolve, basename, join } from "path";
import log from 'loglevel'
import { LLMConfig, translateCsvString, translateJsonDataToCsvString } from "../src/translate";
import { getLLMConfig, setupLog, getRemoteEndpoint } from "../src/setup-env"
import { program } from "commander";
import axios from "axios";

// translate files in tmp
async function translateFolder(
  config: LLMConfig,
  folder: string = "./tmp/untranslated",
  destFolder: string = "./tmp/translated",
  skipExisted: boolean = true
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

    const destPath = resolve(destFolder, file);
    if (skipExisted && fs.existsSync(destPath)) {
      log.info(`Skipped ${destPath} because of file existence`);
      continue;
    }

    if (file.endsWith(".csv")) {
      const csvString = await fs.readFile(filePath, "utf-8");
      const translatedCsvString = await translateCsvString(csvString, config);
      await fs.writeFile(
        destPath,
        translatedCsvString,
        "utf-8"
      );
      log.info(`Output to ${destPath}`);
    }
  }
}

async function getJsonPathList(diffEndpoint: string) {
  const assetMapDiff = (await axios.get(diffEndpoint)).data;
  return Object.keys(assetMapDiff.added).filter((file) => file.startsWith("json/"));
}

async function translateRemoteDiff(
  config: LLMConfig,
  diffEndpoint: string,
  assetEndpoint: string,
  destFolder: string = "./tmp/translated",
  skipExisted: boolean = true
) {
  const jsonPathList = await getJsonPathList(diffEndpoint);
  log.log("Found " + jsonPathList.length + " json files in latest diff to translate")

  for (const jsonPath of jsonPathList) {
    log.info("Translating " + jsonPath);
    const destPath = resolve(destFolder, basename(jsonPath).replaceAll(".json", ".csv"));
    if (skipExisted && fs.existsSync(destPath)) {
      log.info(`Skipped ${destPath} because of file existence`);
      continue;
    }
    const jsonContent = (await axios.get(join(assetEndpoint, jsonPath))).data;
    log.debug(`translating json with ${jsonContent.length} frames`)
    const translatedCsvString = await translateJsonDataToCsvString(jsonContent, jsonPath.replace("json/", ""), config);
    await fs.writeFile(
      destPath,
      translatedCsvString,
      "utf-8"
    );
    log.info(`Output to ${destPath}`);
  }
}

async function main() {
  setupLog()
  program
    .requiredOption(
      "--type <translate-src-type>",
      "Type of the source file, can be folder, remote-diff",
      "folder"
    )
    .option(
      "--dir <dir>",
      "the source directory where the files are located, only activated when type is folder",
      "./tmp/untranslated"
    )
    .option(
      "--tag <tag>",
      "the version of the remote-diff, only activated when type is remote-diff",
      "-1"
  )
    .option(
      "--overwrite",
      "whether to overwrite translation if a translated file already exists, default to false (skip files)",
  )
  await program.parseAsync(process.argv);
  const opts = program.opts();

  const config = getLLMConfig();
  if (opts.type === "folder") {
    log.log("Source File Directory:", opts.dir)
    log.log("overwrite files:", opts.overwrite);
    await translateFolder(config, opts.dir, undefined, !opts.overwrite);
  } else if (opts.type === "remote-diff") {
    const { diffEndpoint, assetEndpoint } = getRemoteEndpoint();
    log.log("Remote Diff Endpoint:", `${diffEndpoint}?latest=${opts.tag}`)
    log.log("overwrite files:", opts.overwrite)
    await translateRemoteDiff(
      config,
      `${diffEndpoint}?latest=${opts.tag}`,
      assetEndpoint,
      undefined,
      !opts.overwrite
    );
  }
}

main().then(() => {
  process.exit(0)
}).catch((err) => {
  log.error(err);
  process.exit(1);
})
