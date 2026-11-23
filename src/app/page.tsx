"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  BOARD_POSITIONS,
  BRANCHES,
  createTuViChart,
  relatedPalaces,
  type BirthInput,
  type Palace,
  type Star,
} from "@/lib/tuvi";

const defaultInput: BirthInput = {
  name: "Nguyễn Hồng Phúc",
  calendar: "solar",
  day: 12,
  month: 6,
  year: 1984,
  time: "07:01",
  gender: "female",
  viewYear: 2026,
  timeZone: 7,
  lunarLeap: false,
};

/**
 * Địa chi có vị trí cố định và màu CỐ ĐỊNH đúng ảnh tham khảo.
 * Chỉ số: Tý Sửu Dần Mão Thìn Tỵ Ngọ Mùi Thân Dậu Tuất Hợi.
 * Tý/Hợi -> xanh dương; Tỵ/Ngọ -> đỏ; Thìn/Tuất/Sửu/Mùi -> vàng;
 * Dần/Mão -> xanh lá; Thân/Dậu -> xám.
 * CSS áp các màu đặc theo data-element, không tô theo tên cung Mệnh/Thân.
 */
const branchElement = [
  "thuy", "tho", "moc", "moc", "tho", "hoa",
  "hoa", "tho", "kim", "kim", "tho", "thuy",
] as const;

const dateText = (d: { day: number; month: number; year: number }) =>
  `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;

type IconName = "sparkles" | "calendar" | "rotate" | "printer" | "sliders" | "arrow" | "info" | "compass" | "chevron";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  let content: ReactNode;
  switch (name) {
    case "sparkles":
      content = <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 17 .6 1.5L21 19l-1.4.5L19 21l-.6-1.5L17 19l1.4-.5L19 17ZM4 16l.7 1.3L6 18l-1.3.7L4 20l-.7-1.3L2 18l1.3-.7L4 16Z" /></>;
      break;
    case "calendar":
      content = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>;
      break;
    case "rotate":
      content = <><path d="M3 11a9 9 0 1 1 2.5 6.3" /><path d="M3 4v7h7" /></>;
      break;
    case "printer":
      content = <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6zM18 12h.01" /></>;
      break;
    case "sliders":
      content = <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" /><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" /></>;
      break;
    case "arrow":
      content = <><path d="M5 12h14m-6-6 6 6-6 6" /></>;
      break;
    case "info":
      content = <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>;
      break;
    case "compass":
      content = <><circle cx="12" cy="12" r="9" /><path d="m15.7 8.3-2.5 4.9-4.9 2.5 2.5-4.9 4.9-2.5Z" /></>;
      break;
    case "chevron":
      content = <path d="m9 18 6-6-6-6" />;
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {content}
    </svg>
  );
}

function StarGroup({ stars, className = "" }: { stars: Star[]; className?: string }) {
  if (stars.length === 0) return null;
  return (
    <div className={`star-group ${className}`}>
      {stars.map((star) => (
        <span className={`star star--${star.kind}`} key={`${star.kind}-${star.name}`}>{star.name}</span>
      ))}
    </div>
  );
}

function PalaceCell({
  palace, row, col, active, isCurrentDaiHan, isCurrentTieuHan,
  onSelect, showMain, showExtra, showCycles, showAnnual,
}: {
  palace: Palace;
  row: number;
  col: number;
  active: boolean;
  isCurrentDaiHan: boolean;
  isCurrentTieuHan: boolean;
  onSelect: () => void;
  showMain: boolean;
  showExtra: boolean;
  showCycles: boolean;
  showAnnual: boolean;
}) {
  const style: CSSProperties = { gridRow: row, gridColumn: col };
  return (
    <section
      className="palace"
      data-branch={palace.branchIndex}
      style={style}
      data-element={branchElement[palace.branchIndex]}
      onClick={onSelect}
      role="button"
      aria-pressed={active}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Chọn cung ${palace.house}, ${palace.stem} ${palace.branch}`}
    >
      <div className="palace-heading">
        <div className="palace-place">
          <span className="palace-heading__stem">{palace.stem}</span>
          <strong className="palace-heading__branch">{palace.branch}</strong>
        </div>
        <div className="palace-heading__house">
          <span>{palace.house}</span>
          {palace.isThan && <span className="tag tag--than">Thân</span>}
        </div>
      </div>
      {(palace.tuan || palace.triet || isCurrentDaiHan || isCurrentTieuHan) && (
        <div className="palace-tags">
          {palace.tuan && <span className="tag tag--void">Tuần</span>}
          {palace.triet && <span className="tag tag--void">Triệt</span>}
          {isCurrentDaiHan && <span className="tag tag--current">Đại hạn hiện tại</span>}
          {isCurrentTieuHan && <span className="tag tag--year">Tiểu hạn năm xem</span>}
        </div>
      )}
      <div className="palace-stars">
        {showMain && (
          <div className="palace-main-wrap" aria-label="Chính tinh">
            {palace.main.length
              ? <StarGroup stars={palace.main} className="star-group--main" />
              : <span className="star-empty">Vô chính diệu</span>}
          </div>
        )}
        {showExtra && palace.extra.length > 0 && (
          <div className="palace-extra-wrap" aria-label="Phụ tinh">
            <StarGroup stars={palace.extra} className="star-group--extra" />
          </div>
        )}
        {showCycles && palace.cycles.length > 0 && (
          <div className="palace-cycles-wrap" aria-label="Vòng sao">
            <StarGroup stars={palace.cycles} className="star-group--cycles" />
          </div>
        )}
        {showAnnual && palace.annual.length > 0 && (
          <div className="palace-annual-wrap" aria-label="Sao lưu theo năm xem">
            <StarGroup stars={palace.annual} className="star-group--annual" />
          </div>
        )}
      </div>
      <div className="palace-footer">
        <span>ĐẠI HẠN</span>
        <strong>{palace.daiHan?.from}–{palace.daiHan?.to} tuổi</strong>
      </div>
    </section>
  );
}

type LinePoint = { x: number; y: number };
type ConnectionKind = "tam-hop" | "xung-chieu";
type ConnectionSegment = {
  branch: number;
  kind: ConnectionKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
type ConnectionGeometry = { width: number; height: number; lines: ConnectionSegment[] };

function PalaceConnections({ geometry }: { geometry: ConnectionGeometry | null }) {
  if (!geometry || geometry.lines.length === 0) return null;
  return (
    <svg
      className="palace-connections"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {geometry.lines.map((line) => (
        <g key={`${line.kind}-${line.branch}`}>
          <line className="palace-connection-halo" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          <line
            className={`palace-connection ${line.kind === "tam-hop" ? "palace-connection--tam" : "palace-connection--xung"}`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          />
        </g>
      ))}
    </svg>
  );
}

function CenterInfo({ title, value }: { title: string; value: ReactNode }) {
  return <div className="center-info-item"><dt>{title}</dt><dd>{value}</dd></div>;
}

function FilterOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`filter-chip ${checked ? "filter-chip--checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="filter-indicator" aria-hidden="true">{checked ? "✓" : "+"}</span>
      {label}
    </label>
  );
}

export default function Home() {
  const [draft, setDraft] = useState<BirthInput>(defaultInput);
  const [submitted, setSubmitted] = useState<BirthInput>(defaultInput);
  // null = no manual override. In this state, show the three lines from Mệnh.
  // Selecting another palace overrides Mệnh; selecting it again returns to Mệnh.
  const [selected, setSelected] = useState<number | null>(null);
  const [showMain, setShowMain] = useState(true);
  const [showExtra, setShowExtra] = useState(true);
  const [showCycles, setShowCycles] = useState(false);
  const [showAnnual, setShowAnnual] = useState(true);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  const result = useMemo(() => {
    try {
      return { chart: createTuViChart(submitted), error: "" };
    } catch (error) {
      return { chart: null, error: error instanceof Error ? error.message : "Không thể lập lá số." };
    }
  }, [submitted]);

  const chart = result.chart;
  const activeBranch = chart ? (selected ?? chart.menh) : null;
  const boardRef = useRef<HTMLDivElement>(null);
  const [connectionGeometry, setConnectionGeometry] = useState<ConnectionGeometry | null>(null);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (activeBranch === null || !board || !chart) {
      setConnectionGeometry(null);
      return;
    }

    // The row height can change when stars are filtered. Always measure actual
    // cell centers rather than assuming a geometrically uniform 4x4 board.
    const measure = () => {
      const boardBounds = board.getBoundingClientRect();
      const getCenter = (branch: number): LinePoint | null => {
        const palace = board.querySelector<HTMLElement>(`[data-branch="${branch}"]`);
        if (!palace) return null;
        const rect = palace.getBoundingClientRect();
        return {
          x: rect.left - boardBounds.left - board.clientLeft + rect.width / 2,
          y: rect.top - boardBounds.top - board.clientTop + rect.height / 2,
        };
      };

      const from = getCenter(activeBranch);
      if (!from) return;
      const related = relatedPalaces(activeBranch);
      const destinations: { branch: number; kind: ConnectionKind }[] = [
        ...related.tamHop.map((branch) => ({ branch, kind: "tam-hop" as const })),
        { branch: related.xung, kind: "xung-chieu" },
      ];
      const lines = destinations.flatMap(({ branch, kind }) => {
        const to = getCenter(branch);
        if (!to) return [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return [];
        // Shorten ends slightly so strokes do not obscure the stars in a cell.
        const trim = Math.min(78, distance / 4);
        const ux = dx / distance;
        const uy = dy / distance;
        return [{
          branch,
          kind,
          x1: from.x + ux * trim,
          y1: from.y + uy * trim,
          x2: to.x - ux * trim,
          y2: to.y - uy * trim,
        }];
      });
      setConnectionGeometry({ width: board.clientWidth, height: board.clientHeight, lines });
    };

    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (observer) {
      observer.observe(board);
      board.querySelectorAll<HTMLElement>(".palace").forEach((palace) => observer.observe(palace));
    }
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeBranch, chart, fontSize, showMain, showExtra, showCycles, showAnnual]);

  const selectPalace = (branch: number) => {
    setSelected((current) => (current === branch || branch === chart?.menh ? null : branch));
  };
  const set = <K extends keyof BirthInput>(field: K, value: BirthInput[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted({ ...draft });
    setSelected(null);
  };
  const resetAll = () => {
    setDraft({ ...defaultInput });
    setSubmitted({ ...defaultInput });
    setSelected(null);
    setShowMain(true);
    setShowExtra(true);
    setShowCycles(false);
    setShowAnnual(true);
    setFontSize("medium");
  };

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead-identity">
          <div className="brand-mark" aria-hidden="true"><span>紫</span><span>微</span></div>
          <div>
            <span className="eyebrow">TỬ VI ĐẨU SỐ · NAM PHÁI</span>
            <h1>Lập lá số Tử Vi <span className="heading-flourish">✧</span></h1>
            <p>An sao Tam Hợp phái · Địa chi cố định, màu ngũ hành theo ảnh mẫu</p>
          </div>
        </div>
        <div className="masthead-badge"><Icon name="compass" size={18} /><span>12 địa chi cố định</span></div>
      </header>

      <section className="form-panel" aria-labelledby="form-title">
        <div className="section-heading">
          <div className="section-heading__icon"><Icon name="calendar" size={20} /></div>
          <div className="section-heading__copy">
            <span className="section-index">BƯỚC 01 / NHẬP DỮ LIỆU</span>
            <h2 id="form-title">Thông tin lập lá số</h2>
            <p>Điền ngày giờ sinh và năm cần xem để lập lá số.</p>
          </div>
          <button type="button" className="ghost-button" onClick={resetAll}><Icon name="rotate" size={15} /> Khôi phục mẫu</button>
        </div>

        <form onSubmit={submit} className="birth-form">
          <label className="field field--name">
            <span>Họ và tên</span>
            <input value={draft.name} onChange={(event) => set("name", event.target.value)} autoComplete="name" required />
          </label>
          <label className="field field--calendar">
            <span>Loại lịch</span>
            <select value={draft.calendar} onChange={(event) => {
              setDraft((prev) => ({ ...prev, calendar: event.target.value as BirthInput["calendar"], lunarLeap: false }));
            }}>
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <div className="field field--date">
            <span id="birth-date-label">Ngày tháng năm sinh</span>
            <div className="date-grid" role="group" aria-labelledby="birth-date-label">
              <label className="date-part"><span className="sr-only">Ngày sinh</span><input type="number" aria-label="Ngày sinh" min={1} max={31} value={draft.day} onChange={(event) => set("day", Number(event.target.value))} required /><small>Ngày</small></label>
              <label className="date-part"><span className="sr-only">Tháng sinh</span><select aria-label="Tháng sinh" value={draft.month} onChange={(event) => set("month", Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select><small>Tháng</small></label>
              <label className="date-part"><span className="sr-only">Năm sinh</span><input type="number" aria-label="Năm sinh" min={1900} max={2100} value={draft.year} onChange={(event) => set("year", Number(event.target.value))} required /><small>Năm</small></label>
            </div>
          </div>
          <label className="field field--time">
            <span>Giờ sinh <small className="field-optional">(24 giờ)</small></span>
            <input type="time" value={draft.time} onChange={(event) => set("time", event.target.value)} required />
          </label>

          <label className="field field--gender">
            <span>Giới tính</span>
            <select value={draft.gender} onChange={(event) => set("gender", event.target.value as BirthInput["gender"])}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <label className="field field--timezone">
            <span>Múi giờ an lịch</span>
            <select value={draft.timeZone} onChange={(event) => set("timeZone", Number(event.target.value) as 7 | 8)}>
              <option value={7}>Việt Nam (UTC+7)</option>
              <option value={8}>UTC+8 · đối chiếu lịch sử</option>
            </select>
          </label>
          <label className="field field--view-year">
            <span>Năm xem hạn</span>
            <input type="number" min={1900} max={2100} value={draft.viewYear} onChange={(event) => set("viewYear", Number(event.target.value))} required />
          </label>
          <div className="form-action"><button type="submit" className="submit-button"><Icon name="sparkles" size={18} /><span>An sao &amp; lập lá số</span><Icon name="arrow" size={17} /></button></div>
          {draft.calendar === "lunar" && (
            <label className="leap-toggle"><input type="checkbox" checked={Boolean(draft.lunarLeap)} onChange={(event) => set("lunarLeap", event.target.checked)} /><span>Ngày sinh thuộc tháng nhuận âm lịch</span></label>
          )}
        </form>
        <div className="form-note"><Icon name="info" size={15} /><span>Giờ Tý: 23:00–00:59. Từ 23:00 tính ngày âm kế tiếp. Với tháng nhuận, ngày 1–15 an như tháng chính, từ ngày 16 an theo tháng tiếp theo.</span></div>
      </section>

      {result.error && <div role="alert" className="error-box"><Icon name="info" size={19} />{result.error}</div>}

      {chart && (
        <>
          <section className="result-section" aria-labelledby="result-title">
            <div className="result-heading">
              <div>
                <span className="section-index">BƯỚC 02 / ĐỊA BÀN TỬ VI</span>
                <h2 id="result-title">Lá số <span>{chart.name}</span></h2>
                <p>Năm xem {submitted.viewYear} · {chart.viewYear} · {chart.ageMu} tuổi mụ</p>
              </div>
              <div className="result-actions">
                <span className="result-ready"><span className="ready-dot" />Đã an sao</span>
                <button type="button" className="print-button" onClick={() => window.print()}><Icon name="printer" size={17} /> In lá số</button>
              </div>
            </div>

            <div className="view-controls">
              <div className="view-controls__title"><Icon name="sliders" size={17} /><span>Tùy chỉnh hiển thị</span></div>
              <div className="filter-list">
                <FilterOption label="Chính tinh" checked={showMain} onChange={setShowMain} />
                <FilterOption label="Phụ tinh" checked={showExtra} onChange={setShowExtra} />
                <FilterOption label="Vòng sao" checked={showCycles} onChange={setShowCycles} />
                <FilterOption label={`Sao lưu ${submitted.viewYear}`} checked={showAnnual} onChange={setShowAnnual} />
              </div>
              <div className="font-controls" role="group" aria-label="Cỡ chữ trong lá số">
                <span className="font-controls__label">Cỡ chữ</span>
                {([
                  ["small", "Nhỏ"], ["medium", "Vừa"], ["large", "Lớn"],
                ] as const).map(([size, label]) => (
                  <button
                    key={size}
                    type="button"
                    className={`font-button ${fontSize === size ? "font-button--active" : ""}`}
                    aria-pressed={fontSize === size}
                    onClick={() => setFontSize(size)}
                  >{label}</button>
                ))}
              </div>
              <label className="mobile-palace-picker">
                <span>Chọn cung</span>
                <select value={selected ?? ""} onChange={(event) => {
                  const value = event.target.value;
                  setSelected(value === "" || Number(value) === chart.menh ? null : Number(value));
                }}>
                  <option value="">Mặc định: cung Mệnh ({BRANCHES[chart.menh]})</option>
                  {chart.palaces.map((palace) => <option key={palace.branchIndex} value={palace.branchIndex}>{palace.house} · {palace.branch}</option>)}
                </select>
              </label>
            </div>

            <div className="chart-frame">
              <div className="board-caption">
                <div><span className="board-caption__mark">✦</span><strong>Địa bàn Tử Vi</strong><span className="board-caption__sub">ĐỊA CHI CỐ ĐỊNH · NỀN MÀU NGŨ HÀNH</span></div>
                <span className="board-instruction">Mặc định kẻ từ cung Mệnh; bấm cung khác để đổi đường nối <Icon name="chevron" size={15} /></span>
              </div>
              <div className="chart-scroll" role="region" aria-label="Địa bàn 12 cung Tử Vi, kéo ngang để xem trên màn hình nhỏ" tabIndex={0}>
                <div className="chart-grid" data-font-size={fontSize} ref={boardRef}>
                  {BOARD_POSITIONS.map(({ branch, row, col }) => (
                    <PalaceCell
                      key={branch}
                      palace={chart.palaces[branch]}
                      row={row}
                      col={col}
                      active={activeBranch === branch}
                      isCurrentDaiHan={chart.currentDaiHan === branch}
                      isCurrentTieuHan={chart.currentTieuHan === branch}
                      onSelect={() => selectPalace(branch)}
                      showMain={showMain} showExtra={showExtra} showCycles={showCycles} showAnnual={showAnnual}
                    />
                  ))}
                  <PalaceConnections geometry={connectionGeometry} />
                  <section className="center-panel" style={{ gridColumn: "2 / span 2", gridRow: "2 / span 2" }} aria-label="Thiên bàn và thông tin lá số">
                    <div className="center-ornament" aria-hidden="true"><span>✦</span></div>
                    <div className="center-eyebrow">TỬ VI ĐẨU SỐ · TAM HỢP NAM PHÁI</div>
                    <h2>{chart.name}</h2>
                    <p className="center-subtitle">THIÊN BÀN · THÔNG TIN LÁ SỐ</p>
                    <div className="center-quickfacts">
                      <span><small>MỆNH</small><b>{BRANCHES[chart.menh]}</b></span>
                      <span><small>THÂN</small><b>{BRANCHES[chart.than]}</b></span>
                      <span><small>NGŨ HÀNH CỤC</small><b>{chart.cuc.label}</b></span>
                    </div>
                    <div className="center-divider"><span>Thông tin chi tiết</span></div>
                    <dl className="center-info">
                      <CenterInfo title="Dương lịch sinh" value={dateText(chart.recordedSolar)} />
                      <CenterInfo title="Âm lịch sinh" value={`${dateText(chart.lunar)}${chart.lunar.leap ? " (nhuận)" : ""}`} />
                      <CenterInfo title="Năm sinh" value={chart.birthYear} />
                      <CenterInfo title="Giờ sinh" value={`Giờ ${chart.hour}`} />
                      <CenterInfo title="Giới tính" value={chart.gender === "male" ? "Nam" : "Nữ"} />
                      <CenterInfo title="Âm dương" value={chart.reversed ? "Âm nam / Dương nữ · nghịch" : "Dương nam / Âm nữ · thuận"} />
                      <CenterInfo title="Năm xem" value={`${submitted.viewYear} · ${chart.viewYear}`} />
                      <CenterInfo title="Tuổi mụ" value={`${chart.ageMu} tuổi`} />
                      <CenterInfo title="Đại hạn" value={chart.currentDaiHan === null ? "Chưa vào đại hạn" : chart.palaces[chart.currentDaiHan].house} />
                      <CenterInfo title="Thân cư" value={chart.palaces[chart.than].house} />
                      {chart.shiftedLateZi && <CenterInfo title="Ngày dùng để an số" value={dateText(chart.solar)} />}
                    </dl>
                    <p className="center-note"><Icon name="info" size={13} /> Mặc định nối từ cung Mệnh. Chạm cung khác để xem tam hợp và xung chiếu; chạm lại để trở về Mệnh.</p>
                  </section>
                </div>
              </div>
              <div className="board-foot">
                <div className="typography-legend" aria-label="Chú thích cỡ chữ sao">
                  <span className="typography-legend__main">TỬ VI</span><span>Chính tinh</span>
                  <span className="typography-legend__extra">Thiên Khôi</span><span>Phụ tinh</span>
                  <span className="typography-legend__annual">L. Thiên Mã</span><span>Sao lưu</span>
                </div>
                <div className="legend">
                  <span><i className="legend-line legend-line--tam" /> Tam hợp (2 đường)</span>
                  <span><i className="legend-line legend-line--xung" /> Xung chiếu (1 đường)</span>
                  <span><i className="legend-dot legend-dot--annual" /> Sao lưu niên</span>
                </div>
                <span className="swipe-hint">↔ Kéo ngang để xem toàn bộ lá số</span>
              </div>
            </div>
          </section>

        </>
      )}

      <footer className="site-footer">
        <div className="footer-brand"><span>✧</span> TỬ VI ĐẨU SỐ</div>
        <p>Bộ tính hỗ trợ 14 chính tinh, một số phụ tinh, Tứ Hóa (bảng Toàn Thư), Tuần/Triệt, Đại hạn, Tiểu hạn và một phần sao lưu niên. Chưa có đầy đủ phụ tinh, miếu/vượng/hãm hay luận đoán tự động. Đây là thuật số truyền thống, không phải phương pháp dự đoán có cơ sở khoa học.</p>
      </footer>
    </div>
  );
}
