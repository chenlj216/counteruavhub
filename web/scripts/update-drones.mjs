#!/usr/bin/env node

import {
  defaultCatalogPath,
  defaultDronesJsonPath,
  readJson,
  updateDroneData,
  writeJson,
} from './drone-updater.mjs'

function readArgs(argv) {
  const args = {
    write: false,
    allowFetchFailure: false,
    file: defaultDronesJsonPath(),
    catalog: defaultCatalogPath(),
  }

  for (const arg of argv) {
    if (arg === '--write') args.write = true
    if (arg === '--allow-fetch-failure') args.allowFetchFailure = true
    if (arg.startsWith('--file=')) args.file = arg.split('=').slice(1).join('=')
    if (arg.startsWith('--catalog=')) args.catalog = arg.split('=').slice(1).join('=')
  }

  return args
}

async function main() {
  const args = readArgs(process.argv.slice(2))
  const existingRecords = await readJson(args.file)
  const catalog = await readJson(args.catalog)
  const nextRecords = await updateDroneData({
    existingRecords,
    catalog,
    allowFetchFailure: args.allowFetchFailure,
  })

  const existingIds = new Set(existingRecords.map((record) => record.id))
  const added = nextRecords.filter((record) => !existingIds.has(record.id))

  if (args.write) {
    await writeJson(args.file, nextRecords)
    console.log(`Drone data updated: ${nextRecords.length} total records, ${added.length} new candidate(s).`)
  } else {
    console.log(`Drone dry run: ${nextRecords.length} total records, ${added.length} new candidate(s).`)
    for (const record of added) {
      console.log(`- ${record.brand} ${record.name} [${record.category}] ${record.controlFreq}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
