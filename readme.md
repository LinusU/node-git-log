# Node.js Git Log

Read Git commit history from Node.js.

## Installation

```sh
npm install --save git-log
```

## Usage

```js
import gitLog from 'git-log'

const commits = await gitLog()

console.log(commits[0].title)
//=> Upgrade to Node.js 10.x

console.log(commits[0].date)
//=> 2019-10-07T20:47:10.000Z

console.log(commits[0].body)
//=> This patch change the Node.js verison to...
```

## API

### `gitLog([options])`

- `options` (`object`, optional)
  - `merges` (`boolean`, optional) - Wether or not to include commits with more than one parent.
  - `range` (`string`, optional) - Include only commits in the specified revision range. When no `range` is specified, it defaults to `'HEAD'` (i.e. the whole history leading to the current commit).
  - `repo` (`string`, optional) - Path to the repository to read the log from. When no `repo` is specified, the current working dirtectory will be used.
  - `path` (`string | string[]`, optional) - Path to a file or directory to limit results to specific changes. When no `path` is specified, the entire history of the project id returned.
- returns `Promise<object[]>` - List of commits
  - `subject` (`string`) - Subject of the commit
  - `body` (`string`) - Body of the commit
  - `date` (`Date`) - Committer date of the commit
