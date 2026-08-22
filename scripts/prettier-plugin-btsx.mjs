const codeLinePattern =
  /^(?:import\b|props\b|module\s+|setup\s+|if\b|elseif\b|each\b|switch\b|case\b|catch\b)/u
const codeBlockPattern = /^(?:module|setup)$/u

function indentation(line) {
  return line.match(/^\s*/u)?.[0].length ?? 0
}

function singleQuoted(value) {
  let output = "'"

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character === '\\' && index + 1 < value.length) {
      const escaped = value[index + 1]
      output += escaped === '"' ? '"' : `\\${escaped}`
      index += 1
    } else {
      output += character === "'" ? "\\'" : character
    }
  }

  return `${output}'`
}

function normalizeLine(line, allCode) {
  let output = ''
  let parentheses = 0
  let braces = 0
  let brackets = 0

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character !== '"') {
      output += character
      if (character === '(') parentheses += 1
      if (character === ')') parentheses = Math.max(0, parentheses - 1)
      if (character === '{') braces += 1
      if (character === '}') braces = Math.max(0, braces - 1)
      if (character === '[') brackets += 1
      if (character === ']') brackets = Math.max(0, brackets - 1)
      continue
    }

    const previous = line.slice(0, index).match(/\S(?=\s*$)/u)?.[0]
    const isCode =
      allCode ||
      parentheses > 0 ||
      braces > 0 ||
      brackets > 0 ||
      previous === '='

    if (!isCode) {
      output += character
      continue
    }

    let value = ''
    let closed = false

    for (index += 1; index < line.length; index += 1) {
      const next = line[index]

      if (next === '\\' && index + 1 < line.length) {
        value += next + line[index + 1]
        index += 1
      } else if (next === '"') {
        closed = true
        break
      } else {
        value += next
      }
    }

    output += closed ? singleQuoted(value) : `"${value}`
  }

  return output
}

function normalizeQuotes(source) {
  const lines = source.split('\n')
  const codeBlocks = []

  return lines
    .map((line) => {
      const trimmed = line.trimStart()
      const indent = indentation(line)

      if (trimmed.length > 0) {
        while (codeBlocks.length > 0 && indent <= codeBlocks.at(-1))
          codeBlocks.pop()
      }

      const allCode = codeBlocks.length > 0 || codeLinePattern.test(trimmed)
      const formatted = normalizeLine(line, allCode)

      if (codeBlockPattern.test(trimmed)) codeBlocks.push(indent)

      return formatted
    })
    .join('\n')
}

export const languages = [
  {
    name: 'Beast BTSX',
    parsers: ['btsx'],
    extensions: ['.btsx'],
    vscodeLanguageIds: ['btsx']
  }
]

export const parsers = {
  btsx: {
    parse: (text) => ({ type: 'BtsxDocument', value: normalizeQuotes(text) }),
    astFormat: 'btsx-ast',
    locStart: () => 0,
    locEnd: (node) => node.value.length
  }
}

export const printers = {
  'btsx-ast': {
    print: (path) => path.node.value
  }
}
