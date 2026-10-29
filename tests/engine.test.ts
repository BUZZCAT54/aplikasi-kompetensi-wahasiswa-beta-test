import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  TARGETS,
  emptyAnswers,
  DEMO_ANSWERS,
  validAnswers,
} from "../src/engine.ts";

test("seluruh nilai nol tidak dinilai siap; seluruh nilai empat memenuhi semua target", () => {
  for (const target of Object.keys(TARGETS) as (keyof typeof TARGETS)[]) {
    assert.equal(evaluate(Array(18).fill(0), target).status, "Bangun fondasi");
    const complete = evaluate(Array(18).fill(4), target);
    assert.equal(complete.score, 100);
    assert.equal(complete.status, "Siap berkembang");
    assert.deepEqual(complete.priority, []);
    assert.equal(
      TARGETS[target].weights.reduce((a, b) => a + b, 0),
      100,
    );
  }
});
test("jawaban kosong, tidak lengkap, dan di luar skala ditolak", () => {
  assert.throws(() => evaluate(emptyAnswers(), "software"));
  assert.throws(() => evaluate([1, 2], "software"));
  assert.throws(() => evaluate(Array(18).fill(5), "software"));
  assert.throws(() => evaluate(Array(18).fill(-1), "software"));
  assert.throws(() => evaluate(Array(18).fill(1.5), "software"));
  assert.equal(validAnswers(new Array(18)), false);
});
test("ambang kesiapan 75 menggunakan nilai penuh", () => {
  const result = evaluate(Array(18).fill(3), "software");
  assert.equal(result.score, 75);
  assert.equal(result.status, "Siap berkembang");
  const lower = Array(18).fill(3);
  lower[0] = 2;
  assert.equal(evaluate(lower, "software").status, "Menuju siap");
  assert.equal(evaluate(Array(18).fill(2), "software").status, "Menuju siap");
});
test("indeks tinggi tidak melewati prasyarat penting yang rendah", () => {
  const answers = Array(18).fill(4);
  answers[1] = 0;
  const result = evaluate(answers, "software");
  assert.ok(result.score > 75);
  assert.equal(result.status, "Menuju siap");
  assert.deepEqual(result.blockers, [1]);
  assert.equal(result.priority[0], 0);
});
test("indeks tinggi tidak melewati batas domain utama", () => {
  const answers = Array(18).fill(4);
  answers.splice(9, 3, 2, 2, 2);
  const result = evaluate(answers, "software");
  assert.ok(result.score >= 75);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.status, "Menuju siap");
});
test("data simulasi konsisten dengan perhitungan manual dan penelusuran aturan", () => {
  const result = evaluate(DEMO_ANSWERS, "software");
  // 10/12*25 + 7/12*15 + 8/12*15 + 8/12*25 + 5/12*10 + 10/12*10.
  assert.ok(Math.abs(result.rawScore - 68.75) < 0.0001);
  assert.equal(result.trace.length, 10);
  assert.equal(result.trace.at(-1)?.conclusion, result.status);
  assert.equal(result.priority.length, 3);
});
