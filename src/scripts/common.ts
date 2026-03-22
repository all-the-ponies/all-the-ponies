import { language } from '../globals'



export function isDev() {
  return ['dev', 'development', '', undefined].includes(process.env.NODE_ENV)
  if (['dev', 'development'].includes(process.env.NODE_ENV)) {
    return true
  }
  return location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    RegExp(
      '^([a-z0-9\\.\\-_%]+:([a-z0-9\\.\\-_%])+?@)?' +
      '((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4' +
      '][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])?' +
      '(:[0-9]+)?(\/[^\\s]*)?$',
    'i').test(location.hostname)
}

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}

export function fixName(name: string) {
  name = name.replaceAll('|', '')
  return name
}

export function transformName(name: string, options = {
        ignoreSpaces: true,
        caseSensitive: false,
        ignoreAccents: true,
        ignorePunctuation: true,
        includeUnused: true,
    }) {
        
    options = {
        ignoreSpaces: true,
        caseSensitive: false,
        ignoreAccents: true,
        ignorePunctuation: true,
        includeUnused: true,
        ...options,
    }

    if (!options.caseSensitive) {
        name = name.toLocaleLowerCase()
    }
    if (options.ignorePunctuation) {
        name = name.replaceAll('-', ' ')
        name = name.replaceAll(/[,.()"'’]/gm, '')
    }
    if (options.ignoreAccents) {
        name = normalize(name)
    }
    if (options.ignoreSpaces) {
        name = name.replaceAll(' ', '')
    }

    return name
}

export function capitalize(str: string) {
  if (str == '') return ''
  return str[0].toLocaleUpperCase() + str.substr(1).toLocaleLowerCase()
}

export function toTitleCase(str: string) {
  return str.split(' ').map(capitalize).join(' ')
}

export function scrollIntoViewWithOffset(element: HTMLElement, offset: number, behavior: ScrollBehavior = 'instant') {
  window.scrollTo({
    behavior: behavior,
    top:
      element.getBoundingClientRect().top -
      document.body.getBoundingClientRect().top -
      offset,
  })
}

export function getCurrentScroll() {
  return document.documentElement.scrollTop || document.body.scrollTop
}

export function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function staticImage(path: string): string {
  if (!path) {
    return
  }
  return `/images/${path}`
}

function createBlobURL(file: string, type: string) {
  let blob = new Blob([file], {
    type: type || 'application/*'
  })

  file = window.URL.createObjectURL(blob)

  return file
}

/**
 * 
 * @param {string} content File content
 * @param {string} type File mime
 * @param {string} filename Downloaded filename
 */
export function downloadFile(content: string, type: string, filename: string) {
  const link = document.createElement('a')
  const blob = createBlobURL(content, type)
  link.href = blob
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blob)
}

export function notNullIsh(value): boolean {
  return !!(value || value === 0)
}


export function findGap(sortedList: number[], start: number = 0) {
  if (sortedList.length === 0) return start
  if (sortedList[0] != start) return start

  let previous: number
  for (let n of sortedList) {
    if (previous != undefined) {
      if (n - previous > 1) {
        return previous + 1
      }
    }
    previous = n
  }

  return sortedList.at(-1) + 1
}
