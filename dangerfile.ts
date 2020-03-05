import { schedule, fail } from 'danger'
import todos from './src'

async function main() {
  await todos({
    keywords: ['TODO', 'FIXME', 'WTF'],
  })

  fail('test')
}

schedule(main())
