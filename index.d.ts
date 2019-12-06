declare namespace gitLog {
  interface Options {
    /**
     * Wether or not to include commits with more than one parent.
     *
     * @default false
     */
    merges?: boolean

    /**
     * Include only commits in the specified revision range. When no `range` is specified, it defaults to `'HEAD'` (i.e. the whole history leading to the current commit).
     *
     * @default 'HEAD'
     */
    range?: string

    /**
     * Path to the repository to read the log from. When no `repo` is specified, the current working dirtectory will be used.
     *
     * @default process.cwd()
     */
    repo?: string
  }

  interface Commit {
    /** Subject of the commit */
    subject: string
    /** Body of the commit */
    body: string
    /** Committer date of the commit */
    date: Date
  }
}

/**
 * @returns List of commits
 */
declare function gitLog (options?: gitLog.Options): Promise<gitLog.Commit[]>

export = gitLog
