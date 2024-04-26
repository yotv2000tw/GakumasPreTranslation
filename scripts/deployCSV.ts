import fs from 'fs-extra'
import md5 from 'md5-file'
import path from 'path'
import { extractInfoFromCsvText } from '../src/csv'

const DOMAIN = 'ai.shiny.fun'

const findCsv = (dir: string) => {
  const results = fs.readdirSync(dir)
  let files: string[] = []
  for (let str of results) {
    const file = path.join(dir, str)
    const stats = fs.statSync(file)
    if (stats.isDirectory()) {
      files = files.concat(findCsv(file))
    } else {
      files.push(file)
    }
  }
  return files
}

const addCustonDomain = () => {
  fs.outputFileSync('./dist/CNAME', DOMAIN)
}

const deployCSV = async () => {
  await fs.emptyDir('./dist/story/')

  const files = findCsv('./data').filter((file) => file.endsWith('.csv'))
  const prims = files.map(async file => {
    const text = await fs.readFile(file, 'utf-8')
    const { jsonUrl } = extractInfoFromCsvText(text)
    const hash = (await md5(file)).slice(0, 7)
    await fs.copy(file, `./dist/story/${hash}.csv`, {
      overwrite: false, errorOnExist: true
    })
    return [jsonUrl, hash]
  })
  const result = await Promise.all(prims)
  await fs.writeJSON('./dist/story.json', result)

  addCustonDomain()
}

deployCSV()