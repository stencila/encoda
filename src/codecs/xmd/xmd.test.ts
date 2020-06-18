import notebook from '../../__fixtures__/article/r-notebook-simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { XmdCodec, decodeFigure } from './'
import { unlinkFiles } from '../../util/media/unlinkFiles'

const jsonCodec = new JsonCodec()
const xmdCodec = new XmdCodec()

describe('decode', () => {
  const xmdToJson = async (filename: string) =>
    await jsonCodec.dump(await xmdCodec.read(filename))

  test('basic.Rmd', async () => {
    expect(await xmdToJson(fixture('basic.Rmd'))).toMatchFile(
      snapshot('basic.json')
    )
  })

  test('kitchensink.Rmd', async () => {
    expect(await xmdToJson(fixture('kitchensink.Rmd'))).toMatchFile(
      snapshot('kitchensink.json')
    )
  })
})

describe('decode - Figure references', () => {
  const rmdFigure = `
\`\`\`{r figure3, fig.cap='(ref:figure-3)'}
# R code here

multi
line
content
\`\`\`
(ref:figure-3) Figure 3. **Distinct and dorsoventrally organized properties of layer 2 stellate cells.** (**A**) Representative action potential after hyperpolarization waveforms from a SC (left), a pyramidal cell (middle) and an unidentified cell (right). The pyramidal and unidentified cells were both positively labelled in _Wfs1^C^_^re^ mice. (**B**) Plot of the first versus the second principal component from PCA of the properties of labelled neurons in _Wfs1_^Cre^ mice reveals two populations of neurons. (**C**) Histogram showing the distribution of rheobase values of cells positively labelled in _Wfs1_^Cre^ mice. The two groups identified in panel (B) can be distinguished by their rheobase. (**D**) Plot of the first two principal components from PCA of the properties of the L2PC (n = 44, green) and SC populations (n = 836, black). Putative pyramidal cells (x) and SCs (+) are colored according to their dorsoventral location (inset shows the scale). (**E**) Proportion of total variance explained by the first five principal components for the analysis in panel (**D**). (**F**) Histograms of the locations of recorded SCs (upper) and L2PCs (lower). (**G**) All values of measured features from all mice are plotted as a function of the dorsoventral location of the recorded cells. Lines indicate fits of a linear model to the complete datasets for SCs (black) and L2PCs (green). Putative pyramidal cells (x, green) and SCs (+, black). Adjusted R^2^ values use the same color scheme.
`

  const mdFigure = `
figure: Figure 3.
:::
\`\`\`r
# R code here

multi
line
content
\`\`\`

**Distinct and dorsoventrally organized properties of layer 2 stellate cells.**

(**A**) Representative action potential after hyperpolarization waveforms from a SC (left), a pyramidal cell (middle) and an unidentified cell (right). The pyramidal and unidentified cells were both positively labelled in _Wfs1^C^_^re^ mice. (**B**) Plot of the first versus the second principal component from PCA of the properties of labelled neurons in _Wfs1_^Cre^ mice reveals two populations of neurons. (**C**) Histogram showing the distribution of rheobase values of cells positively labelled in _Wfs1_^Cre^ mice. The two groups identified in panel (B) can be distinguished by their rheobase. (**D**) Plot of the first two principal components from PCA of the properties of the L2PC (n = 44, green) and SC populations (n = 836, black). Putative pyramidal cells (x) and SCs (+) are colored according to their dorsoventral location (inset shows the scale). (**E**) Proportion of total variance explained by the first five principal components for the analysis in panel (**D**). (**F**) Histograms of the locations of recorded SCs (upper) and L2PCs (lower). (**G**) All values of measured features from all mice are plotted as a function of the dorsoventral location of the recorded cells. Lines indicate fits of a linear model to the complete datasets for SCs (black) and L2PCs (green). Putative pyramidal cells (x, green) and SCs (+, black). Adjusted R^2^ values use the same color scheme.

:::
(ref:figure-3) Figure 3. **Distinct and dorsoventrally organized properties of layer 2 stellate cells.** (**A**) Representative action potential after hyperpolarization waveforms from a SC (left), a pyramidal cell (middle) and an unidentified cell (right). The pyramidal and unidentified cells were both positively labelled in _Wfs1^C^_^re^ mice. (**B**) Plot of the first versus the second principal component from PCA of the properties of labelled neurons in _Wfs1_^Cre^ mice reveals two populations of neurons. (**C**) Histogram showing the distribution of rheobase values of cells positively labelled in _Wfs1_^Cre^ mice. The two groups identified in panel (B) can be distinguished by their rheobase. (**D**) Plot of the first two principal components from PCA of the properties of the L2PC (n = 44, green) and SC populations (n = 836, black). Putative pyramidal cells (x) and SCs (+) are colored according to their dorsoventral location (inset shows the scale). (**E**) Proportion of total variance explained by the first five principal components for the analysis in panel (**D**). (**F**) Histograms of the locations of recorded SCs (upper) and L2PCs (lower). (**G**) All values of measured features from all mice are plotted as a function of the dorsoventral location of the recorded cells. Lines indicate fits of a linear model to the complete datasets for SCs (black) and L2PCs (green). Putative pyramidal cells (x, green) and SCs (+, black). Adjusted R^2^ values use the same color scheme.

`

  it('decodes a simple Figure reference', () => {
    expect(decodeFigure(rmdFigure)).toEqualStringContent(mdFigure)
  })

  it('selects the correct Figure reference', () => {
    const rmdWithMultiReferences = `
\`\`\`{r figure3, fig.cap='(ref:figure-3)'}
# R code here

multi
line
content
\`\`\`
(ref:figure-3) Figure 3. **Distinct and dorsoventrally organized properties of layer 2 stellate cells.** (**A**) Representative action potential after hyperpolarization waveforms from a SC (left), a pyramidal cell (middle) and an unidentified cell (right). The pyramidal and unidentified cells were both positively labelled in _Wfs1^C^_^re^ mice. (**B**) Plot of the first versus the second principal component from PCA of the properties of labelled neurons in _Wfs1_^Cre^ mice reveals two populations of neurons. (**C**) Histogram showing the distribution of rheobase values of cells positively labelled in _Wfs1_^Cre^ mice. The two groups identified in panel (B) can be distinguished by their rheobase. (**D**) Plot of the first two principal components from PCA of the properties of the L2PC (n = 44, green) and SC populations (n = 836, black). Putative pyramidal cells (x) and SCs (+) are colored according to their dorsoventral location (inset shows the scale). (**E**) Proportion of total variance explained by the first five principal components for the analysis in panel (**D**). (**F**) Histograms of the locations of recorded SCs (upper) and L2PCs (lower). (**G**) All values of measured features from all mice are plotted as a function of the dorsoventral location of the recorded cells. Lines indicate fits of a linear model to the complete datasets for SCs (black) and L2PCs (green). Putative pyramidal cells (x, green) and SCs (+, black). Adjusted R^2^ values use the same color scheme.
(ref:figure-4) Figure 4. **Distinct and dorsoventrally organized properties of layer 2 stellate cells.** (**A**) Representative action potential after hyperpolarization waveforms from a SC (left), a pyramidal cell (middle) and an unidentified cell (right). The pyramidal and unidentified cells were both positively labelled in _Wfs1^C^_^re^ mice. (**B**) Plot of the first versus the second principal component from PCA of the properties of labelled neurons in _Wfs1_^Cre^ mice reveals two populations of neurons. (**C**) Histogram showing the distribution of rheobase values of cells positively labelled in _Wfs1_^Cre^ mice. The two groups identified in panel (B) can be distinguished by their rheobase. (**D**) Plot of the first two principal components from PCA of the properties of the L2PC (n = 44, green) and SC populations (n = 836, black). Putative pyramidal cells (x) and SCs (+) are colored according to their dorsoventral location (inset shows the scale). (**E**) Proportion of total variance explained by the first five principal components for the analysis in panel (**D**). (**F**) Histograms of the locations of recorded SCs (upper) and L2PCs (lower). (**G**) All values of measured features from all mice are plotted as a function of the dorsoventral location of the recorded cells. Lines indicate fits of a linear model to the complete datasets for SCs (black) and L2PCs (green). Putative pyramidal cells (x, green) and SCs (+, black). Adjusted R^2^ values use the same color scheme.
`
    expect(decodeFigure(rmdWithMultiReferences)).toMatch('figure: Figure 3.')
  })

  it('encodes even when a reference cannot be resolved', () => {
    const rmdWithNoReferences = `
\`\`\`{r figure3, fig.cap='(ref:figure-3)'}
# R code here

multi
line
content
\`\`\`
`

    const emptyMd = `
figure: figure-3
:::
\`\`\`r
# R code here

multi
line
content
\`\`\`

:::
`

    expect(decodeFigure(rmdWithNoReferences)).toEqualStringContent(emptyMd)
  })
})

describe('encode', () => {
  test('r-notebook-simple', async () => {
    expect(await xmdCodec.dump(notebook)).toMatchFile(
      snapshot('r-notebook-simple.Rmd')
    )
  })
  test('r-notebook-simple', async () => {
    expect(
      await xmdCodec.dump(
        await unlinkFiles(
          await jsonCodec.read(fixture('article/journal/elife/50356.json'))
        )
      )
    ).toMatchFile(snapshot('elife-50356.Rmd'))
  })
})
