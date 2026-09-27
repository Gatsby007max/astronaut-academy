import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import sharp from 'sharp'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, textureCompress, meshopt, resample, instance, join as joinMeshes } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import { SOURCES } from './asset-sources.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'assets-src')
const outDir = join(root, 'public', 'assets')
const src = (id) => join(srcDir, SOURCES.find((s) => s.id === id).file)
const out = (name) => join(outDir, name)

const produced = {}
const record = async (key, file, sourceIds, extra = {}) => {
  const bytes = (await stat(out(file))).size
  const gzipBytes = gzipSync(await readFile(out(file)), { level: 9 }).length
  produced[key] = { file: `/assets/${file}`, bytes, gzipBytes, sources: sourceIds, ...extra }
  console.log(`${key.padEnd(16)} ${(bytes / 1024).toFixed(0).padStart(6)} KB  gzip ${(gzipBytes / 1024).toFixed(0).padStart(6)} KB  ${file}`)
}

async function optimizeModel({ key, sourceId, file, ratio, error, textureSize, quality, keepNames, level = 'medium' }) {
  await MeshoptEncoder.ready
  await MeshoptSimplifier.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'meshopt.encoder': MeshoptEncoder,
    })
  const doc = await io.read(src(sourceId))
  // The source EMU export marks opaque fabric as fully transmissive. Restore
  // opaque cloth before optimization; otherwise the suit disappears in WebGL.
  if (sourceId === 'emu') {
    for (const material of doc.getRoot().listMaterials()) {
      for (const name of ['KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_specular']) material.setExtension(name, null)
      material.setMetallicFactor(0).setRoughnessFactor(.75)
      if (material.getName().includes('justbody_blinn3')) material.setMetallicFactor(.65).setRoughnessFactor(.18)
    }
  }
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose()
  }
  await doc.transform(
    dedup(),
    instance({ min: 2 }),
    ...(keepNames ? [] : [joinMeshes()]),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false }),
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [textureSize, textureSize], quality }),
    meshopt({ encoder: MeshoptEncoder, level }),
  )
  await io.write(out(file), doc)
  let tris = 0
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) tris += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3
  await record(key, file, [sourceId], { triangles: Math.round(tris) })
}

const srgbEncode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)

async function stars() {
  const buf = await readFile(src('stars'))
  const loader = new EXRLoader()
  loader.setDataType(THREE.FloatType)
  const tex = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  const { width, height, data } = tex
  const rgb = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y
    for (let x = 0; x < width; x++) {
      const i = (srcRow * width + x) * 4
      const o = (y * width + x) * 3
      for (let c = 0; c < 3; c++) rgb[o + c] = Math.round(Math.min(1, srgbEncode(Math.max(0, data[i + c]))) * 255)
    }
  }
  const base = sharp(rgb, { raw: { width, height, channels: 3 } })
  await base.clone().webp({ quality: 88, effort: 5 }).toFile(out('stars_4k.webp'))
  await record('stars4k', 'stars_4k.webp', ['stars'])
  await base.clone().resize(2048, 1024, { kernel: 'lanczos3' }).webp({ quality: 75, effort: 5 }).toFile(out('stars_2k.webp'))
  await record('stars2k', 'stars_2k.webp', ['stars'])
}

async function earth() {
  for (const size of [4096, 2048]) {
    const tag = size === 4096 ? '4k' : '2k'
    await sharp(src('earthDay'))
      .resize(size, size / 2, { kernel: 'lanczos3' })
      .removeAlpha()
      .webp({ quality: 80, effort: 5 })
      .toFile(out(`earth_day_${tag}.webp`))
    await record(`earthDay${tag}`, `earth_day_${tag}.webp`, ['earthDay'])

    await sharp(src('earthNight'))
      .resize(size, size / 2, { kernel: 'lanczos3' })
      .modulate({ brightness: 1.0 })
      .webp({ quality: 80, effort: 5 })
      .toFile(out(`earth_night_${tag}.webp`))
    await record(`earthNight${tag}`, `earth_night_${tag}.webp`, ['earthNight'])
  }
  await sharp(src('earthClouds')).greyscale().webp({ quality: 80, effort: 5 }).toFile(out('earth_clouds_2k.webp'))
  await record('earthClouds2k', 'earth_clouds_2k.webp', ['earthClouds'])
}

async function readDem(id, region) {
  let img = sharp(src(id), { limitInputPixels: false })
  if (region) img = img.extract(region)
  const { data, info } = await img.toColourspace('grey16').raw({ depth: 'ushort' }).toBuffer({ resolveWithObject: true })
  const values = new Uint16Array(data.buffer, data.byteOffset, data.byteLength / 2)
  return { values, width: info.width, height: info.height }
}

const demMeters = (v) => v * 0.5 - 10000

async function moon() {
  for (const [size, tag] of [
    [4096, '4k'],
    [2048, '2k'],
  ]) {
    await sharp(src('moonColor'))
      .resize(size, size / 2, { kernel: 'lanczos3' })
      .toColourspace('srgb')
      .removeAlpha()
      .webp({ quality: 84, effort: 5 })
      .toFile(out(`moon_color_${tag}.webp`))
    await record(`moonColor${tag}`, `moon_color_${tag}.webp`, ['moonColor'])
  }

  const dem = await readDem('moonDemGlobal')
  const { width: W, height: H, values } = dem
  const R = 1737400
  const exaggeration = 4
  const h = (x, y) => demMeters(values[Math.min(H - 1, Math.max(0, y)) * W + (((x % W) + W) % W)]) * exaggeration
  const normal = Buffer.alloc(W * H * 3)
  for (let y = 0; y < H; y++) {
    const lat = (0.5 - (y + 0.5) / H) * Math.PI
    const dxMeters = Math.max(2000, ((2 * Math.PI * R) / W) * Math.cos(lat))
    const dyMeters = (Math.PI * R) / H
    for (let x = 0; x < W; x++) {
      const dhdx = (h(x + 1, y) - h(x - 1, y)) / (2 * dxMeters)
      const dhdy = (h(x, y - 1) - h(x, y + 1)) / (2 * dyMeters)
      let nx = -dhdx, ny = -dhdy, nz = 1
      const len = Math.hypot(nx, ny, nz)
      nx /= len; ny /= len; nz /= len
      const o = (y * W + x) * 3
      normal[o] = Math.round((nx * 0.5 + 0.5) * 255)
      normal[o + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      normal[o + 2] = Math.round((nz * 0.5 + 0.5) * 255)
    }
  }
  await sharp(normal, { raw: { width: W, height: H, channels: 3 } })
    .resize(2048, 1024, { kernel: 'cubic' })
    .webp({ quality: 90, effort: 5 })
    .toFile(out('moon_normal_2k.webp'))
  await record('moonNormal2k', 'moon_normal_2k.webp', ['moonDemGlobal'])
}

async function lunarSouthPole() {
  const FULL_W = 5760, FULL_H = 2880
  const rows = 64
  const dem = await readDem('moonDemDetail', { left: 0, top: FULL_H - rows, width: FULL_W, height: rows })
  const sample = (lonDeg, latDeg) => {
    const fx = ((lonDeg + 180) / 360) * FULL_W - 0.5
    const fy = ((90 - latDeg) / 180) * FULL_H - 0.5 - (FULL_H - rows)
    const x0 = Math.floor(fx), y0 = Math.max(0, Math.min(rows - 2, Math.floor(fy)))
    const tx = fx - x0, ty = Math.max(0, Math.min(1, fy - y0))
    const at = (x, y) => dem.values[y * FULL_W + (((x % FULL_W) + FULL_W) % FULL_W)]
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx
    return demMeters(top * (1 - ty) + bottom * ty)
  }
  const N = 257
  const halfSizeKm = 36
  const R = 1737.4
  const heights = new Float32Array(N * N)
  let min = Infinity, max = -Infinity
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = ((i / (N - 1)) * 2 - 1) * halfSizeKm
      const y = ((j / (N - 1)) * 2 - 1) * halfSizeKm
      const r = Math.hypot(x, y)
      const lat = -90 + (r / R) * (180 / Math.PI)
      const lon = (Math.atan2(x, -y) * 180) / Math.PI
      const v = sample(lon, lat)
      heights[j * N + i] = v
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
  }
  const packed = new Uint16Array(N * N)
  for (let k = 0; k < packed.length; k++) packed[k] = Math.round(((heights[k] - min) / (max - min)) * 65535)
  await writeFile(out('lunar_south_pole.bin'), Buffer.from(packed.buffer))
  await record('lunarSouthPole', 'lunar_south_pole.bin', ['moonDemDetail'], {
    grid: N,
    halfSizeKm,
    minMeters: Math.round(min),
    maxMeters: Math.round(max),
    note: 'Azimuthal equidistant reprojection centered on the lunar south pole; uint16 little-endian, row-major',
  })
}

async function emu() { await optimizeModel({ key: 'emu', sourceId: 'emu', file: 'emu.glb', ratio: 0.2, error: 0.004, textureSize: 1024, quality: 80, keepNames: false, level: 'high' }) }
async function iss() { await optimizeModel({ key: 'iss', sourceId: 'iss', file: 'iss.glb', ratio: 0.15, error: 0.004, textureSize: 512, quality: 70, keepNames: true, level: 'high' }) }
async function models() {
  await iss()
  await optimizeModel({ key: 'issHd', sourceId: 'iss', file: 'iss_hd.glb', ratio: 0.3, error: 0.008, textureSize: 1024, quality: 78, keepNames: true, level: 'high' })
  await optimizeModel({ key: 'emu', sourceId: 'emu', file: 'emu.glb', ratio: 0.2, error: 0.004, textureSize: 1024, quality: 80, keepNames: false, level: 'high' })
}

await mkdir(outDir, { recursive: true })
async function title() {
 await sharp(src('titleOrbit')).resize(1920).webp({quality:85, effort:5}).toFile(out('title_orbit.webp'))
 await record('titleOrbit', 'title_orbit.webp', ['titleOrbit'])
}
const tasks = { models, stars, earth, moon, lunarSouthPole, title, ...(process.argv.includes('iss') ? {iss} : {}), ...(process.argv.includes('emu') ? {emu} : {}) }
const only = process.argv.slice(2)
for (const [name, fn] of Object.entries(tasks)) {
  if (only.length && !only.includes(name)) continue
  await fn()
}

const manifestPath = join(root, 'src', 'content', 'generated', 'assets.json')
await mkdir(dirname(manifestPath), { recursive: true })
let previous = { assets: {} }
try {
  previous = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch {}
const manifest = {
  generatedAt: new Date().toISOString(),
  assets: { ...previous.assets, ...produced },
  sources: SOURCES.map(({ id, title, credit, page, url }) => ({ id, title, credit, page, url })),
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
await writeFile(out('manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
const total = Object.values(manifest.assets).reduce((sum, a) => sum + a.bytes, 0)
const totalGzip = Object.values(manifest.assets).reduce((sum, a) => sum + (a.gzipBytes ?? a.bytes), 0)
console.log(`manifest: ${Object.keys(manifest.assets).length} assets, ${(total / 1e6).toFixed(2)} MB raw, ${(totalGzip / 1e6).toFixed(2)} MB gzip`)
