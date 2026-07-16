import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = process.cwd()
const source = path.join(root, 'build', 'icon.png')

if (!fs.existsSync(source)) {
  console.error('Missing build/icon.png — place a square PNG there first.')
  process.exit(1)
}

const sizes = [16, 24, 32, 48, 64, 128, 256]
const buffers = []

for (const size of sizes) {
  buffers.push(await sharp(source).resize(size, size, { fit: 'cover' }).png().toBuffer())
}

fs.writeFileSync(path.join(root, 'build', 'icon.ico'), await pngToIco(buffers))

const iconsDir = path.join(root, 'build', 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

for (const size of [128, 256, 512]) {
  await sharp(source).resize(size, size).png().toFile(path.join(iconsDir, `${size}x${size}.png`))
}

fs.copyFileSync(source, path.join(root, 'public', 'icon.png'))
fs.copyFileSync(source, path.join(root, 'public', 'favicon.png'))

console.log('Generated build/icon.ico, build/icons/*, public/icon.png, public/favicon.png')
