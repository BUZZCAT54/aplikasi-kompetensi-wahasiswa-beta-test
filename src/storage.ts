import {
  emptyAnswers,
  isTarget,
  validAnswers,
  type Answers,
  type TargetId,
} from "./engine";

export interface RecordEntry {
  id: string;
  date: string;
  target: TargetId;
  answers: Answers;
}
export interface StoredState {
  version: 1;
  answers: Answers;
  target: TargetId;
  history: RecordEntry[];
  completed: string[];
}
export const STORAGE_KEY = "titik-siap.v1";
export const freshState = (): StoredState => ({
  version: 1,
  answers: emptyAnswers(),
  target: "software",
  history: [],
  completed: [],
});

export function loadState(): { state: StoredState; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: freshState(), error: null };
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !validAnswers(data.answers) ||
      !isTarget(data.target) ||
      !Array.isArray(data.history) ||
      !Array.isArray(data.completed)
    )
      throw new Error("invalid");
    if (
      !data.history.every(
        (r: RecordEntry) =>
          typeof r?.id === "string" &&
          typeof r.date === "string" &&
          Number.isFinite(Date.parse(r.date)) &&
          isTarget(r.target) &&
          validAnswers(r.answers) &&
          !r.answers.includes(null),
      )
    )
      throw new Error("invalid-history");
    if (!data.completed.every((id: unknown) => typeof id === "string"))
      throw new Error("invalid-completed");
    return {
      state: { ...data, history: data.history.slice(0, 8) },
      error: null,
    };
  } catch {
    return {
      state: freshState(),
      error:
        "Data lokal tidak dapat dibaca. Kamu masih bisa menggunakan aplikasi. Hapus data lokal untuk memulai penyimpanan baru.",
    };
  }
}

export function saveState(state: StoredState): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return "Jawaban belum tersimpan karena penyimpanan browser tidak tersedia atau penuh. Jangan tutup halaman; unduh hasil setelah selesai.";
  }
}
