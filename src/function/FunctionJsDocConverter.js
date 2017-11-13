import doctrine from 'doctrine'
import {html as beautifyHtml} from 'js-beautify'

import FunctionConverter from './FunctionConverter'

export default class FunctionJsDocConverter extends FunctionConverter {

  import (from, path, to, name) {
    const jsdoc = from.readFileSync(path, 'utf8')

    const tags = doctrine.parse(jsdoc).tags
    
    const {dom, $$} = this._createDOM()

    function importFirst(title, property) {
      const tag = tags.filter((tag) => tag.title === title)[0]
      if (tag) dom.append($$(title).text(tag[property || 'description']))
    }

    function importAll(title, property) {
      tags.filter((tag) => tag.title === title).forEach((tag) => {
        dom.append($$(title).text(tag[property || 'description']))
      })
    }

    importFirst('name', 'name')
    importFirst('title')
    importFirst('summary')
    importFirst('description')
    importAll('author')

    const xml = beautifyHtml(dom.serialize())
    to.writeFileSync(name + '.fun.xml', xml, 'utf8')

    return Promise.resolve()
  }

}
