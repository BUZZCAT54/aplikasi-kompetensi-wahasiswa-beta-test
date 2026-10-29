import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DOMAINS,
  TARGETS,
  LEVELS,
  DEMO_ANSWERS,
  band,
  evaluate,
  type TargetId,
  type Evaluation,
} from "./engine";
import { loadState, saveState, freshState, type RecordEntry } from "./storage";

const CompetencyMap = lazy(() => import("./CompetencyMap"));
type Page = "map" | "assessment" | "results" | "rules";
const NAV: { id: Page; title: string; icon: string }[] = [
  { id: "map", title: "Peta kompetensi", icon: "map" },
  { id: "assessment", title: "Asesmen mandiri", icon: "assessment" },
  { id: "results", title: "Hasil & rekomendasi", icon: "result" },
  { id: "rules", title: "Dasar penilaian", icon: "book" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    map: (
      <>
        <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" />
        <path d="M9 3v16M15 5v16" />
      </>
    ),
    assessment: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 3h6v4H9zM9 12h6M9 16h4" />
      </>
    ),
    result: (
      <>
        <path d="M4 3v17h17M8 15v-4M13 15V7M18 15V4" />
      </>
    ),
    book: (
      <>
        <path d="M12 5c-4-3-9-1-9-1v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1ZM12 5v15" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    circle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7v1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.circle}
    </svg>
  );
}

function EmptyResult({ onStart }: { onStart: () => void }) {
  return (
    <div className="empty-result">
      <span className="empty-index">?</span>
      <h2>Petamu dimulai dari sini.</h2>
      <p>
        Belum ada hasil pribadi. Jawab 18 indikator untuk mengenali kompetensi
        dan menentukan prioritas belajarmu.
      </p>
      <button className="primary-button" onClick={onStart}>
        Mulai asesmen <Icon name="arrow" />
      </button>
    </div>
  );
}

export default function App() {
  const [initial] = useState(loadState);
  const [stored, setStored] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [recovered, setRecovered] = useState(!initial.error);
  const [page, setPage] = useState<Page>("map");
  const [source, setSource] = useState<"demo" | "personal">(
    initial.state.history.length ? "personal" : "demo",
  );
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [validation, setValidation] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = stored.answers.filter((x) => x !== null).length;
  const currentRecord =
    stored.history.find((r) => r.id === historyId) ?? stored.history[0];
  const result = useMemo(
    () =>
      source === "demo"
        ? evaluate(DEMO_ANSWERS, stored.target)
        : currentRecord
          ? evaluate(currentRecord.answers, currentRecord.target)
          : null,
    [source, stored.target, currentRecord],
  );
  const target = result?.target ?? stored.target;

  useEffect(() => {
    if (!recovered) return;
    setStorageError(saveState(stored));
  }, [stored, recovered]);
  useEffect(
    () => () => {
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const closeMenu = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenu(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, []);

  function navigate(next: Page) {
    setPage(next);
    setMobileMenu(false);
    setValidation("");
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() =>
      content.current?.focus({ preventScroll: true }),
    );
  }
  function start(index?: number) {
    setStep(
      index ??
        Math.max(
          0,
          Math.floor(stored.answers.findIndex((x) => x === null) / 3),
        ),
    );
    navigate("assessment");
  }
  function submit() {
    const missing = stored.answers.findIndex((x) => x === null);
    if (missing !== -1) {
      setStep(Math.floor(missing / 3));
      setValidation(
        "Lengkapi ketiga indikator pada bidang ini sebelum melihat hasil.",
      );
      return;
    }
    setBusy(true);
    submitTimer.current = setTimeout(() => {
      const entry: RecordEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        target: stored.target,
        answers: [...stored.answers],
      };
      setStored((prev) => ({
        ...prev,
        history: [entry, ...prev.history].slice(0, 8),
      }));
      setHistoryId(entry.id);
      setSource("personal");
      setBusy(false);
      navigate("results");
      setNotice("Asesmen selesai. Hasil dan alasan penilaian sudah tersedia.");
    }, 220);
  }
  function nextStep() {
    if (stored.answers.slice(step * 3, step * 3 + 3).some((x) => x === null)) {
      setValidation("Pilih satu jawaban untuk setiap indikator di bidang ini.");
      return;
    }
    setValidation("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function download() {
    if (!result) return;
    const payload = {
      aplikasi: "Titik Siap",
      versiAturan: "demo-1",
      jenis:
        source === "demo" ? "SIMULASI, BUKAN HASIL PRIBADI" : "Asesmen mandiri",
      catatan:
        "Basis aturan demonstrasi, belum divalidasi pakar. Bukan sertifikasi kompetensi.",
      tanggal:
        source === "demo" ? new Date().toISOString() : currentRecord.date,
      jawaban: source === "demo" ? DEMO_ANSWERS : currentRecord.answers,
      hasil: result,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `titik-siap-${source === "demo" ? "simulasi" : "hasil"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Hasil diekspor dalam berkas JSON.");
  }
  function reset() {
    setRecovered(true);
    setStored(freshState());
    setHistoryId(null);
    setSource("personal");
    setStep(0);
    dialog.current?.close();
    navigate("map");
    setNotice("Jawaban, riwayat, dan rencana belajar lokal sudah dihapus.");
  }

  const sourceSwitch = (
    <div className="source-switch" aria-label="Sumber peta">
      <button
        className={source === "demo" ? "active" : ""}
        aria-pressed={source === "demo"}
        onClick={() => setSource("demo")}
      >
        Contoh
      </button>
      <button
        className={source === "personal" ? "active" : ""}
        aria-pressed={source === "personal"}
        onClick={() => setSource("personal")}
      >
        Milik saya
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Lewati navigasi
      </a>
      <header className="mobile-header">
        <span className="wordmark">
          titik siap<span>.</span>
        </span>
        <button
          className="icon-button"
          aria-label={mobileMenu ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={mobileMenu}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <Icon name={mobileMenu ? "close" : "menu"} />
        </button>
      </header>
      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Tutup menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        className={`sidebar ${mobileMenu ? "is-open" : ""}`}
        aria-label="Navigasi utama"
      >
        <div className="brand">
          <span className="wordmark">
            titik siap<span>.</span>
          </span>
          <span>Kenali bekal. Temukan arah.</span>
        </div>
        <div className="nav-caption">Ruang mahasiswa</div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              aria-label={item.title}
              onClick={() => navigate(item.id)}
              className={page === item.id ? "active" : ""}
              aria-current={page === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
              {item.id === "assessment" && answered > 0 && (
                <span className="nav-count">{answered}/18</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-number">01 /</span>
            <p>
              Kesiapan bukan titik akhir.
              <br />
              Ia tumbuh bersama prosesmu.
            </p>
          </div>
          <div className="program-label">
            <Icon name="book" />
            <div>
              Informatika &<br />
              Sistem Informasi
            </div>
          </div>
          <button
            className="text-button clear-data"
            onClick={() => dialog.current?.showModal()}
          >
            Kelola data lokal
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            Ruang mahasiswa <span>/</span>{" "}
            <strong>{NAV.find((n) => n.id === page)?.title}</strong>
          </div>
          <span className="local-status">
            <Icon name="check" size={15} />
            {storageError ? "Penyimpanan bermasalah" : "Penyimpanan lokal"}
          </span>
        </header>
        {storageError && (
          <div className="storage-error" role="alert">
            <p>{storageError}</p>
            <button onClick={() => dialog.current?.showModal()}>
              Kelola data
            </button>
          </div>
        )}
        <main id="main-content" ref={content} tabIndex={-1}>
          {page === "map" && (
            <>
              <section className="page-heading">
                <div>
                  <h1>
                    Setiap kemampuan,
                    <br />
                    <em>punya arah.</em>
                  </h1>
                  <p>
                    Kenali kompetensimu hari ini.
                    <br className="desktop-break" /> Tentukan langkah untuk
                    perjalanan berikutnya.
                  </p>
                </div>
                <div className="heading-action">
                  <button className="primary-button" onClick={() => start()}>
                    {answered > 0 && answered < 18
                      ? "Lanjutkan asesmen"
                      : "Mulai asesmen"}
                    <Icon name="arrow" />
                  </button>
                  <span>18 indikator · 6 bidang kompetensi</span>
                </div>
              </section>
              <section
                className="landscape-layout"
                aria-label="Jelajahi kompetensi"
              >
                <div className="landscape-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Bentang kompetensimu</h2>
                      <p>
                        {source === "demo"
                          ? "Peta simulasi, bukan hasil asesmen pribadi."
                          : result
                            ? "Berdasarkan asesmen yang kamu selesaikan."
                            : "Selesaikan asesmen untuk membentuk petamu."}
                      </p>
                    </div>
                    {sourceSwitch}
                  </div>
                  <Suspense
                    fallback={
                      <div className="map-placeholder" role="status">
                        Memuat peta kompetensi 3D…
                      </div>
                    }
                  >
                    <CompetencyMap
                      scores={result?.scores ?? null}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  </Suspense>
                  <div className="map-caption">
                    <span className="caption-line" />
                    <span>
                      Tinggi bidang menunjukkan indeks kompetensi, bukan
                      peringkat mahasiswa.
                    </span>
                  </div>
                </div>
                <aside className="domain-panel">
                  <div className="domain-panel-top">
                    <span>Bidang yang dipilih</span>
                    <span>{DOMAINS[selected].code} / 06</span>
                  </div>
                  <h2>{DOMAINS[selected].name}</h2>
                  <p>{DOMAINS[selected].description}</p>
                  <div className="domain-score">
                    <strong>
                      {result ? Math.round(result.scores[selected]) : "–"}
                    </strong>
                    <span>
                      / 100
                      <br />
                      {source === "demo" ? "indeks simulasi" : "indeks domain"}
                    </span>
                  </div>
                  <div
                    className="domain-meter"
                    role="meter"
                    aria-label={`Indeks ${DOMAINS[selected].short}`}
                    aria-valuenow={
                      result ? Math.round(result.scores[selected]) : 0
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      style={{ width: `${result?.scores[selected] ?? 0}%` }}
                    />
                  </div>
                  <span className="domain-status">
                    {result ? band(result.scores[selected]) : "Belum dinilai"}
                  </span>
                  <div className="domain-foot">
                    <span>3 indikator penilaian</span>
                    <button onClick={() => start(selected)}>
                      Lihat indikator <Icon name="arrow" size={18} />
                    </button>
                  </div>
                </aside>
              </section>
              <section className="next-section">
                <div className="next-intro">
                  <span className="section-kicker">
                    Dari mengenali ke mengembangkan
                  </span>
                  <h2>
                    Satu langkah
                    <br />
                    lebih siap.
                  </h2>
                  <p>
                    Hasil yang berguna bukan hanya angka, tetapi tahu apa yang
                    perlu dilatih.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => navigate("results")}
                  >
                    Lihat hasil & rencana belajar{" "}
                    <Icon name="arrow" size={17} />
                  </button>
                </div>
                <div className="readiness-summary">
                  <div className="summary-top">
                    <h3>
                      {source === "demo"
                        ? "Contoh ringkasan kesiapan"
                        : "Ringkasan kesiapanmu"}
                    </h3>
                    <span>
                      {source === "demo"
                        ? "Simulasi"
                        : result
                          ? "Hasil pribadi"
                          : "Belum ada asesmen"}
                    </span>
                  </div>
                  {result ? (
                    <>
                      <div className="summary-body">
                        <div className="index-number">
                          {result.score}
                          <span>/100</span>
                        </div>
                        <div>
                          <strong>{result.status}</strong>
                          <p>Target: {TARGETS[target].name}</p>
                        </div>
                      </div>
                      <div className="summary-bottom">
                        <span>
                          {result.priority.length
                            ? `Prioritas: ${DOMAINS[result.priority[0]].short}`
                            : "Seluruh indikator berada pada skala tertinggi"}
                        </span>
                        <span>Aturan dapat ditelusuri</span>
                      </div>
                    </>
                  ) : (
                    <p className="summary-empty">
                      Hasil akan muncul setelah kamu menyelesaikan asesmen.
                      Mulai dari pengalaman yang benar-benar pernah kamu
                      lakukan.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {page === "assessment" && (
            <>
              <section className="page-heading compact">
                <div>
                  <h1>
                    Mulai dari
                    <br />
                    <em>yang kamu kuasai.</em>
                  </h1>
                  <p>
                    Jawab berdasarkan pengalaman nyata, bukan yang ingin kamu
                    capai.
                  </p>
                </div>
                <div className="assessment-count">
                  <strong>
                    {answered}
                    <span>/18</span>
                  </strong>
                  <span>indikator terisi</span>
                </div>
              </section>
              <div className="assessment-layout">
                <aside className="assessment-outline">
                  <label htmlFor="target">Arah yang ingin kamu tuju</label>
                  <select
                    id="target"
                    value={stored.target}
                    onChange={(e) =>
                      setStored((s) => ({
                        ...s,
                        target: e.target.value as TargetId,
                      }))
                    }
                  >
                    {Object.entries(TARGETS).map(([id, t]) => (
                      <option key={id} value={id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="step-list">
                    {DOMAINS.map((d, i) => {
                      const complete = stored.answers
                        .slice(i * 3, i * 3 + 3)
                        .every((a) => a !== null);
                      return (
                        <button
                          key={d.id}
                          className={step === i ? "current" : ""}
                          aria-current={step === i ? "step" : undefined}
                          onClick={() => {
                            setStep(i);
                            setValidation("");
                          }}
                        >
                          <span className={complete ? "complete" : ""}>
                            {complete ? (
                              <Icon name="check" size={16} />
                            ) : (
                              d.code
                            )}
                          </span>
                          <span>{d.short}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="small-note">
                    Pilih skala 0–4. Jawaban disimpan di browser ini saat
                    penyimpanan tersedia. Kamu bisa berhenti dan melanjutkan
                    nanti.
                  </p>
                </aside>
                <section className="question-panel" aria-busy={busy}>
                  <div className="question-heading">
                    <span>Bidang {step + 1} dari 6</span>
                    <h2>{DOMAINS[step].name}</h2>
                    <p>{DOMAINS[step].description}</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (step === 5) submit();
                      else nextStep();
                    }}
                  >
                    <fieldset className="questions-fieldset" disabled={busy}>
                      <legend className="sr-only">
                        Indikator {DOMAINS[step].short}
                      </legend>
                      {DOMAINS[step].questions.map((question, i) => {
                        const index = step * 3 + i;
                        return (
                          <fieldset className="question" key={index}>
                            <legend>
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              {question}
                            </legend>
                            <div className="rating-options">
                              {LEVELS.map((level) => (
                                <label
                                  key={level.value}
                                  className={
                                    stored.answers[index] === level.value
                                      ? "checked"
                                      : ""
                                  }
                                >
                                  <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={level.value}
                                    checked={
                                      stored.answers[index] === level.value
                                    }
                                    onChange={() => {
                                      setStored((s) => ({
                                        ...s,
                                        answers: s.answers.map((a, n) =>
                                          n === index ? level.value : a,
                                        ),
                                      }));
                                      setValidation("");
                                    }}
                                  />
                                  <span className="rating-number">
                                    {level.value}
                                  </span>
                                  <span>{level.name}</span>
                                  <small>{level.detail}</small>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        );
                      })}
                    </fieldset>
                    {validation && (
                      <p className="validation" role="alert">
                        {validation}
                      </p>
                    )}
                    <div className="question-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={step === 0 || busy}
                        onClick={() => {
                          setStep((s) => s - 1);
                          setValidation("");
                        }}
                      >
                        Sebelumnya
                      </button>
                      <span>{Math.round((answered / 18) * 100)}% terisi</span>
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={busy}
                      >
                        {busy
                          ? "Menghitung hasil…"
                          : step === 5
                            ? "Lihat hasil asesmen"
                            : "Bidang berikutnya"}
                        {!busy && <Icon name="arrow" size={18} />}
                      </button>
                    </div>
                    <div className="form-progress">
                      <span style={{ width: `${(answered / 18) * 100}%` }} />
                    </div>
                  </form>
                </section>
              </div>
            </>
          )}

          {page === "results" && (
            <>
              <section className="page-heading compact">
                <div>
                  <h1>
                    Bekalmu terbaca.
                    <br />
                    <em>Langkahmu lebih terarah.</em>
                  </h1>
                  <p>
                    {source === "demo"
                      ? "Kamu sedang melihat hasil simulasi. Isi asesmen untuk mendapatkan hasil pribadi."
                      : "Hasil refleksi mandiri, beserta alasan dan langkah pengembangannya."}
                  </p>
                </div>
                <div className="results-source">
                  {sourceSwitch}
                  <button className="text-button" onClick={() => start()}>
                    Isi asesmen pribadi <Icon name="arrow" size={17} />
                  </button>
                </div>
              </section>
              {!result ? (
                <EmptyResult onStart={() => start()} />
              ) : (
                <>
                  <section className="result-banner">
                    <div>
                      <span>
                        {source === "demo"
                          ? "Hasil simulasi"
                          : `Asesmen ${new Date(currentRecord.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
                      </span>
                      <h2>{result.status}</h2>
                      <p>{TARGETS[result.target].name}</p>
                    </div>
                    <div className="result-index">
                      <strong>{result.score}</strong>
                      <span>
                        / 100
                        <br />
                        indeks kesiapan
                      </span>
                    </div>
                    <div className="result-explanation">
                      <p>
                        {result.status === "Siap berkembang"
                          ? "Indeks, bidang utama, dan prasyarat memenuhi batas contoh kesiapan. Uji kemampuanmu lewat proyek nyata."
                          : "Masih ada ruang untuk menguatkan bekalmu. Mulai dari prioritas latihan di bawah ini."}
                      </p>
                      <div>
                        <button onClick={download}>
                          <Icon name="download" size={16} />
                          Unduh JSON
                        </button>
                        <button onClick={() => window.print()}>
                          Cetak hasil
                        </button>
                      </div>
                    </div>
                  </section>
                  <p className="method-note">
                    <Icon name="circle" size={17} />
                    Indeks berasal dari jawaban mandiri dan aturan demonstrasi
                    yang belum divalidasi pakar. Ini bukan probabilitas atau
                    sertifikasi kompetensi.
                  </p>
                  <div className="results-grid">
                    <section className="score-breakdown">
                      <h2>Enam bidang, satu gambaran.</h2>
                      <p>Bandingkan kekuatan dan ruang pengembanganmu.</p>
                      {DOMAINS.map((d, i) => (
                        <div className="score-row" key={d.id}>
                          <div>
                            <span>{d.code}</span>
                            <strong>{d.short}</strong>
                            <span>{band(result.scores[i])}</span>
                            <b>{Math.round(result.scores[i])}</b>
                          </div>
                          <div className="score-track">
                            <span style={{ width: `${result.scores[i]}%` }} />
                          </div>
                        </div>
                      ))}
                    </section>
                    <section className="learning-plan">
                      <div className="plan-heading">
                        <h2>Prioritas latihan</h2>
                        <span>
                          {source === "demo"
                            ? "Rencana contoh"
                            : "Rencana pribadimu"}
                        </span>
                      </div>
                      {result.priority.length ? (
                        result.priority.map((idx, rank) => {
                          const d = DOMAINS[idx];
                          const completionId = `${source === "demo" ? "demo" : currentRecord.id}:${d.id}`;
                          return (
                            <article key={d.id} className="practice">
                              <div className="practice-heading">
                                <span>{String(rank + 1).padStart(2, "0")}</span>
                                <h3>{d.short}</h3>
                              </div>
                              <p>{d.activity}</p>
                              <small>
                                <strong>Bukti latihan:</strong> {d.evidence}
                              </small>
                              <label className="practice-check">
                                <input
                                  type="checkbox"
                                  checked={stored.completed.includes(
                                    completionId,
                                  )}
                                  onChange={(e) =>
                                    setStored((s) => ({
                                      ...s,
                                      completed: e.target.checked
                                        ? [...s.completed, completionId]
                                        : s.completed.filter(
                                            (id) => id !== completionId,
                                          ),
                                    }))
                                  }
                                />
                                Sudah saya latih
                                {source === "demo" ? " (simulasi)" : ""}
                              </label>
                            </article>
                          );
                        })
                      ) : (
                        <p>
                          Seluruh jawaban berada pada skala tertinggi. Minta
                          dosen atau mentor meninjau bukti proyekmu, lalu ambil
                          tantangan baru.
                        </p>
                      )}
                    </section>
                  </div>
                  <section className="trace-section">
                    <div className="section-title">
                      <div>
                        <h2>Mengapa hasilnya seperti ini?</h2>
                        <p>
                          Fakta jawaban diolah menjadi indeks domain, prasyarat,
                          lalu kesimpulan.
                        </p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => navigate("rules")}
                      >
                        Baca dasar penilaian <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    <details>
                      <summary>
                        Lihat {result.trace.length} langkah penalaran
                      </summary>
                      <div className="trace-list">
                        {result.trace.map((rule) => (
                          <div key={rule.id}>
                            <code>{rule.id}</code>
                            <p>{rule.premise}</p>
                            <strong>{rule.conclusion}</strong>
                          </div>
                        ))}
                      </div>
                    </details>
                  </section>
                </>
              )}
              <section className="history-section">
                <h2>Riwayat di perangkat ini</h2>
                <p>
                  Menyimpan hingga delapan asesmen terakhir. Simulasi tidak
                  masuk riwayat.
                </p>
                {stored.history.length ? (
                  <div className="history-list">
                    {stored.history.map((entry) => {
                      const r = evaluate(entry.answers, entry.target);
                      return (
                        <button
                          key={entry.id}
                          onClick={() => {
                            setHistoryId(entry.id);
                            setSource("personal");
                            window.scrollTo({ top: 0, behavior: "instant" });
                          }}
                        >
                          <span>
                            {new Date(entry.date).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <strong>{TARGETS[entry.target].name}</strong>
                          <span>{r.status}</span>
                          <b>{r.score}/100</b>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="history-empty">
                    Belum ada asesmen tersimpan. Selesaikan asesmen pertamamu
                    untuk mulai melihat riwayat.
                  </div>
                )}
              </section>
            </>
          )}

          {page === "rules" && (
            <>
              <section className="page-heading compact">
                <div>
                  <h1>
                    Hasil yang bisa
                    <br />
                    <em>kamu telusuri.</em>
                  </h1>
                  <p>
                    Kenali cara sistem membaca jawaban sebelum menggunakan
                    hasilnya.
                  </p>
                </div>
                <span className="version-label">
                  Basis aturan demo · versi 1
                </span>
              </section>
              <section className="rules-intro">
                <h2>Tentang prototipe ini</h2>
                <p>
                  Titik Siap menggunakan sistem berbasis aturan dengan alur
                  penalaran maju: fakta jawaban membentuk indeks domain, lalu
                  diperiksa terhadap prasyarat dan aturan kesiapan. Seluruh
                  pertanyaan, bobot, serta batas di sini adalah rancangan
                  demonstrasi, belum hasil elisitasi atau validasi pakar.
                </p>
                <p>
                  Gunakan hasilnya sebagai bahan refleksi. Untuk penilaian
                  akademik resmi, dosen atau pakar perlu meninjau indikator,
                  menyepakati aturan, memeriksa bukti kerja, dan menguji
                  validitasnya.
                </p>
              </section>
              <div className="rules-grid">
                <section>
                  <h2>01. Jawaban menjadi indeks</h2>
                  <p>
                    Enam domain masing-masing memiliki tiga indikator dengan
                    skala 0–4 dan bobot yang sama di dalam domain.
                  </p>
                  <div className="formula">
                    Indeks domain = jumlah skor / 12 × 100
                  </div>
                  <p>
                    Skor 0: belum pernah; 1: perlu panduan; 2: mulai mandiri; 3:
                    mandiri; 4: dapat membimbing. Tidak ada jawaban yang
                    dianggap benar otomatis.
                  </p>
                  <ul className="threshold-list">
                    <li>
                      <span>75–100</span>Kuat
                    </li>
                    <li>
                      <span>50 hingga &lt;75</span>Berkembang
                    </li>
                    <li>
                      <span>Di bawah 50</span>Perlu latihan
                    </li>
                  </ul>
                </section>
                <section>
                  <h2>02. Bobot mengikuti tujuan</h2>
                  <p>
                    Indeks akhir adalah jumlah indeks tiap domain dikalikan
                    bobot target. Total bobot setiap target adalah 100%.
                  </p>
                  <div
                    className="table-scroll"
                    tabIndex={0}
                    aria-label="Tabel bobot kompetensi"
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Bidang</th>
                          <th>Pengembang</th>
                          <th>Analis sistem</th>
                          <th>Analis data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOMAINS.map((d, i) => (
                          <tr key={d.id}>
                            <th>{d.short}</th>
                            <td>{TARGETS.software.weights[i]}%</td>
                            <td>{TARGETS.analyst.weights[i]}%</td>
                            <td>{TARGETS.data.weights[i]}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
              <section className="decision-rules">
                <h2>03. Aturan kesiapan</h2>
                <div className="rule-card">
                  <code>K1</code>
                  <div>
                    <h3>Siap berkembang</h3>
                    <p>
                      Indeks akhir ≥ 75, setiap domain utama ≥ 65, dan seluruh
                      indikator prasyarat minimal 2.
                    </p>
                  </div>
                </div>
                <div className="rule-card">
                  <code>K2</code>
                  <div>
                    <h3>Menuju siap</h3>
                    <p>
                      Indeks akhir ≥ 50, tetapi satu atau lebih syarat K1 belum
                      terpenuhi.
                    </p>
                  </div>
                </div>
                <div className="rule-card">
                  <code>K3</code>
                  <div>
                    <h3>Bangun fondasi</h3>
                    <p>
                      Indeks akhir di bawah 50. Latihan dasar perlu didahulukan.
                    </p>
                  </div>
                </div>
                <p>
                  Perbandingan menggunakan angka sebelum pembulatan; angka besar
                  pada layar dibulatkan ke bilangan bulat.
                </p>
                <h3>Domain utama & indikator prasyarat</h3>
                {Object.entries(TARGETS).map(([id, profile]) => (
                  <div className="prerequisite" key={id}>
                    <strong>{profile.name}</strong>
                    <p>
                      Domain utama:{" "}
                      {profile.essential
                        .map((i) => DOMAINS[i].short)
                        .join(" dan ")}
                      .
                    </p>
                    <ul>
                      {profile.critical.map((q) => (
                        <li key={q}>
                          Q{q + 1}:{" "}
                          {DOMAINS[Math.floor(q / 3)].questions[q % 3]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
              <section className="rules-intro">
                <h2>04. Urutan rekomendasi</h2>
                <p>
                  Domain dengan indikator prasyarat yang belum terpenuhi selalu
                  didahulukan. Domain berikutnya diurutkan berdasarkan (100 −
                  indeks domain) × bobot target, maksimum tiga domain. Jika
                  seluruh domain mencapai 100, sistem menyarankan peninjauan
                  bukti oleh mentor.
                </p>
                <h2>Data dan batas penggunaan</h2>
                <p>
                  Jawaban, riwayat, dan centang latihan disimpan di localStorage
                  browser ini. Tidak ada akun, pengiriman jawaban ke server,
                  atau sinkronisasi perangkat. Tombol kelola data lokal
                  menghapus data aplikasi ini saja. Pada perangkat bersama,
                  hapus data setelah digunakan.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => dialog.current?.showModal()}
                >
                  Kelola data lokal
                </button>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              titik siap<span className="brand-dot">.</span>{" "}
              <span className="footer-divider">/</span> Belajar dengan arah.
            </span>
            <span>Prototipe akademik · Aturan belum divalidasi pakar</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}
      <dialog
        ref={dialog}
        className="data-dialog"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title">Data di browser ini</h2>
        <p>
          Terdapat {stored.history.length} hasil asesmen dan {answered} jawaban
          draf. Menghapus data akan mengosongkan jawaban, riwayat, dan centang
          latihan Titik Siap pada browser ini.
        </p>
        <p>
          Unduh hasil dari halaman Hasil & rekomendasi jika ingin menyimpannya
          lebih dulu.
        </p>
        <div>
          <button
            className="secondary-button"
            onClick={() => dialog.current?.close()}
          >
            Batal
          </button>
          <button className="danger-button" onClick={reset}>
            Hapus semua data lokal
          </button>
        </div>
      </dialog>
    </div>
  );
}
