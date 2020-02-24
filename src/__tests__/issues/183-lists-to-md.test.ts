import { dump } from '../..'

test('issue 183: conversion of lists to Markdown fails', async () => {
  expect(
    await dump(
      {
        type: 'List',
        items: [
          { type: 'ListItem', content: ['Item One'] },
          { type: 'ListItem', content: ['Item Two'] },
          { type: 'ListItem', content: ['Item Three'] }
        ]
      },
      'md'
    )
  ).toEqual(`-   Item One
-   Item Two
-   Item Three`)

  expect(
    await dump(
      {
        type: 'List',
        items: [
          { type: 'ListItem', content: ['Item One'] },
          {
            type: 'ListItem',
            content: [
              'This is a nested item',
              {
                type: 'List',
                order: 'ordered',
                items: [
                  { type: 'ListItem', content: ['Nested Item One'] },
                  { type: 'ListItem', content: ['Nested Item Two'] },
                  { type: 'ListItem', content: ['Nested Item Three'] }
                ]
              }
            ]
          },
          { type: 'ListItem', content: ['Item Three'] }
        ]
      },
      'md'
    )
  ).toEqual(`-   Item One
-   This is a nested item

    -   Nested Item One
    -   Nested Item Two
    -   Nested Item Three
-   Item Three`)

  expect(
    await dump(
      {
        type: 'List',
        items: [
          {
            type: 'ListItem',
            isChecked: false,
            content: ['Todo item']
          },
          {
            type: 'ListItem',
            isChecked: true,
            content: ['Completed todo item']
          }
        ]
      },
      'md'
    )
  ).toEqual(`-   [ ] Todo item
-   [x] Completed todo item`)
})
