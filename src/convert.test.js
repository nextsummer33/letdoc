const { mdToHtml } = require('./convert')

const simpleMD = '# Hello world\nThis is a simple content'
const titledMD = '[comment]: # (title: my title)\n[comment]: # (author: example)\n[comment]: # (version: v1.0)\n# Hello world\nOh Yeah'

test('Markdown content should be convert into html', async () => {
  const htmlContent = await mdToHtml(simpleMD)
  expect(htmlContent.indexOf('<h1 id="hello-world">Hello world</h1>')).toBeGreaterThan(-1)
  expect(htmlContent.indexOf('<p>This is a simple content</p>')).toBeGreaterThan(-1)
})

test('Generated html should replace the metadata in the markdown, such as title, author name, version', async () => {
  const htmlContent = await mdToHtml(titledMD)
  expect(htmlContent.indexOf('<h1 class="title">My Title</h1>')).toBeGreaterThan(-1)
  expect(htmlContent.indexOf('Author:&nbsp;<strong>Example</strong>')).toBeGreaterThan(-1)
  expect(htmlContent.indexOf('Version:&nbsp;<strong>v1.0</strong>')).toBeGreaterThan(-1)
  expect(htmlContent.indexOf(`Date:&nbsp;<strong>${(new Date()).toLocaleDateString()}</strong>`)).toBeGreaterThan(-1)
})
