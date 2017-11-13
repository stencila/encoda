import doctrine from 'doctrine'
import {html as beautifyHtml} from 'js-beautify'

import FunctionConverter from './FunctionConverter'

export default class FunctionJsDocConverter extends FunctionConverter {

  import (from, path, to, name) {
    const jsdoc = from.readFileSync(path, 'utf8')

    const tags = doctrine.parse(jsdoc, {
      sloppy: true // allow optional parameters to be specified in brackets
    }).tags

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

    function importParams() {
      const paramTags = tags.filter((tag) => tag.title === 'param')
      if (paramTags.length) {
        const params = $$('params')
        paramTags.forEach((tag) => {
          const param = $$('param')
          if (tag.name) param.attr('name', tag.name)
          if (tag.type) {
            let type
            switch (tag.type.type) {
              case 'AllLiteral':
                type = 'any'
                break
              case 'NameExpression':
                type = tag.type.name
                break
              case 'OptionalType':
                type = tag.type.expression.name
                param.append($$('default').text(tag.default ? tag.default : 'null'))
                break
              default:
                throw new Error('Unhandled parameter type: ' + tag.type.type)
            }
            param.attr('type', type)
          }
          if (tag.description) param.append($$('description').text(tag.description))
          params.append(param)
        })
        dom.append(params)
      }
    }

    importFirst('name', 'name')
    importAll('author')
    importFirst('title')
    importFirst('summary')
    importFirst('description')
    importParams()

    const xml = beautifyHtml(dom.serialize(), {
      void_elements: [] // No, 'self-closing', void tags for XML
    })
    to.writeFileSync(name + '.fun.xml', xml, 'utf8')

    return Promise.resolve()
  }

}
