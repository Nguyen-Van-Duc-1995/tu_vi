"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  BOARD_POSITIONS, BRANCHES, createTuViChart, relatedPalaces,
  type BirthInput, type Palace, type Star,
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

const branchElement = ["thuy", "tho", "moc", "moc", "tho", "hoa", "hoa", "tho", "kim", "kim", "tho", "thuy"] as const;

const dateText = (d: { day: number; month: number; year: number }) =>
  `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;

function StarGroup({ stars, className = "" }: { stars: Star[]; className?: string }) {
  if (!stars.length) return null;
  return (
    <div className={`star-group ${className}`}>
      {stars.map((star) => (
        <span className={`star star--${star.kind}`} key={`${star.kind}-${star.name}`}>{star.name}</span>
      ))}
    </div>
  );
}

function PalaceCell({
  palace, row, col, active, related, opposite, isCurrentDaiHan, isCurrentTieuHan,
  onSelect, showMain, showExtra, showCycles, showAnnual,
}: {
  palace: Palace;
  row: number;
  col: number;
  active: boolean;
  related: boolean;
  opposite: boolean;
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
      className={`palace ${active ? "palace--selected" : ""} ${related ? "palace--related" : ""} ${opposite ? "palace--opposite" : ""}`}
      style={style}
      data-element={branchElement[palace.branchIndex]}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`${palace.stem} ${palace.branch}, cung ${palace.house}`}
    >
      <div className="palace-heading">
        <div className="palace-heading__branch">{palace.stem} {palace.branch}</div>
        <div className="palace-heading__house">
          {palace.house}{palace.isThan && <b className="tag tag--than">Thân</b>}
        </div>
      </div>
      {(palace.tuan || palace.triet || isCurrentDaiHan || isCurrentTieuHan) && (
        <div className="palace-tags">
          {palace.tuan && <span className="tag tag--void">Tuần</span>}
          {palace.triet && <span className="tag tag--void">Triệt</span>}
          {isCurrentDaiHan && <span className="tag tag--current">Đại hạn năm xem</span>}
          {isCurrentTieuHan && <span className="tag tag--year">Tiểu hạn năm xem</span>}
        </div>
      )}
      {showMain && <StarGroup stars={palace.main} className="star-group--main" />}
      {showExtra && <StarGroup stars={palace.extra} />}
      {showCycles && <StarGroup stars={palace.cycles} />}
      {showAnnual && <StarGroup stars={palace.annual} className="star-group--annual" />}
      <div className="palace-footer">Đại hạn: {palace.daiHan?.from}–{palace.daiHan?.to} tuổi</div>
    </section>
  );
}

export default function Home() {
  const [draft, setDraft] = useState<BirthInput>(defaultInput);
  const [submitted, setSubmitted] = useState<BirthInput>(defaultInput);
  const [selected, setSelected] = useState<number>(2);
  const [showMain, setShowMain] = useState(true);
  const [showExtra, setShowExtra] = useState(true);
  const [showCycles, setShowCycles] = useState(false);
  const [showAnnual, setShowAnnual] = useState(true);

  const result = useMemo(() => {
    try {
      return { chart: createTuViChart(submitted), error: "" };
    } catch (error) {
      return { chart: null, error: error instanceof Error ? error.message : "Không thể lập lá số." };
    }
  }, [submitted]);
  const chart = result.chart;
  const rel = relatedPalaces(selected);
  const set = <K extends keyof BirthInput>(field: K, value: BirthInput[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted({ ...draft });
  };
  const chosen = chart?.palaces[selected];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">TỬ VI ĐẨU SỐ · TAM HỢP NAM PHÁI</span>
          <h1>An sao Tử Vi</h1>
          <p>12 cung địa chi cố định · Tính cung chức và tinh đẩu theo ngày giờ sinh</p>
        </div>
        <div className="topbar-mark" aria-hidden>紫<br />微</div>
      </header>

      <section className="form-panel" aria-label="Thông tin sinh">
        <h2>Thông tin lập lá số</h2>
        <form onSubmit={submit} className="birth-form">
          <label className="field field--name">
            <span>Họ tên</span>
            <input value={draft.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Loại lịch</span>
            <select value={draft.calendar} onChange={(e) => {
              setDraft((p) => ({ ...p, calendar: e.target.value as BirthInput["calendar"], lunarLeap: false }));
            }}>
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <label className="field field--small">
            <span>Ngày</span>
            <input type="number" min={1} max={31} value={draft.day} onChange={(e) => set("day", Number(e.target.value))} required />
          </label>
          <label className="field field--small">
            <span>Tháng</span>
            <select value={draft.month} onChange={(e) => set("month", Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option value={m} key={m}>{m}</option>)}
            </select>
          </label>
          <label className="field field--year">
            <span>Năm sinh</span>
            <input type="number" min={1900} max={2100} value={draft.year} onChange={(e) => set("year", Number(e.target.value))} required />
          </label>
          {draft.calendar === "lunar" && (
            <label className="field field--checkbox">
              <input type="checkbox" checked={Boolean(draft.lunarLeap)} onChange={(e) => set("lunarLeap", e.target.checked)} />
              <span>Tháng nhuận</span>
            </label>
          )}
          <label className="field">
            <span>Giờ sinh</span>
            <input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} required />
          </label>
          <label className="field">
            <span>Giới tính</span>
            <select value={draft.gender} onChange={(e) => set("gender", e.target.value as BirthInput["gender"])}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <label className="field">
            <span>Múi giờ lịch</span>
            <select value={draft.timeZone} onChange={(e) => set("timeZone", Number(e.target.value) as 7 | 8)}>
              <option value="7">Việt Nam UTC+7</option>
              <option value="8">UTC+8 (đối chiếu trước 1968)</option>
            </select>
          </label>
          <label className="field field--year">
            <span>Năm xem hạn</span>
            <input type="number" min={1900} max={2100} value={draft.viewYear} onChange={(e) => set("viewYear", Number(e.target.value))} required />
          </label>
          <button type="submit" className="submit-button">An sao &amp; lập lá số</button>
        </form>
        <p className="form-hint">Quy ước: giờ Tý 23:00–00:59; từ 23:00 tính sang ngày âm kế tiếp. Tháng nhuận: ngày 1–15 tính như tháng chính, ngày 16 trở đi tính tháng tiếp theo khi an Mệnh/Thân.</p>
      </section>

      {result.error && <div role="alert" className="error-box">{result.error}</div>}

      {chart && (
        <>
          <div className="toolbar">
            <h2>Lá số {chart.name}</h2>
            <div className="toggles">
              <label><input type="checkbox" checked={showMain} onChange={(e) => setShowMain(e.target.checked)} /> Chính tinh</label>
              <label><input type="checkbox" checked={showExtra} onChange={(e) => setShowExtra(e.target.checked)} /> Phụ tinh</label>
              <label><input type="checkbox" checked={showCycles} onChange={(e) => setShowCycles(e.target.checked)} /> Vòng sao</label>
              <label><input type="checkbox" checked={showAnnual} onChange={(e) => setShowAnnual(e.target.checked)} /> Sao lưu {submitted.viewYear}</label>
            </div>
          </div>

          <div className="chart-scroll" aria-label="Địa bàn 12 cung Tử Vi có thể cuộn ngang trên màn hình nhỏ">
            <div className="chart-grid">
              {BOARD_POSITIONS.map(({ branch, row, col }) => (
                <PalaceCell
                  key={branch}
                  palace={chart.palaces[branch]}
                  row={row}
                  col={col}
                  active={branch === selected}
                  related={rel.tamHop.includes(branch)}
                  opposite={rel.xung === branch}
                  isCurrentDaiHan={chart.currentDaiHan === branch}
                  isCurrentTieuHan={chart.currentTieuHan === branch}
                  onSelect={() => setSelected(branch)}
                  showMain={showMain} showExtra={showExtra} showCycles={showCycles} showAnnual={showAnnual}
                />
              ))}
              <section className="center-panel" style={{ gridColumn: "2 / span 2", gridRow: "2 / span 2" }}>
                <div className="center-seal">紫 微 斗 數</div>
                <h2>{chart.name}</h2>
                <p className="center-subtitle">Lá số Tử Vi Nam phái</p>
                <div className="center-info">
                  <div><span>Dương lịch sinh</span><strong>{dateText(chart.recordedSolar)}</strong></div>
                  <div><span>Âm lịch</span><strong>{dateText(chart.lunar)}{chart.lunar.leap ? " (nhuận)" : ""}</strong></div>
                  <div><span>Năm sinh</span><strong>{chart.birthYear}</strong></div>
                  <div><span>Giờ sinh</span><strong>{chart.hour}</strong></div>
                  <div><span>Giới tính</span><strong>{chart.gender === "male" ? "Nam" : "Nữ"}</strong></div>
                  <div><span>Âm dương</span><strong>{chart.reversed ? "Âm nam / Dương nữ · nghịch" : "Dương nam / Âm nữ · thuận"}</strong></div>
                  <div><span>Cục</span><strong>{chart.cuc.label}</strong></div>
                  <div><span>Mệnh</span><strong>{BRANCHES[chart.menh]}</strong></div>
                  <div><span>Thân</span><strong>{BRANCHES[chart.than]}</strong></div>
                  <div><span>Năm xem</span><strong>{submitted.viewYear} · {chart.viewYear}</strong></div>
                  <div><span>Tuổi mụ</span><strong>{chart.ageMu}</strong></div>
                  <div><span>Đại hạn</span><strong>{chart.currentDaiHan === null ? "Chưa vào đại hạn" : chart.palaces[chart.currentDaiHan].house}</strong></div>
                  {chart.shiftedLateZi && <div><span>Ngày dùng để an số (giờ Tý)</span><strong>{dateText(chart.solar)}</strong></div>}
                </div>
                <div className="center-note">Bấm vào một cung ở viền để xem tam hợp và xung chiếu.</div>
              </section>
            </div>
          </div>

          <div className="legend">
            <span><i className="legend-dot legend-dot--selected" /> Cung đang chọn</span>
            <span><i className="legend-dot legend-dot--tam" /> Tam hợp</span>
            <span><i className="legend-dot legend-dot--xung" /> Xung chiếu</span>
            <span><i className="legend-dot legend-dot--annual" /> Sao lưu niên</span>
          </div>

          {chosen && (
            <section className="detail-panel">
              <h2>Đang xét: Cung {chosen.house} tại {chosen.stem} {chosen.branch}</h2>
              <p>
                Tam hợp: <strong>{rel.tamHop.map((idx) => `${chart.palaces[idx].house} (${BRANCHES[idx]})`).join(" · ")}</strong>.
                {" "}Xung chiếu: <strong>{chart.palaces[rel.xung].house} ({BRANCHES[rel.xung]})</strong>.
              </p>
              <p>Chính tinh: {chosen.main.length ? chosen.main.map((s) => s.name).join(", ") : "Vô chính diệu"}. Đại hạn {chosen.daiHan?.from}–{chosen.daiHan?.to} tuổi.</p>
            </section>
          )}
        </>
      )}

      <footer className="site-footer">
        Bộ tính hiện hỗ trợ 14 chính tinh, một số nhóm phụ tinh, Tứ Hóa theo bảng Toàn Thư, Tuần/Triệt, Đại hạn, Tiểu hạn và một tập sao lưu niên. Chưa có đầy đủ mọi phụ tinh, miếu/vượng/hãm và luận đoán tự động. Đây là hệ thống thuật số truyền thống, không phải phương pháp dự đoán có cơ sở khoa học.
      </footer>
    </div>
  );
}
