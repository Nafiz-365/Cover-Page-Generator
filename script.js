document.addEventListener('DOMContentLoaded', () => {
    // Selectors - Inputs
    const inputs = {
        studentName: document.getElementById('input-student-name'),
        studentId: document.getElementById('input-student-id'),
        studentBatch: document.getElementById('input-student-batch'),
        studentSection: document.getElementById('input-student-section'),
        studentDept: document.getElementById('input-student-dept'),
        teacherName: document.getElementById('input-teacher-name'),
        teacherDesignation: document.getElementById('input-teacher-designation'),
        teacherDept: document.getElementById('input-teacher-dept'),
        workTitle: document.getElementById('input-work-title'),
        courseName: document.getElementById('input-course-name'),
        courseCode: document.getElementById('input-course-code'),
        workNo: document.getElementById('input-work-no'),
        submissionDate: document.getElementById('input-submission-date')
    };

    // Selectors - View Elements
    const views = {
        studentName: document.getElementById('view-student-name'),
        studentId: document.getElementById('view-student-id'),
        studentBatch: document.getElementById('view-student-batch'),
        studentDept: document.querySelectorAll('#view-student-dept'),
        teacherName: document.getElementById('view-teacher-name'),
        teacherDesignation: document.getElementById('view-teacher-designation'),
        teacherDept: document.getElementById('view-teacher-dept'),
        workTitle: document.getElementById('view-work-title'),
        courseName: document.getElementById('view-course-name'),
        courseCode: document.getElementById('view-course-code'),
        workNo: document.getElementById('view-work-no'),
        submissionDate: document.getElementById('view-submission-date')
    };

    // --- Pro Features: Progress & Persistence ---
    const progressBar = document.getElementById('progress-bar');
    const updateProgress = () => {
        const totalFields = Object.keys(inputs).length;
        const filledFields = Object.values(inputs).filter(input => input.value.trim() !== '').length;
        const progress = (filledFields / totalFields) * 100;
        if (progressBar) progressBar.style.width = `${progress}%`;
    };

    const saveData = () => {
        const data = {};
        Object.keys(inputs).forEach(key => {
            data[key] = inputs[key].value;
        });
        localStorage.setItem('mu_cover_data', JSON.stringify(data));
    };

    // --- Advanced Features: Themes ---
    const themeToggleInput = document.getElementById('theme-toggle-input');

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mu_theme', theme);
        if (themeToggleInput) {
            themeToggleInput.checked = (theme === 'light');
        }
    };

    themeToggleInput?.addEventListener('change', (e) => {
        setTheme(e.target.checked ? 'light' : 'dark');
    });

    // Initial Load - restore transition after first paint
    const savedTheme = localStorage.getItem('mu_theme') || 'dark';
    setTheme(savedTheme);

    const loadData = () => {
        const saved = localStorage.getItem('mu_cover_data');
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(key => {
                if (inputs[key]) {
                    inputs[key].value = data[key];
                    syncView(key, data[key]);
                }
            });
            updateProgress();
        }
    };




    // --- Advanced Features: Subject Library ---
    const presetLibrary = document.getElementById('preset-library');
    const btnSavePreset = document.getElementById('btn-save-preset');

    const renderPresets = () => {
        const presets = JSON.parse(localStorage.getItem('mu_presets') || '[]');
        if (presetLibrary) {
            presetLibrary.innerHTML = presets.map(p => `
                <div class="preset-item" data-id="${p.id}" title="Click to load: ${p.name}">
                    ${p.name}
                    <span class="delete-preset" data-id="${p.id}" title="Delete Preset">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </span>
                </div>
            `).join('');

            presetLibrary.querySelectorAll('.preset-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const deleteBtn = e.target.closest('.delete-preset');
                    if (deleteBtn) {
                        e.stopPropagation();
                        deletePreset(deleteBtn.dataset.id);
                    } else {
                        loadPreset(item.dataset.id);
                    }
                });
            });
        }
    };

    const savePreset = () => {
        if (!inputs.courseName.value) {
            showToast('Enter Course Name first');
            return;
        }
        const preset = {
            id: Date.now(),
            name: inputs.courseName.value,
            courseName: inputs.courseName.value,
            courseCode: inputs.courseCode.value,
            teacherName: inputs.teacherName.value,
            teacherDesignation: inputs.teacherDesignation.value,
            teacherDept: inputs.teacherDept.value
        };
        const presets = JSON.parse(localStorage.getItem('mu_presets') || '[]');
        presets.push(preset);
        localStorage.setItem('mu_presets', JSON.stringify(presets));
        renderPresets();
        showToast('Subject Saved to Library');
    };

    const loadPreset = (id) => {
        const presets = JSON.parse(localStorage.getItem('mu_presets') || '[]');
        const preset = presets.find(p => p.id == id);
        if (preset) {
            Object.keys(preset).forEach(key => {
                if (inputs[key]) {
                    inputs[key].value = preset[key];
                    syncView(key, preset[key]);
                }
            });
            saveData();
            updateProgress();
            showToast('Preset Loaded');
        }
    };

    const deletePreset = (id) => {
        let presets = JSON.parse(localStorage.getItem('mu_presets') || '[]');
        presets = presets.filter(p => p.id != id);
        localStorage.setItem('mu_presets', JSON.stringify(presets));
        renderPresets();
        showToast('Preset Deleted');
    };

    const selectTemplate = document.getElementById('select-template');
    const captureArea = document.getElementById('capture-area');

    const setTemplate = (template) => {
        captureArea.className = `a4-page shadow ${template}`;
        localStorage.setItem('mu_template', template);
    };

    selectTemplate?.addEventListener('change', (e) => {
        setTemplate(e.target.value);
    });

    // Load saved template
    const savedTemplate = localStorage.getItem('mu_template') || 'template-classic';
    if (selectTemplate) {
        selectTemplate.value = savedTemplate;
        setTemplate(savedTemplate);
    }

    // --- Core Logic ---
    const today = new Date().toISOString().split('T')[0];
    inputs.submissionDate.value = today;
    views.submissionDate.textContent = today;

    // Reset Form
    document.getElementById('btn-reset')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data?')) {
            Object.keys(inputs).forEach(key => {
                inputs[key].value = '';
                syncView(key, '');
            });
            inputs.submissionDate.value = today;
            syncView('submissionDate', today);
            localStorage.removeItem('mu_cover_data');
            updateProgress();
            showToast('Form Cleared');
        }
    });

    // Mode Toggle
    const btnAssignment = document.getElementById('btn-assignment');
    const btnLabReport = document.getElementById('btn-labreport');
    const modeTitle = document.getElementById('preview-mode-title');
    const assignmentOnLabel = document.querySelector('.assignment-on span');
    const workNoLabel = document.getElementById('input-work-no');

    const sidebarTitle = document.getElementById('sidebar-title');
    const workTitleInput = document.getElementById('input-work-title');

    const updateMode = (isAssignment) => {
        const page = document.getElementById('capture-area');
        page.style.opacity = '0';

        setTimeout(() => {
            if (isAssignment) {
                btnAssignment.classList.add('active');
                btnLabReport.classList.remove('active');
                modeTitle.innerHTML = `ASSIGNMENT NO- <span id="view-work-no">${inputs.workNo.value || '...'}</span>`;
                assignmentOnLabel.textContent = 'Assignment on';
                sidebarTitle.textContent = 'Assignment Details';
                workTitleInput.placeholder = 'Assignment Title/Topic';
                workNoLabel.placeholder = 'Assignment No';
            } else {
                btnLabReport.classList.add('active');
                btnAssignment.classList.remove('active');
                modeTitle.innerHTML = `LAB REPORT NO- <span id="view-work-no">${inputs.workNo.value || '...'}</span>`;
                assignmentOnLabel.textContent = 'Experiment on';
                sidebarTitle.textContent = 'Lab Report Details';
                workTitleInput.placeholder = 'Experiment Name/Topic';
                workNoLabel.placeholder = 'Experiment No';
            }
            page.style.transition = 'opacity 0.3s ease';
            page.style.opacity = '1';
        }, 150);
    };

    btnAssignment.addEventListener('click', () => updateMode(true));
    btnLabReport.addEventListener('click', () => updateMode(false));

    // Real-time Update Logic
    const syncView = (key, value) => {
        const updateElement = (el, text) => {
            if (!el) return;
            el.textContent = text;
            el.classList.remove('animate-text');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('animate-text');
        };

        if (key === 'studentDept') {
            document.querySelectorAll('#view-student-dept').forEach(el => {
                updateElement(el, `Department of ${value || '...'}`);
            });
        } else if (key === 'teacherDept') {
            updateElement(views[key], `Department of ${value || '...'}`);
        } else if (views[key]) {
            let fallback = '.........................';
            if (key === 'studentName') fallback = 'Student Name';
            else if (key === 'teacherName') fallback = "Teacher's Name";
            else if (key === 'workTitle') fallback = '.........................';

            updateElement(views[key], value || fallback);
        }
    };

    // Attach listeners
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('input', (e) => {
            syncView(key, e.target.value);
            saveData();
            updateProgress();

            // Special case for workNo because of innerHTML in updateMode
            if (key === 'workNo') {
                const viewWorkNo = document.getElementById('view-work-no');
                if (viewWorkNo) viewWorkNo.textContent = e.target.value || '...';
            }
        });
    });

    // Initialize
    loadData();

    // Toast System
    const showToast = (message) => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#2563eb"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Download PDF (Renamed to Generate)
    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            const element = document.getElementById('capture-area');
            const originalContent = btnGenerate.innerHTML;

            btnGenerate.disabled = true;
            btnGenerate.style.opacity = '0.7';
            btnGenerate.textContent = 'GENERATING...';

            // Options for high-quality single page A4 PDF
            const opt = {
                margin: 0,
                filename: `MU_CoverPage_${inputs.studentName.value || 'Student'}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    letterRendering: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    // Use onclone to style the captured version perfectly
                    onclone: (clonedDoc) => {
                        const clonedEl = clonedDoc.getElementById('capture-area');
                        clonedEl.style.boxShadow = 'none';
                        clonedEl.style.margin = '0';
                        clonedEl.style.padding = '25mm 20mm'; // Symmetrical margins
                        clonedEl.style.width = '210mm';
                        clonedEl.style.height = '297mm';
                        clonedEl.style.position = 'fixed';
                        clonedEl.style.top = '0';
                        clonedEl.style.left = '0';
                        clonedEl.style.transform = 'none';

                        // Clear body completely
                        clonedDoc.body.style.margin = '0';
                        clonedDoc.body.style.padding = '0';
                        clonedDoc.body.style.overflow = 'hidden';
                    }
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Capture and save
            html2pdf().set(opt).from(element).save().then(() => {
                btnGenerate.disabled = false;
                btnGenerate.style.opacity = '1';
                btnGenerate.innerHTML = originalContent;
                showToast('Cover Page Generated Successfully!');

                // Celebration!
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#2563eb', '#1e3a8a', '#ffffff']
                });
            }).catch(err => {
                console.error('PDF Generation Error:', err);
                btnGenerate.disabled = false;
                btnGenerate.style.opacity = '1';
                btnGenerate.innerHTML = originalContent;
            });
        });
    }

    // --- PWA: Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('SW Registered');
            }).catch(err => {
                console.log('SW Registration failed', err);
            });
        });
    }

    // Final Init
    btnSavePreset?.addEventListener('click', savePreset);
    renderPresets();
});
