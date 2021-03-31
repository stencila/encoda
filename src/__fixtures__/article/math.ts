import {
  article,
  date,
  mathBlock,
  mathFragment,
  paragraph,
  person,
} from '@stencila/schema'

/**
 * A small `Article` with various types of `Math` nodes
 */
export default article({
  title: 'A little article with some math in it',
  authors: [
    person({
      name: 'Janet J Johns',
    }),
  ],
  datePublished: date({ value: '2020-03-13' }),
  content: [
    paragraph({
      content: [
        'Some inline math fragments ',
        mathFragment({ mathLanguage: 'tex', text: '\\pi' }),
        ', ',
        mathFragment({ mathLanguage: 'asciimath', text: 'pi' }),
        ' and ',
        mathFragment({
          mathLanguage: 'mathml',
          text: '<math><mrow><mi>&pi;</mi></mrow></math>',
        }),
        '.',
      ],
    }),
    mathBlock({
      mathLanguage: 'asciimath',
      text: 'sum_(i=1)^n i^3=((n(n+1))/2)^2',
    }),
  ],
})
