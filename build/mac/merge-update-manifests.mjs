import fs from 'node:fs'
import YAML from 'yaml'

console.info('Reading manifests...')
const arm64Manifest = YAML.parse(fs.readFileSync('./artifacts/mac-manifest-arm64/latest-mac.yml', 'utf8'))
const x64Manifest = YAML.parse(fs.readFileSync('./artifacts/mac-manifest-x64/latest-mac.yml', 'utf8'))

console.info('Merging manifests...')
arm64Manifest.files.push(...x64Manifest.files)

console.info('Writing final manifest...')
fs.writeFileSync('latest-mac.yml', YAML.stringify(arm64Manifest), 'utf8')
