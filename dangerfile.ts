import { schedule } from 'danger'
import todos from './src'

async function main() {
  // TODO: Set options for todos
  await todos()
}

schedule(main())
