import { schedule, warn } from 'danger'
import todos from './src'

async function main() {
  await todos({
    keywords: ['TODO', 'FIXME', 'WTF'],
  })

  warn('test')
}

schedule(main())
