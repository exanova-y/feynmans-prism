// The other pears, as people in the world. A pear on this machine streams its
// room over the loopback bridge (torrent/src/bridge.ts); every device in it
// becomes a figure with its name. Devices that are playing move; the rest
// stand in Nonacris' square.

import * as THREE from 'three'
import { buildFigure, isForm, nameLabel } from './figures.ts'
import { damp } from './noise.ts'
import { START, type Form } from './regions.ts'
import { heightAt } from './terrain.ts'

interface Pose {
  x: number
  y: number
  z: number
  heading: number
  form: string
}

interface Peer {
  id: string
  name: string | null
  user: string | null
  pose: Pose | null
}

interface Figure {
  group: THREE.Group
  body: THREE.Group
  form: Form
  label: string
  target: THREE.Vector3
  heading: number
}

const POSE_EVERY = 0.2
const RETRY_MS = 10_000

export class Others {
  readonly group = new THREE.Group()
  private figures = new Map<string, Figure>()
  private source: EventSource | null = null
  private postTimer = 0
  private retry: number | undefined
  private readonly url: string

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    this.source = new EventSource(`${this.url}/events`)
    this.source.onmessage = (e) => this.receive(JSON.parse(e.data))
    this.source.onerror = () => {
      this.source?.close()
      this.source = null
      this.retry = window.setTimeout(() => this.connect(), RETRY_MS)
    }
  }

  private receive(frame: { self: { id: string }; peers: Peer[] }) {
    const seen = new Set<string>()
    frame.peers.forEach((peer, i) => {
      seen.add(peer.id)
      const label = peer.user ? `${peer.name ?? peer.id.slice(0, 8)} · ${peer.user}` : (peer.name ?? peer.id.slice(0, 8))
      const form: Form = peer.pose && isForm(peer.pose.form) ? peer.pose.form : 'human'
      const fig = this.figure(peer.id, label, form)
      if (peer.pose) {
        fig.target.set(peer.pose.x, peer.pose.y, peer.pose.z)
        fig.heading = peer.pose.heading
      } else this.idleSlot(fig, i)
    })
    for (const [id, fig] of this.figures) {
      if (seen.has(id)) continue
      this.group.remove(fig.group)
      this.figures.delete(id)
    }
  }

  private figure(id: string, label: string, form: Form): Figure {
    let fig = this.figures.get(id)
    if (fig && fig.form === form && fig.label === label) return fig
    if (fig) this.group.remove(fig.group)
    const group = new THREE.Group()
    const body = buildFigure(form)
    group.add(body, nameLabel(label))
    if (fig) group.position.copy(fig.group.position)
    fig = { group, body, form, label, target: fig?.target ?? new THREE.Vector3(), heading: fig?.heading ?? 0 }
    this.figures.set(id, fig)
    this.group.add(group)
    return fig
  }

  // A loose ring just ahead of the start, for pears whose laptop is only
  // lending compute; they face the newcomer.
  private idleSlot(fig: Figure, i: number) {
    const a = (i / 8) * Math.PI * 2
    const x = START.x + Math.cos(a) * 3
    const z = START.z + 5 + Math.sin(a) * 1.5 // flat ground; further on drops into the spring
    fig.target.set(x, heightAt(x, z), z)
    fig.heading = Math.PI
  }

  update(dt: number, me: Pose) {
    for (const fig of this.figures.values()) {
      fig.group.position.lerp(fig.target, damp(8, dt))
      fig.group.rotation.y = fig.heading
    }
    this.postTimer += dt
    if (this.postTimer < POSE_EVERY || !this.source) return
    this.postTimer = 0
    fetch(`${this.url}/pose`, { method: 'POST', body: JSON.stringify(me), keepalive: true }).catch(() => {})
  }

  dispose() {
    this.source?.close()
    window.clearTimeout(this.retry)
  }
}
