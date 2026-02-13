

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
