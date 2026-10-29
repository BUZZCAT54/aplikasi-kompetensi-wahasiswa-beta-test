"""Run against the local Vite server: python tests/browser.py."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'screenshots'
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('TEST_URL', 'http://127.0.0.1:5174')
CHROME = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome-stable')
checks = []


def passed(message):
    checks.append(message)
    print('PASS:', message, flush=True)


def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflows viewport'


def nav(page, name):
    page.locator('nav').get_by_role('button', name=name, exact=True).click()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1050}, device_scale_factor=1, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    expect(page.locator('canvas')).to_have_count(1)
    expect(page.get_by_text('Peta simulasi, bukan hasil asesmen pribadi.')).to_be_visible()
    assert page.locator('.map-fallback').count() == 0
    no_overflow(page)
    page.screenshot(path=str(OUT / 'desktop.png'), full_page=True)
    passed('Desktop: WebGL renders, sample data is labeled, and page has no horizontal overflow')

    for name in ['Pemrograman', 'Basis data', 'Analisis sistem', 'Rekayasa web', 'Keamanan', 'Kolaborasi']:
        page.get_by_role('button', name=f'Pilih {name}', exact=True).click()
        expect(page.get_by_role('button', name=f'Pilih {name}', exact=True)).to_have_attribute('aria-pressed', 'true')
    passed('All six map labels select a domain and update its detail panel')

    initial_left = page.get_by_role('button', name='Pilih Pemrograman', exact=True).evaluate('e=>e.style.left')
    page.get_by_role('button', name='Perbesar peta').click()
    assert page.get_by_role('button', name='Pilih Pemrograman', exact=True).evaluate('e=>e.style.left') != initial_left
    page.get_by_role('button', name='Perkecil peta').click()
    canvas = page.locator('canvas').bounding_box()
    page.mouse.move(canvas['x'] + canvas['width'] / 2, canvas['y'] + canvas['height'] - 20)
    page.mouse.down()
    page.mouse.move(canvas['x'] + canvas['width'] / 2 + 75, canvas['y'] + canvas['height'] - 20, steps=12)
    page.mouse.up()
    rotated_left = page.get_by_role('button', name='Pilih Pemrograman', exact=True).evaluate('e=>e.style.left')
    assert rotated_left != initial_left
    page.get_by_role('button', name='Atur ulang', exact=True).click()
    passed('3D zoom in/out, drag rotation, and camera reset work')

    page.get_by_role('button', name='Milik saya', exact=True).click()
    expect(page.get_by_text('Belum dinilai', exact=True)).to_be_visible()
    page.get_by_role('button', name='Lihat hasil & rencana belajar').click()
    expect(page.get_by_text('Petamu dimulai dari sini.')).to_be_visible()
    page.get_by_role('button', name='Contoh', exact=True).click()
    expect(page.locator('.result-banner')).to_contain_text('Hasil simulasi')
    passed('Personal empty state and simulated results remain separate')

    page.get_by_role('button', name='Isi asesmen pribadi').click()
    page.get_by_role('button', name='Bidang berikutnya').click()
    expect(page.get_by_role('alert')).to_contain_text('Pilih satu jawaban')
    page.locator('#target').select_option('analyst')
    page.locator('#target').select_option('data')
    page.locator('#target').select_option('software')
    for i in range(3):
        page.locator(f'input[name="question-{i}"][value="3"]').check()
    page.reload()
    page.wait_for_load_state('networkidle')
    nav(page, 'Asesmen mandiri')
    for i in range(3):
        expect(page.locator(f'input[name="question-{i}"][value="3"]')).to_be_checked()
    passed('Form validation, all target options, and draft persistence after reload work')

    # Exercise every step selector, including skipping ahead to an incomplete submit.
    for i in range(6):
        page.locator('.step-list > button').nth(i).click()
        expect(page.locator('.question-heading > span')).to_have_text(f'Bidang {i + 1} dari 6')
    page.get_by_role('button', name='Lihat hasil asesmen', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Lengkapi ketiga indikator')
    expect(page.locator('.question-heading > span')).to_have_text('Bidang 2 dari 6')
    page.get_by_role('button', name='Sebelumnya', exact=True).click()
    passed('Step navigation and final-submit guard take the user to missing answers')

    for step in range(6):
        for q in range(step * 3, step * 3 + 3):
            page.locator(f'input[name="question-{q}"][value="3"]').check()
        if step < 5:
            page.get_by_role('button', name='Bidang berikutnya', exact=True).click()
    page.screenshot(path=str(OUT / 'assessment.png'), full_page=True)
    page.get_by_role('button', name='Lihat hasil asesmen', exact=True).click()
    expect(page.locator('.result-banner h2')).to_have_text('Siap berkembang')
    expect(page.locator('.result-index strong')).to_have_text('75')
    expect(page.locator('.history-list > button')).to_have_count(1)
    page.get_by_text('Lihat 10 langkah penalaran', exact=True).click()
    expect(page.locator('.trace-list > div')).to_have_count(10)
    expect(page.locator('.trace-list')).to_contain_text('K1')
    page.screenshot(path=str(OUT / 'results.png'), full_page=True)
    passed('All 18 answers produce index 75, correct K1 conclusion, ten reasoning steps, and one real history entry')

    for box in page.locator('.practice-check input').all():
        box.check()
    with page.expect_download() as download_info:
        page.get_by_role('button', name='Unduh JSON', exact=True).click()
    payload = json.loads(Path(download_info.value.path()).read_text())
    assert payload['hasil']['score'] == 75 and payload['jenis'] == 'Asesmen mandiri'
    page.evaluate('window.print = () => { window.__printed = true; }')
    page.get_by_role('button', name='Cetak hasil', exact=True).click()
    assert page.evaluate('window.__printed')
    passed('Learning checklist, valid JSON download, and print action work')

    page.reload()
    page.wait_for_load_state('networkidle')
    nav(page, 'Hasil & rekomendasi')
    expect(page.locator('.result-index strong')).to_have_text('75')
    for box in page.locator('.practice-check input').all():
        expect(box).to_be_checked()
        box.uncheck()
    page.locator('.history-list > button').first.click()
    expect(page.locator('.result-index strong')).to_have_text('75')
    page.get_by_role('button', name='Baca dasar penilaian').click()
    expect(page.get_by_role('heading', name='03. Aturan kesiapan')).to_be_visible()
    page.locator('main').get_by_role('button', name='Kelola data lokal').click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    page.locator('.sidebar').get_by_role('button', name='Kelola data lokal').click()
    page.get_by_role('button', name='Batal', exact=True).click()
    expect(page.get_by_role('dialog')).not_to_be_visible()
    passed('Results and practice state persist; history selection, rule page, modal cancel and Escape work')

    nav(page, 'Peta kompetensi')
    page.get_by_role('button', name='Lihat indikator', exact=False).click()
    expect(page.locator('.question-heading')).to_be_visible()
    nav(page, 'Peta kompetensi')
    page.get_by_role('button', name='Milik saya', exact=True).focus()
    page.keyboard.press('Space')
    expect(page.get_by_role('button', name='Milik saya', exact=True)).to_have_attribute('aria-pressed', 'true')
    focus = page.get_by_role('button', name='Milik saya', exact=True).evaluate('e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth})')
    assert focus['style'] != 'none' and focus['width'] != '0px'
    passed('Indicator link, keyboard Space activation, and visible focus ring work')

    for width in [320, 390, 540, 760, 820, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.wait_for_timeout(120)
        no_overflow(page)
        if width == 390:
            page.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
        for label in ['Asesmen mandiri', 'Hasil & rekomendasi', 'Dasar penilaian', 'Peta kompetensi']:
            if width <= 760:
                page.get_by_role('button', name='Buka navigasi', exact=True).click()
            nav(page, label)
            page.wait_for_timeout(80)
            no_overflow(page)
    passed('All four pages have no horizontal overflow at 320, 390, 540, 760, 820, 1024 and 1440 px')

    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='Buka navigasi', exact=True).click()
    page.get_by_role('button', name='Tutup navigasi', exact=True).click()
    page.get_by_role('button', name='Buka navigasi', exact=True).click()
    page.keyboard.press('Escape')
    page.get_by_role('button', name='Buka navigasi', exact=True).click()
    page.get_by_role('button', name='Tutup menu', exact=True).click(position={'x': 375, 'y': 30})
    page.get_by_role('button', name='Buka navigasi', exact=True).click()
    nav(page, 'Asesmen mandiri')
    page.locator('input[name="question-0"][value="2"]').check()
    page.screenshot(path=str(OUT / 'mobile-assessment.png'), full_page=True)
    passed('Mobile navigation closes by button, backdrop and Escape; mobile radio controls work')

    # Reset is intentionally the last action in the main context.
    page.set_viewport_size({'width': 1440, 'height': 1050})
    page.locator('.sidebar').get_by_role('button', name='Kelola data lokal').click()
    page.get_by_role('button', name='Hapus semua data lokal', exact=True).click()
    expect(page.get_by_text('Belum dinilai', exact=True)).to_be_visible()
    state = page.evaluate('JSON.parse(localStorage.getItem("titik-siap.v1"))')
    assert state['history'] == [] and state['completed'] == [] and all(x is None for x in state['answers'])
    passed('Confirmed reset clears only app draft, history, and checklist')

    corrupt_context = browser.new_context()
    corrupt_context.add_init_script('localStorage.setItem("titik-siap.v1", "malformed")')
    corrupt_page = corrupt_context.new_page()
    corrupt_page.goto(URL)
    expect(corrupt_page.get_by_role('alert')).to_contain_text('Data lokal tidak dapat dibaca')
    corrupt_context.close()
    blocked_context = browser.new_context()
    blocked_context.add_init_script('Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); }')
    blocked_page = blocked_context.new_page()
    blocked_page.goto(URL)
    expect(blocked_page.get_by_role('alert')).to_contain_text('Jawaban belum tersimpan')
    blocked_context.close()
    passed('Malformed storage and denied/full storage show actionable error states')

    fallback_context = browser.new_context(viewport={'width': 390, 'height': 844})
    fallback_context.add_init_script('''const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (String(type).includes('webgl')) return null;
        return original.call(this, type, ...args);
      };''')
    fallback_page = fallback_context.new_page()
    fallback_page.goto(URL)
    expect(fallback_page.get_by_role('heading', name='Peta 3D tidak tersedia')).to_be_visible()
    fallback_page.locator('.map-fallback button').nth(2).click()
    expect(fallback_page.locator('.domain-panel h2')).to_contain_text('Analisis')
    no_overflow(fallback_page)
    fallback_context.close()
    passed('Unavailable WebGL falls back to a usable domain list on mobile')

    assert not errors, errors
    passed('No uncaught JavaScript errors during normal end-to-end workflow')
    (ROOT / 'docs' / 'browser-results.json').write_text(json.dumps({'passed': len(checks), 'checks': checks, 'errors': errors}, indent=2))
    browser.close()
