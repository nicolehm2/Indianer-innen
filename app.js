/* ============================================================
   app.js – Sons of Hoddehü – Face Transformer
   ============================================================ */

'use strict';

/* ── Band member filter definitions ─────────────────────────── */
const MEMBERS = [
  {
    id: 'hogan',
    name: 'Hogan',
    alias: '"Der Unbesiegbare"',
    role: 'Lead Guitar',
    emoji: '🎸',
    avatarClass: 'avatar-bg-1',
    filter: applyHogan,
    description: 'Hogan zerreißt die Stille mit jedem Akkord.',
  },
  {
    id: 'el-dingelong',
    name: 'El dingelong Ling Long',
    alias: '"Das Rätsel"',
    role: 'Vocals',
    emoji: '🎤',
    avatarClass: 'avatar-bg-2',
    filter: applyElDingelong,
    description: 'Seine Stimme ist so mysteriös wie sein Name.',
  },
  {
    id: 'krabbenpuhler',
    name: 'Krabbenpuhler',
    alias: '"Der Schalebrecher"',
    role: 'Bass',
    emoji: '🦀',
    avatarClass: 'avatar-bg-3',
    filter: applyKrabbenpuhler,
    description: 'Der tiefste Bass diesseits der Nordsee.',
  },
  {
    id: 'lehrwicht',
    name: 'Lehrwicht',
    alias: '"Der Weise"',
    role: 'Keyboards',
    emoji: '📚',
    avatarClass: 'avatar-bg-4',
    filter: applyLehrwicht,
    description: 'Wissen ist Macht – und Lehrwicht hat beides.',
  },
  {
    id: 'mechonicker',
    name: 'Mechonicker',
    alias: '"Der Schrauber"',
    role: 'Drums',
    emoji: '🔧',
    avatarClass: 'avatar-bg-5',
    filter: applyMechonicker,
    description: 'Sein Rhythmus läuft wie ein perfekt geöltes Getriebe.',
  },
  {
    id: 'fininiküsch',
    name: 'Fininiküsch',
    alias: '"Der Feine"',
    role: 'Rhythm Guitar',
    emoji: '✨',
    avatarClass: 'avatar-bg-6',
    filter: applyFininiküsch,
    description: 'Feinsinnig, präzise und immer einen Tick schneller als alle anderen.',
  },
  {
    id: 'fahrschueler',
    name: 'Der Fahrschüler',
    alias: '"Der Lernende"',
    role: 'Percussion',
    emoji: '🚗',
    avatarClass: 'avatar-bg-7',
    filter: applyFahrschueler,
    description: 'Noch auf der Lernkurve – aber schon jetzt kaum zu stoppen.',
  },
  {
    id: 'fette-fee',
    name: 'Die Fette Fee',
    alias: '"Die Zauberin"',
    role: 'FX & Synth',
    emoji: '🧚',
    avatarClass: 'avatar-bg-8',
    filter: applyFetteFee,
    description: 'Mit einem Wink ihres Zauberstabs verzaubert sie die ganze Bühne.',
  },
];

/* ── Canvas helpers ──────────────────────────────────────────── */

/**
 * Manipulate each pixel with a callback `fn(r,g,b,a) → [r,g,b,a]`
 */
function pixelOp(ctx, w, h, fn) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b, a] = fn(d[i], d[i + 1], d[i + 2], d[i + 3]);
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

/* Overlay a tint color with given alpha over each pixel */
function overlayTint(ctx, w, h, tr, tg, tb, alpha) {
  pixelOp(ctx, w, h, (r, g, b, a) => [
    clamp(r * (1 - alpha) + tr * alpha),
    clamp(g * (1 - alpha) + tg * alpha),
    clamp(b * (1 - alpha) + tb * alpha),
    a,
  ]);
}

/* Simple contrast / brightness tweak */
function adjustCB(ctx, w, h, contrast, brightness) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  pixelOp(ctx, w, h, (r, g, b, a) => [
    clamp(factor * (r - 128) + 128 + brightness),
    clamp(factor * (g - 128) + 128 + brightness),
    clamp(factor * (b - 128) + 128 + brightness),
    a,
  ]);
}

/* Desaturate towards grayscale */
function desaturate(ctx, w, h, amount) {
  pixelOp(ctx, w, h, (r, g, b, a) => {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return [
      clamp(r + (gray - r) * amount),
      clamp(g + (gray - g) * amount),
      clamp(b + (gray - b) * amount),
      a,
    ];
  });
}

/* Add a vignette effect via radial gradient */
function addVignette(ctx, w, h, strength = 0.55) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* Draw a glowing text label at the bottom */
function addLabel(ctx, w, h, line1, line2) {
  ctx.save();
  ctx.textAlign = 'center';

  // shadow glow
  ctx.shadowColor = '#e63946';
  ctx.shadowBlur = 18;

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(w / 14)}px "Bebas Neue", Impact, sans-serif`;
  ctx.fillText(line1, w / 2, h - 52);

  ctx.shadowColor = '#f4a261';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#f4a261';
  ctx.font = `${Math.round(w / 20)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(line2, w / 2, h - 28);

  ctx.restore();
}

/* Add horizontal scan-line texture */
function addScanlines(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();
}

/* Draw star/spark at a random position */
function drawSparks(ctx, w, h, color, count) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 2.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ── Per-member filter functions ─────────────────────────────── */

/** Hogan – "Der Unbesiegbare" – Deep purple + high contrast */
function applyHogan(ctx, w, h) {
  adjustCB(ctx, w, h, 60, -20);
  desaturate(ctx, w, h, 0.4);
  overlayTint(ctx, w, h, 100, 0, 180, 0.22);
  addVignette(ctx, w, h, 0.65);
  addScanlines(ctx, w, h);
  drawSparks(ctx, w, h, 'rgba(180,0,255,0.7)', 60);
  addLabel(ctx, w, h, 'HOGAN', '"Der Unbesiegbare" · Lead Guitar');
}

/** El dingelong Ling Long – "Das Rätsel" – Golden shimmer */
function applyElDingelong(ctx, w, h) {
  adjustCB(ctx, w, h, 50, 10);
  desaturate(ctx, w, h, 0.3);
  overlayTint(ctx, w, h, 255, 200, 0, 0.25);
  addVignette(ctx, w, h, 0.5);
  drawSparks(ctx, w, h, 'rgba(255,220,0,0.9)', 90);
  addLabel(ctx, w, h, 'EL DINGELONG LING LONG', '"Das Rätsel" · Vocals');
}

/** Krabbenpuhler – "Der Schalebrecher" – Deep sea teal */
function applyKrabbenpuhler(ctx, w, h) {
  adjustCB(ctx, w, h, 40, -10);
  desaturate(ctx, w, h, 0.5);
  overlayTint(ctx, w, h, 0, 180, 160, 0.28);
  addVignette(ctx, w, h, 0.6);
  drawSparks(ctx, w, h, 'rgba(0,220,200,0.8)', 70);
  addScanlines(ctx, w, h);
  addLabel(ctx, w, h, 'KRABBENPUHLER', '"Der Schalebrecher" · Bass');
}

/** Lehrwicht – "Der Weise" – Warm amber tones */
function applyLehrwicht(ctx, w, h) {
  adjustCB(ctx, w, h, 55, 5);
  desaturate(ctx, w, h, 0.35);
  overlayTint(ctx, w, h, 200, 120, 0, 0.22);
  addVignette(ctx, w, h, 0.55);
  drawSparks(ctx, w, h, 'rgba(255,160,0,0.7)', 50);
  addLabel(ctx, w, h, 'LEHRWICHT', '"Der Weise" · Keyboards');
}

/** Mechonicker – "Der Schrauber" – Industrial steel grey */
function applyMechonicker(ctx, w, h) {
  adjustCB(ctx, w, h, 70, -30);
  desaturate(ctx, w, h, 0.7);
  overlayTint(ctx, w, h, 120, 130, 140, 0.2);
  addVignette(ctx, w, h, 0.7);
  addScanlines(ctx, w, h);
  drawSparks(ctx, w, h, 'rgba(200,210,220,0.6)', 40);
  addLabel(ctx, w, h, 'MECHONICKER', '"Der Schrauber" · Drums');
}

/** Fininiküsch – "Der Feine" – Silver & ice blue */
function applyFininiküsch(ctx, w, h) {
  adjustCB(ctx, w, h, 45, 15);
  desaturate(ctx, w, h, 0.45);
  overlayTint(ctx, w, h, 160, 200, 255, 0.22);
  addVignette(ctx, w, h, 0.45);
  drawSparks(ctx, w, h, 'rgba(180,220,255,0.9)', 80);
  addLabel(ctx, w, h, 'FININIKÜSCH', '"Der Feine" · Rhythm Guitar');
}

/** Der Fahrschüler – "Der Lernende" – Bright orange energy */
function applyFahrschueler(ctx, w, h) {
  adjustCB(ctx, w, h, 65, 10);
  desaturate(ctx, w, h, 0.25);
  overlayTint(ctx, w, h, 255, 100, 0, 0.28);
  addVignette(ctx, w, h, 0.5);
  drawSparks(ctx, w, h, 'rgba(255,130,0,0.85)', 75);
  addScanlines(ctx, w, h);
  addLabel(ctx, w, h, 'DER FAHRSCHÜLER', '"Der Lernende" · Percussion');
}

/** Die Fette Fee – "Die Zauberin" – Magical pink & violet */
function applyFetteFee(ctx, w, h) {
  adjustCB(ctx, w, h, 80, 20);
  desaturate(ctx, w, h, 0.2);
  overlayTint(ctx, w, h, 220, 80, 200, 0.28);
  addVignette(ctx, w, h, 0.45);
  drawSparks(ctx, w, h, 'rgba(255,100,220,0.9)', 110);
  addLabel(ctx, w, h, 'DIE FETTE FEE', '"Die Zauberin" · FX & Synth');
}

/* ── DOM helpers ─────────────────────────────────────────────── */

function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ── Main init ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* Populate member cards */
  const grid = document.getElementById('membersGrid');
  const picker = document.getElementById('memberPicker');

  MEMBERS.forEach((m, idx) => {
    /* Member card */
    const card = document.createElement('article');
    card.className = 'member-card';
    card.dataset.id = m.id;
    card.innerHTML = `
      <div class="member-avatar ${m.avatarClass}" aria-hidden="true">${m.emoji}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-alias">${m.alias}</div>
        <div class="member-role">${m.role}</div>
        <p class="member-description">${m.description}</p>
      </div>`;
    grid.appendChild(card);

    /* Picker button inside transform tool */
    const btn = document.createElement('button');
    btn.className = 'pick-btn' + (idx === 0 ? ' active' : '');
    btn.dataset.id = m.id;
    btn.textContent = m.name.split(' ')[0]; // first name only
    picker.appendChild(btn);
  });

  /* ── State ─────────────────────────────────────────── */
  let originalImage = null;
  let activeMemberId = MEMBERS[0].id;

  /* ── Upload zone ───────────────────────────────────── */
  const uploadZone = document.getElementById('uploadZone');
  const fileInput  = document.getElementById('fileInput');
  const placeholder = document.getElementById('canvasPlaceholder');
  const canvas     = document.getElementById('outputCanvas');
  const resultLabel = document.getElementById('resultLabel');
  const ctx        = canvas.getContext('2d');

  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadFile(file);
    else showToast('⚠️  Bitte eine Bild-Datei hochladen.');
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
  });

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        placeholder.style.display = 'none';
        applyTransform();
        showToast('🤘 Foto geladen – Rockstar-Transformation aktiv!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ── Member picker ─────────────────────────────────── */
  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.pick-btn');
    if (!btn) return;
    document.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeMemberId = btn.dataset.id;
    if (originalImage) applyTransform();
  });

  /* ── Member cards also select filter ──────────────── */
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.member-card');
    if (!card) return;
    document.querySelectorAll('.member-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    activeMemberId = card.dataset.id;
    // sync picker
    document.querySelectorAll('.pick-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.id === activeMemberId);
    });
    if (originalImage) {
      applyTransform();
      document.getElementById('transform').scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('transform').scrollIntoView({ behavior: 'smooth' });
      showToast('🎸 Mitglied gewählt – jetzt ein Foto hochladen!');
    }
  });

  /* ── Apply transform ───────────────────────────────── */
  function applyTransform() {
    if (!originalImage) return;

    const member = MEMBERS.find(m => m.id === activeMemberId);
    if (!member) return;

    // Fit to max 600px
    const MAX = 600;
    let w = originalImage.naturalWidth;
    let h = originalImage.naturalHeight;
    if (w > MAX || h > MAX) {
      const scale = Math.min(MAX / w, MAX / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width  = w;
    canvas.height = h;

    // Draw original
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);

    // Apply member-specific filter
    member.filter(ctx, w, h);

    // Show result label
    resultLabel.textContent = `Sons of Hoddehü – ${member.name} ${member.alias}`;
    resultLabel.classList.add('visible');
  }

  /* ── Retransform button ────────────────────────────── */
  document.getElementById('transformBtn').addEventListener('click', () => {
    if (!originalImage) {
      showToast('📸 Bitte zuerst ein Foto hochladen!');
      return;
    }
    applyTransform();
    showToast('🔥 Rockstar-Look angewendet!');
  });

  /* ── Download button ───────────────────────────────── */
  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!originalImage) {
      showToast('📸 Kein Bild zum Speichern.');
      return;
    }
    const link = document.createElement('a');
    const member = MEMBERS.find(m => m.id === activeMemberId);
    link.download = `sons-of-hoddehu-${member ? member.id : 'rockstar'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Bild gespeichert!');
  });

  /* ── Smooth scroll for CTA ─────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
