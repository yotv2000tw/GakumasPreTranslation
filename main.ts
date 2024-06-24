import axios from "axios";
import { getLLMConfig, setupLog } from "./src/setup-env";
import { LLMConfig } from "./src/translate";
import log from "loglevel";
import { readFileSync, readJSONSync, writeJSONSync } from 'fs-extra'

// const prompt = `你是一位经验丰富的本地化工作者，你现在需要将日语游戏文本翻译为中文。

// 输入格式：你的输入为若干行文本，每行格式为[key],[japanese]。代表待翻译的字段名与日文原文。
// 输出：你的输出为一个json数组，格式为
// [{
//   "key": "string", // 原始key
//   "japanese": "string", // 原始日文
//   "chinese": "string" // 翻译后中文
// }]

// 接下来为输入
// `

const prompt = `你是一位經驗豐富的本地化工作者，你現在需要將日語偶像培育遊戲文本翻譯為中文。你需要注意特定術語的翻譯：

- プロデュース：培育
- メモリー：回憶
- サークル：社團

輸入格式：你的輸入為若干行文本，每行格式為[key],[japanese]。代表待翻譯的欄位名與日文原文。
輸出：你的輸出為若干行文本，每行格式為[key],[chinese]。代表原始key，翻譯後中文。

接下來為輸入
`

async function getTranslation(
  userInput: string,
  {
    apiKey,
    baseURL,
    model,
    max_tokens,
  }: LLMConfig
) {
  try {
    const openai = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    log.info(`Sending request to ${model} API, please wait...`);
    const response = await openai.post(
      "/v1/chat/completions",
      {
        model,
        // response_format: { "type": "json_object" },
        messages: [
          { role: "system", content: prompt },
          // { 'role': 'user', content: exampleInput },
          // {'role': 'assistant', content: exampleOutput},
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        max_tokens,
      },
      {
        timeout: 180000,
      }
    );

    const generatedText = response.data.choices[0].message.content;
    const tokenConsumed = response.data.usage.total_tokens;
    log.debug(`Generated Text: ${generatedText}`);
    log.debug(`Consumed token: ${tokenConsumed}`);
    return generatedText;
  } catch (error) {
    log.error(`Error: ${error.message}`);
    log.error(`Error: ${error.response.data.error.message}`);
    throw new Error(error.response.data.error.message);
  }
}

interface LocalizatonObj {
  [key: string]: {
    japanese: string;
    chinese: string;
  }
}

function parseCsvFormatLocalization(txt: string): { [key: string]: string } {
  const obj = {}
  txt.replaceAll("\r\n", "\n").split("\n").forEach((line) => {
    if (line.startsWith("KEY,Japanese")) {
      return
    }
    if (line === "") {
      return
    }
    if (line.startsWith("//")) {
      return
    }
    // note: not using split as there might be ","
    const splitIndex = line.indexOf(",")
    const key = line.slice(0, splitIndex)
    const content = line.slice(splitIndex + 1)
    obj[key] = content
  })
  return obj
}

function countUntranslatedLines(lFile: LocalizatonObj) {
  let count = 0
  for (const key of Object.keys(lFile)) {
    if (key !== "" && lFile[key].chinese === "") {
      count += 1
    }
  }
  return count
}

function pickUntranslatedLines(lFile: LocalizatonObj, size: number = 30) {
  let untranslatedLines = ""
  let count = 0
  for (const key of Object.keys(lFile)) {
    if (lFile[key].chinese === "") {
      untranslatedLines += `${key},${lFile[key].japanese}\n`
      count += 1
      if (count >= size) {
        break
      }
    }
  }
  log.info(`Picked ${count} untranslated lines`)
  return untranslatedLines
}

function readRawLocalization(filePath: string) {
  const rawLocalization = readFileSync(filePath, "utf-8")
  const rawObj: LocalizatonObj = {}

  const parsed = parseCsvFormatLocalization(rawLocalization)
  for (const key of Object.keys(parsed)) {
    rawObj[key] = {
      japanese: parsed[key],
      chinese: "",
    }
  }
  return rawObj
}

// will modify rawObj
function applyTranslatedLocalization(rawObj: LocalizatonObj, translationTable: { [key: string]: string }) {
  // const translatedObj: LocalizatonObj = readJSONSync(filePath, {
  //   "encoding": "utf-8"
  // })
  for (const key of Object.keys(translationTable)) {
    if (rawObj[key] === undefined) {
      log.warn("Key not found in Localization.txt: ", key);
      continue
    }
    rawObj[key].chinese = translationTable[key]
  }
  return rawObj
}

async function main() {
  setupLog()
  const sourcePath = "./etc/Localization.txt"
  const targetPath = "./etc/translated.json"
  const distPath = "./etc/localization.json"
  const config = getLLMConfig()

  // initialization
  const l10nObj = readRawLocalization(sourcePath) // get raw lFile
  const lastl10nObj: LocalizatonObj = readJSONSync(targetPath, {
    "encoding": "utf-8"
  })
  const lastl10nTable = {}
  Object.keys(lastl10nObj).forEach((key) => {
    lastl10nTable[key] = lastl10nObj[key].chinese
  })
  applyTranslatedLocalization(l10nObj, lastl10nTable)
  // console.log(lFile)
  let untranslated = countUntranslatedLines(l10nObj)

  while (untranslated > 0) {
    log.info(`${untranslated} untranslated lines left`)
    // translation
    const input = pickUntranslatedLines(l10nObj, 60)
    // console.log(input)
    // const rtn = ""
    const rtn = await getTranslation(input, config)
    // console.log(rtn)
    const translationTable = parseCsvFormatLocalization(rtn)
    applyTranslatedLocalization(l10nObj, translationTable)
    // console.log(lFile)
    writeJSONSync(targetPath, l10nObj, {
      "encoding": "utf-8",
      "spaces": 2,
    })
    untranslated = countUntranslatedLines(l10nObj)
  }
  const tmp = {}
  Object.keys(l10nObj).forEach((key) => {
    tmp[key] = l10nObj[key].chinese
  })
  writeJSONSync(distPath, tmp, {
    "encoding": "utf-8",
    "spaces": 2,
  })
}

main()
