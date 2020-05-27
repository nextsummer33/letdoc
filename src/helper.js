const capitializeWords = (txt) => {
  if (typeof txt != 'string') {
    throw 'Invalid data type of the argument.'
  } else if (!txt) {
    return ''
  } else if (txt.length == 1) {
    return txt.toUpperCase()
  }

  return txt
    .split(' ')
    .map((s) => s[0].toUpperCase() + s.substring(1, s.length))
    .join(' ')
}

const delay = (duration, callback) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (callback instanceof Promise) {
        callback.then(resolve).catch(reject)
      } else {
        resolve(callback())
      }
    }, duration);
  })
}

module.exports = {
  capitializeWords,
  delay
}
