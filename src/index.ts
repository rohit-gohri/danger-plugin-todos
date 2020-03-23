import { escapeRegExp, merge } from "lodash"
// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

function getCreatedOrModifiedFiles() {
  return [...danger.git.created_files, ...danger.git.modified_files]
}

export type GenerateRepoUrl = (filepath: string) => string

export type RepoUrl = string | GenerateRepoUrl | boolean

export type IgnorePatterns = (string | RegExp)[]

interface PlainObject<T> {
  [key: string]: T
}

export function shouldIgnoreFile(filepath: string, ignore: IgnorePatterns) {
  for (const ignorePath of ignore) {
    if (ignorePath instanceof RegExp && ignorePath.test(filepath)) {
      return true
    } else if (typeof ignorePath === "string" && filepath.includes(ignorePath)) {
      return true
    }
  }
  return false
}

export function getMatches(diffString: string, keyword: string) {
  if (!diffString) {
    return []
  }
  const escapedKeyword = escapeRegExp(keyword)

  const regex = new RegExp(
    `(?:\\/\\/|#|<!--|;|\\/\\*|^|\\--|\\/\\*\\*\\s*\\**)\\s*${escapedKeyword}(?::\\s*|\\s+)(.+)`,
    "gi",
  )
  const matches = diffString.match(regex)
  if (!matches || !matches.length) {
    return []
  }
  return matches
}

export function getFormattedSrcLink(filepath: string, repoUrl?: RepoUrl) {
  let srcLink = `\`${filepath}\``
  if (repoUrl === true) {
    try {
      const packageFile = require(`${process.cwd()}/package.json`)
      repoUrl = packageFile.repository.url.replace(/\.git$/, '')
    }
    catch (err) {
      //
    }
  }
  // Github style url
  if (typeof repoUrl === "string") {
    srcLink = `[${filepath}](${repoUrl}/blob/${danger.git.commits[0].sha}/${filepath})`
  } else if (typeof repoUrl === "function") {
    srcLink = `[${filepath}](${repoUrl(filepath)})`
  }
  return srcLink
}

export function prepareTodosForDanger(keywords: string[] | undefined, addedText: string, removedText: string, filepath: string, repoUrl: RepoUrl, keywordMatches: PlainObject<string[]>): PlainObject<string[]> | undefined  {
  if (keywords === undefined) return
  const result = keywordMatches
  keywords.forEach(keyword => {
    const addedMatches = getMatches(addedText, keyword)
    const removedMatches = getMatches(removedText, keyword)
    const srcLink = getFormattedSrcLink(filepath, repoUrl)

    addedMatches.forEach(match => {
      result[keyword].push(`\`\`${match}\`\`: ${srcLink}`)
    })
    removedMatches.forEach(match => {
      result[keyword].push(`~~${match}~~: ${srcLink}`)
    })
  })
  return result
}

/**
 * A danger-js plugin to list all todos/fixmes/etc added/changed in a PR
 */
export default async function todos({
  repoUrl = true,
  ignore = [],
  keywords = ["TODO", "FIXME"],
}: {
  repoUrl?: RepoUrl
  ignore?: IgnorePatterns
  keywords?: string[],
} = {}) {
  const keywordMatches: PlainObject<string[]> = {}

  keywords.forEach(keyword => {
    keywordMatches[keyword] = []
  })

  const results = await Promise.all(
    getCreatedOrModifiedFiles().map(async filepath => {
      if (shouldIgnoreFile(filepath, ignore)) {
        return
      }

      let addedText: string = ''
      let removedText: string = ''

      try {
        const diff = await danger.git.diffForFile(filepath)
        if (diff) {
          addedText = diff.added
          removedText = diff.removed
        }
      }
      catch (err) {
        if (danger.gitlab) {
          // Could not get diff, will be using full file
          addedText = await danger.gitlab.utils.fileContents(filepath)
        }
        else {
          throw err
        }
      }

      if (!addedText || !removedText) {
        return
      }
      return prepareTodosForDanger(keywords, addedText, removedText, filepath, repoUrl, keywordMatches)
    }),
  )
  const mergedKeywordMatches: PlainObject<string[]> = merge(keywordMatches, ...results)

  const output: string[] = []
  Object.values(mergedKeywordMatches).forEach(matches => {
    if (matches.length) {
      output.push(...matches)
    }
  })

  if (!output.length) {
    return
  }

  markdown(`### ${keywords.join("s/")}s:\n- ${output.join("\n- ")}`)
}
