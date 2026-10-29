export const DOMAINS = [
  {
    id: "programming",
    short: "Pemrograman",
    name: "Logika & pemrograman",
    code: "01",
    description:
      "Mengubah masalah menjadi program yang dapat diuji dan dipelihara.",
    activity:
      "Buat aplikasi pencatat tugas dengan validasi input dan minimal lima pengujian.",
    evidence: "Repositori dengan README, kode, dan hasil pengujian.",
    questions: [
      "Saya dapat menyusun algoritma untuk menyelesaikan masalah yang belum pernah saya temui.",
      "Saya dapat membuat program dengan struktur data, fungsi, dan penanganan kesalahan yang sesuai.",
      "Saya dapat menemukan bug dan menulis pengujian untuk mencegahnya muncul kembali.",
    ],
  },
  {
    id: "data",
    short: "Basis data",
    name: "Basis data & pengolahan data",
    code: "02",
    description:
      "Merancang penyimpanan dan memperoleh informasi yang tepat dari data.",
    activity:
      "Rancang basis data perpustakaan, lalu tulis query JOIN, agregasi, dan transaksi.",
    evidence: "ERD, skrip SQL, dan penjelasan hasil query.",
    questions: [
      "Saya dapat membuat ERD dan menjelaskan relasi serta normalisasi tabel.",
      "Saya dapat menulis query JOIN dan agregasi untuk menjawab kebutuhan informasi.",
      "Saya dapat menjaga integritas data menggunakan constraint dan transaksi.",
    ],
  },
  {
    id: "systems",
    short: "Analisis sistem",
    name: "Analisis & perancangan sistem",
    code: "03",
    description:
      "Menerjemahkan kebutuhan pengguna menjadi rancangan yang bisa dikerjakan.",
    activity:
      "Wawancarai seorang calon pengguna dan rancang alur layanan peminjaman alat.",
    evidence: "Catatan kebutuhan, diagram alur, dan kriteria penerimaan.",
    questions: [
      "Saya dapat menggali kebutuhan pengguna dan memisahkannya dari asumsi saya sendiri.",
      "Saya dapat memodelkan proses bisnis dan merancang alur sistem yang sesuai.",
      "Saya dapat menulis kriteria penerimaan untuk memverifikasi kebutuhan pengguna.",
    ],
  },
  {
    id: "engineering",
    short: "Rekayasa web",
    name: "Rekayasa perangkat lunak",
    code: "04",
    description:
      "Menghubungkan antarmuka, API, dan proses pengembangan yang teratur.",
    activity:
      "Bangun satu alur CRUD lengkap dengan API, validasi, dan penanganan kondisi gagal.",
    evidence: "Demo aplikasi dan pull request dengan penjelasan perubahan.",
    questions: [
      "Saya dapat membangun antarmuka web responsif yang terhubung ke API.",
      "Saya dapat menggunakan Git, branch, dan code review saat mengerjakan proyek.",
      "Saya dapat menjalankan aplikasi di lingkungan baru mengikuti prosedur deployment.",
    ],
  },
  {
    id: "security",
    short: "Keamanan",
    name: "Keamanan & etika digital",
    code: "05",
    description:
      "Mengenali risiko teknis dan bertanggung jawab terhadap data pengguna.",
    activity:
      "Audit aplikasi latihan: validasi input, otorisasi, dan penyimpanan rahasia.",
    evidence:
      "Daftar risiko, perbaikan, dan uji akses untuk dua peran pengguna.",
    questions: [
      "Saya dapat membedakan autentikasi dan otorisasi serta menguji pembatasan akses.",
      "Saya dapat mengenali input berbahaya dan menerapkan validasi yang sesuai.",
      "Saya dapat menentukan data pribadi yang perlu dilindungi dan menjelaskan alasan pengumpulannya.",
    ],
  },
  {
    id: "collaboration",
    short: "Kolaborasi",
    name: "Komunikasi & kolaborasi",
    code: "06",
    description:
      "Menyampaikan keputusan teknis dan bekerja dengan umpan balik.",
    activity:
      "Presentasikan proyek dalam lima menit lalu revisi dokumentasinya dari umpan balik.",
    evidence:
      "Rekaman atau catatan presentasi serta dokumentasi yang diperbarui.",
    questions: [
      "Saya dapat menjelaskan keputusan teknis kepada orang dengan latar belakang berbeda.",
      "Saya dapat membagi pekerjaan, menyampaikan kendala, dan menyepakati prioritas tim.",
      "Saya dapat memberi dan menindaklanjuti umpan balik yang spesifik terhadap pekerjaan.",
    ],
  },
] as const;

export type TargetId = "software" | "analyst" | "data";
export const TARGETS: Record<
  TargetId,
  { name: string; weights: number[]; essential: number[]; critical: number[] }
> = {
  software: {
    name: "Pengembang perangkat lunak",
    weights: [25, 15, 15, 25, 10, 10],
    essential: [0, 3],
    critical: [1, 9],
  },
  analyst: {
    name: "Analis sistem",
    weights: [10, 15, 30, 15, 10, 20],
    essential: [2, 5],
    critical: [6, 15],
  },
  data: {
    name: "Analis data",
    weights: [20, 30, 15, 10, 10, 15],
    essential: [0, 1],
    critical: [1, 4],
  },
};

export const LEVELS = [
  { value: 0, name: "Belum pernah", detail: "Belum mencoba" },
  { value: 1, name: "Dengan panduan", detail: "Perlu contoh lengkap" },
  { value: 2, name: "Mulai mandiri", detail: "Sesekali dibantu" },
  { value: 3, name: "Mandiri", detail: "Tanpa bantuan" },
  {
    value: 4,
    name: "Dapat membimbing",
    detail: "Bisa menjelaskan ke orang lain",
  },
] as const;

export type Answers = (number | null)[];
export type Readiness = "Siap berkembang" | "Menuju siap" | "Bangun fondasi";
export interface RuleTrace {
  id: string;
  premise: string;
  conclusion: string;
}
export interface Evaluation {
  score: number;
  rawScore: number;
  scores: number[];
  status: Readiness;
  target: TargetId;
  trace: RuleTrace[];
  priority: number[];
  blockers: number[];
}

export const DEMO_ANSWERS: Answers = [
  3, 3, 4, 2, 3, 2, 3, 3, 2, 3, 2, 3, 1, 2, 2, 3, 4, 3,
];
export const emptyAnswers = (): Answers => Array(18).fill(null);
export function validAnswers(value: unknown): value is Answers {
  return (
    Array.isArray(value) &&
    value.length === 18 &&
    Array.from(value).every(
      (x) =>
        x === null ||
        (typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 4),
    )
  );
}
export function isTarget(value: unknown): value is TargetId {
  return typeof value === "string" && Object.hasOwn(TARGETS, value);
}
export function band(score: number) {
  return score >= 75 ? "Kuat" : score >= 50 ? "Berkembang" : "Perlu latihan";
}

export function evaluate(answers: Answers, target: TargetId): Evaluation {
  if (!validAnswers(answers) || answers.some((x) => x === null))
    throw new Error("Lengkapi semua 18 indikator sebelum menghitung hasil.");
  if (!isTarget(target)) throw new Error("Target kompetensi tidak dikenali.");
  const values = answers as number[];
  const profile = TARGETS[target];
  const scores = DOMAINS.map(
    (_, i) =>
      (values.slice(i * 3, i * 3 + 3).reduce((a, b) => a + b, 0) / 12) * 100,
  );
  const rawScore = scores.reduce(
    (total, score, i) => total + (score * profile.weights[i]) / 100,
    0,
  );
  const blockers = profile.critical.filter((i) => values[i] < 2);
  const essentialsMet = profile.essential.every((i) => scores[i] >= 65);
  const ready = rawScore >= 75 && essentialsMet && blockers.length === 0;
  const status: Readiness = ready
    ? "Siap berkembang"
    : rawScore >= 50
      ? "Menuju siap"
      : "Bangun fondasi";
  const trace: RuleTrace[] = DOMAINS.map((domain, i) => ({
    id: `D${i + 1}`,
    premise: `${domain.short}: (${values.slice(i * 3, i * 3 + 3).join(" + ")}) / 12 × 100 = ${scores[i].toFixed(1)}`,
    conclusion: band(scores[i]),
  }));
  trace.push({
    id: "B1",
    premise: `Jumlah indeks domain × bobot ${profile.weights.join("/")}% = ${rawScore.toFixed(2)}`,
    conclusion: "Indeks kesiapan berbobot",
  });
  trace.push({
    id: "P1",
    premise: profile.essential
      .map((i) => `${DOMAINS[i].short} ${scores[i].toFixed(1)} ≥ 65`)
      .join("; "),
    conclusion: essentialsMet
      ? "Domain utama memenuhi batas"
      : "Domain utama perlu penguatan",
  });
  trace.push({
    id: "P2",
    premise: `Indikator prasyarat ${profile.critical.map((i) => `Q${i + 1} = ${values[i]}`).join("; ")}. Minimal 2.`,
    conclusion: blockers.length
      ? "Prasyarat belum terpenuhi"
      : "Prasyarat terpenuhi",
  });
  trace.push({
    id: ready ? "K1" : rawScore >= 50 ? "K2" : "K3",
    premise: ready
      ? "Indeks ≥ 75, domain utama ≥ 65, semua prasyarat ≥ 2."
      : rawScore >= 50
        ? "Indeks ≥ 50; satu atau lebih syarat K1 belum terpenuhi."
        : "Indeks < 50.",
    conclusion: status,
  });
  const priority = DOMAINS.map((_, i) => i)
    .sort((a, b) => {
      const aBlocked = blockers.some((q) => Math.floor(q / 3) === a) ? 1 : 0;
      const bBlocked = blockers.some((q) => Math.floor(q / 3) === b) ? 1 : 0;
      return (
        bBlocked - aBlocked ||
        (100 - scores[b]) * profile.weights[b] -
          (100 - scores[a]) * profile.weights[a] ||
        a - b
      );
    })
    .filter((i) => scores[i] < 100)
    .slice(0, 3);
  return {
    score: Math.round(rawScore),
    rawScore,
    scores,
    status,
    target,
    trace,
    priority,
    blockers,
  };
}
