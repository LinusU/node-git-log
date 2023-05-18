/* eslint-env mocha */

import assert from 'assert'
import { execa } from 'execa'
import fs from 'fs/promises'
import temp from 'fs-temp/promises'
import path from 'path'

import gitLog from './index.js'

function withRepo (objectFormat, fn) {
  if (typeof objectFormat === 'function') {
    fn = objectFormat
    objectFormat = null
  }

  const flags = []
  if (objectFormat != null) {
    flags.push(`--object-format=${objectFormat}`)
  }

  return async () => {
    const cwd = await temp.mkdir()

    try {
      await execa('git', ['init', ...flags], { cwd })
      await fn(cwd)
    } finally {
      await fs.rm(cwd, { recursive: true })
    }
  }
}

async function populate (fn) {
  const start = new Date()
  const result = await fn()
  const end = new Date()

  // Git doesn't give us millisecond precision
  start.setMilliseconds(0)
  end.setMilliseconds(999)

  return [start, end, result]
}

/** @returns {string} hash of the new commit */
async function commit (cwd, subject, body = '') {
  await execa('git', ['commit', '--allow-empty', '-m', subject + (body ? '\n\n' + body : '')], { cwd })
  const hash = (await execa('git', ['rev-parse', 'HEAD'], { cwd })).stdout

  // SHA-1 or SHA-256
  assert(/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(hash))

  return hash
}

describe('Git Log', () => {
  it('should handle single commit', withRepo(async (repo) => {
    const [start, end, hash] = await populate(async () => {
      return await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')
    assert.strictEqual(commits[0].hash, hash)

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))

  it('should work with .git folder', withRepo(async (repo) => {
    const [start, end, hash] = await populate(async () => {
      return await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo: path.join(repo, '.git') })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')
    assert.strictEqual(commits[0].hash, hash)

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))

  it('should handle multiple commits', withRepo(async (repo) => {
    const [start, end, hashes] = await populate(async () => {
      const hash1 = await commit(repo, 'Foobar 1')
      const hash2 = await commit(repo, 'Foobar 2')
      const hash3 = await commit(repo, 'Foobar 3')
      return [hash1, hash2, hash3]
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 3)

    assert.strictEqual(commits[0].subject, 'Foobar 3')
    assert.strictEqual(commits[0].body, '')
    assert.strictEqual(commits[0].hash, hashes[2])

    assert.strictEqual(commits[1].subject, 'Foobar 2')
    assert.strictEqual(commits[1].body, '')
    assert.strictEqual(commits[1].hash, hashes[1])

    assert.strictEqual(commits[2].subject, 'Foobar 1')
    assert.strictEqual(commits[2].body, '')
    assert.strictEqual(commits[2].hash, hashes[0])

    assert(commits[0].date <= end)
    assert(commits[1].date <= commits[0].date)
    assert(commits[2].date <= commits[1].date)
    assert(start <= commits[2].date)
  }))

  it('should handle commit bodies', withRepo(async (repo) => {
    const [start, end, hashes] = await populate(async () => {
      const hash1 = await commit(repo, 'Foobar 1', 'This is the first body')
      const hash2 = await commit(repo, 'Foobar 2', 'This is the second body\n\nWith multiple lines')
      const hash3 = await commit(repo, 'Foobar 3', 'This is the third body')
      return [hash1, hash2, hash3]
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 3)

    assert.strictEqual(commits[0].subject, 'Foobar 3')
    assert.strictEqual(commits[0].body, 'This is the third body')
    assert.strictEqual(commits[0].hash, hashes[2])

    assert.strictEqual(commits[1].subject, 'Foobar 2')
    assert.strictEqual(commits[1].body, 'This is the second body\n\nWith multiple lines')
    assert.strictEqual(commits[1].hash, hashes[1])

    assert.strictEqual(commits[2].subject, 'Foobar 1')
    assert.strictEqual(commits[2].body, 'This is the first body')
    assert.strictEqual(commits[2].hash, hashes[0])

    assert(commits[0].date <= end)
    assert(commits[1].date <= commits[0].date)
    assert(commits[2].date <= commits[1].date)
    assert(start <= commits[2].date)
  }))

  it('should handle SHA-1 hashes', withRepo('sha1', async (repo) => {
    const [start, end, hash] = await populate(async () => {
      return await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')
    assert.strictEqual(commits[0].hash, hash)
    assert.strictEqual(commits[0].hash.length, 40)

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))

  it('should handle SHA-256 hashes', withRepo('sha256', async (repo) => {
    const [start, end, hash] = await populate(async () => {
      return await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')
    assert.strictEqual(commits[0].hash, hash)
    assert.strictEqual(commits[0].hash.length, 64)

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))
})
