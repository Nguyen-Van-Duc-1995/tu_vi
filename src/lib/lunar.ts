/**
 * Chuyen doi am-duong lich Viet Nam bang phep tinh thien van (Ho Ngoc Duc / Meeus).
 * Chi dung de lap la so trong pham vi nam 1900-2100. timeZoneHours = 7 (UTC+7)
 * hoac 8 cho quy uoc lich su truoc 1968. Khong su dung timezone cua trinh duyet.
 */
export type LunarDate = { day: number; month: number; year: number; leap: boolean };
export type SolarDate = { day: number; month: number; year: number };
const PI = Math.PI;
const RAD = PI / 180;
const SYNODIC = 29.530588853;
const EPOCH = 2415021.076998695;
const int = Math.floor;

export function julianDay({ day, month, year }: SolarDate): number {
  const a = int((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - int(y / 100) + int(y / 400) - 32045;
}

export function solarFromJulian(jdn: number): SolarDate {
  const a = jdn + 32044;
  const b = int((4 * a + 3) / 146097);
  const c = a - int((b * 146097) / 4);
  const d = int((4 * c + 3) / 1461);
  const e = c - int((1461 * d) / 4);
  const m = int((5 * e + 2) / 153);
  return {
    day: e - int((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * int(m / 10),
    year: 100 * b + d - 4800 + int(m / 10),
  };
}

function newMoon(k: number, tz: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const approximate = 2415020.75933 + SYNODIC * k + 0.0001178 * t2 - 0.000000155 * t3;
  const correction = 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * RAD);
  const m = (359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3) * RAD;
  const mp = (306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3) * RAD;
  const f = (21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3) * RAD;
  const c = (0.1734 - 0.000393 * t) * Math.sin(m) + 0.0021 * Math.sin(2 * m)
    - 0.4068 * Math.sin(mp) + 0.0161 * Math.sin(2 * mp) - 0.0004 * Math.sin(3 * mp)
    + 0.0104 * Math.sin(2 * f) - 0.0051 * Math.sin(m + mp) - 0.0074 * Math.sin(m - mp)
    + 0.0004 * Math.sin(2 * f + m) - 0.0004 * Math.sin(2 * f - m)
    - 0.0006 * Math.sin(2 * f + mp) + 0.001 * Math.sin(2 * f - mp)
    + 0.0005 * Math.sin(2 * mp + m);
  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
    : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return int(approximate + correction - deltaT + 0.5 + tz / 24);
}

/** 0..11: vi tri Trung khi trong 12 cung hoang dao. */
function solarSector(jdn: number, tz: number): number {
  const t = (jdn - 2451545.5 - tz / 24) / 36525;
  const t2 = t * t;
  const m = (357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2) * RAD;
  const meanLongitude = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const correction = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(m)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * m) + 0.000290 * Math.sin(3 * m);
  const longitude = ((meanLongitude + correction) * RAD % (2 * PI) + 2 * PI) % (2 * PI);
  return int(longitude / PI * 6);
}

function monthEleven(year: number, tz: number): number {
  const k = int((julianDay({ day: 31, month: 12, year }) - 2415021) / SYNODIC);
  const moon = newMoon(k, tz);
  return solarSector(moon, tz) >= 9 ? newMoon(k - 1, tz) : moon;
}

function leapMonthOffset(month11: number, tz: number): number {
  const k = int((month11 - EPOCH) / SYNODIC + 0.5);
  let i = 1;
  let arc = solarSector(newMoon(k + i, tz), tz);
  let previous: number;
  do {
    previous = arc;
    i += 1;
    arc = solarSector(newMoon(k + i, tz), tz);
  } while (arc !== previous && i < 14);
  return i - 1;
}

export function validSolarDate(input: SolarDate): boolean {
  if (!Number.isInteger(input.day) || !Number.isInteger(input.month) || !Number.isInteger(input.year) ||
      input.year < 1900 || input.year > 2100 || input.month < 1 || input.month > 12 || input.day < 1) return false;
  const d = new Date(Date.UTC(input.year, input.month - 1, input.day));
  return d.getUTCFullYear() === input.year && d.getUTCMonth() + 1 === input.month && d.getUTCDate() === input.day;
}

export function solarToLunar(input: SolarDate, tz = 7): LunarDate {
  if (!validSolarDate(input)) throw new Error("Ngày dương lịch không hợp lệ hoặc ngoài phạm vi 1900–2100.");
  const jd = julianDay(input);
  const k = int((jd - EPOCH) / SYNODIC);
  let start = newMoon(k + 1, tz);
  if (start > jd) start = newMoon(k, tz);
  let a11 = monthEleven(input.year, tz);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= start) {
    lunarYear = input.year;
    a11 = monthEleven(input.year - 1, tz);
  } else {
    lunarYear = input.year + 1;
    b11 = monthEleven(input.year + 1, tz);
  }
  const diff = int((start - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarLeap = false;
  if (b11 - a11 > 365) {
    const leapOffset = leapMonthOffset(a11, tz);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      lunarLeap = diff === leapOffset;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: jd - start + 1, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

export function lunarToSolar(input: LunarDate, tz = 7): SolarDate {
  const { day, month, year, leap } = input;
  if (![day, month, year].every(Number.isInteger) || day < 1 || day > 30 || month < 1 || month > 12 || year < 1899 || year > 2100) {
    throw new Error("Ngày âm lịch không hợp lệ hoặc ngoài phạm vi 1900–2100.");
  }
  const a11 = monthEleven(month < 11 ? year - 1 : year, tz);
  const b11 = monthEleven(month < 11 ? year : year + 1, tz);
  let offset = month - 11;
  if (offset < 0) offset += 12;
  if (b11 - a11 > 365) {
    const leapOffset = leapMonthOffset(a11, tz);
    let leapMonth = leapOffset - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) throw new Error(`Năm ${year} không có tháng ${month} nhuận.`);
    if (leap || offset >= leapOffset) offset += 1;
  } else if (leap) {
    throw new Error(`Năm ${year} không có tháng nhuận phù hợp.`);
  }
  const k = int(0.5 + (a11 - EPOCH) / SYNODIC);
  const solar = solarFromJulian(newMoon(k + offset, tz) + day - 1);
  if (!validSolarDate(solar)) throw new Error("Ngày âm nằm ngoài phạm vi lịch được hỗ trợ.");
  const roundTrip = solarToLunar(solar, tz);
  if (roundTrip.day !== day || roundTrip.month !== month || roundTrip.year !== year || roundTrip.leap !== leap) {
    throw new Error("Ngày âm không tồn tại trong tháng (hoặc chọn sai tháng nhuận).");
  }
  return solar;
}

export function addDays(solar: SolarDate, days: number): SolarDate {
  return solarFromJulian(julianDay(solar) + days);
}
