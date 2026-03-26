const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = path.resolve(__dirname, '..');

// Read default logo as base64 at startup - this is the ONLY reliable way with page.setContent()
// file:// URLs are blocked in page.setContent() context by Chromium security
let DEFAULT_LOGO_B64 = '';
try {
  const buf = require('fs').readFileSync(path.join(ROOT, 'assets', 'logo.png'));
  DEFAULT_LOGO_B64 = `data:image/png;base64,${buf.toString('base64')}`;
  console.log('[Startup] Default logo loaded, size:', DEFAULT_LOGO_B64.length);
} catch (e) {
  console.error('[Startup] Failed to load default logo:', e.message);
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(ROOT));

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCaptureAreaHtml(data) {
  const mode = data?.mode === 'lab' ? 'lab' : 'assignment';
  const modeTitle = mode === 'lab' ? 'LAB REPORT NO-' : 'ASSIGNMENT NO-';
  const onLabel = mode === 'lab' ? 'Experiment on' : 'Assignment on';

  let displayDate = data?.submissionDate || '';
  if (displayDate) {
    const d = new Date(displayDate);
    if (!isNaN(d)) {
      displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  const teacherDept = data?.teacherDept ? `Department of ${data.teacherDept}` : 'Department of ...';
  const studentDept = data?.studentDept ? `Department of ${data.studentDept}` : 'Department of ...';
  const sectionLine = data?.studentSection ? `<p class="section">Section: <span>${escapeHtml(data.studentSection)}</span></p>` : '';
  const batchLine = data?.studentBatch ? `<p class="batch">Batch: <span id="view-student-batch">${escapeHtml(data.studentBatch)}</span></p>` : '<p class="batch">Batch: <span id="view-student-batch">...</span></p>';

  let logoSrc = data?.logoDataUrl;
  if (!logoSrc || !logoSrc.startsWith('data:')) {
    logoSrc = DEFAULT_LOGO_B64;
  }

  return `
  <div id="capture-area" class="a4-page ${escapeHtml(data?.template || 'template-classic')} ${escapeHtml(data?.font || 'font-classic')}">
    <div class="preview-header">
      <!-- LOGO: src written directly, NOT through escapeHtml to avoid corrupting base64 -->
      <img src="${logoSrc}" alt="Logo" class="preview-logo">
    </div>

    <div class="preview-title">
      <h2 id="preview-mode-title">${escapeHtml(modeTitle)} <span id="view-work-no">${escapeHtml(data?.workNo || '...')}</span></h2>
      <div class="assignment-on">
        <span>${escapeHtml(onLabel)}</span>
        <div id="view-work-title">${escapeHtml(data?.workTitle || '.........................')}</div>
      </div>
    </div>

    <div class="preview-course-box">
      <div class="course-row">
        <span class="label">Course Name :</span>
        <span class="value" id="view-course-name">${escapeHtml(data?.courseName || '.........................')}</span>
      </div>
      <div class="course-row">
        <span class="label">Course Code :</span>
        <span class="value" id="view-course-code">${escapeHtml(data?.courseCode || '.........................')}</span>
      </div>
    </div>

    <div class="preview-footer">
      <div class="footer-column">
        <h3>SUBMITTED TO:</h3>
        <div class="footer-info">
          <p class="name" id="view-teacher-name">${escapeHtml(data?.teacherName || "Teacher's Name")}</p>
          <p class="designation" id="view-teacher-designation">${escapeHtml(data?.teacherDesignation || 'Designation')}</p>
          <p class="dept" id="view-teacher-dept">${escapeHtml(teacherDept)}</p>
          <p class="uni">${escapeHtml(data?.universityLine || 'Metropolitan University, Sylhet')}</p>
        </div>
      </div>
      <div class="footer-column">
        <h3>SUBMITTED BY:</h3>
        <div class="footer-info">
          <p class="name" id="view-student-name">${escapeHtml(data?.studentName || 'Student Name')}</p>
          <p class="id">ID: <span id="view-student-id">${escapeHtml(data?.studentId || '.........')}</span></p>
          ${batchLine}
          ${sectionLine}
          <p class="dept" id="view-student-dept">${escapeHtml(studentDept)}</p>
          <p class="uni">${escapeHtml(data?.universityLine || 'Metropolitan University, Sylhet')}</p>
        </div>
      </div>
    </div>

    <div class="submission-date">
      <strong>Date of Submission:</strong> <span id="view-submission-date">${escapeHtml(displayDate)}</span>
    </div>
  </div>
  `;
}

async function buildPdfHtml(data) {
  const css = await fs.readFile(path.join(ROOT, 'style.css'), 'utf8');
  const accentColor = data?.accentColor || '#4ecdc4';
  const accentRgb = data?.accentRgb || '78, 205, 196';

  // Force "desktop-like" styling: disable responsive scaling rules for PDF
  const pdfOnlyCss = `
    :root { 
      --accent-color: ${accentColor}; 
      --accent-blue: ${accentColor}; 
      --accent-rgb: ${accentRgb}; 
      --accent-glow: rgba(${accentRgb}, 0.4);
    }
    html, body { margin: 0; padding: 0; background: #fff; }
    .app-container, .sidebar, .main-header, .dashboard-footer, .toast-container { display: none !important; }
    /* Render only the capture area */
    #capture-area {
      transform: none !important;
      margin: 0 !important;
      padding: 25mm 20mm !important; /* Force exact screen padding */
      box-shadow: none !important;
      width: 210mm !important;
      height: 297mm !important;
      overflow: hidden !important;
      background: white !important;
    }

    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    
    @page { size: A4; margin: 0; }
  `;

  const captureArea = buildCaptureAreaHtml(data);

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Hind+Siliguri:wght@400;600;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;600;700&family=Roboto+Mono:wght@400;700&family=Open+Sans:wght@400;600;700&display=swap"
      rel="stylesheet">
    <style>${css}</style>
    <style>${pdfOnlyCss}</style>
  </head>
  <body>
    ${captureArea}
  </body>
  </html>`;
}

app.post('/api/pdf', async (req, res) => {
  const data = {
    ...(req.body || {}),
    baseUrl: `http://localhost:${PORT}/`,
  };
  let browser;
  try {
    const html = await buildPdfHtml(data);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Stable viewport; actual PDF size is controlled by page.pdf(format:A4)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    // Ensure fonts and images are ready before PDF
    await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    const safeName = String(data?.studentName || 'Student').replace(/[^\w\-]+/g, '_').slice(0, 40);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CoverPage_${safeName}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF_GENERATION_FAILED' });
  } finally {
    try {
      if (browser) await browser.close();
    } catch {
      // ignore
    }
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Cover Page Generator running on http://localhost:${PORT}`);
});

