import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { mySchema } from './schema'
import { Song, Progress } from './model'

const adapter = new LokiJSAdapter({
    schema: mySchema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
})

export const database = new Database({
    adapter,
    modelClasses: [Song, Progress],
})