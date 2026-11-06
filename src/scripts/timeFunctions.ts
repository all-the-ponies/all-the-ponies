import { language } from "@/globals";

type TimeUnit = 'years' | 'days' | 'hours' | 'minutes' | 'seconds'
const TIME_UNITS: { name: TimeUnit; secs: number; letter: string }[] = [
  { name: 'years',   secs: 31536000, letter: 'y' },
  { name: 'days',    secs: 86400,    letter: 'd' },
  { name: 'hours',   secs: 3600,     letter: 'h' },
  { name: 'minutes', secs: 60,       letter: 'm' },
  { name: 'seconds', secs: 1,        letter: 's' },
]


export function formatTime(
  time: number,
  {
    style = 'narrow' as 'short' | 'narrow' | 'long',
    units = null as TimeUnit[] | null,
  } = {},
): string {
  // Keep the canonical largest -> smallest order regardless of how `units` was passed in
  let active = units ? TIME_UNITS.filter(u => units.includes(u.name)) : TIME_UNITS;
  if (active.length === 0) active = TIME_UNITS;

  // Cascade the remainder through only the active units
  let remaining = Math.trunc(time);
  const values: Record<TimeUnit, number> = {
    years: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
  };
  for (const u of active) {
    values[u.name] = Math.floor(remaining / u.secs);
    remaining %= u.secs;
  }

  const allZero = active.every(u => values[u.name] === 0);
  const smallest = active[active.length - 1];

  if (Intl && 'DurationFormat' in Intl) {
    /** @ts-ignore */
    return new Intl.DurationFormat(language.value.code, {
      style: style,
      // make sure something like "0s" / "0h" is returned instead of an empty string
      ...(allZero ? { [`${smallest.name}Display`]: 'always' } : {}),
    }).format(values)
  }

  // fallback if using an older browser
  if (allZero) return "0" + smallest.letter;
  return active
    .filter(u => values[u.name] > 0)
    .map(u => values[u.name] + u.letter)
    .join(" ");
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
