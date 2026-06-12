export const TYPE_MODE = {
  INTERFACE_ONLY: 'interface-only',
  PREFER_TYPE: 'prefer-type',
}

export const toPascalCase = (str) => {
  if (typeof str !== 'string' || str === '') return 'Type'
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, '_')
  const parts = cleaned.split('_').filter(Boolean)
  if (parts.length === 0) return 'Type'
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

export const debounce = (fn, delay) => {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function')
  }
  let timer = null
  let lastArgs = null
  let lastThis = null
  const debounced = function (...args) {
    lastArgs = args
    lastThis = this
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(lastThis, lastArgs)
    }, delay)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
    lastThis = null
  }
  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      const args = lastArgs
      const thisArg = lastThis
      lastArgs = null
      lastThis = null
      fn.apply(thisArg, args)
    }
  }
  return debounced
}

export const parseJson = (text) => {
  if (typeof text !== 'string' || text.trim() === '') {
    return { success: false, error: '请输入 JSON 内容', value: null, line: null, column: null }
  }
  try {
    const value = JSON.parse(text)
    return { success: true, value, error: null, line: null, column: null }
  } catch (e) {
    const msg = e.message || ''
    const lineMatch = msg.match(/line\s+(\d+)/i)
    const columnMatch = msg.match(/column\s+(\d+)/i)
    const posMatch = msg.match(/position\s+(\d+)/i)

    let line = lineMatch ? parseInt(lineMatch[1], 10) : null
    let column = columnMatch ? parseInt(columnMatch[1], 10) : null

    if (line === null && posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = text.slice(0, pos)
      line = before.split('\n').length
      const lastNewline = before.lastIndexOf('\n')
      column = lastNewline === -1 ? pos + 1 : pos - lastNewline
    }

    return {
      success: false,
      error: msg || 'JSON 解析错误',
      value: null,
      line,
      column,
    }
  }
}

export const formatJson = (text) => {
  const parsed = parseJson(text)
  if (!parsed.success) {
    return { success: false, error: parsed.error, formatted: null, line: parsed.line, column: parsed.column }
  }
  try {
    const formatted = JSON.stringify(parsed.value, null, 2)
    return { success: true, formatted, error: null }
  } catch (e) {
    return { success: false, error: e.message || '格式化失败', formatted: null }
  }
}

export const extractOptionalMarkers = (text) => {
  const optionalFields = new Set()
  if (typeof text !== 'string') return optionalFields

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*\/\/\s*@optional\s*$/.test(line) || /^\s*\/\/\s*@optional\b/.test(line)) {
      let nextLineIdx = i + 1
      while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') {
        nextLineIdx++
      }
      if (nextLineIdx < lines.length) {
        const keyMatch = lines[nextLineIdx].match(/"([^"\\]+)"\s*:/)
        if (keyMatch) {
          optionalFields.add(keyMatch[1])
        }
      }
    }
  }
  return optionalFields
}

const isPlainObject = (val) => {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

const getValueType = (val) => {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  const t = typeof val
  if (t === 'number') {
    return Number.isInteger(val) ? 'integer' : 'float'
  }
  return t
}



export const inferObjectFieldSchemas = (objects, parentKey = '') => {
  const fieldInfo = {}

  objects.forEach((obj) => {
    if (!isPlainObject(obj)) return
    Object.keys(obj).forEach((key) => {
      if (!fieldInfo[key]) {
        fieldInfo[key] = {
          key,
          count: 0,
          sampleValues: [],
          types: new Set(),
          hasNull: false,
          hasObject: false,
          hasArray: false,
          objectSamples: [],
          arraySamples: [],
        }
      }
      fieldInfo[key].count++
      const val = obj[key]
      const vType = getValueType(val)

      if (vType === 'null') {
        fieldInfo[key].hasNull = true
      } else if (vType === 'integer' || vType === 'float') {
        fieldInfo[key].types.add('number')
      } else if (vType === 'array') {
        fieldInfo[key].hasArray = true
        fieldInfo[key].arraySamples.push(val)
      } else if (vType === 'object') {
        fieldInfo[key].hasObject = true
        fieldInfo[key].objectSamples.push(val)
      } else {
        fieldInfo[key].types.add(vType)
      }

      if (fieldInfo[key].sampleValues.length < 3) {
        fieldInfo[key].sampleValues.push(val)
      }
    })
  })

  const totalObjects = objects.length
  const result = {}

  Object.keys(fieldInfo).forEach((key) => {
    const info = fieldInfo[key]
    const required = info.count === totalObjects

    let baseType = ''
    if (info.types.size > 0) {
      baseType = Array.from(info.types).sort().join(' | ')
    }
    if (info.hasObject) {
      const nestedName = toPascalCase(`${parentKey}_${key}`)
      baseType = baseType ? `${baseType} | ${nestedName}` : nestedName
    }
    if (info.hasArray) {
      const itemType = inferArrayItemType(info.arraySamples, `${parentKey}_${key}`)
      const arrayType = `(${itemType})[]`
      baseType = baseType ? `${baseType} | ${arrayType}` : arrayType
    }
    if (baseType === '') {
      baseType = 'any'
    }
    if (info.hasNull) {
      baseType = `${baseType} | null`
    }

    result[key] = {
      key,
      required,
      type: baseType,
      hasObject: info.hasObject,
      hasArray: info.hasArray,
      objectSamples: info.objectSamples,
      arraySamples: info.arraySamples,
    }
  })

  return result
}

export const inferArrayItemType = (arrays, parentKey = '') => {
  if (!arrays || arrays.length === 0) return 'any'

  const allItems = []
  let allEmpty = true
  arrays.forEach((arr) => {
    if (Array.isArray(arr) && arr.length > 0) {
      allEmpty = false
      allItems.push(...arr)
    }
  })

  if (allEmpty) return 'any'

  const types = new Set()
  const objectSamples = []
  const arraySamples = []
  let hasNull = false

  allItems.forEach((item) => {
    const vType = getValueType(item)
    if (vType === 'null') {
      hasNull = true
    } else if (vType === 'integer' || vType === 'float') {
      types.add('number')
    } else if (vType === 'array') {
      arraySamples.push(item)
    } else if (vType === 'object') {
      objectSamples.push(item)
    } else {
      types.add(vType)
    }
  })

  const parts = []
  if (types.size > 0) {
    parts.push(Array.from(types).sort().join(' | '))
  }
  if (objectSamples.length > 0) {
    const nestedName = toPascalCase(`${parentKey}_Item`)
    parts.push(nestedName)
  }
  if (arraySamples.length > 0) {
    const itemType = inferArrayItemType(arraySamples, `${parentKey}_Nested`)
    parts.push(`(${itemType})[]`)
  }

  let result = parts.length > 0 ? parts.join(' | ') : 'any'
  if (hasNull) {
    result = `${result} | null`
  }
  return result
}

const collectNestedObjects = (value, name = 'RootType', depth = 0, typeDefs = [], usedNames = new Set(), customNames = {}) => {
  const getName = (defaultName) => {
    if (customNames[defaultName]) return customNames[defaultName]
    if (usedNames.has(defaultName)) {
      let counter = 2
      while (usedNames.has(`${defaultName}${counter}`)) counter++
      usedNames.add(`${defaultName}${counter}`)
      return `${defaultName}${counter}`
    }
    usedNames.add(defaultName)
    return defaultName
  }

  if (Array.isArray(value)) {
    const listName = getName(`${name}List`)
    if (value.length === 0) {
      typeDefs.push({ name: listName, isArray: true, itemType: 'any', fields: null, depth })
    } else {
      const items = value.filter((v) => isPlainObject(v))
      if (items.length === value.length && items.length > 0) {
        const itemName = getName(name)
        const fields = inferObjectFieldSchemas(items, name)
        typeDefs.push({ name: itemName, isArray: false, fields, depth: depth + 1 })
        typeDefs.push({ name: listName, isArray: true, itemType: itemName, fields: null, depth })

        Object.values(fields).forEach((f) => {
          if (f.hasObject && f.objectSamples.length > 0) {
            const subName = toPascalCase(`${name}_${f.key}`)
            collectNestedObjects(
              f.objectSamples.length === 1 ? f.objectSamples[0] : f.objectSamples,
              subName,
              depth + 2,
              typeDefs,
              usedNames,
              customNames
            )
          }
        })
      } else {
        const itemType = inferArrayItemType([value], name)
        typeDefs.push({ name: listName, isArray: true, itemType, fields: null, depth })

        const objs = value.filter((v) => isPlainObject(v))
        if (objs.length > 0) {
          const objNameMatch = itemType.match(/[A-Z][A-Za-z0-9]*(?=\s*\|)/) || itemType.match(/[A-Z][A-Za-z0-9]*$/)
          const objName = objNameMatch ? objNameMatch[0] : getName(name)
          const fields = inferObjectFieldSchemas(objs, name)
          typeDefs.push({ name: objName, isArray: false, fields, depth: depth + 1 })
          Object.values(fields).forEach((f) => {
            if (f.hasObject && f.objectSamples.length > 0) {
              const subName = toPascalCase(`${name}_${f.key}`)
              collectNestedObjects(
                f.objectSamples.length === 1 ? f.objectSamples[0] : f.objectSamples,
                subName,
                depth + 2,
                typeDefs,
                usedNames,
                customNames
              )
            }
          })
        }
      }
    }
    return typeDefs
  }

  if (isPlainObject(value)) {
    if (Object.keys(value).length === 0) {
      const typeName = getName(name)
      typeDefs.push({ name: typeName, isRecord: true, fields: null, depth })
      return typeDefs
    }

    const typeName = getName(name)
    const fields = inferObjectFieldSchemas([value], name)
    typeDefs.push({ name: typeName, isArray: false, fields, depth })

    Object.values(fields).forEach((f) => {
      if (f.hasObject && f.objectSamples.length > 0) {
        const subName = toPascalCase(`${name}_${f.key}`)
        collectNestedObjects(
          f.objectSamples.length === 1 ? f.objectSamples[0] : f.objectSamples,
          subName,
          depth + 1,
          typeDefs,
          usedNames,
          customNames
        )
      }
    })
    return typeDefs
  }

  const typeName = getName(name)
  const primitiveType = typeof value === 'number' ? 'number' : typeof value
  typeDefs.push({ name: typeName, isArray: false, primitiveType, fields: null, depth })
  return typeDefs
}

export const buildTypeDefinitions = (value, rootName = 'RootType', customNames = {}) => {
  const usedNames = new Set()
  const allDefs = []
  collectNestedObjects(value, rootName, 0, allDefs, usedNames, customNames)

  const seen = new Set()
  const deduped = []
  for (let i = allDefs.length - 1; i >= 0; i--) {
    if (!seen.has(allDefs[i].name)) {
      seen.add(allDefs[i].name)
      deduped.unshift(allDefs[i])
    }
  }
  return deduped
}

const resolveFieldType = (field, customNames) => {
  let type = field.type

  if (customNames) {
    Object.keys(customNames).forEach((oldName) => {
      const newName = customNames[oldName]
      if (oldName !== newName) {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g')
        type = type.replace(regex, newName)
      }
    })
  }

  return type
}

export const generateTypeScript = (value, options = {}) => {
  const {
    rootName = 'RootType',
    mode = TYPE_MODE.INTERFACE_ONLY,
    optionalMarkers = new Set(),
    customNames = {},
    depthThreshold = 3,
  } = options

  if (value === undefined) {
    return { code: '', typeDefs: [], rootTypeName: rootName, rootListName: null }
  }

  const typeDefs = buildTypeDefinitions(value, rootName, customNames)

  const defs = []
  let rootTypeName = rootName
  let rootListName = null

  typeDefs.forEach((def) => {
    if (def.isRecord) {
      defs.push(`export type ${def.name} = Record<string, any>`)
      return
    }

    if (def.isArray) {
      let itemType = def.itemType
      if (customNames) {
        Object.keys(customNames).forEach((oldName) => {
          const newName = customNames[oldName]
          if (oldName !== newName) {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g')
            itemType = itemType.replace(regex, newName)
          }
        })
      }
      defs.push(`export type ${def.name} = ${itemType}[]`)
      if (def.depth === 0) {
        rootListName = def.name
      }
      return
    }

    if (def.fields) {
      const fieldLines = []
      const keys = Object.keys(def.fields).sort()
      keys.forEach((key) => {
        const field = def.fields[key]
        const forceOptional = optionalMarkers.has(key)
        const optionalSymbol = forceOptional || !field.required ? '?' : ''
        const fieldType = resolveFieldType(field, customNames)

        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
        fieldLines.push(`  ${safeKey}${optionalSymbol}: ${fieldType}`)
      })

      const useInterface = mode === TYPE_MODE.INTERFACE_ONLY || (mode === TYPE_MODE.PREFER_TYPE && def.depth < depthThreshold)

      if (useInterface) {
        defs.push(`export interface ${def.name} {`)
        defs.push(...fieldLines)
        defs.push('}')
      } else {
        defs.push(`export type ${def.name} = {`)
        defs.push(...fieldLines)
        defs.push('}')
      }

      if (def.depth === 0) {
        rootTypeName = def.name
      }
      return
    }

    if (def.primitiveType) {
      defs.push(`export type ${def.name} = ${def.primitiveType}`)
    }
  })

  return {
    code: defs.join('\n'),
    typeDefs,
    rootTypeName,
    rootListName,
  }
}

export const truncateText = (text, maxLen = 80) => {
  if (typeof text !== 'string') return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return clean.slice(0, maxLen) + '...'
}

export const downloadTsFile = (code, filename = 'types.ts') => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  try {
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    return true
  } catch {
    return false
  }
}

export const copyToClipboard = async (text) => {
  if (typeof navigator === 'undefined') return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Silently fall back to legacy method
  }
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    }
  } catch {
    // Fall through to return false
  }
  return false
}

export const getJsonPreviewSummary = (text, maxLen = 80) => {
  if (typeof text !== 'string' || text.trim() === '') return ''
  const stripped = text.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim()
  return truncateText(stripped, maxLen)
}
