## 📄 MU Cover Page Generator

A professional, high-fidelity cover page generator for Metropolitan University students. Featuring real-time preview, dark mode, and high-quality PDF exports.

### Deterministic PDF (mobile + desktop same)
Client-side `html2pdf/html2canvas` can render differently on mobile (font loading, text autoscaling, viewport scaling). This project now supports **server-side PDF generation** (Puppeteer) so the downloaded PDF is **identical on mobile and desktop**.

### 🔗 Live Preview

[![Live Demo](https://img.shields.io/badge/Visit_Website-2563eb?style=for-the-badge&logo=google-chrome&logoColor=white)](https://nafiz-365.github.io/Cover-Page-Generator/)

---

## 🚀 How to use

1. Fill in your Student, Teacher, Institute, Department, Course, & Assignment/Lab Report details.
2. Toggle between **Assignment** or **Lab Report**.
3. Click **Generate PDF** for a print-ready A4 document.

### ▶️ Run locally (recommended for best PDF)

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### PDF generation

- Click **GENERATE COVER PAGE** while the server is running.
- The frontend calls `POST /api/pdf` and downloads an A4 PDF created by headless Chrome (Puppeteer).

## 🛠️ Tech Stack

- HTML5, CSS3, JavaScript (ES6)
- LocalStorage for data persistence.
