// The four bodies, shared by the player and by the other pears' figures, and
// a floating name label.

import * as THREE from 'three'
import { mat } from './props.ts'
import type { Form } from './regions.ts'

function part(geo: THREE.BufferGeometry, color: number, y: number, rx = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat(color))
  m.position.set(0, y, z)
  m.rotation.x = rx
  m.castShadow = true
  return m
}

function human() {
  const g = new THREE.Group()
  g.add(part(new THREE.BoxGeometry(0.8, 1.4, 0.5), 0xc76b4a, 0.7))
  g.add(part(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xe9c9a5, 1.7))
  return g
}

function owl() {
  const g = new THREE.Group()
  g.add(part(new THREE.ConeGeometry(0.45, 1.2, 6), 0x8a6a4a, 0.6, Math.PI / 2))
  g.add(part(new THREE.SphereGeometry(0.35, 6, 5), 0xa08a6a, 0.9))
  for (const side of [-1, 1]) {
    const wing = part(new THREE.BoxGeometry(1.8, 0.08, 0.7), 0x7a5a3a, 0.7)
    wing.position.x = side * 1.1
    wing.name = side < 0 ? 'wingL' : 'wingR'
    g.add(wing)
  }
  return g
}

function naiad() {
  const g = new THREE.Group()
  const m = new THREE.MeshLambertMaterial({ color: 0x7fe0e8, transparent: true, opacity: 0.75, emissive: 0x104050 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 3, 8), m)
  body.position.y = 0.9
  g.add(body)
  return g
}

function stag() {
  const g = new THREE.Group()
  g.add(part(new THREE.BoxGeometry(0.8, 0.8, 1.8), 0x8a5a3a, 1.1))
  g.add(part(new THREE.BoxGeometry(0.4, 0.5, 0.7), 0x8a5a3a, 1.7, 0, 0.9))
  for (const side of [-1, 1]) {
    const antler = part(new THREE.ConeGeometry(0.08, 0.9, 4), 0xe0d0b0, 2.4, 0, 0.9)
    antler.position.x = side * 0.22
    antler.rotation.z = side * 0.4
    g.add(antler)
  }
  for (const [x, z] of [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]]) {
    const leg = part(new THREE.BoxGeometry(0.16, 0.8, 0.16), 0x6a4a2a, 0.4, 0, z)
    leg.position.x = x
    g.add(leg)
  }
  return g
}

const BUILDERS: Record<Form, () => THREE.Group> = { human, owl, naiad, stag }

export const buildFigure = (form: Form) => BUILDERS[form]()

export const isForm = (v: string): v is Form => v in BUILDERS

export function nameLabel(text: string) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = 'rgba(246,242,232,0.9)'
  ctx.beginPath()
  ctx.roundRect(8, 8, 240, 48, 14)
  ctx.fill()
  ctx.fillStyle = '#3f5a45'
  ctx.font = '600 24px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.slice(0, 22), 128, 32)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))
  sprite.scale.set(4, 1, 1)
  sprite.position.y = 2.9
  return sprite
}
