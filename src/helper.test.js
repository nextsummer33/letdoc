const { capitializeWords } = require('./helper')

test('Should throw if invalid argument', () => {
  expect(() => {
    capitializeWords({})
  }).toThrowError('Invalid data type of the argument.')
})

test('Should capitialize each word', () => {
  expect(capitializeWords('hello world')).toEqual('Hello World')
  expect(capitializeWords('Hello world')).toEqual('Hello World')
  expect(capitializeWords('Hello World')).toEqual('Hello World')
  expect(capitializeWords('')).toEqual('')
  expect(capitializeWords('h')).toEqual('H')
})
