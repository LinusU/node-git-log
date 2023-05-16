/* eslint-env mocha */

import assert from 'assert'
import { execa } from 'execa'
import fs from 'fs/promises'
import temp from 'fs-temp/promises'
import path from 'path'

import gitLog from './index.js'

function withRepo (fn) {
  return async () => {
    const cwd = await temp.mkdir()

    try {
      await execa('git', ['init'], { cwd })
      await fn(cwd)
    } finally {
      await fs.rm(cwd, { recursive: true })
    }
  }
}

async function populate (fn) {
  const start = new Date()
  await fn()
  const end = new Date()

  // Git doesn't give us millisecond precision
  start.setMilliseconds(0)
  end.setMilliseconds(999)

  return [start, end]
}

async function commit (cwd, subject, body = '') {
  await execa('git', ['commit', '--allow-empty', '-m', subject + (body ? '\n\n' + body : '')], { cwd })
}

describe('Git Log', () => {
  it('should handle single commit', withRepo(async (repo) => {
    const [start, end] = await populate(async () => {
      await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))

  it('should work with .git folder', withRepo(async (repo) => {
    const [start, end] = await populate(async () => {
      await commit(repo, 'Foobar')
    })

    const commits = await gitLog({ repo: path.join(repo, '.git') })

    assert.strictEqual(commits.length, 1)

    assert.strictEqual(commits[0].subject, 'Foobar')
    assert.strictEqual(commits[0].body, '')

    assert(commits[0].date <= end)
    assert(start <= commits[0].date)
  }))

  it('should handle multiple commits', withRepo(async (repo) => {
    const [start, end] = await populate(async () => {
      await commit(repo, 'Foobar 1')
      await commit(repo, 'Foobar 2')
      await commit(repo, 'Foobar 3')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 3)

    assert.strictEqual(commits[0].subject, 'Foobar 3')
    assert.strictEqual(commits[0].body, '')

    assert.strictEqual(commits[1].subject, 'Foobar 2')
    assert.strictEqual(commits[1].body, '')

    assert.strictEqual(commits[2].subject, 'Foobar 1')
    assert.strictEqual(commits[2].body, '')

    assert(commits[0].date <= end)
    assert(commits[1].date <= commits[0].date)
    assert(commits[2].date <= commits[1].date)
    assert(start <= commits[2].date)
  }))

  it('should handle commit bodies', withRepo(async (repo) => {
    const [start, end] = await populate(async () => {
      await commit(repo, 'Foobar 1', 'This is the first body')
      await commit(repo, 'Foobar 2', 'This is the second body\n\nWith multiple lines')
      await commit(repo, 'Foobar 3', 'This is the third body')
    })

    const commits = await gitLog({ repo })

    assert.strictEqual(commits.length, 3)

    assert.strictEqual(commits[0].subject, 'Foobar 3')
    assert.strictEqual(commits[0].body, 'This is the third body')

    assert.strictEqual(commits[1].subject, 'Foobar 2')
    assert.strictEqual(commits[1].body, 'This is the second body\n\nWith multiple lines')

    assert.strictEqual(commits[2].subject, 'Foobar 1')
    assert.strictEqual(commits[2].body, 'This is the first body')

    assert(commits[0].date <= end)
    assert(commits[1].date <= commits[0].date)
    assert(commits[2].date <= commits[1].date)
    assert(start <= commits[2].date)
  }))
})
