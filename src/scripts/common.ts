export function isLocalhost() {
  return window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    RegExp(
      '^([a-z0-9\\.\\-_%]+:([a-z0-9\\.\\-_%])+?@)?' +
      '((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4' +
      '][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])?' +
      '(:[0-9]+)?(\/[^\\s]*)?$',
    'i').test(window.location.hostname)
}


// Load JSON text from server hosted file and return JSON parsed object
// From stackoverflow https://stackoverflow.com/a/4117299/17129659
export function loadJSON(filePath: string) {
  // Load json file;
  var json = loadTextFileAjaxSync(filePath, "application/json");
  // Parse json
  return JSON.parse(json);
}


// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath: string, mimeType: string)
{
  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  if (mimeType != null) {
    if (xmlhttp.overrideMimeType) {
      xmlhttp.overrideMimeType(mimeType);
    }
  }
  let error = xmlhttp.send();
  if (xmlhttp.status==200 && xmlhttp.readyState == 4 ) {
    return xmlhttp.responseText;
  }
  else {
    
    // TODO Throw exception
    return null;
  }
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
        name = name.replaceAll(/[,.()"']/gm, '')
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

export function setURL(url: string, replace: boolean = false) {
    if (history && history.replaceState) {
      if (replace) {
        history.replaceState("", "", url);
      } else {
        history.pushState('', '', url)
      }
    } else {
        location.href = url
    }
}

export function setUrlParameter(param: string, value: any, replace: boolean = false) {
    const url = new URL(location.href)
    if (value) {
      url.searchParams.set(param, encodeURIComponent(value))
    } else {
      url.searchParams.delete(param)
    }

    
    if (history && history.replaceState) {
      if (replace) {
        history.replaceState("", "", url.toString());
      } else {
        history.pushState('', '', url.toString())
      }
    } else {
        location.href = url.toString();
    }
}

export function getUrlParameter(param: string) {
    const url = new URL(location.href)
    const value = url.searchParams.get(param)
  return value == null ? null : decodeURIComponent(value)
}

// Taken from https://stackoverflow.com/a/5354536/17129659 by Tokimon
export function checkVisible(elm: HTMLElement) {
  var rect = elm.getBoundingClientRect();
  var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

export function formatTime(time: number): string {
  // if (Math.trunc(time) == 0) return "0s";
  let out = "";
  let d_h_m_s = [0, 0, 0, 0, 0];
  let letters = ['y', "d", "h", "m", "s"];
  [time, d_h_m_s[0]] = truncTime(time, 31536000);
  [time, d_h_m_s[1]] = truncTime(time, 86400);
  [time, d_h_m_s[2]] = truncTime(time, 3600);
  [time, d_h_m_s[3]] = truncTime(time, 60);
  d_h_m_s[4] = Math.trunc(time)
  
  if (Intl && 'DurationFormat' in Intl) {
    /** @ts-ignore */
    return new Intl.DurationFormat(language.value.code, {
      style: 'narrow',
      secondsDisplay: d_h_m_s.reduce((partialSum: number, a: number) => partialSum + a, 0) == 0 ? 'always' : 'auto', // make sure 0s is returned
    }).format({
      years: d_h_m_s[0],
      days: d_h_m_s[1],
      hours: d_h_m_s[2],
      minutes: d_h_m_s[3],
      seconds: d_h_m_s[4],
    })
  }
  
  // fallback if using an older browser
  if (d_h_m_s.reduce((partialSum: number, a: number) => partialSum + a, 0) == 0) return "0s"
  for (let i = 0; i < d_h_m_s.length; i++) {
    if (d_h_m_s[i] > 0) {
      out += " " + d_h_m_s[i] + letters[i];
    }
  }
  return out.trim();
}

export function formatTimestamp(time: number): string {
  // if (Math.trunc(time) == 0) return "0:00";
  let out = []
  let d_h_m_s = [0, 0, 0, 0];

  [time, d_h_m_s[0]] = truncTime(time, 31536000);
  [time, d_h_m_s[1]] = truncTime(time, 86400);
  [time, d_h_m_s[2]] = truncTime(time, 3600);
  [time, d_h_m_s[3]] = truncTime(time, 60);
  d_h_m_s[4] = Math.trunc(time)

  let startIndex = Math.min(d_h_m_s.findIndex(num => num > 0), 3)
  if (startIndex == -1) {
    startIndex = 3
  }

  for (let i = 0; i < d_h_m_s.length; i++) {
    if (i >= startIndex) {
      if (i == startIndex) {
        out.push(String(d_h_m_s[i]))
      } else {
        out.push(String(d_h_m_s[i]).padStart(2, '0'))
      }
    }
  }
 
  // out.push(String(d_h_m_s[3]).padStart(2, '0'))

  return out.join(':')
}

function truncTime(time: number, value: number) {
  var num = Math.trunc(time / value);
  time -= value * num;
  return [time, num];
}

export function pickRandom(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}


import { language } from '@/globals';



export function formatNumber(num: number): string {
  return new Intl.NumberFormat(language.value.code).format(num)
}

export function staticImage(path: string): string {
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

export function valueExists(value): boolean {
  return !!(value || value === 0)
}
