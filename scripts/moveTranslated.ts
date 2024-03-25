import fs from "fs-extra";
import { extractInfoFromCsvText } from "../src/csv";
import log from "loglevel";
import { setupLog } from "../src/setup-env";
import { dirname } from 'path'

function moveTranslatedFiles(
  srcFolder: string = "./tmp/translated",
  destFolder: string = "./data",
  removeTmpFile: boolean = true
) {
  const files = fs
    .readdirSync(srcFolder)
    .filter((file) => file.endsWith(".csv"));
  files.forEach((file) => {
    log.info(`Moving ${file}`);
    const fullJsonPath = extractInfoFromCsvText(
      fs.readFileSync(`${srcFolder}/${file}`, "utf-8")
    ).jsonUrl;
    const fileShouldPath = `${destFolder}/${fullJsonPath.replace(
      ".json",
      ".csv"
    )}`;

    if (fs.existsSync(fileShouldPath)) {
      log.warn(`${fileShouldPath} already exists. Default overwriting`);
    }
    fs.ensureDirSync(dirname(fileShouldPath));
    if (removeTmpFile) {
      fs.moveSync(`${srcFolder}/${file}`, fileShouldPath, {
        overwrite: true
      });
    } else {
      fs.copyFileSync(`${srcFolder}/${file}`, fileShouldPath);
    }
  });
}

setupLog();
moveTranslatedFiles();
