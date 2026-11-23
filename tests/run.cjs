/* Test with Node's built-in assertions; compiles only the pure TypeScript engine. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const build = fs.mkdtempSync(path.join(os.tmpdir(), 'tuvi-core-'));
try {
  execFileSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', [
    '--target', 'ES2022', '--module', 'CommonJS', '--moduleResolution', 'Node',
    '--strict', '--skipLibCheck', '--outDir', build,
    'src/lib/lunar.ts', 'src/lib/tuvi.ts',
  ], { cwd: projectDir, stdio: 'inherit' });
  const { solarToLunar, lunarToSolar } = require(path.join(build, 'lunar.js'));
  const { createTuViChart, calculateTuViPosition, BOARD_POSITIONS, BRANCHES, relatedPalaces } = require(path.join(build, 'tuvi.js'));

  const assertLunar = (solar, expected) => assert.deepEqual(solarToLunar(solar), expected);
  assertLunar({ day: 10, month: 2, year: 2024 }, { day: 1, month: 1, year: 2024, leap: false });
  assertLunar({ day: 22, month: 1, year: 2023 }, { day: 1, month: 1, year: 2023, leap: false });
  assertLunar({ day: 22, month: 3, year: 2023 }, { day: 1, month: 2, year: 2023, leap: true });
  assertLunar({ day: 17, month: 2, year: 2026 }, { day: 1, month: 1, year: 2026, leap: false });
  assertLunar({ day: 12, month: 6, year: 1984 }, { day: 14, month: 5, year: 1984, leap: false });
  assert.deepEqual(lunarToSolar({ day: 1, month: 2, year: 2023, leap: true }), { day: 22, month: 3, year: 2023 });
  assert.throws(() => lunarToSolar({ day: 30, month: 2, year: 2023, leap: true }));
  assert.throws(() => lunarToSolar({ day: 1, month: 3, year: 2023, leap: true }));

  const expectedPositions = [
    [5, 1, 1], [6, 1, 2], [7, 1, 3], [8, 1, 4],
    [4, 2, 1], [9, 2, 4], [3, 3, 1], [10, 3, 4],
    [2, 4, 1], [1, 4, 2], [0, 4, 3], [11, 4, 4],
  ];
  assert.deepEqual(BOARD_POSITIONS.map(({ branch, row, col }) => [branch, row, col]), expectedPositions);
  assert.equal(new Set(BOARD_POSITIONS.map(x => x.branch)).size, 12);
  assert.equal(calculateTuViPosition(5, 6), 1); // Hoa luc cuc ngay 5 -> Suu
  assert.equal(calculateTuViPosition(20, 4), 6); // Kim tu cuc ngay 20 -> Ngo
  assert.deepEqual(relatedPalaces(2), { tamHop: [6, 10], xung: 8 }); // Dan-Ngo-Tuat, Than xung

  const sample = {
    name: 'Nguyễn Hồng Phúc', calendar: 'solar', day: 12, month: 6,
    year: 1984, time: '07:01', gender: 'female', viewYear: 2026, timeZone: 7,
  };
  const chart = createTuViChart(sample);
  assert.equal(chart.birthYear, 'Giáp Tý');
  assert.equal(chart.viewYear, 'Bính Ngọ');
  assert.equal(chart.cuc.label, 'Hỏa lục cục');
  assert.equal(chart.menh, 2); // Dan
  assert.equal(chart.than, 10); // Tuat
  assert.equal(chart.ageMu, 43);
  assert.equal(chart.currentDaiHan, 11); // Hoi, nguoi Duong Nu nghich
  assert.equal(chart.palaces.flatMap(x => x.main).length, 14);
  assert.equal(new Set(chart.palaces.flatMap(x => x.main.map(s => s.name))).size, 14);
  const findAnnual = (star) => {
    const palace = chart.palaces.find(p => p.annual.some(s => s.name === `L. ${star}`));
    assert.ok(palace, `Missing ${star}`);
    return palace.branch;
  };
  // Kiem lai truc tiep voi luu tinh nam Binh Ngo 2026 trong anh tham khao.
  const annualPlaces = {
    'Lộc Tồn': 'Tỵ', 'Kình Dương': 'Ngọ', 'Đà La': 'Thìn',
    'Văn Khúc': 'Ngọ', 'Thái Tuế': 'Ngọ', 'Văn Xương': 'Thân',
    'Thiên Mã': 'Thân', 'Tang Môn': 'Thân', 'Hồng Loan': 'Dậu',
    'Thiên Việt': 'Dậu', 'Thiên Khôi': 'Hợi', 'Kiếp Sát': 'Hợi',
    'Thiên Khốc': 'Tý', 'Thiên Hư': 'Tý', 'Bạch Hổ': 'Dần',
    'Đào Hoa': 'Mão',
  };
  for (const [star, place] of Object.entries(annualPlaces)) {
    assert.equal(findAnnual(star), place, `${star} phai o cung ${place}`);
  }

  const secondChart = createTuViChart({ ...sample, time: '03:30', gender: 'male', viewYear: 2027 });
  assert.equal(secondChart.palaces.length, 12);
  assert.notEqual(secondChart.menh, chart.menh);
  assert.deepEqual(secondChart.palaces.map(p => p.branch), [...BRANCHES]);
  assert.throws(() => createTuViChart({ ...sample, day: 31, month: 2 }));
  // Kiem tra doi qua lai tren hon 300 ngay dai dien, gom nhuận, đầu/cuối năm.
  for (let year = 1900; year <= 2100; year += 10) {
    for (const month of [1, 2, 3, 6, 9, 12]) {
      for (const day of [1, 10, 20]) {
        const solar = { day, month, year };
        const lunar = solarToLunar(solar);
        const back = lunarToSolar(lunar);
        assert.deepEqual(back, solar, `Round trip ${JSON.stringify(solar)}`);
      }
    }
  }
  console.log('✓ Tất cả kiểm thử lõi Tử Vi và lịch âm đã chạy thành công.');
} finally {
  fs.rmSync(build, { force: true, recursive: true });
}
