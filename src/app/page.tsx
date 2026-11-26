"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BOARD_POSITIONS,
  BRANCHES,
  createTuViChart,
  relatedPalaces,
  type BirthInput,
  type Palace,
  type Star,
} from "@/lib/tuvi";
import "./chart-fit.css";

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

// Lưu dữ liệu trên trình duyệt, không cần backend và không phụ thuộc vào tài khoản.
const TUVI_STORAGE_KEY = "tuvi-nam-phai:chart-session:v1";

type StoredChartSession = {
  draft: BirthInput;
  submitted: BirthInput;
  dayText: string;
  yearText: string;
  viewYearText: string;
  selected: number | null;
  showMain: boolean;
  showExtra: boolean;
  showCycles: boolean;
  showAnnual: boolean;
  fontSize: "small" | "medium" | "large";
  mobileView: "overview" | "detail";
};

// Kiểm tra dữ liệu đọc từ localStorage trước khi khôi phục vào form.
function isBirthInput(value: unknown): value is BirthInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<BirthInput>;
  return (
    typeof input.name === "string" &&
    (input.calendar === "solar" || input.calendar === "lunar") &&
    Number.isInteger(input.day) &&
    input.day! >= 1 &&
    input.day! <= 31 &&
    Number.isInteger(input.month) &&
    input.month! >= 1 &&
    input.month! <= 12 &&
    Number.isInteger(input.year) &&
    input.year! >= 1900 &&
    input.year! <= 2100 &&
    typeof input.time === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.time) &&
    (input.gender === "male" || input.gender === "female") &&
    Number.isInteger(input.viewYear) &&
    input.viewYear! >= 1900 &&
    input.viewYear! <= 2100 &&
    (input.timeZone === undefined ||
      input.timeZone === 7 ||
      input.timeZone === 8) &&
    (input.lunarLeap === undefined || typeof input.lunarLeap === "boolean")
  );
}

/**
 * Địa chi có vị trí cố định và màu CỐ ĐỊNH đúng ảnh tham khảo.
 * Chỉ số: Tý Sửu Dần Mão Thìn Tỵ Ngọ Mùi Thân Dậu Tuất Hợi.
 * Tý/Hợi -> xanh dương; Tỵ/Ngọ -> đỏ; Thìn/Tuất/Sửu/Mùi -> vàng;
 * Dần/Mão -> xanh lá; Thân/Dậu -> xám.
 * CSS áp các màu đặc theo data-element, không tô theo tên cung Mệnh/Thân.
 */
const branchElement = [
  "thuy",
  "tho",
  "moc",
  "moc",
  "tho",
  "hoa",
  "hoa",
  "tho",
  "kim",
  "kim",
  "tho",
  "thuy",
] as const;

// Giữ nguyên chuỗi đang nhập, kể cả chuỗi rỗng hoặc số 0 ở đầu.
const numericText = (value: string, length: number) =>
  value.replace(/[^0-9]/g, "").slice(0, length);

const dateText = (d: { day: number; month: number; year: number }) =>
  `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;

type IconName =
  | "sparkles"
  | "calendar"
  | "rotate"
  | "printer"
  | "sliders"
  | "arrow"
  | "info"
  | "compass"
  | "chevron";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  let content: ReactNode;
  switch (name) {
    case "sparkles":
      content = (
        <>
          <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
          <path d="m19 17 .6 1.5L21 19l-1.4.5L19 21l-.6-1.5L17 19l1.4-.5L19 17ZM4 16l.7 1.3L6 18l-1.3.7L4 20l-.7-1.3L2 18l1.3-.7L4 16Z" />
        </>
      );
      break;
    case "calendar":
      content = (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
        </>
      );
      break;
    case "rotate":
      content = (
        <>
          <path d="M3 11a9 9 0 1 1 2.5 6.3" />
          <path d="M3 4v7h7" />
        </>
      );
      break;
    case "printer":
      content = (
        <>
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6zM18 12h.01" />
        </>
      );
      break;
    case "sliders":
      content = (
        <>
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" />
        </>
      );
      break;
    case "arrow":
      content = (
        <>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </>
      );
      break;
    case "info":
      content = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </>
      );
      break;
    case "compass":
      content = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.7 8.3-2.5 4.9-4.9 2.5 2.5-4.9 4.9-2.5Z" />
        </>
      );
      break;
    case "chevron":
      content = <path d="m9 18 6-6-6-6" />;
      break;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}

function StarGroup({
  stars,
  className = "",
}: {
  stars: Star[];
  className?: string;
}) {
  if (stars.length === 0) return null;
  return (
    <div className={`star-group ${className}`}>
      {stars.map((star) => (
        <span
          className={`star star--${star.kind}`}
          key={`${star.kind}-${star.name}`}
        >
          {star.name}
          {star.kind === "main" && star.brightness
            ? `\u00a0(${star.brightness})`
            : null}
        </span>
      ))}
    </div>
  );
}

function PalaceCell({
  palace,
  row,
  col,
  active,
  isCurrentDaiHan,
  isCurrentTieuHan,
  onSelect,
  showMain,
  showExtra,
  showCycles,
  showAnnual,
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
          {isCurrentDaiHan && (
            <span className="tag tag--current">Đại vận hiện tại</span>
          )}
          {isCurrentTieuHan && (
            <span className="tag tag--year">Tiểu vận năm xem</span>
          )}
        </div>
      )}
      <div className="palace-stars">
        {showMain && (
          <div className="palace-main-wrap" aria-label="Chính tinh">
            {palace.main.length ? (
              <StarGroup stars={palace.main} className="star-group--main" />
            ) : (
              <span className="star-empty">Vô chính diệu</span>
            )}
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
        <span>ĐẠI VẬN</span>
        <strong>
          {palace.daiHan?.from}–{palace.daiHan?.to} tuổi
        </strong>
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
type ConnectionGeometry = {
  width: number;
  height: number;
  lines: ConnectionSegment[];
};

function PalaceConnections({
  geometry,
}: {
  geometry: ConnectionGeometry | null;
}) {
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
          <line
            className="palace-connection-halo"
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
          <line
            className={`palace-connection ${line.kind === "tam-hop" ? "palace-connection--tam" : "palace-connection--xung"}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        </g>
      ))}
    </svg>
  );
}

function CenterInfo({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="center-info-item">
      <dt>{title}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function FilterOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`filter-chip ${checked ? "filter-chip--checked" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="filter-indicator" aria-hidden="true">
        {checked ? "✓" : "+"}
      </span>
      {label}
    </label>
  );
}

export default function Home() {
  const [draft, setDraft] = useState<BirthInput>(defaultInput);
  // Giu du lieu dang nhap o dang chuoi de co the xoa trang (khong tu nhay ve 0).
  // Chuyen thanh number DUY NHAT khi bam nut lap la so.
  const [dayText, setDayText] = useState(String(defaultInput.day));
  const [yearText, setYearText] = useState(String(defaultInput.year));
  const [viewYearText, setViewYearText] = useState(
    String(defaultInput.viewYear),
  );
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState<BirthInput>(defaultInput);
  // Chỉ ghi localStorage sau khi đã đọc dữ liệu cũ: không ghi đè bằng dữ liệu mẫu.
  const [storageReady, setStorageReady] = useState(false);
  // Mỗi lần lập lá số thành công (kể cả cùng dữ liệu), cuộn xuống kết quả.
  const [scrollRequest, setScrollRequest] = useState(0);
  const resultSectionRef = useRef<HTMLElement>(null);
  // null = no manual override. In this state, show the three lines from Mệnh.
  // Selecting another palace overrides Mệnh; selecting it again returns to Mệnh.
  const [selected, setSelected] = useState<number | null>(null);
  const [showMain, setShowMain] = useState(true);
  const [showExtra, setShowExtra] = useState(true);
  const [showCycles, setShowCycles] = useState(true);
  const [showAnnual, setShowAnnual] = useState(true);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  // Chỉ trên điện thoại: ưu tiên xem đủ 12 cung, nhưng cho phép chuyển sang đọc đầy đủ.
  const [mobileView, setMobileView] = useState<"overview" | "detail">(
    "overview",
  );

  // Đọc lại form và dữ liệu đã an sau khi trang được hydrate (an toàn với Next.js SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TUVI_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StoredChartSession>;
        if (isBirthInput(saved.draft)) setDraft(saved.draft);
        if (isBirthInput(saved.submitted)) {
          // Nếu phiên bản thuật toán thay đổi, bỏ qua lá số lưu không còn hợp lệ.
          try {
            createTuViChart(saved.submitted);
            setSubmitted(saved.submitted);
          } catch {
            // Giữ lá số mẫu để trang không bị lỗi.
          }
        }
        if (typeof saved.dayText === "string") {
          setDayText(numericText(saved.dayText, 2));
        }
        if (typeof saved.yearText === "string") {
          setYearText(numericText(saved.yearText, 4));
        }
        if (typeof saved.viewYearText === "string") {
          setViewYearText(numericText(saved.viewYearText, 4));
        }
        if (
          saved.selected === null ||
          (typeof saved.selected === "number" &&
            Number.isInteger(saved.selected) &&
            saved.selected >= 0 &&
            saved.selected < 12)
        ) {
          setSelected(saved.selected);
        }
        if (typeof saved.showMain === "boolean") setShowMain(saved.showMain);
        if (typeof saved.showExtra === "boolean") setShowExtra(saved.showExtra);
        if (typeof saved.showCycles === "boolean")
          setShowCycles(saved.showCycles);
        if (typeof saved.showAnnual === "boolean")
          setShowAnnual(saved.showAnnual);
        if (["small", "medium", "large"].includes(saved.fontSize ?? "")) {
          setFontSize(saved.fontSize!);
        }
        if (saved.mobileView === "overview" || saved.mobileView === "detail") {
          setMobileView(saved.mobileView);
        }
      }
    } catch {
      // Private mode / trình duyệt chặn storage: website vẫn hoạt động bình thường.
    } finally {
      setStorageReady(true);
    }
  }, []);

  // Lưu cả dữ liệu form đang gõ và lá số đã bấm an sao.
  // Không lưu scrollRequest: reload không được tự cuộn xuống lá số.
  useEffect(() => {
    if (!storageReady) return;
    const session: StoredChartSession = {
      draft,
      submitted,
      dayText,
      yearText,
      viewYearText,
      selected,
      showMain,
      showExtra,
      showCycles,
      showAnnual,
      fontSize,
      mobileView,
    };
    try {
      window.localStorage.setItem(TUVI_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // localStorage không khả dụng: không ngăn người dùng lập lá số.
    }
  }, [
    storageReady,
    draft,
    submitted,
    dayText,
    yearText,
    viewYearText,
    selected,
    showMain,
    showExtra,
    showCycles,
    showAnnual,
    fontSize,
    mobileView,
  ]);

  const result = useMemo(() => {
    try {
      return { chart: createTuViChart(submitted), error: "" };
    } catch (error) {
      return {
        chart: null,
        error: error instanceof Error ? error.message : "Không thể lập lá số.",
      };
    }
  }, [submitted]);

  const chart = result.chart;

  useEffect(() => {
    if (scrollRequest === 0 || !chart) return;

    // Đợi React cập nhật DOM của lá số trước khi cuộn.
    const frame = window.requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [scrollRequest, chart]);
  // Nếu chưa chọn thủ công, mọi thông tin và đường nối đều dựa trên cung Mệnh.
  const activeBranch = chart ? selected ?? chart.menh : null;
  const chosen =
    chart && activeBranch !== null ? chart.palaces[activeBranch] : null;
  const related = activeBranch !== null ? relatedPalaces(activeBranch) : null;
  const boardRef = useRef<HTMLDivElement>(null);
  const chartFrameRef = useRef<HTMLDivElement>(null);
  // Chỉ dùng MỘT trạng thái cho tỷ lệ thu nhỏ và chiều rộng hiển thị.
  // Tránh trường hợp hai effect đo ở hai thời điểm khác nhau khi trang mới tải.
  const [desktopLayout, setDesktopLayout] = useState<{
    scale: number;
    height: number;
    visibleWidth: number;
  } | null>(null);
  const desktopFit = useMemo(
    () =>
      desktopLayout && desktopLayout.scale < 1
        ? { scale: desktopLayout.scale, height: desktopLayout.height }
        : null,
    [desktopLayout],
  );
  const chartVisibleWidth = desktopLayout?.visibleWidth ?? null;
  const [connectionGeometry, setConnectionGeometry] =
    useState<ConnectionGeometry | null>(null);

  // Tính đồng thời độ scale và chiều rộng thực tế ngay khi DOM đã có kích thước.
  // offsetWidth/offsetHeight là kích thước GỐC, không bị CSS transform ảnh hưởng.
  useLayoutEffect(() => {
    const frame = chartFrameRef.current;
    if (!frame || !chart) {
      setDesktopLayout(null);
      return;
    }

    const desktop = window.matchMedia("screen and (min-width: 769px)");
    let rafId = 0;
    let disposed = false;

    const measureNow = () => {
      if (disposed) return;
      if (!desktop.matches) {
        setDesktopLayout((prev) => (prev === null ? prev : null));
        return;
      }

      const naturalWidth = frame.offsetWidth;
      const naturalHeight = frame.offsetHeight;
      if (!naturalWidth || !naturalHeight) return;

      const maxHeight = Math.max(1, Math.floor(window.innerHeight * 0.95));
      const rawScale = Math.min(1, maxHeight / (naturalHeight + 1));
      // Tối đa 4 chữ số thập phân để chống render lặp do sai số hình học.
      const scale =
        rawScale >= 0.9999 ? 1 : Math.round(rawScale * 10000) / 10000;
      const next = {
        scale,
        height: scale < 1 ? maxHeight : naturalHeight,
        visibleWidth: Math.round(naturalWidth * scale * 10) / 10,
      };

      setDesktopLayout((prev) =>
        prev &&
        prev.scale === next.scale &&
        prev.height === next.height &&
        prev.visibleWidth === next.visibleWidth
          ? prev
          : next,
      );
    };

    const scheduleMeasure = () => {
      if (disposed) return;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        measureNow();
      });
    };

    // useLayoutEffect chạy trước paint: căn đúng ngay lần hiển thị đầu.
    measureNow();
    // Đo lại sau paint vì CSS/font và dữ liệu localStorage có thể vừa ổn định.
    scheduleMeasure();

    // ResizeObserver phát hiện nội dung lá số thay đổi mà KHÔNG resize cửa sổ.
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasure)
        : null;
    observer?.observe(frame);
    if (boardRef.current) observer?.observe(boardRef.current);

    // Zoom, xoay màn hình, browser UI và font tải muộn đều được cập nhật.
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("pageshow", scheduleMeasure);
    desktop.addEventListener("change", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    document.fonts?.addEventListener("loadingdone", scheduleMeasure);
    void document.fonts?.ready.then(() => {
      if (!disposed) scheduleMeasure();
    });

    return () => {
      disposed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("pageshow", scheduleMeasure);
      desktop.removeEventListener("change", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      document.fonts?.removeEventListener("loadingdone", scheduleMeasure);
    };
  }, [
    chart,
    storageReady,
    fontSize,
    mobileView,
    showMain,
    showExtra,
    showCycles,
    showAnnual,
  ]);

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

      // Quy đổi tọa độ đã scale về hệ tọa độ gốc của SVG.
      // SVG sẽ tự thu nhỏ cùng chart-frame, không scale tọa độ hai lần.
      const scaleX =
        board.offsetWidth > 0 && boardBounds.width > 0
          ? boardBounds.width / board.offsetWidth
          : 1;
      const scaleY =
        board.offsetHeight > 0 && boardBounds.height > 0
          ? boardBounds.height / board.offsetHeight
          : 1;

      const getCenter = (branch: number): LinePoint | null => {
        const palace = board.querySelector<HTMLElement>(
          `[data-branch="${branch}"]`,
        );
        if (!palace) return null;
        const rect = palace.getBoundingClientRect();
        return {
          x:
            (rect.left - boardBounds.left + rect.width / 2) / scaleX -
            board.clientLeft,
          y:
            (rect.top - boardBounds.top + rect.height / 2) / scaleY -
            board.clientTop,
        };
      };

      const from = getCenter(activeBranch);
      if (!from) return;
      const related = relatedPalaces(activeBranch);
      const destinations: { branch: number; kind: ConnectionKind }[] = [
        ...related.tamHop.map((branch) => ({
          branch,
          kind: "tam-hop" as const,
        })),
        { branch: related.xung, kind: "xung-chieu" },
      ];
      const lines = destinations.flatMap(({ branch, kind }) => {
        const to = getCenter(branch);
        if (!to) return [];

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) return [];

        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        const baseTrim = Math.min(78, distance / 4);

        const trim = isMobile
          ? Math.max(0, (distance - (distance - 2 * baseTrim) * 1.3) / 2)
          : baseTrim;

        const ux = dx / distance;
        const uy = dy / distance;

        return [
          {
            branch,
            kind,

            // Mobile: cùng xuất phát từ tâm cung đang chọn
            x1: isMobile ? from.x : from.x + ux * trim,
            y1: isMobile ? from.y : from.y + uy * trim,

            // Giữ nguyên điểm đích
            x2: to.x - ux * trim,
            y2: to.y - uy * trim,
          },
        ];
      });
      setConnectionGeometry({
        width: board.clientWidth,
        height: board.clientHeight,
        lines,
      });
    };

    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (observer) {
      observer.observe(board);
      board
        .querySelectorAll<HTMLElement>(".palace")
        .forEach((palace) => observer.observe(palace));
    }
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    activeBranch,
    chart,
    fontSize,
    mobileView,
    showMain,
    showExtra,
    showCycles,
    showAnnual,
    desktopFit,
  ]);

  const selectPalace = (branch: number) => {
    setSelected((current) =>
      current === branch || branch === chart?.menh ? null : branch,
    );
  };
  const set = <K extends keyof BirthInput>(field: K, value: BirthInput[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const day = Number(dayText);
    const year = Number(yearText);
    const viewYear = Number(viewYearText);

    if (!/^[0-9]{1,2}$/.test(dayText) || day < 1 || day > 31) {
      setFormError("Ngày sinh phải nằm trong khoảng 1–31.");
      return;
    }
    if (!/^[0-9]{4}$/.test(yearText) || year < 1900 || year > 2100) {
      setFormError("Năm sinh phải gồm 4 chữ số, từ 1900 đến 2100.");
      return;
    }
    if (
      !/^[0-9]{4}$/.test(viewYearText) ||
      viewYear < 1900 ||
      viewYear > 2100
    ) {
      setFormError("Năm xem vận phải gồm 4 chữ số, từ 1900 đến 2100.");
      return;
    }
    setFormError("");
    const nextInput: BirthInput = { ...draft, day, year, viewYear };
    setDraft(nextInput);
    setSubmitted(nextInput);
    setSelected(null);
    setScrollRequest((value) => value + 1);
  };
  const resetAll = () => {
    setScrollRequest(0);
    setFormError("");
    setDayText(String(defaultInput.day));
    setYearText(String(defaultInput.year));
    setViewYearText(String(defaultInput.viewYear));
    setDraft({ ...defaultInput });
    setSubmitted({ ...defaultInput });
    setSelected(null);
    setShowMain(true);
    setShowExtra(true);
    setShowCycles(true);
    setShowAnnual(true);
    setFontSize("medium");
    setMobileView("overview");
  };

  return (
    <div
      className="app-shell app-shell--align-to-chart"
      style={
        chartVisibleWidth !== null
          ? ({
              "--chart-visible-width": `${chartVisibleWidth}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <header className="masthead">
        <div className="masthead-identity">
          <div className="brand-mark" aria-hidden="true">
            <span>紫</span>
            <span>微</span>
          </div>
          <div>
            <span className="eyebrow">TỬ VI ĐẨU SỐ · NAM PHÁI</span>
            <h1>
              Lập lá số Tử Vi <span className="heading-flourish">✧</span>
            </h1>
            <p>
              An sao Tam Hợp phái · Địa chi cố định, màu ngũ hành theo ảnh mẫu
            </p>
          </div>
        </div>
        <div className="masthead-badge">
          <Icon name="compass" size={18} />
          <span>12 địa chi cố định</span>
        </div>
      </header>

      <section className="form-panel" aria-labelledby="form-title">
        <div className="section-heading">
          <div className="section-heading__icon">
            <Icon name="calendar" size={20} />
          </div>
          <div className="section-heading__copy">
            <span className="section-index">BƯỚC 01 / NHẬP DỮ LIỆU</span>
            <h2 id="form-title">Thông tin lập lá số</h2>
            <p>Điền ngày giờ sinh và năm cần xem để lập lá số.</p>
          </div>
          <button type="button" className="ghost-button" onClick={resetAll}>
            <Icon name="rotate" size={15} /> Khôi phục mẫu
          </button>
        </div>

        <form onSubmit={submit} className="birth-form">
          <label className="field field--name">
            <span>Họ và tên</span>
            <input
              value={draft.name}
              onChange={(event) => set("name", event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label className="field field--calendar">
            <span>Loại lịch</span>
            <select
              value={draft.calendar}
              onChange={(event) => {
                setDraft((prev) => ({
                  ...prev,
                  calendar: event.target.value as BirthInput["calendar"],
                  lunarLeap: false,
                }));
              }}
            >
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <div className="field field--date">
            <span id="birth-date-label">Ngày tháng năm sinh</span>
            <div
              className="date-grid"
              role="group"
              aria-labelledby="birth-date-label"
            >
              <label className="date-part">
                <span className="sr-only">Ngày sinh</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  aria-label="Ngày sinh"
                  value={dayText}
                  onChange={(event) => {
                    setDayText(numericText(event.target.value, 2));
                    setFormError("");
                  }}
                  required
                />
                <small>Ngày</small>
              </label>
              <label className="date-part">
                <span className="sr-only">Tháng sinh</span>
                <select
                  aria-label="Tháng sinh"
                  value={draft.month}
                  onChange={(event) => set("month", Number(event.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <small>Tháng</small>
              </label>
              <label className="date-part">
                <span className="sr-only">Năm sinh</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  aria-label="Năm sinh"
                  value={yearText}
                  onChange={(event) => {
                    setYearText(numericText(event.target.value, 4));
                    setFormError("");
                  }}
                  required
                />
                <small>Năm</small>
              </label>
            </div>
          </div>
          <label className="field field--time">
            <span>
              Giờ sinh <small className="field-optional">(24 giờ)</small>
            </span>
            <input
              type="time"
              value={draft.time}
              onChange={(event) => set("time", event.target.value)}
              required
            />
          </label>

          <label className="field field--gender">
            <span>Giới tính</span>
            <select
              value={draft.gender}
              onChange={(event) =>
                set("gender", event.target.value as BirthInput["gender"])
              }
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <label className="field field--timezone">
            <span>Múi giờ an lịch</span>
            <select
              value={draft.timeZone}
              onChange={(event) =>
                set("timeZone", Number(event.target.value) as 7 | 8)
              }
            >
              <option value={7}>Việt Nam (UTC+7)</option>
              <option value={8}>UTC+8 · đối chiếu lịch sử</option>
            </select>
          </label>
          <label className="field field--view-year">
            <span>Năm xem vận</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              aria-label="Năm xem vận"
              value={viewYearText}
              onChange={(event) => {
                setViewYearText(numericText(event.target.value, 4));
                setFormError("");
              }}
              required
            />
          </label>
          <div className="form-action">
            <button type="submit" className="submit-button">
              <Icon name="sparkles" size={18} />
              <span>An sao &amp; lập lá số</span>
              <Icon name="arrow" size={17} />
            </button>
          </div>
          {draft.calendar === "lunar" && (
            <label className="leap-toggle">
              <input
                type="checkbox"
                checked={Boolean(draft.lunarLeap)}
                onChange={(event) => set("lunarLeap", event.target.checked)}
              />
              <span>Ngày sinh thuộc tháng nhuận âm lịch</span>
            </label>
          )}
        </form>
        {formError && (
          <div className="error-box" role="alert">
            <Icon name="info" size={18} />
            {formError}
          </div>
        )}
        <div className="form-note">
          <Icon name="info" size={15} />
          <span>
            Giờ Tý: 23:00–00:59. Từ 23:00 tính ngày âm kế tiếp. Với tháng nhuận,
            ngày 1–15 an như tháng chính, từ ngày 16 an theo tháng tiếp theo.
          </span>
        </div>
      </section>

      {result.error && (
        <div role="alert" className="error-box">
          <Icon name="info" size={19} />
          {result.error}
        </div>
      )}

      {chart && (
        <>
          <section
            ref={resultSectionRef}
            className="result-section"
            aria-labelledby="result-title"
          >
            <div className="result-heading">
              <div>
                <span className="section-index">BƯỚC 02 / ĐỊA BÀN TỬ VI</span>
                <h2 id="result-title">
                  Lá số <span>{chart.name}</span>
                </h2>
                <p>
                  Năm xem {submitted.viewYear} · {chart.viewYear} ·{" "}
                  {chart.ageMu} tuổi mụ
                </p>
              </div>
              <div className="result-actions">
                <span className="result-ready">
                  <span className="ready-dot" />
                  Đã an sao
                </span>
                <button
                  type="button"
                  className="print-button"
                  onClick={() => window.print()}
                >
                  <Icon name="printer" size={17} /> In lá số
                </button>
              </div>
            </div>

            <div className="view-controls">
              <div className="view-controls__title">
                <Icon name="sliders" size={17} />
                <span>Tùy chỉnh hiển thị</span>
              </div>
              <div className="filter-list">
                <FilterOption
                  label="Chính tinh"
                  checked={showMain}
                  onChange={setShowMain}
                />
                <FilterOption
                  label="Phụ tinh"
                  checked={showExtra}
                  onChange={setShowExtra}
                />
                <FilterOption
                  label="Vòng sao"
                  checked={showCycles}
                  onChange={setShowCycles}
                />
                <FilterOption
                  label={`Sao lưu ${submitted.viewYear}`}
                  checked={showAnnual}
                  onChange={setShowAnnual}
                />
              </div>
              <div
                className="font-controls"
                role="group"
                aria-label="Cỡ chữ trong lá số"
              >
                <span className="font-controls__label">Cỡ chữ</span>
                {(
                  [
                    ["small", "Nhỏ"],
                    ["medium", "Vừa"],
                    ["large", "Lớn"],
                  ] as const
                ).map(([size, label]) => (
                  <button
                    key={size}
                    type="button"
                    className={`font-button ${fontSize === size ? "font-button--active" : ""}`}
                    aria-pressed={fontSize === size}
                    onClick={() => setFontSize(size)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                className="mobile-view-switch"
                role="group"
                aria-label="Chế độ xem lá số trên điện thoại"
              >
                <span className="mobile-view-switch__label">
                  Lá số trên điện thoại
                </span>
                <div className="mobile-view-switch__buttons">
                  <button
                    type="button"
                    className={`mobile-view-button ${mobileView === "overview" ? "mobile-view-button--active" : ""}`}
                    aria-pressed={mobileView === "overview"}
                    onClick={() => setMobileView("overview")}
                  >
                    Toàn cảnh 12 cung
                  </button>
                  <button
                    type="button"
                    className={`mobile-view-button ${mobileView === "detail" ? "mobile-view-button--active" : ""}`}
                    aria-pressed={mobileView === "detail"}
                    onClick={() => setMobileView("detail")}
                  >
                    Xem chi tiết
                  </button>
                </div>
                <p className="mobile-view-note">
                  {mobileView === "overview"
                    ? "Giữ đủ 4 cột trong màn hình; tất cả các sao đang bật được xếp dọc từng dòng. Vuốt dọc để xem các hàng."
                    : "Mỗi sao một dòng, chữ lớn hơn. Vuốt ngang để xem từng cung."}
                </p>
              </div>
              <label className="mobile-palace-picker">
                <span>Chọn cung</span>
                <select
                  value={selected ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelected(
                      value === "" || Number(value) === chart.menh
                        ? null
                        : Number(value),
                    );
                  }}
                >
                  <option value="">
                    Mặc định: cung Mệnh ({BRANCHES[chart.menh]})
                  </option>
                  {chart.palaces.map((palace) => (
                    <option key={palace.branchIndex} value={palace.branchIndex}>
                      {palace.house} · {palace.branch}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              className="chart-fit"
              data-fitted={desktopFit !== null}
              style={
                desktopFit
                  ? ({
                      "--chart-fit-scale": desktopFit.scale,
                      "--chart-fit-height": `${desktopFit.height}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <div className="chart-frame" ref={chartFrameRef}>
                <div className="board-caption">
                  <div>
                    <span className="board-caption__mark">✦</span>
                    <strong>Địa bàn Tử Vi</strong>
                    <span className="board-caption__sub">
                      ĐỊA CHI CỐ ĐỊNH · NỀN MÀU NGŨ HÀNH
                    </span>
                  </div>
                  <span className="board-instruction">
                    Mặc định kẻ từ cung Mệnh; bấm cung khác để đổi đường nối{" "}
                    <Icon name="chevron" size={15} />
                  </span>
                </div>
                <div
                  className={`chart-scroll chart-scroll--${mobileView}`}
                  role="region"
                  aria-label={
                    mobileView === "overview"
                      ? "Địa bàn 12 cung, chế độ toàn cảnh trên điện thoại"
                      : "Địa bàn 12 cung, vuốt ngang trên điện thoại để đọc chi tiết"
                  }
                  tabIndex={0}
                >
                  <div
                    className="chart-grid"
                    data-font-size={fontSize}
                    data-mobile-view={mobileView}
                    ref={boardRef}
                  >
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
                        showMain={showMain}
                        showExtra={showExtra}
                        showCycles={showCycles}
                        showAnnual={showAnnual}
                      />
                    ))}
                    <PalaceConnections geometry={connectionGeometry} />
                    <section
                      className="center-panel"
                      style={{
                        gridColumn: "2 / span 2",
                        gridRow: "2 / span 2",
                      }}
                      aria-label="Thiên bàn và thông tin lá số"
                    >
                      <div className="center-ornament" aria-hidden="true">
                        <span>✦</span>
                      </div>
                      <div className="center-eyebrow">
                        TỬ VI ĐẨU SỐ · TAM HỢP NAM PHÁI
                      </div>
                      <h2>{chart.name}</h2>
                      <p className="center-subtitle">
                        THIÊN BÀN · THÔNG TIN LÁ SỐ
                      </p>
                      <div className="center-quickfacts">
                        <span>
                          <small>MỆNH</small>
                          <b>{BRANCHES[chart.menh]}</b>
                        </span>
                        <span>
                          <small>THÂN</small>
                          <b>{BRANCHES[chart.than]}</b>
                        </span>
                        <span>
                          <small>NGŨ HÀNH CỤC</small>
                          <b>{chart.cuc.label}</b>
                        </span>
                      </div>
                      <div className="center-divider">
                        <span>Thông tin chi tiết</span>
                      </div>
                      <dl className="center-info">
                        <CenterInfo
                          title="Dương lịch sinh"
                          value={dateText(chart.recordedSolar)}
                        />
                        <CenterInfo
                          title="Âm lịch sinh"
                          value={`${dateText(chart.lunar)}${chart.lunar.leap ? " (nhuận)" : ""}`}
                        />
                        <CenterInfo title="Năm sinh" value={chart.birthYear} />
                        <CenterInfo
                          title="Giờ sinh"
                          value={`Giờ ${chart.hour}`}
                        />
                        <CenterInfo
                          title="Giới tính"
                          value={chart.gender === "male" ? "Nam" : "Nữ"}
                        />
                        <CenterInfo
                          title="Âm dương"
                          value={
                            chart.reversed
                              ? "Âm nam / Dương nữ · nghịch"
                              : "Dương nam / Âm nữ · thuận"
                          }
                        />
                        <CenterInfo
                          title="Năm xem"
                          value={`${submitted.viewYear} · ${chart.viewYear}`}
                        />
                        <CenterInfo
                          title="Tuổi mụ"
                          value={`${chart.ageMu} tuổi`}
                        />
                        <CenterInfo
                          title="Đại vận"
                          value={
                            chart.currentDaiHan === null
                              ? "Chưa vào đại vận"
                              : chart.palaces[chart.currentDaiHan].house
                          }
                        />
                        <CenterInfo
                          title="Thân cư"
                          value={chart.palaces[chart.than].house}
                        />
                        {chart.shiftedLateZi && (
                          <CenterInfo
                            title="Ngày dùng để an số"
                            value={dateText(chart.solar)}
                          />
                        )}
                      </dl>
                      <p className="center-note">
                        <Icon name="info" size={13} /> Mặc định nối từ cung
                        Mệnh. Chạm cung khác để xem tam hợp và xung chiếu; chạm
                        lại để trở về Mệnh.
                      </p>
                    </section>
                  </div>
                </div>
                <div className="board-foot">
                  <div
                    className="typography-legend"
                    aria-label="Chú thích cỡ chữ sao"
                  >
                    <span className="typography-legend__main">TỬ VI</span>
                    <span>Chính tinh</span>
                    <span>M: Miếu · V: Vượng · Đ: Đắc · B: Bình · H: Hãm</span>
                    <span className="typography-legend__extra">Thiên Khôi</span>
                    <span>Phụ tinh</span>
                    <span className="typography-legend__annual">
                      L. Thiên Mã
                    </span>
                    <span>Sao lưu</span>
                  </div>
                  <div className="legend">
                    <span>
                      <i className="legend-line legend-line--tam" /> Tam hợp (2
                      đường)
                    </span>
                    <span>
                      <i className="legend-line legend-line--xung" /> Xung chiếu
                      (1 đường)
                    </span>
                    <span>
                      <i className="legend-dot legend-dot--annual" /> Sao lưu
                      niên
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Luôn giữ khung chú thích đầy đủ ở dưới, kể cả khi mobile đã hiển thị tất cả sao. */}
          {chosen && related && (
            <section
              className="detail-panel"
              aria-labelledby="detail-title"
              aria-live="polite"
            >
              <div className="detail-intro">
                <span className="section-index">CHÚ THÍCH · CUNG ĐANG XEM</span>
                <h2 id="detail-title">Cung {chosen.house}</h2>
                <span className="detail-location">
                  {chosen.stem} {chosen.branch}
                  {chosen.isThan ? " · Cung Thân" : ""}
                  {activeBranch === chart.menh ? " · Mặc định: Mệnh" : ""}
                </span>
                <p>
                  Các thông tin của cung đang xem và các cung liên hệ theo tam
                  phương tứ chính. Khi chưa chọn cung nào, phần này luôn hiển
                  thị cung Mệnh.
                </p>
                {activeBranch !== chart.menh && (
                  <button
                    className="back-to-menh"
                    type="button"
                    onClick={() => setSelected(null)}
                  >
                    Về cung Mệnh <Icon name="arrow" size={15} />
                  </button>
                )}
              </div>
              <div className="detail-content">
                <div className="detail-fact detail-fact--large">
                  <span className="detail-label">CHÍNH TINH</span>
                  <strong className="detail-main-stars">
                    {chosen.main.length
                      ? chosen.main
                          .map(
                            (star) =>
                              `${star.name}${star.brightness ? ` (${star.brightness})` : ""}`,
                          )
                          .join(" · ")
                      : "Vô chính diệu"}
                  </strong>
                </div>
                <div className="detail-fact">
                  <span className="detail-label">ĐẠI VẬN</span>
                  <strong>
                    {chosen.daiHan?.from}–{chosen.daiHan?.to} tuổi
                  </strong>
                </div>
                <div className="detail-fact detail-fact--mobile-stars">
                  <span className="detail-label">
                    DANH SÁCH SAO ĐẦY ĐỦ CỦA CUNG
                  </span>
                  {chosen.extra.length > 0 && (
                    <div className="detail-star-row">
                      <b>Phụ tinh</b>
                      <StarGroup
                        stars={chosen.extra}
                        className="star-group--detail"
                      />
                    </div>
                  )}
                  {chosen.cycles.length > 0 && (
                    <div className="detail-star-row">
                      <b>Vòng sao</b>
                      <StarGroup
                        stars={chosen.cycles}
                        className="star-group--detail"
                      />
                    </div>
                  )}
                  {chosen.annual.length > 0 && (
                    <div className="detail-star-row">
                      <b>Sao lưu</b>
                      <StarGroup
                        stars={chosen.annual}
                        className="star-group--detail"
                      />
                    </div>
                  )}
                  {chosen.extra.length === 0 &&
                    chosen.cycles.length === 0 &&
                    chosen.annual.length === 0 && (
                      <span>Không có sao bổ sung trong dữ liệu hiện tại.</span>
                    )}
                </div>
                <div className="detail-fact detail-fact--wide">
                  <span className="detail-label">TAM HỢP · 2 CUNG LIÊN HỆ</span>
                  <div className="related-links">
                    {related.tamHop.map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectPalace(idx)}
                        className="related-link related-link--tam"
                      >
                        {chart.palaces[idx].house}{" "}
                        <small>({BRANCHES[idx]})</small>
                        <Icon name="chevron" size={13} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="detail-fact detail-fact--wide">
                  <span className="detail-label">
                    XUNG CHIẾU · CUNG ĐỐI DIỆN
                  </span>
                  <div className="related-links">
                    <button
                      type="button"
                      onClick={() => selectPalace(related.xung)}
                      className="related-link related-link--xung"
                    >
                      {chart.palaces[related.xung].house}{" "}
                      <small>({BRANCHES[related.xung]})</small>
                      <Icon name="chevron" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <span>✧</span> TỬ VI ĐẨU SỐ
        </div>
        <p>
          Bộ tính hỗ trợ 14 chính tinh, một số phụ tinh, Tứ Hóa (bảng Toàn Thư),
          Tuần/Triệt, Đại vận, Tiểu vận và một phần sao lưu niên. 14 chính tinh
          có ký hiệu M/V/Đ/B/H. Đây là thuật số truyền thống.
        </p>
      </footer>
    </div>
  );
}
