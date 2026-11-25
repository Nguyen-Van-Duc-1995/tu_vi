import {
  addDays,
  lunarToSolar,
  solarToLunar,
  type LunarDate,
  type SolarDate,
} from "./lunar";

/** Dia ban BAT BIEN: index 0..11 theo chieu thuan Tý, Sửu, ..., Hợi. */
export const BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;
export const STEMS = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
] as const;
export const HOUSES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;
export const BOARD_POSITIONS = [
  { branch: 5, row: 1, col: 1 }, // Ty
  { branch: 6, row: 1, col: 2 }, // Ngo
  { branch: 7, row: 1, col: 3 }, // Mui
  { branch: 8, row: 1, col: 4 }, // Than
  { branch: 4, row: 2, col: 1 }, // Thin
  { branch: 9, row: 2, col: 4 }, // Dau
  { branch: 3, row: 3, col: 1 }, // Mao
  { branch: 10, row: 3, col: 4 }, // Tuat
  { branch: 2, row: 4, col: 1 }, // Dan
  { branch: 1, row: 4, col: 2 }, // Suu
  { branch: 0, row: 4, col: 3 }, // Ty
  { branch: 11, row: 4, col: 4 }, // Hoi
] as const;

export type Gender = "male" | "female";
export type CalendarMode = "solar" | "lunar";
export type StarKind =
  | "main"
  | "good"
  | "bad"
  | "neutral"
  | "hoa"
  | "cycle"
  | "annual";
export type Star = { name: string; kind: StarKind };
export type Palace = {
  branchIndex: number;
  branch: (typeof BRANCHES)[number];
  stem: (typeof STEMS)[number];
  house: (typeof HOUSES)[number];
  isThan: boolean;
  main: Star[];
  extra: Star[];
  cycles: Star[];
  annual: Star[];
  tuan: boolean;
  triet: boolean;
  daiHan: { from: number; to: number } | null;
};
export type BirthInput = {
  name: string;
  calendar: CalendarMode;
  day: number;
  month: number;
  year: number;
  lunarLeap?: boolean;
  time: string;
  gender: Gender;
  viewYear: number;
  timeZone?: 7 | 8;
};
export type Chart = {
  name: string;
  solar: SolarDate;
  recordedSolar: SolarDate;
  shiftedLateZi: boolean;
  lunar: LunarDate;
  birthYear: string;
  viewYear: string;
  gender: Gender;
  hour: string;
  effectiveMonth: number;
  cuc: { element: string; number: number; label: string };
  menh: number;
  than: number;
  reversed: boolean;
  ageMu: number;
  currentDaiHan: number | null;
  currentTieuHan: number;
  palaces: Palace[];
};

const mod = (x: number, n = 12) => ((x % n) + n) % n;
const indexOf = (branch: (typeof BRANCHES)[number]) => BRANCHES.indexOf(branch);

// Nap am luc thap hoa giap: tung cap 2 nam co mot hanh (tu Giap Ty den Quy Hoi).
const NAP_AM_ELEMENTS = [
  "Kim",
  "Hỏa",
  "Mộc",
  "Thổ",
  "Kim",
  "Hỏa",
  "Thủy",
  "Thổ",
  "Kim",
  "Mộc",
  "Thủy",
  "Thổ",
  "Hỏa",
  "Mộc",
  "Thủy",
  "Kim",
  "Hỏa",
  "Mộc",
  "Thổ",
  "Kim",
  "Hỏa",
  "Thủy",
  "Thổ",
  "Kim",
  "Mộc",
  "Thủy",
  "Thổ",
  "Hỏa",
  "Mộc",
  "Thủy",
] as const;
const CUC_NUMBER: Record<string, number> = {
  Thủy: 2,
  Mộc: 3,
  Kim: 4,
  Thổ: 5,
  Hỏa: 6,
};
const CUC_NAME: Record<string, string> = {
  Thủy: "Thủy nhị cục",
  Mộc: "Mộc tam cục",
  Kim: "Kim tứ cục",
  Thổ: "Thổ ngũ cục",
  Hỏa: "Hỏa lục cục",
};

/** 1984 Giap Ty -> 0; 2026 Binh Ngo -> 42. */
function yearStem(year: number): number {
  return mod(year + 6, 10);
}
function yearBranch(year: number): number {
  return mod(year + 8);
}
export function canChiYear(year: number): string {
  return `${STEMS[yearStem(year)]} ${BRANCHES[yearBranch(year)]}`;
}

function napAm(stemIndex: number, branchIndex: number): string {
  const index = Array.from({ length: 60 }, (_, i) => i).find(
    (i) => i % 10 === stemIndex && i % 12 === branchIndex,
  );
  if (index === undefined)
    throw new Error("Thiên can và địa chi không tạo thành một cặp hợp lệ.");
  return NAP_AM_ELEMENTS[Math.floor(index / 2)];
}

function palaceStem(yearStemIndex: number, branchIndex: number): number {
  // Ngu ho don: Giap/Ky -> Binh Dan, At/Canh -> Mau Dan, ...
  const danStem = [2, 4, 6, 8, 0][yearStemIndex % 5];
  return mod(danStem + mod(branchIndex - 2), 10);
}

/** Quy tac muon ngay chan tien, le lui de an Tu Vi. */
export function calculateTuViPosition(
  lunarDay: number,
  cucNumber: number,
): number {
  if (
    !Number.isInteger(lunarDay) ||
    lunarDay < 1 ||
    lunarDay > 30 ||
    ![2, 3, 4, 5, 6].includes(cucNumber)
  ) {
    throw new Error("Ngày âm hoặc số Cục không hợp lệ.");
  }
  const quotient = Math.ceil(lunarDay / cucNumber);
  const borrowed = quotient * cucNumber - lunarDay;
  return mod(2 + quotient - 1 + (borrowed % 2 === 0 ? borrowed : -borrowed));
}

/** Chom 6 sao Tu Vi + 8 sao Thien Phu (tong dung 14 sao). */
function placeFourteenStars(
  ziWei: number,
  add: (branch: number, name: string, kind: StarKind) => void,
): void {
  const tuViGroup: Array<[string, number]> = [
    ["Tử Vi", 0],
    ["Thiên Cơ", -1],
    ["Thái Dương", -3],
    ["Vũ Khúc", -4],
    ["Thiên Đồng", -5],
    ["Liêm Trinh", -8],
  ];
  const thienPhu = mod(4 - ziWei); // Doi xung qua truc Dan - Than
  const thienPhuGroup: Array<[string, number]> = [
    ["Thiên Phủ", 0],
    ["Thái Âm", 1],
    ["Tham Lang", 2],
    ["Cự Môn", 3],
    ["Thiên Tướng", 4],
    ["Thiên Lương", 5],
    ["Thất Sát", 6],
    ["Phá Quân", 10],
  ];
  for (const [name, offset] of tuViGroup)
    add(mod(ziWei + offset), name, "main");
  for (const [name, offset] of thienPhuGroup)
    add(mod(thienPhu + offset), name, "main");
}

const LOC_TON = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const THIEN_KHOI = [1, 0, 11, 11, 1, 0, 6, 6, 3, 3];
const THIEN_VIET = [7, 8, 9, 9, 7, 8, 2, 2, 5, 5];
const LUU_VAN_XUONG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
const LUU_VAN_KHUC = [9, 8, 6, 5, 6, 5, 3, 2, 0, 11];

/** Bang Tu Hoa nam sinh: Nam phai pho bien ban Toan Thu (Nham Khoa Ta Phu). */
export const TU_HOA: ReadonlyArray<readonly [string, string, string, string]> =
  [
    ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
    ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
    ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
    ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
    ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
    ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
    ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
    ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
    ["Thiên Lương", "Tử Vi", "Tả Phụ", "Vũ Khúc"],
    ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
  ];

function horse(yearBranchIndex: number): number {
  if ([2, 6, 10].includes(yearBranchIndex)) return 8;
  if ([8, 0, 4].includes(yearBranchIndex)) return 2;
  if ([5, 9, 1].includes(yearBranchIndex)) return 11;
  return 5;
}
function daoHoa(yearBranchIndex: number): number {
  if ([2, 6, 10].includes(yearBranchIndex)) return 3;
  if ([8, 0, 4].includes(yearBranchIndex)) return 9;
  if ([5, 9, 1].includes(yearBranchIndex)) return 6;
  return 0;
}
function kiepSat(yearBranchIndex: number): number {
  if ([2, 6, 10].includes(yearBranchIndex)) return 11;
  if ([8, 0, 4].includes(yearBranchIndex)) return 5;
  if ([5, 9, 1].includes(yearBranchIndex)) return 2;
  return 8;
}

function placeTuHoa(
  yearStemIndex: number,
  palaces: Palace[],
  add: (branch: number, name: string, kind: StarKind) => void,
  prefix: string,
  kind: StarKind,
): void {
  const labels = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];
  TU_HOA[yearStemIndex].forEach((starName, i) => {
    const palace = palaces.find((p) =>
      [...p.main, ...p.extra].some((s) => s.name === starName),
    );
    if (!palace)
      throw new Error(`Không tìm thấy sao ${starName} để an Tứ Hóa.`);
    add(palace.branchIndex, `${prefix}${labels[i]}`, kind);
  });
}

/**
 * Lưu Song Hao: an từ Lưu Lộc Tồn theo can năm xem và giới tính.
 * Quy ước: Dương nam, Âm nữ thuận; Âm nam, Dương nữ nghịch.
 * Tiểu Hao cách 3 cung, Đại Hao cách 9 cung theo chiều an.
 */
function getAnnualSongHao(viewYear: number, gender: Gender) {
  const stemIndex = yearStem(viewYear);
  const locTon = LOC_TON[stemIndex];
  const forward = (stemIndex % 2 === 0) === (gender === "male");
  const direction = forward ? 1 : -1;

  return {
    tieuHao: mod(locTon + 3 * direction),
    daiHao: mod(locTon + 9 * direction),
  };
}

export function createTuViChart(input: BirthInput): Chart {
  if (!input.name.trim()) throw new Error("Vui lòng nhập họ tên.");
  if (
    !Number.isInteger(input.viewYear) ||
    input.viewYear < 1900 ||
    input.viewYear > 2100
  )
    throw new Error("Năm xem phải nằm trong 1900–2100.");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.time))
    throw new Error("Giờ sinh phải theo định dạng HH:mm.");
  if (input.gender !== "male" && input.gender !== "female")
    throw new Error("Giới tính không hợp lệ.");
  if (input.calendar !== "solar" && input.calendar !== "lunar")
    throw new Error("Loại lịch không hợp lệ.");
  const tz = input.timeZone === 8 ? 8 : 7;
  let solar: SolarDate;
  if (input.calendar === "solar") {
    solar = { day: input.day, month: input.month, year: input.year };
    // Validate before using solarToLunar.
    solarToLunar(solar, tz);
  } else {
    solar = lunarToSolar(
      {
        day: input.day,
        month: input.month,
        year: input.year,
        leap: Boolean(input.lunarLeap),
      },
      tz,
    );
  }
  // Quy uoc gio Ty muon: tu 23:00 tro di tinh ngay am ke tiep.
  const recordedSolar = { ...solar };
  const shiftedLateZi = Number(input.time.slice(0, 2)) === 23;
  if (shiftedLateZi) {
    solar = addDays(solar, 1);
  }
  const lunar = solarToLunar(solar, tz);
  const hourNumber = Number(input.time.slice(0, 2));
  const hourIndex = mod(Math.floor((hourNumber + 1) / 2));
  const effectiveMonth =
    lunar.leap && lunar.day >= 16 ? (lunar.month % 12) + 1 : lunar.month;
  const menh = mod(2 + (effectiveMonth - 1) - hourIndex);
  const than = mod(2 + (effectiveMonth - 1) + hourIndex);
  const stemOfYear = yearStem(lunar.year);
  const branchOfYear = yearBranch(lunar.year);
  const menhStem = palaceStem(stemOfYear, menh);
  const cucElement = napAm(menhStem, menh);
  const cucNumber = CUC_NUMBER[cucElement];
  const forward = (stemOfYear % 2 === 0) === (input.gender === "male"); // Duong nam, am nu
  const direction = forward ? 1 : -1;
  const ageMu = input.viewYear - lunar.year + 1;

  const palaces: Palace[] = BRANCHES.map((branch, branchIndex) => ({
    branchIndex,
    branch,
    stem: STEMS[palaceStem(stemOfYear, branchIndex)],
    house: HOUSES[mod(branchIndex - menh)],
    isThan: branchIndex === than,
    main: [],
    extra: [],
    cycles: [],
    annual: [],
    tuan: false,
    triet: false,
    daiHan: null,
  }));

  const add = (branch: number, name: string, kind: StarKind): void => {
    const palace = palaces[mod(branch)];
    if (kind === "main") palace.main.push({ name, kind });
    else if (kind === "cycle") palace.cycles.push({ name, kind });
    else if (kind === "annual") palace.annual.push({ name, kind });
    else palace.extra.push({ name, kind });
  };

  const ziWei = calculateTuViPosition(lunar.day, cucNumber);
  placeFourteenStars(ziWei, add);

  // Sao theo can nam sinh.
  const locTon = LOC_TON[stemOfYear];
  add(locTon, "Lộc Tồn", "good");
  add(locTon + 1, "Kình Dương", "bad");
  add(locTon - 1, "Đà La", "bad");

  // Vòng Lộc Tồn (Bác Sĩ): Bác Sĩ đồng cung với Lộc Tồn.
  // Dương nam, Âm nữ an thuận; Âm nam, Dương nữ an nghịch.
  // Quan Phủ khác Quan Phù thuộc vòng Thái Tuế.
  const bacSiCycle = [
    "Bác Sĩ",
    "Lực Sĩ",
    "Thanh Long",
    "Tiểu Hao",
    "Tướng Quân",
    "Tấu Thư",
    "Phi Liêm",
    "Hỷ Thần",
    "Bệnh Phù",
    "Đại Hao",
    "Phục Binh",
    "Quan Phủ",
  ] as const;
  bacSiCycle.forEach((name, step) =>
    add(mod(locTon + direction * step), name, "cycle"),
  );

  add(THIEN_KHOI[stemOfYear], "Thiên Khôi", "good");
  add(THIEN_VIET[stemOfYear], "Thiên Việt", "good");

  // Sao theo thang am va gio sinh.
  const taPhu = mod(4 + effectiveMonth - 1);
  const huuBat = mod(10 - (effectiveMonth - 1));
  const xuong = mod(10 - hourIndex);
  const khuc = mod(4 + hourIndex);
  add(taPhu, "Tả Phụ", "good");
  add(huuBat, "Hữu Bật", "good");
  add(xuong, "Văn Xương", "good");
  add(khuc, "Văn Khúc", "good");
  add(mod(11 - hourIndex), "Địa Không", "bad");
  add(mod(11 + hourIndex), "Địa Kiếp", "bad");

  // Sao theo chi nam sinh.
  add(daoHoa(branchOfYear), "Đào Hoa", "good");
  add(horse(branchOfYear), "Thiên Mã", "neutral");
  add(mod(3 - branchOfYear), "Hồng Loan", "good");
  add(mod(3 - branchOfYear + 6), "Thiên Hỷ", "good");
  add(kiepSat(branchOfYear), "Kiếp Sát", "bad");
  add(mod(4 + branchOfYear), "Long Trì", "good");
  add(mod(10 - branchOfYear), "Phượng Các", "good");
  add(mod(6 - branchOfYear), "Thiên Khốc", "bad");
  add(mod(6 + branchOfYear), "Thiên Hư", "bad");
  add(mod(9 + branchOfYear), "Thiên Đức", "good");
  add(mod(5 + branchOfYear), "Nguyệt Đức", "good");

  // Hoa / Linh tinh: Tinh khoi theo tam hop tuoi, chieu an theo am duong nam nu.
  const hoaStart = [2, 6, 10].includes(branchOfYear)
    ? 1
    : [8, 0, 4].includes(branchOfYear)
      ? 2
      : [5, 9, 1].includes(branchOfYear)
        ? 3
        : 9;
  const linhStart = [2, 6, 10].includes(branchOfYear) ? 3 : 10;
  add(mod(hoaStart + direction * hourIndex), "Hỏa Tinh", "bad");
  add(mod(linhStart - direction * hourIndex), "Linh Tinh", "bad");

  // Sao theo ngay am, phu thuoc vao 4 sao Tả Hữu Xương Khúc.
  add(mod(taPhu + lunar.day - 1), "Tam Thai", "good");
  add(mod(huuBat - (lunar.day - 1)), "Bát Tọa", "good");
  add(mod(xuong + lunar.day - 2), "Ân Quang", "good");
  add(mod(khuc - (lunar.day - 2)), "Thiên Quý", "good");

  // Vong Thai Tue theo chi nam sinh va vong Trang Sinh theo Cuc.
  const thaiTueCycle = [
    "Thái Tuế",
    "Thiếu Dương",
    "Tang Môn",
    "Thiếu Âm",
    "Quan Phù",
    "Tử Phù",
    "Tuế Phá",
    "Long Đức",
    "Bạch Hổ",
    "Phúc Đức",
    "Điếu Khách",
    "Trực Phù",
  ];
  thaiTueCycle.forEach((name, step) =>
    add(mod(branchOfYear + step), name, "cycle"),
  );
  const trangSinhCycle = [
    "Tràng Sinh",
    "Mộc Dục",
    "Quan Đới",
    "Lâm Quan",
    "Đế Vượng",
    "Suy",
    "Bệnh",
    "Tử",
    "Mộ",
    "Tuyệt",
    "Thai",
    "Dưỡng",
  ];
  const trangSinhStart =
    cucNumber === 2 || cucNumber === 5
      ? 8
      : cucNumber === 3
        ? 11
        : cucNumber === 4
          ? 5
          : 2;
  trangSinhCycle.forEach((name, step) =>
    add(mod(trangSinhStart + direction * step), name, "cycle"),
  );

  // Tuan theo tuan Giap (10 nam), Triet theo can nam sinh.
  const cycle60 = mod(lunar.year - 1984, 60);
  const tuanPairStart = mod(10 - 2 * Math.floor(cycle60 / 10));
  for (const i of [tuanPairStart, mod(tuanPairStart + 1)])
    palaces[i].tuan = true;
  const trietPairStart = [8, 6, 4, 2, 0][stemOfYear % 5];
  for (const i of [trietPairStart, trietPairStart + 1]) palaces[i].triet = true;

  // Dai han: menh bat dau tu so Cuc, moi cung 10 tuoi.
  for (let i = 0; i < 12; i++) {
    const from = cucNumber + i * 10;
    palaces[mod(menh + direction * i)].daiHan = { from, to: from + 9 };
  }
  const currentDaiHan =
    palaces.find(
      (p) => p.daiHan && ageMu >= p.daiHan.from && ageMu <= p.daiHan.to,
    )?.branchIndex ?? null;
  // Tieu han nam 1 tuoi: DNT Thin; Than-Ty-Thin Tuat; Ty-Dau-Suu Mui; Hoi-Mao-Mui Suu.
  const tieuHanStart = [2, 6, 10].includes(branchOfYear)
    ? 4
    : [8, 0, 4].includes(branchOfYear)
      ? 10
      : [5, 9, 1].includes(branchOfYear)
        ? 7
        : 1;
  const currentTieuHan = mod(
    tieuHanStart + Math.max(ageMu - 1, 0) * (input.gender === "male" ? 1 : -1),
  );

  // Tu hoa theo can nam sinh, dat cung sao goc dang dong.
  placeTuHoa(stemOfYear, palaces, add, "", "hoa");

  // Sao luu theo nam xem (Binh Ngo 2026 khop dung cac vi tri trong anh mau).
  const stemOfViewYear = yearStem(input.viewYear);
  const branchOfViewYear = yearBranch(input.viewYear);
  const locOfViewYear = LOC_TON[stemOfViewYear];
  add(branchOfViewYear, "L. Thái Tuế", "annual");
  add(mod(branchOfViewYear + 2), "L. Tang Môn", "annual");
  add(mod(branchOfViewYear + 8), "L. Bạch Hổ", "annual");
  add(locOfViewYear, "L. Lộc Tồn", "annual");
  add(mod(locOfViewYear + 1), "L. Kình Dương", "annual");
  add(mod(locOfViewYear - 1), "L. Đà La", "annual");

  // Lưu Song Hao: phải gọi hàm và thêm vào palace.annual thông qua add().
  const songHao = getAnnualSongHao(input.viewYear, input.gender);
  add(songHao.tieuHao, "L. Tiểu Hao", "annual");
  add(songHao.daiHao, "L. Đại Hao", "annual");

  add(THIEN_KHOI[stemOfViewYear], "L. Thiên Khôi", "annual");
  add(THIEN_VIET[stemOfViewYear], "L. Thiên Việt", "annual");
  add(LUU_VAN_XUONG[stemOfViewYear], "L. Văn Xương", "annual");
  add(LUU_VAN_KHUC[stemOfViewYear], "L. Văn Khúc", "annual");
  add(horse(branchOfViewYear), "L. Thiên Mã", "annual");
  add(daoHoa(branchOfViewYear), "L. Đào Hoa", "annual");
  add(mod(3 - branchOfViewYear), "L. Hồng Loan", "annual");
  add(kiepSat(branchOfViewYear), "L. Kiếp Sát", "annual");
  add(mod(6 - branchOfViewYear), "L. Thiên Khốc", "annual");
  add(mod(6 + branchOfViewYear), "L. Thiên Hư", "annual");
  placeTuHoa(stemOfViewYear, palaces, add, "L. ", "annual");

  return {
    name: input.name.trim(),
    solar,
    recordedSolar,
    shiftedLateZi,
    lunar,
    birthYear: canChiYear(lunar.year),
    viewYear: canChiYear(input.viewYear),
    gender: input.gender,
    hour: BRANCHES[hourIndex],
    effectiveMonth,
    cuc: {
      element: cucElement,
      number: cucNumber,
      label: CUC_NAME[cucElement],
    },
    menh,
    than,
    reversed: !forward,
    ageMu,
    currentDaiHan,
    currentTieuHan,
    palaces,
  };
}

/** Tu 1 cung, tinh tam hop (cach 4, 8) va xung chieu (cach 6). */
export function relatedPalaces(branch: number): {
  tamHop: number[];
  xung: number;
} {
  return { tamHop: [mod(branch + 4), mod(branch + 8)], xung: mod(branch + 6) };
}
