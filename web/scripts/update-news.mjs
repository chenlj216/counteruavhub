#!/usr/bin/env node

import { readJson, updateNewsData, writeJson, defaultNewsJsonPath } from './news-updater.mjs'

function readArgs(argv) {
  const args = {
    write: false,
    allowFetchFailure: false,
    maxNew: 8,
    limit: 80,
    file: defaultNewsJsonPath(),
  }

  for (const arg of argv) {
    if (arg === '--write') args.write = true
    if (arg === '--allow-fetch-failure') args.allowFetchFailure = true
    if (arg.startsWith('--max-new=')) args.maxNew = Number(arg.split('=')[1])
    if (arg.startsWith('--limit=')) args.limit = Number(arg.split('=')[1])
    if (arg.startsWith('--file=')) args.file = arg.split('=').slice(1).join('=')
  }

  return args
}

async function main() {
  const args = readArgs(process.argv.slice(2))
  const existingItems = await readJson(args.file)
  const nextItems = await updateNewsData({
    existingItems,
    allowFetchFailure: args.allowFetchFailure,
    maxNew: args.maxNew,
    limit: args.limit,
  })

  const added = nextItems.filter((item) => !existingItems.some((existing) => existing.url === item.url))

  if (args.write) {
    await writeJson(args.file, nextItems)
    console.log(`News data updated: ${nextItems.length} total items, ${added.length} new candidate(s).`)
  } else {
    console.log(`News dry run: ${nextItems.length} total items, ${added.length} new candidate(s).`)
    for (const item of added) {
      console.log(`- ${item.date} [${item.category}] ${item.title} (${item.source})`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
