import fs from 'fs'
import {promisify} from 'util'

fs.readFileAsync = promisify(fs.readFile)
fs.writeFileAsync = promisify(fs.writeFile)

export default fs
