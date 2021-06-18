import schema from '@stencila/schema'
import { MdCodec } from '../../codecs/md'
import { HTMLCodec } from '../../codecs/html'
import { snapshot } from '../helpers'

test('checked list items in Markdown are decoded and redndered to HTML', async () => {
  const md = `
- [x] Invent the universe
- [ ] Make apple pie
- [ ] Invite friends
  `

  const list = schema.list({
    order: 'Unordered',
    items: [
      schema.listItem({
        isChecked: true,
        content: [schema.paragraph({ content: ['Invent the universe'] })],
      }),
      schema.listItem({
        isChecked: false,
        content: [schema.paragraph({ content: ['Make apple pie'] })],
      }),
      schema.listItem({
        isChecked: false,
        content: [schema.paragraph({ content: ['Invite friends'] })],
      }),
    ],
  })

  expect(await new MdCodec().load(md, { isStandalone: false })).toEqual([list])
  expect(await new HTMLCodec().dump(list)).toMatchFile(
    snapshot('306-checked-listItem.html')
  )
})
