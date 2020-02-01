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

/**
 * A danger-js plugin to list all todos/fixmes/etc added/changed in a PR
 */
export default async function todos({
  repoUrl,
  ignore = [],
  keywords = ["TODO", "FIXME"],
}: {
  repoUrl?: string | GenerateRepoUrl
  ignore?: Array<string | RegExp>
  keywords?: string[]
} = {}) {
  const keywordMatches: { [key: string]: string[] } = {}

  keywords.forEach(keyword => {
    keywordMatches[keyword] = []
  })

  await Promise.all(
    getCreatedOrModifiedFiles().map(async filepath => {
      let ignoreFile = false
      ignore.forEach(ignorePath => {
        if (typeof ignorePath === "string" && filepath.includes(ignorePath)) {
          ignoreFile = true
        } else if (ignorePath instanceof RegExp && ignorePath.test(filepath)) {
          ignoreFile = true
        }
      })

      if (ignoreFile) {
        return
      }

      const diff = await danger.git.diffForFile(filepath)

      if (!diff) {
        return
      }

      keywords.forEach(keyword => {
        const regex = new RegExp(`(?:\/\/|#|<!--|;|\/\*|^|\/\*\*\s*\**)\s*${keyword.trim()}(?::\s*|\s+)(.+)`, "gi")
        const matches = diff.added.match(regex)
        if (!matches || !matches.length) {
          return
        }

        let srcLink = `\`${filepath}\``

        // Github url
        if (typeof repoUrl === "string") {
          srcLink = `[${filepath}](${repoUrl}/blob/${danger.git.commits[0].sha}/${filepath})`
        } else if (typeof repoUrl === "function") {
          srcLink = `[${filepath}](${repoUrl(filepath)})`
        }

        matches.forEach(match => {
          keywordMatches[keyword].push(`\`\`${match}\`\` : ${srcLink}`)
        })
      })
    })
  )

  const output: string[] = []
  Object.values(keywordMatches).forEach(matches => {
    if (matches.length) {
      output.push(...matches)
    }
  })

  if (!output.length) {
    return
  }

  markdown(`### ${keywords.join("s/")}s:\n- ${output.join("\n- ")}`)
}
