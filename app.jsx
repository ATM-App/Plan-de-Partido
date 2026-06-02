import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, User, Settings, Sun, Moon, 
  Download, Plus, ChevronDown, CheckCircle2, AlertCircle, Goal, Edit2, X, Upload,
  Home, Users, CalendarDays, Swords, BarChart2, Database, Key, MapPin, RotateCcw, Activity,
  GitCompare, ArrowRight, ArrowLeft, LogOut, CloudRain, Target, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc 
} from 'firebase/firestore';

// --- CONFIGURACIÓN FIREBASE ---
// Usamos el entorno de Canvas si está disponible, si no, usa la configuración proporcionada para producción.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyCz-XarDGeQeZShD6wbc8DjmcohVITQAac",
  authDomain: "plan-de-partido.firebaseapp.com",
  databaseURL: "https://plan-de-partido-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "plan-de-partido",
  storageBucket: "plan-de-partido.firebasestorage.app",
  messagingSenderId: "514353053562",
  appId: "1:514353053562:web:e65c39215727a2b55420c3"
};

const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'plan-de-partido';

// --- DATOS DE PRUEBA INICIALES ---
const DUMMY_GOALKEEPER = {
  id: 'gk-oblak',
  name: 'Jan Oblak',
  number: 13,
  team: 'Primer Equipo',
  league: 'LaLiga EA Sports',
  group: 'Primera División',
  photoUrl: 'https://cdn.resfu.com/img_data/jugadores/medium/68290.jpg?size=250x&lossy=1',
  birthYear: 1993,
  age: 31,
  nationality: 'Eslovenia',
  height: '1.88 m',
  foot: 'Derecho',
  hand: 'Derecha',
  contract: '30 JUN 2028',
  form: 8.2,
  lastMatches: ['W', 'W', 'D', 'W', 'W'],
  stats: { minutes: 2970, starts: 33, subs: 0, goalsConceded: 24, cleanSheets: 16, savePercentage: 76.3, xGPrevented: 7.1, penaltiesSaved: 2, penaltiesFaced: 4, teamMatches: 38, calledUpMatches: 38, playedMatches: 33, teamMinutes: 3420 },
  skills: [
    { subject: 'Reflejos', A: 92, fullMark: 100 }, { subject: 'Juego Aéreo', A: 88, fullMark: 100 },
    { subject: '1 vs 1', A: 85, fullMark: 100 }, { subject: 'Distribución', A: 75, fullMark: 100 }, { subject: 'Anticipación', A: 80, fullMark: 100 },
  ],
  performanceData: [
    { match: 1, saves: 3, goals: 0 }, { match: 5, saves: 4, goals: 1 }, { match: 10, saves: 2, goals: 0 }, { match: 15, saves: 5, goals: 2 },
    { match: 20, saves: 4, goals: 0 }, { match: 25, saves: 3, goals: 1 }, { match: 30, saves: 6, goals: 0 }, { match: 35, saves: 3, goals: 0 },
  ],
  technicalDecision: {
    title: 'Recomendado: Titular',
    reason: 'Mejor estado de forma y rendimiento superior a la media del equipo.'
  },
  matchPlan: {
    defensive: 'Cerrar espacios en bloque bajo, fuerte en el 1vs1.',
    offensive: 'Salida rápida por bandas, buscar a los carrileros.',
    tactical: 'Mantener la línea adelantada coordinado con la defensa.',
    keyAspects: 'Sonreír, disfrutar y transmitir máxima seguridad.'
  },
  assignedTo: 'all'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const useImageUploader = (onBase64Ready) => {
  return (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        onBase64Ready(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
};

// ==========================================
// SISTEMA PDF ENTERPRISE PREMIUM
// ==========================================
const loadJsPDF = async () => {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => resolve(window.jspdf);
    script.onerror = () => reject(new Error("Error al cargar la librería jsPDF"));
    document.head.appendChild(script);
  });
};

const loadIconB64 = async (iconName, color) => {
  const paths = {
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    swords: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>',
    gitCompare: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
    goal: '<path d="M12 13V2l8 4-8 4"/><path d="M20.55 10.23A9 9 0 1 1 8 4.94"/><path d="M8 10a5 5 0 1 0 8.9 2.02"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  };
  const svgStr = paths[iconName] || '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgStr}</svg>`;
  
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};

const generateDonutBase64 = (percent, colorHex, darkMode) => {
  const canvas = document.createElement('canvas');
  canvas.width = 120; canvas.height = 120;
  const ctx = canvas.getContext('2d');
  const cx = 60, cy = 60, r = 48;
  
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0'; 
  ctx.lineWidth = 14; 
  ctx.stroke();
  
  if (percent > 0) {
    ctx.beginPath();
    const endAngle = (percent / 100) * 2 * Math.PI - (0.5 * Math.PI);
    ctx.arc(cx, cy, r, -0.5 * Math.PI, endAngle);
    ctx.strokeStyle = colorHex; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
  }
  
  ctx.fillStyle = darkMode ? '#ffffff' : '#0f172a'; 
  ctx.font = 'bold 30px Helvetica';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${percent}%`, cx, cy + 2);
  return canvas.toDataURL('image/png');
};

const loadCustomFonts = async (doc) => {
  const fontUrls = {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
    bolditalic: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-blackitalic-webfont.ttf'
  };
  
  for (const [weight, url] of Object.entries(fontUrls)) {
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = window.btoa(binary);
      doc.addFileToVFS(`Roboto-${weight}.ttf`, base64);
      doc.addFont(`Roboto-${weight}.ttf`, "Roboto", weight);
    } catch(e) { 
      console.warn("Error cargando fuente personalizada", e); 
    }
  }
};

const loadGkPhotoBase64 = async (url, fallbackName, darkMode) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = 400; const height = 480;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      const imgRatio = img.width / img.height;
      const targetRatio = width / height;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      
      if (imgRatio > targetRatio) {
        sWidth = img.height * targetRatio; sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / targetRatio; sy = (img.height - sHeight) * 0.15; 
      }
      
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
      
      const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    const bgColor = darkMode ? '0f172a' : 'f8fafc';
    img.src = url || `https://api.dicebear.com/7.x/initials/png?seed=${fallbackName}&backgroundColor=${bgColor}`;
  });
};

const exportarPDFVectorial = async (gk, matches, rivals, activeSeason, showNotification, darkMode) => {
  try {
    showNotification("Generando Reporte Premium con Fotografía y Gráficos...", "success");
    const jspdfModule = await loadJsPDF();
    const JsPDFClass = jspdfModule.jsPDF;
    
    const doc = new JsPDFClass({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    await loadCustomFonts(doc);

    const loadImgToB64 = (url) => new Promise(resolve => {
      if(!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

    const p = darkMode ? {
      bg: [15, 23, 42], card: [30, 41, 59], cardAlt: [2, 6, 23], textMain: [255, 255, 255], textMuted: [148, 163, 184], line: [51, 65, 85], watermark: [41, 52, 69], accentRedBg: [127, 29, 29], accentRedBorder: [153, 27, 27], accentRedTitle: [254, 202, 202], accentRedText1: [255, 255, 255], accentRedText2: [254, 226, 226]
    } : {
      bg: [248, 250, 252], card: [255, 255, 255], cardAlt: [241, 245, 249], textMain: [15, 23, 42], textMuted: [100, 116, 139], line: [226, 232, 240], watermark: [241, 245, 249], accentRedBg: [255, 255, 255], accentRedBorder: [254, 202, 202], accentRedTitle: [220, 38, 38], accentRedText1: [15, 23, 42], accentRedText2: [71, 85, 105]
    };

    const teamMatches = gk.stats?.teamMatches || Math.max(matches.length, (gk.stats?.starts || 0) + (gk.stats?.subs || 0));
    const teamMinutes = gk.stats?.teamMinutes || teamMatches * 90;
    const playedMatches = gk.stats?.playedMatches || ((gk.stats?.starts || 0) + (gk.stats?.subs || 0));
    
    const minsPercent = teamMinutes > 0 ? Math.round(((gk.stats?.minutes || 0) / teamMinutes) * 100) : 0;
    const startsPercent = teamMatches > 0 ? Math.round(((gk.stats?.starts || 0) / teamMatches) * 100) : 0;
    const subsPercent = teamMatches > 0 ? Math.round(((gk.stats?.subs || 0) / teamMatches) * 100) : 0;
    const goalsPercent = playedMatches > 0 ? Math.min(100, Math.round(((gk.stats?.goalsConceded || 0) / Math.max(1, playedMatches)) * 50)) : 0;
    const cleanSheetsPercent = playedMatches > 0 ? Math.round(((gk.stats?.cleanSheets || 0) / playedMatches) * 100) : 0;
    const penaltiesPercent = (gk.stats?.penaltiesFaced || 0) > 0 ? Math.round(((gk.stats?.penaltiesSaved || 0) / Math.max(1, gk.stats.penaltiesFaced)) * 100) : 0;

    const gkMatchesForPdf = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextMatchPdf = gkMatchesForPdf.length > 0 ? gkMatchesForPdf[0] : null;
    const rivalPdf = nextMatchPdf ? rivals.find(r => r.id === nextMatchPdf.rivalId) : null;

    const statsUrl = `https://www.atleticodemadrid.com/jugadores/${gk.name.toLowerCase().replace(/\s+/g, '-')}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(statsUrl)}&color=0b132b&margin=10`;

    const iconActColor = darkMode ? '#ffffff' : '#0f172a';
    const [photoB64, iTarget, iShield, iSwords, iGit, iGoal, iCalendar, iPin, iActivity, rivalShieldB64, qrB64] = await Promise.all([
      loadGkPhotoBase64(gk.photoUrl, gk.name, darkMode),
      loadIconB64('target', '#3b82f6'), loadIconB64('shield', '#ef4444'), loadIconB64('swords', '#10b981'),
      loadIconB64('gitCompare', '#3b82f6'), loadIconB64('goal', '#eab308'), loadIconB64('calendar', '#3b82f6'),
      loadIconB64('mapPin', '#ef4444'), loadIconB64('activity', iconActColor),
      loadImgToB64(rivalPdf?.shieldUrl),
      loadImgToB64(qrApiUrl)
    ]);

    const pageWidth = 297; const pageHeight = 210;
    const drawBackground = () => { doc.setFillColor(...p.bg); doc.rect(0, 0, pageWidth, pageHeight, 'F'); };

    const drawHeader = () => {
      doc.setTextColor(...p.textMain); doc.setFont("Roboto", "bolditalic");
      doc.setFontSize(26); if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.8);
      doc.text("ATLETI PLAN PARTIDO", 15, 22); if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);
      doc.setFontSize(10); doc.setFont("Roboto", "bold"); doc.setTextColor(...p.textMuted);
      doc.text("DEPARTAMENTO DE PORTEROS • ATLÉTICO DE MADRID", 15, 29);
      doc.setFillColor(220, 38, 38); doc.roundedRect(pageWidth - 65, 14, 50, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("Roboto", "bold");
      doc.text(`Temp. ${activeSeason}`, pageWidth - 40, 21, { align: 'center' });
      doc.setDrawColor(...p.line); doc.setLineWidth(0.5); doc.line(15, 36, pageWidth - 15, 36);
    };

    // --- PAGE 1 ---
    doc.setFillColor(11, 19, 43); doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(20, 30, 60); doc.setFontSize(250); doc.setFont("Roboto", "bolditalic");
    doc.text(String(gk.number || ''), pageWidth / 2 + 70, 160, { align: 'center' });

    if (qrB64) {
      doc.setFillColor(255, 255, 255); doc.roundedRect(pageWidth - 38, 14, 23, 23, 2, 2, 'F');
      doc.addImage(qrB64, 'PNG', pageWidth - 36.5, 15.5, 20, 20);
    }

    const leftCX = 74;
    if (nextMatchPdf) {
      doc.setFillColor(255, 255, 255); doc.roundedRect(leftCX - 60, 35, 120, 8, 4, 4, 'F');
      doc.setTextColor(11, 19, 43); doc.setFontSize(8.5); doc.setFont("Roboto", "bold");
      doc.text(`${nextMatchPdf.league || 'LIGA'} • ${nextMatchPdf.group || 'GRUPO'} • JORNADA ${nextMatchPdf.matchday || '-'}`.toUpperCase(), leftCX, 40.5, { align: 'center' });
      doc.setTextColor(239, 68, 68); doc.setFontSize(12); doc.setFont("Roboto", "bold");
      if (iPin) doc.addImage(iPin, 'PNG', leftCX - doc.getTextWidth(nextMatchPdf.field || 'CAMPO POR DEFINIR')/2 - 10, 48.5, 6, 6);
      doc.text((nextMatchPdf.field || 'CAMPO POR DEFINIR').toUpperCase(), leftCX, 53, { align: 'center' });
      doc.setTextColor(255, 255, 255); doc.setFontSize(13);
      doc.text(formatDate(nextMatchPdf.date), leftCX, 61, { align: 'center' });

      const shieldY = 90;
      if (iShield) doc.addImage(iShield, 'PNG', leftCX - 40 - 15, shieldY, 32, 32);
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("Roboto", "bold");
      doc.text("ATLETI", leftCX - 25, shieldY + 42, { align: 'center' });

      doc.setFillColor(255, 255, 255); doc.roundedRect(leftCX - 20, shieldY + 6, 40, 16, 6, 6, 'F');
      doc.setTextColor(11, 19, 43); doc.setFontSize(22); doc.setFont("Roboto", "bolditalic");
      doc.text(nextMatchPdf.time || '--:--', leftCX, shieldY + 18, { align: 'center' });
      
      doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont("Roboto", "bold");
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2);
      doc.text("HORA", leftCX, shieldY + 33, { align: 'center' });
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

      if (rivalShieldB64) doc.addImage(rivalShieldB64, 'PNG', leftCX + 10 + 15, shieldY, 32, 32);
      else if (iSwords) doc.addImage(iSwords, 'PNG', leftCX + 10 + 15, shieldY, 32, 32);
      
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("Roboto", "bold");
      doc.text((rivalPdf?.name || 'RIVAL').toUpperCase(), leftCX + 25, shieldY + 42, { align: 'center', maxWidth: 45 });

      const statsY = 168;
      doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text("GOLES RIVAL", leftCX - 35, statsY, {align: 'center'});
      doc.setFillColor(255, 255, 255); doc.roundedRect(leftCX - 50, statsY + 4, 30, 14, 7, 7, 'F'); 
      doc.setTextColor(239, 68, 68); doc.setFontSize(24); doc.setFont("Roboto", "bolditalic");
      doc.text(String(nextMatchPdf.goalsScored || rivalPdf?.goalsScored || '0'), leftCX - 35, statsY + 15, {align: 'center'});

      doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text("RACHA RIVAL", leftCX + 35, statsY, {align: 'center'});
      if (nextMatchPdf.streak && nextMatchPdf.streak.length > 0) {
          let stX = leftCX + 35 - ((nextMatchPdf.streak.length * 12) / 2) + 6;
          nextMatchPdf.streak.forEach(res => {
              if (res === 'V') doc.setFillColor(16, 185, 129); else if (res === 'E') doc.setFillColor(59, 130, 246); else doc.setFillColor(239, 68, 68);
              doc.circle(stX, statsY + 11, 5, 'F'); doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("Roboto", "bold");
              doc.text(res, stX, statsY + 11, {align: 'center', baseline: 'middle'}); stX += 12;
          });
      } else {
          doc.setTextColor(100, 116, 139); doc.setFontSize(14); doc.text("--", leftCX + 35, statsY + 11, {align: 'center'});
      }
    } else {
        doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("Roboto", "bold"); doc.text("SIN PARTIDO PROGRAMADO", leftCX, 100, { align: 'center' });
    }

    if(typeof doc.setGState === 'function') {
        doc.setDrawColor(255, 255, 255); doc.setGState(new doc.GState({opacity: 0.1}));
        doc.line(148.5, 20, 148.5, pageHeight - 20); doc.setGState(new doc.GState({opacity: 1}));
    }

    const rightCX = 222;
    const polW = 65; const polH = 85; const polX = rightCX - polW/2; const polY = 35;
    doc.setFillColor(255, 255, 255); doc.roundedRect(polX, polY, polW, polH, 2, 2, 'F');
    if (photoB64) doc.addImage(photoB64, 'PNG', polX + 3, polY + 3, polW - 6, polH - 18);
    
    doc.setTextColor(11, 19, 43); doc.setFontSize(6); doc.setFont("Roboto", "bold"); doc.text(gk.team.toUpperCase(), polX + 3, polY + polH - 9);
    doc.setFontSize(9); doc.text(`${gk.number} - ${gk.name.toUpperCase()}`, polX + 3, polY + polH - 3);

    doc.setTextColor(212, 175, 55); doc.setFontSize(10); doc.setFont("Roboto", "bold");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2); doc.text("PLAN DE PARTIDO", rightCX, polY + polH + 18, { align: 'center' });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    doc.setTextColor(255, 255, 255); doc.setFontSize(26); doc.setFont("Roboto", "bolditalic"); doc.text(`${gk.number} - ${gk.name.toUpperCase()}`, rightCX, polY + polH + 32, { align: 'center' });

    doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont("Roboto", "bold");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2); doc.text("DEPARTAMENTO DE PORTEROS", pageWidth / 2, pageHeight - 12, { align: 'center' });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    // --- PAGE 2 ---
    doc.addPage(); drawBackground(); drawHeader();
    doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, 45, 85, 150, 4, 4, 'FD');
    doc.setTextColor(...p.watermark); doc.setFont("Roboto", "bolditalic"); doc.setFontSize(140); doc.text(String(gk.number || ''), 80, 160, { align: 'right', angle: 0 });
    if (photoB64) doc.addImage(photoB64, 'PNG', 15, 45, 85, 102);
    
    doc.setTextColor(...p.textMain); doc.setFontSize(26); doc.setFont("Roboto", "bolditalic");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.5); doc.text(gk.name.toUpperCase(), 57, 137, { align: 'center', maxWidth: 80 });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);
    doc.setTextColor(239, 68, 68); doc.setFontSize(10); doc.setFont("Roboto", "bold"); doc.text(`#${gk.number || '-'} | ${gk.team.toUpperCase()}`, 57, 144, { align: 'center' });

    let py = 158;
    const addProfileRow = (label, val) => {
      doc.setTextColor(...p.textMuted); doc.setFont("Roboto", "bold"); doc.setFontSize(9); doc.text(label.toUpperCase(), 22, py);
      doc.setTextColor(...p.textMain); doc.text(String(val).toUpperCase(), 93, py, { align: 'right' });
      doc.setDrawColor(...p.line); doc.setLineWidth(0.2); doc.line(22, py + 3, 93, py + 3); py += 11;
    };
    addProfileRow("Nacionalidad", gk.nationality || '--'); addProfileRow("Edad", `${gk.age || '--'} años`); addProfileRow("Pie Domin.", gk.foot || '--');

    doc.setFillColor(...p.cardAlt); doc.setDrawColor(...p.line); doc.roundedRect(22, 175, 71, 15, 2, 2, 'FD');
    if (iActivity) doc.addImage(iActivity, 'PNG', 26, 178, 9, 9);
    doc.setTextColor(...p.textMuted); doc.setFontSize(7); doc.setFont("Roboto", "bold"); doc.text("FORMA ACTUAL", 38, 184);
    doc.setTextColor(16, 185, 129); doc.setFontSize(16); doc.text(String(gk.form || '5.0'), 88, 185, { align: 'right' });

    const rightX = 108;
    doc.setTextColor(...p.textMain); doc.setFontSize(12); doc.setFont("Roboto", "bold"); doc.text("ESTADÍSTICAS GLOBALES TEMPORADA", rightX, 50);

    let statY = 56;
    const drawStatBox = (px, py, title, val, subtitle, colorHex, percent) => {
      doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(px, py, 54, 30, 3, 3, 'FD');
      doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(title.toUpperCase(), px + 5, py + 8);
      doc.setTextColor(...p.textMain); doc.setFontSize(18); doc.text(String(val), px + 5, py + 19);
      doc.setTextColor(...p.textMuted); doc.setFontSize(7); doc.setFont("Roboto", "normal"); doc.text(subtitle, px + 5, py + 26);
      const donutB64 = generateDonutBase64(percent, colorHex, darkMode); doc.addImage(donutB64, 'PNG', px + 33, py + 10, 17, 17);
    };

    drawStatBox(rightX, statY, "Minutos Jugados", gk.stats?.minutes || 0, "min. jugados totales", "#3b82f6", minsPercent);
    drawStatBox(rightX + 59, statY, "Titularidades", gk.stats?.starts || 0, `${gk.stats?.starts || 0} de ${teamMatches} partidos`, "#8b5cf6", startsPercent);
    drawStatBox(rightX + 118, statY, "Suplencias", gk.stats?.subs || 0, `${gk.stats?.subs || 0} de ${teamMatches} partidos`, "#6366f1", subsPercent);
    statY += 34;
    drawStatBox(rightX, statY, "Goles Encajados", gk.stats?.goalsConceded || 0, `Promedio: ${playedMatches ? ((gk.stats?.goalsConceded || 0) / Math.max(1, playedMatches)).toFixed(2) : 0}`, "#ef4444", goalsPercent);
    drawStatBox(rightX + 59, statY, "Porterías Cero", gk.stats?.cleanSheets || 0, "Ratio clean sheets", "#10b981", cleanSheetsPercent);
    drawStatBox(rightX + 118, statY, "Penaltis Parados", gk.stats?.penaltiesSaved || 0, `De ${gk.stats?.penaltiesFaced || 0} penaltis`, "#06b6d4", penaltiesPercent);

    const planY = statY + 41;
    doc.setTextColor(...p.textMain); doc.setFontSize(12); doc.setFont("Roboto", "bold");
    if (iTarget) doc.addImage(iTarget, 'PNG', rightX, planY - 4, 5, 5); doc.text("PLAN DE PARTIDO & DECISIÓN TÉCNICA", rightX + 7, planY);

    doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(rightX, planY + 6, 113, 56, 3, 3, 'FD');
    let pLineY = planY + 16;
    const addPlanLine = (title, text, iconImage) => {
      if (iconImage) doc.addImage(iconImage, 'PNG', rightX + 4, pLineY - 3, 4, 4);
      doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(title, rightX + 10, pLineY);
      doc.setTextColor(...p.textMain); doc.setFont("Roboto", "normal"); doc.text(text || '--', rightX + 10, pLineY + 5, { maxWidth: 100 }); pLineY += 12;
    };
    addPlanLine("OBJ. DEFENSIVO", gk.matchPlan?.defensive, iShield); addPlanLine("OBJ. OFENSIVO", gk.matchPlan?.offensive, iSwords);
    addPlanLine("OBJ. TÁCTICO", gk.matchPlan?.tactical, iGit); addPlanLine("ASPECTOS CLAVES", gk.matchPlan?.keyAspects, iGoal);

    doc.setFillColor(...p.accentRedBg); doc.setDrawColor(...p.accentRedBorder); doc.roundedRect(rightX + 118, planY + 6, 54, 56, 3, 3, 'FD');
    doc.setTextColor(...p.accentRedTitle); doc.setFont("Roboto", "bold"); doc.setFontSize(8); doc.text("RECOMENDACIÓN", rightX + 124, planY + 15);
    doc.setDrawColor(239, 68, 68); doc.line(rightX + 124, planY + 18, rightX + 166, planY + 18);
    doc.setTextColor(...p.accentRedText1); doc.setFontSize(11); doc.setFont("Roboto", "bolditalic"); doc.text(gk.technicalDecision?.title || 'Pendiente', rightX + 124, planY + 25, { maxWidth: 45 });
    doc.setTextColor(...p.accentRedText2); doc.setFontSize(8); doc.setFont("Roboto", "normal"); doc.text(gk.technicalDecision?.reason || '--', rightX + 124, planY + 36, { maxWidth: 45 });

    // --- PAGE 3 ---
    doc.addPage(); drawBackground(); drawHeader();
    if (iCalendar) doc.addImage(iCalendar, 'PNG', 15, 43, 6, 6);
    doc.setTextColor(...p.textMain); doc.setFontSize(16); doc.setFont("Roboto", "bolditalic");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.5); doc.text("HISTORIAL COMPLETO DE PARTIDOS", 23, 48);
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    let tY = 56;
    doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, tY, pageWidth - 30, 10, 2, 2, 'FD');
    doc.setTextColor(...p.textMuted); doc.setFontSize(9); doc.setFont("Roboto", "bold");
    doc.text("FECHA", 20, tY + 7); doc.text("COMPETICIÓN", 60, tY + 7); doc.text("RIVAL", 140, tY + 7); doc.text("CAMPO", 200, tY + 7); doc.text("GOLES", 265, tY + 7); tY += 14;

    const gkMatches = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (gkMatches.length === 0) {
      doc.setTextColor(...p.textMain); doc.setFont("Roboto", "normal"); doc.text("No hay partidos registrados en el calendario para este portero.", 20, tY + 5);
    } else {
      gkMatches.forEach((m) => {
        if (tY > pageHeight - 20) { doc.addPage(); drawBackground(); drawHeader(); tY = 40; }
        const rival = rivals.find(r => r.id === m.rivalId);
        doc.setDrawColor(...p.line); doc.line(15, tY + 10, pageWidth - 15, tY + 10);
        doc.setTextColor(...p.textMuted); doc.setFont("Roboto", "normal"); doc.text(m.date || '--', 20, tY + 6);
        doc.text(`${m.league || '--'} ${m.matchday ? `(J${m.matchday})` : ''}`, 60, tY + 6);
        doc.setTextColor(...p.textMain); doc.setFont("Roboto", "bold"); doc.text(rival?.name?.toUpperCase() || 'DESCONOCIDO', 140, tY + 6, { maxWidth: 55 });
        doc.setTextColor(...p.textMuted); doc.setFont("Roboto", "normal"); if (iPin) doc.addImage(iPin, 'PNG', 196, tY + 3, 3, 3); doc.text(m.field || '--', 200, tY + 6, { maxWidth: 60 });
        doc.setTextColor(239, 68, 68); doc.setFont("Roboto", "bold"); doc.text(String(m.goalsScored || rival?.goalsScored || '-'), 265, tY + 6); tY += 12;
      });
    }

    doc.save(`PLAN_PARTIDO_${gk.name.replace(/\s+/g, '_').toUpperCase()}.pdf`);
    showNotification("PDF Vectorial exportado con éxito.", "success");
  } catch (error) {
    console.error("Error generando PDF:", error);
    showNotification("Error exportando PDF.", "error");
  }
};

// ==========================================
// COMPONENTES UI BÁSICOS Y SKELETONS
// ==========================================
function SkeletonCard() { return <div className="animate-pulse rounded-[3rem] border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50 h-64 w-full"></div>; }
function SkeletonMatch() { return <div className="animate-pulse rounded-[3rem] border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50 h-72 w-full"></div>; }
function BottomNavItem({ icon, label, active, onClick }) { return ( <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${active ? 'text-red-500' : 'text-slate-400 hover:text-slate-300'}`}> {React.cloneElement(icon, { size: active ? 22 : 20, strokeWidth: active ? 2.5 : 2 })} <span className={`text-[9px] font-bold ${active ? 'font-black tracking-widest uppercase' : ''}`}>{label}</span> </button> ); }
function SidebarItem({ icon, label, active, onClick, darkMode }) { return ( <button onClick={onClick} className={`w-full flex flex-col items-center justify-center gap-1 py-3 transition-all border-l-4 ${active ? `border-red-600 bg-white text-red-600 font-black shadow-lg` : `border-transparent text-blue-200 hover:text-white hover:bg-blue-900 font-bold`} `}> {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2, className: active ? 'text-red-600' : '' })} <span className="text-[9px] uppercase tracking-widest mt-1">{label}</span> </button> ); }
function ProfileRow({ label, value, theme }) { return ( <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700/50 pb-2"> <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{label}</span> <span className="font-bold text-sm text-blue-950 dark:text-white">{value}</span> </div> ); }

function StatCard({ title, value, subtitle, color, percent, showPercentInside, theme, darkMode }) {
  return (
    <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-between relative overflow-hidden shadow-sm`}>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <h4 className={`text-[9px] uppercase tracking-widest font-black ${theme.textMuted} w-2/3 leading-tight`}>{title}</h4>
        <div className="w-10 h-10 relative flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <path className={darkMode ? "stroke-slate-700" : "stroke-slate-100"} strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            {percent > 0 && ( <path className={`${color}`} strokeWidth="4" fill="none" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /> )}
          </svg>
          {showPercentInside && ( <div className="absolute inset-0 flex items-center justify-center"> <span className={`text-[9px] font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{percent}%</span> </div> )}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black tracking-tighter mb-1 text-blue-950 dark:text-white leading-none">{value}</p>
        <p className={`text-[8px] font-bold uppercase tracking-widest ${theme.textMuted} truncate mt-1`}>{subtitle}</p>
      </div>
    </div>
  );
}

function CompareProfileCard({ gk, color, theme, darkMode }) { return ( <div className={`p-5 rounded-[2rem] flex items-center gap-5 shadow-sm border ${theme.border} ${theme.card}`}> <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shrink-0 bg-slate-50 dark:bg-slate-900 ${color === 'blue' ? 'border-blue-500' : 'border-red-500'}`}> <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" alt=""/> </div> <div> <h4 className={`font-black text-sm uppercase ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{gk.name}</h4> <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme.textMuted} mt-1.5 ml-0.5`}>{gk.team}</p> </div> </div> ); }

function StatRow({ label, val1, val2, isHigherBetter, darkMode }) {
  const isBetter = isHigherBetter ? parseFloat(val1) >= parseFloat(val2) : parseFloat(val1) <= parseFloat(val2);
  const isTie = parseFloat(val1) === parseFloat(val2);
  return ( <div className={`flex justify-between items-center py-3 border-b last:border-0 ${darkMode ? 'border-slate-700/50' : 'border-slate-100'}`}> <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span> <span className={`text-base font-black ${isTie ? 'text-slate-400' : isBetter ? 'text-emerald-500' : 'text-slate-400'}`}>{val1}</span> </div> );
}

function StreakDisplay({ streak }) {
  if (!streak || streak.length === 0) return <span className="text-sm font-black text-slate-300 dark:text-slate-600">---</span>;
  return ( <div className="flex gap-1.5 justify-end mt-1"> {streak.map((res, i) => ( <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${res === 'V' ? 'bg-emerald-500' : res === 'E' ? 'bg-blue-500' : 'bg-red-500'}`}> <span className="leading-none pt-[1px]">{res}</span> </div> ))} </div> );
}

function MatchPlanBox({ title, icon, content, darkMode }) {
  return (
    <div className={`bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 p-5 rounded-[2rem] shadow-inner flex flex-col h-full`}>
       <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2"> {icon} <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</span> </div>
       <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap flex-1"> {content || <span className="text-slate-400 italic">No definido...</span>} </p>
    </div>
  );
}

function MatchScoreboardCard({ match, rival, gks, onEdit, onDelete, theme, layout = 'grid', darkMode }) {
  const convocados = gks.filter(gk => match.goalkeeperIds?.includes(gk.id));
  return (
    <div className={`rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-sm dark:shadow-md overflow-hidden relative flex flex-col group ${layout === 'wide' ? 'md:col-span-2' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 dark:from-blue-900/20 to-transparent pointer-events-none" />
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 py-3 px-4 text-center relative z-10 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[10px] md:text-xs font-black uppercase text-blue-950 dark:text-blue-400 tracking-[0.15em]">{match.league || 'Competición por definir'} {match.group && ` • ${match.group}`} {match.matchday && ` • JORNADA ${match.matchday}`}</span>
        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase">{match.season || '2026/27'}</span>
      </div>
      <div className="text-center pt-5 pb-3 relative z-10 px-4">
        <div className="flex justify-center items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1"><MapPin size={16} /><span className="text-xs md:text-sm uppercase font-black tracking-widest">{match.field || 'Campo por definir'}</span></div>
        <p className="text-slate-800 dark:text-white text-sm font-bold tracking-wide">{formatDate(match.date)}</p>
      </div>
      <div className="flex items-center justify-between px-6 md:px-12 py-6 relative z-10 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col items-center flex-1"><Shield className="w-16 h-16 md:w-24 md:h-24 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-transform group-hover:scale-105" /><span className="text-blue-950 dark:text-white font-black mt-4 text-[10px] md:text-xs text-center drop-shadow-sm uppercase">Atleti</span></div>
        <div className="flex flex-col items-center px-4 md:px-8"><div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-3 md:px-8 md:py-4 rounded-[2rem] shadow-inner backdrop-blur-md"><span className="text-xl md:text-3xl font-black text-blue-950 dark:text-white tracking-widest">{match.time || '--:--'}</span></div><span className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-[0.2em]">Hora</span></div>
        <div className="flex flex-col items-center flex-1">{rival?.shieldUrl ? ( <img src={rival.shieldUrl} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-sm transition-transform group-hover:scale-105" alt="Rival"/> ) : ( <Swords className="w-16 h-16 md:w-24 md:h-24 text-slate-300 dark:text-slate-600" /> )}<span className="text-blue-950 dark:text-white font-black mt-4 text-[10px] md:text-xs text-center drop-shadow-sm uppercase truncate w-24 md:w-32">{rival?.name || 'Rival'}</span></div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center relative z-10 mt-auto gap-4 md:gap-0 rounded-b-[3rem]">
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
           <span className="text-[10px] md:text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Convocatoria</span>
           {convocados.length > 0 ? ( <div className="flex -space-x-3">{convocados.map(gk => ( <img key={gk.id} src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} title={gk.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-sm bg-slate-200 dark:bg-slate-700" style={{ objectPosition: 'center 15%' }} alt=""/> ))}</div> ) : ( <span className="text-[10px] text-slate-400 font-bold italic">Sin asignar</span> )}
        </div>
        <div className="flex items-center gap-4 md:gap-8 justify-center w-full md:w-auto">
           <div className="flex flex-col items-center md:items-end"><span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Goles Favor</span><span className="text-lg md:text-2xl font-black text-blue-950 dark:text-white">{match.goalsScored || rival?.goalsScored || '--'}</span></div>
           <div className="flex flex-col items-center md:items-end"><span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Racha Rival</span><StreakDisplay streak={match.streak} /></div>
           {(onEdit || onDelete) && (
             <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3 md:pl-4 ml-1 md:ml-2">
               {onEdit && ( <button onClick={() => onEdit(match)} className="p-2 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl transition-colors"><Edit2 size={16}/></button> )}
               {onDelete && ( <button onClick={() => onDelete(match.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl transition-colors"><X size={16}/></button> )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, className = "", ...props }) { return ( <div className={className}>{label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}<input className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors ${props.type === 'number' && props.className?.includes('text-emerald') ? props.className : ''}`} {...props} /></div> ); }
function FormSelect({ label, children, className = "", ...props }) { return ( <div className={className}>{label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}<select className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-blue-950 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors cursor-pointer`} {...props}>{children}</select></div> ); }
function FormTextarea({ label, className = "", ...props }) { return ( <div className={className}>{label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}<textarea className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors shadow-inner resize-none text-xs`} {...props} /></div> ); }

// ==========================================
// VISTAS Y MÓDULOS 
// ==========================================

function LoginScreen({ users, onLogin }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [error, setError] = useState(''); const [isAuthenticating, setIsAuthenticating] = useState(false); const [isEntering, setIsEntering] = useState(false);
  
  const submit = (e) => {
    e.preventDefault(); setError(''); setIsAuthenticating(true);
    setTimeout(() => {
      const user = users.find(x => (x.username === u || x.email === u) && x.password === p);
      if (user) { 
        if(user.active === false) { setError("Cuenta desactivada."); setIsAuthenticating(false); } else { setIsEntering(true); setTimeout(() => onLogin(user), 700); }
      } else { setError("Usuario o contraseña incorrectos"); setIsAuthenticating(false); }
    }, 600);
  };
  
  return (
    <div className={`h-screen w-full flex bg-blue-950 overflow-hidden transition-all duration-700 ease-in-out ${isEntering ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
      <style>{`@keyframes shimmer { 100% { transform: translateX(200%); } } .animate-shimmer { animation: shimmer 2s infinite; }`}</style>
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-900 to-blue-950 overflow-hidden flex-col justify-end p-24">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center"><Shield className="w-[800px] h-[800px] text-white transform -rotate-12" /></div>
        <div className="relative z-20 flex flex-col">
          <h3 className="text-3xl xl:text-4xl font-black text-red-500/90 italic uppercase tracking-tighter mb-4 drop-shadow-xl">"Nunca dejes de creer"</h3>
          <h2 className="text-6xl xl:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">Observa.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">Reacciona.</span><br/>Lidera.</h2>
          <div className="border-l-4 border-red-500 pl-6 max-w-xl backdrop-blur-sm bg-blue-950/20 p-4 rounded-r-2xl"><p className="text-blue-100 text-lg font-medium">Software de alto rendimiento diseñado exclusivamente para optimizar la toma de decisiones, y el plan de partido de nuestros porteros.</p></div>
        </div>
      </div>
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col justify-center px-10 md:px-16 py-12 bg-white z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-blue-600"></div>
        <div className="flex flex-col items-center text-center mb-12">
          <Shield className="h-20 w-20 text-red-600 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.2)]" />
          <h1 className="text-blue-950 text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 whitespace-nowrap">ATLETI <span className="text-red-600">PLAN PARTIDO</span></h1>
          <div className="flex flex-col items-center"><span className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Departamento de porteros</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 text-sm md:text-base font-black tracking-widest uppercase mt-1">Atlético de Madrid</span></div>
        </div>
        <form onSubmit={submit} className="w-full space-y-8">
          <div className="relative group">
            <input type="text" id="user" required className="peer w-full bg-transparent border-b-2 border-slate-200 text-slate-800 px-1 py-3 pt-6 outline-none focus:border-red-600 transition-colors placeholder-transparent" placeholder="Usuario" value={u} onChange={e=>setU(e.target.value)} disabled={isAuthenticating}/>
            <label htmlFor="user" className="absolute left-1 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-red-600 pointer-events-none">Usuario o Email</label>
          </div>
          <div className="relative group">
            <input type="password" id="pass" required className="peer w-full bg-transparent border-b-2 border-slate-200 text-slate-800 px-1 py-3 pt-6 outline-none focus:border-red-600 transition-colors placeholder-transparent" placeholder="Contraseña" value={p} onChange={e=>setP(e.target.value)} disabled={isAuthenticating}/>
            <label htmlFor="pass" className="absolute left-1 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-red-600 pointer-events-none">Contraseña</label>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"><AlertCircle size={16} className="text-red-500 shrink-0"/><p className="text-red-600 text-xs font-bold">{String(error)}</p></div>}
          <div className="pt-6">
            <button type="submit" disabled={isAuthenticating || isEntering} className="relative w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_8px_25px_rgba(220,38,38,0.3)] transition-all hover:scale-[1.02] hover:bg-red-700 overflow-hidden group disabled:opacity-80 disabled:scale-100 flex items-center justify-center h-14">
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:animate-shimmer"></div>
              {isAuthenticating ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <span className="relative z-10">Acceder</span>}
            </button>
            <div className="mt-8 text-center flex items-center justify-center gap-3 opacity-90"><div className="h-px w-10 bg-gradient-to-r from-transparent to-red-500/80"></div><p className="text-slate-500 text-[10px] font-black italic tracking-widest uppercase">"Donde empieza nuestra defensa."</p><div className="h-px w-10 bg-gradient-to-l from-transparent to-blue-500/80"></div></div>
          </div>
        </form>
      </div>
    </div>
  );
}

function VestuarioVirtual({ gks, onOpenPlan, theme }) {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[3rem] p-6 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 px-2 relative z-10">
        <div>
          <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span></span>
            Centro de Mando: Vestuario
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Selecciona a un portero para configurar su plan táctico</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg"><Shield size={16} className="text-red-500"/><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Atleti KMP Report</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {gks.map(gk => (
          <div key={gk.id} onClick={() => onOpenPlan(gk)} className="group cursor-pointer relative flex flex-col w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-700/50 hover:border-red-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800 group-hover:bg-red-500 group-hover:shadow-[0_0_10px_#ef4444] transition-colors duration-500 z-20"></div>
            <div className="absolute inset-0 z-0">
              <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} alt={gk.name} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" style={{ objectPosition: 'center 15%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>
            <span className="absolute top-4 right-4 text-slate-800/50 font-black italic text-6xl md:text-7xl z-10 group-hover:text-red-500/20 transition-colors duration-500 select-none">{gk.number}</span>
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-slate-950/40 backdrop-blur-[2px]">
               <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-slate-900/80 text-red-500 mb-3 shadow-[0_0_15px_rgba(220,38,38,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-500"><Target size={28} strokeWidth={2.5} /></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Ver Plan Táctico</span>
            </div>
            <div className="mt-auto relative z-30 p-6 flex flex-col justify-end">
               <div className="flex items-end justify-between mb-2"><div><h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-md">{gk.name}</h4><p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mt-2">{gk.team}</p></div></div>
               <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800/80">
                 <div><span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Forma</span><span className="text-sm font-black text-emerald-400">{gk.form || '5.0'}</span></div>
                 <div><span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min. Jugados</span><span className="text-sm font-black text-white">{gk.stats?.minutes || 0}</span></div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockerPlanModal({ gk, onClose, theme, darkMode }) {
  const recommendation = gk.technicalDecision || { title: 'PENDIENTE', reason: 'Sin valoración técnica actualmente.' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/95 backdrop-blur-md p-4 no-print animate-in fade-in">
      <div className={`w-full max-w-4xl rounded-[3rem] border ${theme.border} bg-slate-950 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}>
        <div className="p-8 border-b border-slate-850 flex justify-between items-center bg-gradient-to-r from-red-950/30 to-blue-950/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-500 bg-slate-900 flex-shrink-0 shadow-lg"><img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} alt=""/></div>
            <div><h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{gk.name}</h2><p className="text-xs font-black text-red-500 uppercase tracking-widest mt-1">PLAN DE PARTIDO PERSONALIZADO</p></div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-900 hover:bg-red-900 text-slate-400 hover:text-white rounded-full transition-colors shadow-lg"><X size={20}/></button>
        </div>
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2"><Shield size={18} className="text-red-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Defensivo</span></div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.defensive || 'No definido.'}</p>
            </div>
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2"><Swords size={18} className="text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Ofensivo</span></div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.offensive || 'No definido.'}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2"><GitCompare size={18} className="text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Táctico</span></div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.tactical || 'No definido.'}</p>
            </div>
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2"><Goal size={18} className="text-yellow-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Aspectos Claves</span></div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.keyAspects || 'No definido.'}</p>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-red-950/20 to-slate-900 border border-red-900/40 p-6 rounded-[2rem] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1"><span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Recomendación de Titularidad</span><h4 className="text-xl font-black italic tracking-tighter text-slate-200 uppercase leading-tight mb-2">{recommendation.title}</h4><p className="text-xs text-slate-400 font-medium">{recommendation.reason}</p></div>
            <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-slate-950/80 border border-slate-800 shadow-inner"><span className="text-4xl">🧤</span></div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-850 flex justify-end bg-slate-950/40"><button onClick={onClose} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-900/30">Confirmar Plan</button></div>
      </div>
    </div>
  );
}

function ModuleInicio({ gks, matches, rivals, theme, setModule, darkMode, onEditMatch, onDeleteMatch, isDataLoading, currentUserData, viewLockerRoom, setViewLockerRoom, onOpenLockerPlan, role }) {
  const upcomingMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  const [weatherData, setWeatherData] = useState({ temp: '--', desc: 'Cargando...', city: 'Madrid', isRainy: false });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current_weather=true`);
        const wData = await weatherRes.json();
        const current = wData.current_weather;
        let desc = 'DESPEJADO'; let isRainy = false;
        if ([51,53,55,61,63,65,80,81,82,95,96,99].includes(current.weathercode)) { desc = 'LLUVIA'; isRainy = true; }
        else if ([71,73,75,85,86].includes(current.weathercode)) { desc = 'NIEVE'; isRainy = true; }
        else if ([1,2,3].includes(current.weathercode)) { desc = 'NUBLADO'; }
        setWeatherData({ temp: String(Math.round(current.temperature)), desc, city: 'MADRID', isRainy });
      } catch (e) { setWeatherData({ temp: '--', desc: 'ERROR', city: 'MADRID', isRainy: false }); }
    };
    fetchWeather();
  }, []);

  const hour = new Date().getHours();
  let greeting = "BUENOS DÍAS";
  if (hour >= 13 && hour < 20) greeting = "BUENAS TARDES";
  else if (hour >= 20 || hour < 5) greeting = "BUENAS NOCHES";
  const userName = currentUserData?.name ? currentUserData.name.split(' ')[0].toUpperCase() : 'ENTRENADOR';

  if (isDataLoading) { return ( <div className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><SkeletonCard /><div className="md:col-span-2 flex overflow-hidden gap-6"><SkeletonMatch /><SkeletonMatch className="hidden md:block" /></div></div></div> ); }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-blue-950 rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden shadow-sm min-h-[140px]">
           <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10"><Shield size={180} /></div>
           <div className="relative z-10 text-left"><h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{greeting}, {userName}</h2></div>
         </div>
         <div className={`md:col-span-1 rounded-[2.5rem] p-6 flex items-center justify-between text-white relative overflow-hidden shadow-sm min-h-[140px] ${weatherData.isRainy ? 'bg-gradient-to-r from-slate-600 to-slate-800' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none -mr-8">{weatherData.isRainy ? <CloudRain size={120} /> : <Sun size={120} />}</div>
           <div className="flex items-center gap-4 z-10 w-full">
              <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-sm shrink-0">{weatherData.isRainy ? <CloudRain size={36} /> : <Sun size={36} />}</div>
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">{weatherData.city}</p>
                 <div className="flex items-baseline gap-2"><span className="text-4xl font-black tracking-tighter leading-none">{weatherData.temp}º</span><span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{weatherData.desc}</span></div>
              </div>
           </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-center shadow-sm`}>
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 mb-4"><Users size={32} className="text-red-600"/></div>
          <h2 className="text-5xl font-black text-blue-950 dark:text-white tracking-tighter mb-2">{gks.length}</h2>
          <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} font-black`}>Porteros Asignados</p>
        </div>
        <div className="md:col-span-2 overflow-hidden flex flex-col gap-4">
          <div className="flex justify-between items-end px-2 mb-2">
             <div className="text-left"><h3 className="text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white leading-none">Próximos Partidos</h3></div>
             {upcomingMatches.length > 1 && <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">Desliza →</span>}
          </div>
          {upcomingMatches.length > 0 ? (
             <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 custom-scrollbar">
               {upcomingMatches.map(match => {
                  const r = rivals.find(r => r.id === match.rivalId);
                  return ( <div key={match.id} className="min-w-full lg:min-w-[85%] snap-center shrink-0"><MatchScoreboardCard match={match} rival={r} gks={gks} theme={theme} darkMode={darkMode} onEdit={role !== 'staff' ? onEditMatch : null} onDelete={role !== 'staff' ? onDeleteMatch : null} /></div> )
               })}
             </div>
          ) : ( <div className={`p-6 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-slate-400 h-[250px]`}><CalendarDays size={48} className="mb-4 opacity-50" /><p className="text-sm font-black uppercase tracking-widest text-slate-500">Sin partidos programados</p></div> )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-10 mb-4 px-2">
        <div className="text-left">
          <h3 className={`text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Tus Porteros</h3>
          <h4 className="text-2xl font-black italic uppercase tracking-tighter text-blue-950 dark:text-white mt-1 leading-none">Planificación del Plantel</h4>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 shadow-inner">
          <button onClick={() => setViewLockerRoom(true)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${viewLockerRoom ? 'bg-blue-950 dark:bg-red-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>🚪 Vestuario 3D</button>
          <button onClick={() => setViewLockerRoom(false)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${!viewLockerRoom ? 'bg-blue-950 dark:bg-red-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>📋 Tarjetas</button>
        </div>
      </div>
      {viewLockerRoom ? ( <VestuarioVirtual gks={gks} onOpenPlan={onOpenLockerPlan} theme={theme} /> ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gks.map(gk => (
            <div key={gk.id} onClick={() => setModule('porteros')} className={`p-4 rounded-[2rem] border ${theme.border} bg-white dark:bg-slate-800 hover:border-red-500/50 hover:shadow-lg cursor-pointer transition-all group relative overflow-hidden shadow-sm`}>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-transparent text-7xl font-black italic transform -skew-x-6 z-0 pointer-events-none select-none transition-all group-hover:scale-110" style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.05)' : '2px rgba(15, 23, 42, 0.05)' }}>{gk.number}</div>
              <div className="flex items-center gap-4 relative z-10 text-left">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 group-hover:border-red-500 transition-colors shrink-0 bg-slate-50 dark:bg-slate-900"><img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} alt=""/></div>
                <div><h4 className="font-black text-sm uppercase text-blue-950 dark:text-white tracking-tight drop-shadow-sm">{gk.name}</h4><p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-500 mt-1.5 ml-0.5">{gk.team}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardView({ gk, allGks, matches, rivals, theme, darkMode, onEditTechDec, onEditStats, onEditMatchPlan, activeSeason, isDataLoading, exportTrigger, resetExportTrigger, showNotification, role }) {
  useEffect(() => {
    if (exportTrigger > 0) { exportarPDFVectorial(gk, matches, rivals, activeSeason, showNotification, darkMode).finally(() => { if (resetExportTrigger) resetExportTrigger(); }); }
  }, [exportTrigger]);

  if (isDataLoading) return <div className="space-y-6"><SkeletonCard/><SkeletonCard/></div>;
  if (!gk) return null;

  const gkMatches = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextMatch = gkMatches[0]; const nextMatchRival = nextMatch ? rivals.find(r => r.id === nextMatch.rivalId) : null;

  const getGkState = (formScore) => {
    if (formScore >= 8.0) return { text: 'EN FORMA', icon: '🟢', color: 'text-emerald-500 dark:text-emerald-400' };
    if (formScore >= 5.0) return { text: 'REGULAR', icon: '🟠', color: 'text-orange-500 dark:text-orange-400' };
    return { text: 'BAJO', icon: '🔴', color: 'text-red-500 dark:text-red-400' };
  };
  const gkState = getGkState(gk.form || 5);

  const getTrend = (perfData) => {
    if (!perfData || perfData.length < 2) return { text: 'ESTABLE →', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
    const last = perfData[perfData.length - 1].goals; const prev = perfData[perfData.length - 2].goals;
    if (last < prev) return { text: 'EN MEJORA ↗', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-100 dark:border-emerald-500/20' };
    if (last > prev) return { text: 'EN DECLIVE ↘', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-500/20' };
    return { text: 'ESTABLE →', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10 border border-blue-100 dark:border-blue-500/20' };
  };
  const gkTrend = getTrend(gk.performanceData);
  const recommendation = gk.technicalDecision || { title: 'PENDIENTE', reason: 'Aún no se ha introducido una valoración técnica para este portero.' };

  const teamMatches = gk.stats?.teamMatches || Math.max(matches.length, (gk.stats?.starts || 0) + (gk.stats?.subs || 0));
  const teamMinutes = gk.stats?.teamMinutes || teamMatches * 90;
  const playedMatches = gk.stats?.playedMatches || ((gk.stats?.starts || 0) + (gk.stats?.subs || 0));
  
  const minsPercent = teamMinutes > 0 ? Math.round(((gk.stats?.minutes || 0) / teamMinutes) * 100) : 0;
  const startsPercent = teamMatches > 0 ? Math.round(((gk.stats?.starts || 0) / teamMatches) * 100) : 0;
  const subsPercent = teamMatches > 0 ? Math.round(((gk.stats?.subs || 0) / teamMatches) * 100) : 0;
  const goalsPercent = playedMatches > 0 ? Math.min(100, Math.round(((gk.stats?.goalsConceded || 0) / Math.max(1, playedMatches)) * 50)) : 0;
  const cleanSheetsPercent = playedMatches > 0 ? Math.round(((gk.stats?.cleanSheets || 0) / Math.max(1, playedMatches)) * 100) : 0;
  const penaltiesPercent = (gk.stats?.penaltiesFaced || 0) > 0 ? Math.round(((gk.stats?.penaltiesSaved || 0) / Math.max(1, gk.stats.penaltiesFaced)) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:grid-cols-12">
        <div className={`xl:col-span-4 rounded-[3rem] border ${theme.border} ${theme.card} overflow-hidden flex relative min-h-[380px] shadow-sm`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 dark:bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className={`w-2/5 ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-200'} relative flex flex-col justify-end border-r overflow-hidden`}>
            <div className="absolute inset-0 z-10"><img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} alt={gk.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" style={{ objectPosition: 'center 15%', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }} crossOrigin="anonymous"/></div>
            <span className="absolute top-12 right-4 md:right-6 text-transparent text-8xl md:text-9xl font-black italic transform -skew-x-6 z-20 pointer-events-none select-none drop-shadow-xl" style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.2)' : '2px rgba(15, 23, 42, 0.1)' }}>{gk.number}</span>
            <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${darkMode ? 'from-slate-900' : 'from-white'} to-transparent z-10 pointer-events-none`}></div>
            <div className="relative z-20 text-center pb-6 px-2"><span className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-transparent break-words leading-none" style={{ WebkitTextStroke: darkMode ? '1.5px rgba(255, 255, 255, 0.95)' : '1.5px rgba(23, 37, 84, 0.95)' }}>{gk.name}</span><p className="text-[11px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.3em] mt-2 drop-shadow-sm">{gk.team || 'Atlético de Madrid'}</p></div>
          </div>
          <div className="w-3/5 p-6 md:p-8 flex flex-col justify-between z-10">
            <div>
              <div className="mt-2 space-y-4"><ProfileRow label="Equipo" value={gk.team || 'Atlético de Madrid'} theme={theme} /><ProfileRow label="Competición" value={`${gk.league || '--'} ${gk.group ? `(${gk.group})` : ''}`} theme={theme} /><ProfileRow label="Pie Domin." value={gk.foot || 'Derecho'} theme={theme} /><ProfileRow label="Mano Domin." value={gk.hand || 'Derecha'} theme={theme} /></div>
            </div>
            <div className={`mt-6 p-5 rounded-[2rem] ${darkMode ? 'bg-slate-900/80' : 'bg-slate-50 border border-slate-100'} flex items-center justify-between shadow-inner`}>
              <div><p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Forma</p><div className="flex items-end gap-1"><span className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{gk.form || '5.0'}</span><span className={`text-xs mb-1 font-bold ${theme.textMuted}`}>/10</span></div></div>
              <div className="flex gap-1.5">{gk.lastMatches?.map((m, i) => <div key={i} className={`w-3.5 h-3.5 rounded-full ${m === 'W' ? 'bg-emerald-500' : m === 'D' ? 'bg-blue-500' : 'bg-red-500'} shadow-sm`}></div>)}</div>
            </div>
          </div>
        </div>
        <div className={`xl:col-span-8 h-full`}>
          {nextMatch ? ( <MatchScoreboardCard match={nextMatch} rival={nextMatchRival} gks={[gk]} theme={theme} darkMode={darkMode} /> ) : ( <div className={`h-full p-8 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col items-center justify-center text-slate-400 dark:text-slate-500`}><CalendarDays size={56} className="mb-4 opacity-50" /><p className="text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sin partidos inminentes</p><p className="text-xs mt-2 font-medium">Este portero no está en ninguna convocatoria próxima.</p></div> )}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-6 ml-2 group">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-950 dark:text-slate-300">Estadísticas Temporada {activeSeason}</h3>
          {role !== 'staff' && ( <button onClick={onEditStats} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-sm no-print opacity-100" title="Editar Estadísticas"><Edit2 size={16} strokeWidth={3} /></button> )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 print:grid-cols-4">
          <StatCard title="Minutos Jugados" value={gk.stats?.minutes || 0} subtitle="min. jugados" color="stroke-blue-500" percent={minsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Titular" value={gk.stats?.starts || 0} subtitle={`${gk.stats?.starts || 0} / ${teamMatches}`} color="stroke-indigo-500" percent={startsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Suplente" value={gk.stats?.subs || 0} subtitle={`${gk.stats?.subs || 0} / ${teamMatches}`} color="stroke-violet-500" percent={subsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Goles Encajados" value={gk.stats?.goalsConceded || 0} subtitle={`Promedio: ${playedMatches ? ((gk.stats?.goalsConceded || 0) / Math.max(1, playedMatches)).toFixed(2) : 0}`} color="stroke-red-500" percent={goalsPercent} theme={theme} darkMode={darkMode} />
          <StatCard title="Porterías a Cero" value={gk.stats?.cleanSheets || 0} subtitle="Ratio clean sheets" color="stroke-emerald-500" percent={cleanSheetsPercent} theme={theme} darkMode={darkMode} />
          <StatCard title="Penaltis Parados" value={gk.stats?.penaltiesSaved || 0} subtitle={`de ${gk.stats?.penaltiesFaced || 0} penaltis`} color="stroke-cyan-500" percent={penaltiesPercent} theme={theme} darkMode={darkMode} />
          <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-center relative overflow-hidden shadow-sm`}>
             <h4 className={`text-[9px] uppercase tracking-widest font-black ${theme.textMuted} mb-3`}>Datos Globales</h4>
             <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-2"><span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Convocatorias</span><div className="flex items-center gap-2"><span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.calledUpMatches || 0}/{gk.stats?.teamMatches || 0}</span><span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">{teamMatches > 0 ? Math.round(((gk.stats?.calledUpMatches || 0) / teamMatches) * 100) : 0}%</span></div></div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-2"><span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Jugados</span><div className="flex items-center gap-2"><span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.playedMatches || 0}/{gk.stats?.teamMatches || 0}</span><span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">{teamMatches > 0 ? Math.round(((gk.stats?.playedMatches || 0) / teamMatches) * 100) : 0}%</span></div></div>
                <div className="flex justify-between items-center"><span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Minutos</span><div className="flex items-center gap-2"><span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.minutes || 0}/{gk.stats?.teamMinutes || 0}</span><span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">{teamMinutes > 0 ? Math.round(((gk.stats?.minutes || 0) / teamMinutes) * 100) : 0}%</span></div></div>
             </div>
          </div>
          <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-center relative overflow-hidden shadow-sm`}><span className="text-4xl md:text-5xl mb-2 md:mb-3 drop-shadow-md">{gkState.icon}</span><span className={`text-[10px] font-black uppercase tracking-widest ${gkState.color}`}>{gkState.text}</span></div>
        </div>
      </div>
      <div className={`rounded-[3rem] border ${theme.border} ${theme.card} p-8 flex flex-col shadow-sm relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white flex items-center gap-2"><Target size={18} className="text-blue-500"/> Plan de Partido</h3>
          {role !== 'staff' && ( <button onClick={onEditMatchPlan} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-600 transition-all shadow-sm no-print opacity-100" title="Editar Plan de Partido"><Edit2 size={16} strokeWidth={3} /></button> )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
          <MatchPlanBox title="Objetivo Defensivo" icon={<Shield size={18} className="text-red-500"/>} content={gk.matchPlan?.defensive} darkMode={darkMode} />
          <MatchPlanBox title="Objetivo Ofensivo" icon={<Swords size={18} className="text-emerald-500"/>} content={gk.matchPlan?.offensive} darkMode={darkMode} />
          <MatchPlanBox title="Objetivo Táctico" icon={<GitCompare size={18} className="text-blue-500"/>} content={gk.matchPlan?.tactical} darkMode={darkMode} />
          <MatchPlanBox title="Aspectos Claves" icon={<Goal size={18} className="text-yellow-500"/>} content={gk.matchPlan?.keyAspects} darkMode={darkMode} />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:grid-cols-12 print:break-inside-avoid">
        <div className={`xl:col-span-3 rounded-[3rem] border ${theme.border} ${theme.card} p-8 flex flex-col items-center justify-center shadow-sm`}>
           <h3 className="text-xs font-black uppercase tracking-widest mb-4 w-full text-center text-blue-950 dark:text-white">Perfil Técnico</h3>
           <div className="w-full h-[240px] -mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={gk.skills || DUMMY_GOALKEEPER.skills}>
                 <PolarGrid stroke={darkMode ? '#334155' : '#cbd5e1'} />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '900' }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                 <Radar name={gk.name} dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} strokeWidth={2} />
                 <RechartsTooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '16px' }} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className={`xl:col-span-6 rounded-[3rem] border ${theme.border} ${theme.card} p-8 flex flex-col shadow-sm`}>
          <div className="flex justify-between items-center mb-8"><h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white">Evolución (Últimos 5)</h3><span className={`text-[10px] font-black px-4 py-1.5 rounded-xl ${gkTrend.bg} ${gkTrend.color}`}>{gkTrend.text}</span></div>
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gk.performanceData || DUMMY_GOALKEEPER.performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="match" stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} fontWeight="bold" />
                <RechartsTooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '16px', color: darkMode ? '#fff' : '#000' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                <Line type="monotone" dataKey="goals" name="Goles Encajados" stroke="#ef4444" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-6"><div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm"></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Goles Encajados</span></div></div>
        </div>
        <div className={`xl:col-span-3 rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 p-8 flex flex-col relative overflow-hidden shadow-sm dark:shadow-md group`}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
           <div className="flex justify-between items-center mb-6 relative z-10"><h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2"><BarChart2 size={18}/> Decisión</h3>{role !== 'staff' && ( <button onClick={onEditTechDec} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-600 transition-all shadow-sm no-print opacity-100" title="Editar Decisión"><Edit2 size={14} strokeWidth={3} /></button> )}</div>
           <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 p-5 rounded-[2rem] mb-5 relative z-10 shadow-inner"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">Recomendación</span><span className="text-xl font-black italic tracking-tighter text-blue-950 dark:text-white leading-tight uppercase">{recommendation.title}</span></div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10"><strong className="text-slate-800 dark:text-slate-200 block mb-1">Motivo:</strong> {recommendation.reason}</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function ModulePorteros({ gks, role, onSelect, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  if (isDataLoading) return <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"><p className={`text-sm font-medium ${theme.textMuted}`}>Gestiona los perfiles y accede a sus estadísticas.</p>{role === 'admin' && ( <button onClick={onNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20"><Plus size={16} /> Crear Portero</button> )}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gks.map(gk => (
          <div key={gk.id} className={`rounded-[3rem] border ${theme.border} ${theme.card} overflow-hidden group relative flex flex-col shadow-sm hover:shadow-xl transition-shadow`}>
            <div onClick={() => onSelect(gk.id)} className="cursor-pointer flex-1 flex flex-col">
              <div className={`h-48 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'} relative overflow-hidden border-b`}><img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-700" style={{ objectPosition: 'center 15%', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }} alt=""/></div>
              <div className="pt-4 pb-6 px-4 text-center relative z-20"><span className="absolute right-4 top-1/2 -translate-y-1/2 text-transparent text-6xl font-black italic transform -skew-x-6 z-0 pointer-events-none select-none transition-all group-hover:scale-110" style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.05)' : '2px rgba(15, 23, 42, 0.05)' }}>{gk.number}</span><div className="relative z-10"><h3 className={`text-xl font-black uppercase italic tracking-tighter ${darkMode ? 'text-white' : 'text-blue-950'}`}>{gk.name}</h3><p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 dark:text-red-500 mt-2 ml-1">{gk.team || 'Atlético de Madrid'}</p></div></div>
            </div>
            <div className={`p-4 border-t ${theme.border} flex justify-center gap-3 mt-auto ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              {role !== 'staff' ? ( <button onClick={(e) => { e.stopPropagation(); onEdit(gk); }} className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-blue-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white' : 'text-blue-600 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm'}`}><Edit2 size={14}/> Editar</button> ) : ( <button onClick={(e) => { e.stopPropagation(); onSelect(gk.id); }} className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-blue-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white' : 'text-blue-600 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm'}`}><Eye size={14}/> Ver Perfil</button> )}
              {role === 'admin' && ( <button onClick={(e) => { e.stopPropagation(); onDelete(gk.id); }} className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-red-400 bg-slate-800 border border-slate-700 hover:bg-red-500/20 hover:text-red-300' : 'text-red-600 bg-white border border-slate-200 hover:bg-red-50 shadow-sm'}`}><X size={14}/> Borrar</button> )}
            </div>
          </div>
        ))}
        {gks.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">No hay porteros asignados.</div>}
      </div>
    </div>
  );
}

function ModulePartidos({ matches, rivals, gks, role, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (isDataLoading) return <div className="grid grid-cols-1 xl:grid-cols-2 gap-8"><SkeletonMatch/><SkeletonMatch/></div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"><p className={`text-sm font-medium ${theme.textMuted}`}>Gestiona el calendario y las convocatorias de tus porteros.</p>{role !== 'staff' && ( <button onClick={onNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20"><Plus size={16} /> Añadir Partido</button> )}</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {sortedMatches.map(match => { const rival = rivals.find(r => r.id === match.rivalId); return <MatchScoreboardCard key={match.id} match={match} rival={rival} gks={gks} onEdit={role !== 'staff' ? onEdit : null} onDelete={role !== 'staff' ? onDelete : null} theme={theme} darkMode={darkMode} /> })}
        {sortedMatches.length === 0 && ( <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm"><CalendarDays className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest text-sm">No hay partidos programados</p><p className="text-xs text-slate-400 mt-2 font-medium">Haz clic en "Añadir Partido" para crear la próxima jornada.</p></div> )}
      </div>
    </div>
  );
}

function ModuleComparador({ gks, theme, darkMode }) {
  const [gk1Id, setGk1Id] = useState(gks[0]?.id || ''); const [gk2Id, setGk2Id] = useState(gks[1]?.id || '');
  const gk1 = gks.find(g => g.id === gk1Id); const gk2 = gks.find(g => g.id === gk2Id);
  const radarData = useMemo(() => {
    if (!gk1 || !gk2) return [];
    return gk1.skills.map(s1 => { const s2 = gk2.skills.find(s => s.subject === s1.subject); return { subject: s1.subject, A: s1.A, B: s2 ? s2.A : 0, fullMark: 100 }; });
  }, [gk1, gk2]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card} text-center shadow-sm`}>
        <GitCompare className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl md:text-3xl font-black text-blue-950 dark:text-white uppercase tracking-tighter mb-2">Comparador de Rendimiento</h2>
        <p className={`text-sm font-medium mb-8 ${theme.textMuted}`}>Analiza y contrasta las habilidades y estadísticas de dos porteros cara a cara.</p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <select value={gk1Id} onChange={(e) => setGk1Id(e.target.value)} className={`w-full md:w-64 border ${theme.border} rounded-[1rem] px-4 py-3 outline-none font-black text-sm cursor-pointer shadow-inner bg-slate-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500`}><option value="">Selecciona Portero 1</option>{gks.map(g => <option key={g.id} value={g.id} disabled={g.id === gk2Id}>{g.name}</option>)}</select>
          <span className="text-slate-400 font-black uppercase text-xs">VS</span>
          <select value={gk2Id} onChange={(e) => setGk2Id(e.target.value)} className={`w-full md:w-64 border ${theme.border} rounded-[1rem] px-4 py-3 outline-none font-black text-sm cursor-pointer shadow-inner bg-slate-50 dark:bg-slate-900 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500`}><option value="">Selecciona Portero 2</option>{gks.map(g => <option key={g.id} value={g.id} disabled={g.id === gk1Id}>{g.name}</option>)}</select>
        </div>
      </div>
      {gk1 && gk2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6"><CompareProfileCard gk={gk1} color="blue" theme={theme} darkMode={darkMode} /><CompareProfileCard gk={gk2} color="red" theme={theme} darkMode={darkMode} /></div>
          <div className={`lg:col-span-8 p-6 md:p-8 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col items-center justify-center min-h-[400px] shadow-sm`}>
            <h3 className="text-xs font-black text-blue-950 dark:text-white uppercase tracking-widest mb-6 w-full text-center">Atributos Técnicos Cara a Cara</h3>
            <div className="w-full h-[350px] max-w-md mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke={darkMode ? '#334155' : '#cbd5e1'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '900' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={gk1.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2} />
                  <Radar name={gk2.name} dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} strokeWidth={2} />
                  <RechartsTooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '16px', color: darkMode ? '#fff' : '#000' }} itemStyle={{ fontWeight: 'bold' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
               <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-center text-blue-600 dark:text-blue-400">{gk1.name}</h3>
               <StatRow label="Forma Actual" val1={gk1.form} val2={gk2.form} isHigherBetter darkMode={darkMode} />
               <StatRow label="Minutos Jugados" val1={gk1.stats?.minutes || 0} val2={gk2.stats?.minutes || 0} isHigherBetter darkMode={darkMode} />
               <StatRow label="Porterías a Cero" val1={gk1.stats?.cleanSheets || 0} val2={gk2.stats?.cleanSheets || 0} isHigherBetter darkMode={darkMode} />
               <StatRow label="Goles Encajados" val1={gk1.stats?.goalsConceded || 0} val2={gk2.stats?.goalsConceded || 0} isHigherBetter={false} darkMode={darkMode} />
               <StatRow label="Penaltis Parados" val1={gk1.stats?.penaltiesSaved || 0} val2={gk2.stats?.penaltiesSaved || 0} isHigherBetter darkMode={darkMode} />
             </div>
             <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
               <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-center text-red-600 dark:text-red-400">{gk2.name}</h3>
               <StatRow label="Forma Actual" val1={gk2.form} val2={gk1.form} isHigherBetter darkMode={darkMode} />
               <StatRow label="Minutos Jugados" val1={gk2.stats?.minutes || 0} val2={gk1.stats?.minutes || 0} isHigherBetter darkMode={darkMode} />
               <StatRow label="Porterías a Cero" val1={gk2.stats?.cleanSheets || 0} val2={gk1.stats?.cleanSheets || 0} isHigherBetter darkMode={darkMode} />
               <StatRow label="Goles Encajados" val1={gk2.stats?.goalsConceded || 0} val2={gk1.stats?.goalsConceded || 0} isHigherBetter={false} darkMode={darkMode} />
               <StatRow label="Penaltis Parados" val1={gk2.stats?.penaltiesSaved || 0} val2={gk1.stats?.penaltiesSaved || 0} isHigherBetter darkMode={darkMode} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleRivales({ rivals, role, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  if (isDataLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-6"><SkeletonCard/><SkeletonCard/></div>;
  return (
    <div className="space-y-6">
      {role === 'admin' && ( <div className="flex justify-end mb-6"><button onClick={onNew} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg"><Plus size={16} /> Añadir Rival</button></div> )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {rivals.map(rival => (
          <div key={rival.id} className={`p-6 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col items-center text-center relative group shadow-sm hover:shadow-xl transition-shadow`}>
            {role === 'admin' && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(rival)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-blue-600 rounded-full shadow-md transition-colors"><Edit2 size={14} strokeWidth={3}/></button>
                <button onClick={() => onDelete(rival.id)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-600 rounded-full shadow-md transition-colors"><X size={14} strokeWidth={3}/></button>
              </div>
            )}
            <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-4 mt-2">
              {rival.shieldUrl ? <img src={rival.shieldUrl} alt={rival.name} className="max-w-full max-h-full object-contain drop-shadow-md" /> : <Swords className="w-12 h-12 text-slate-300 dark:text-slate-600"/>}
            </div>
            <h3 className="font-black text-sm md:text-base uppercase tracking-tight text-blue-950 dark:text-white leading-tight">{rival.name}</h3>
            {rival.category && <span className="mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-black rounded-lg text-slate-500 dark:text-slate-300 uppercase tracking-widest">EQUIPO {rival.category}</span>}
          </div>
        ))}
        {rivals.length === 0 && <div className="col-span-full text-center py-20 text-slate-400 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">No hay rivales registrados.</div>}
      </div>
    </div>
  );
}

function ModuleAjustes({ users, currentUserData, role, onNewUser, onEditUser, onSaveProfile, onBackup, theme, darkMode }) {
  const [profileData, setProfileData] = useState(currentUserData);
  const handleImageUpload = useImageUploader((base64) => setProfileData(prev => ({ ...prev, photoUrl: base64 })));
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-blue-950 dark:text-white"><User className="text-blue-500"/> Mi Perfil</h3>
        <div className="flex flex-col md:flex-row gap-10 items-start">
           <div className="flex flex-col items-center w-full md:w-auto shrink-0">
             <label className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden relative group shadow-md">
                {profileData.photoUrl ? <img src={profileData.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: `center ${profileData.photoOffsetY ?? 50}%` }} alt="Perfil" /> : <User size={48} className="text-slate-300 dark:text-slate-600" />}
                <div className="absolute inset-0 bg-blue-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={24} className="text-white mb-2"/><span className="text-[10px] text-white font-black uppercase tracking-widest">Cambiar</span></div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
             </label>
             {profileData.photoUrl && (
               <div className="w-32 mt-6">
                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2"><span>Ajustar Encuadre</span></div>
                 <input type="range" min="0" max="100" value={profileData.photoOffsetY ?? 50} onChange={(e) => setProfileData({...profileData, photoOffsetY: e.target.value})} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
               </div>
             )}
           </div>
           <div className="flex-1 w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <FormInput label="Nombre Completo" type="text" value={profileData.name || ''} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                 <FormInput label="Email" type="email" value={profileData.email || ''} onChange={e => setProfileData({...profileData, email: e.target.value})} />
                 <FormInput label="Usuario de Acceso" type="text" value={profileData.username || ''} onChange={e => setProfileData({...profileData, username: e.target.value})} />
                 <FormInput label="Nueva Contraseña (Opcional)" type="password" value={profileData.newPassword || ''} onChange={e => setProfileData({...profileData, newPassword: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="flex justify-end pt-4"><button onClick={() => {onSaveProfile(profileData); setProfileData({...profileData, newPassword: ''});}} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-colors shadow-lg">Guardar Cambios</button></div>
           </div>
        </div>
      </div>
      {role === 'admin' && (
        <>
          <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3 text-blue-950 dark:text-white"><Database className="text-purple-500"/> Copia de Seguridad</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">Genera un archivo JSON con todos los datos (Porteros, Usuarios, Rivales). Guarda esto periódicamente.</p>
            <button onClick={onBackup} className="flex items-center justify-center w-full md:w-auto gap-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg"><Download size={18} /> Descargar Backup Completo</button>
          </div>
          <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-blue-950 dark:text-white"><Key className="text-emerald-500"/> Gestión de Usuarios</h3>
              <button onClick={onNewUser} className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-md"><Plus size={16} /> Nuevo Usuario</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest font-black text-slate-400"><th className="pb-4 pl-4">Usuario</th><th className="pb-4">Rol</th><th className="pb-4 text-right pr-4">Acciones</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-4 pl-4 flex items-center gap-4"><img src={u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover" style={{ objectPosition: `center ${u.photoOffsetY ?? 50}%` }} alt="" /><div><div className={`font-black text-sm uppercase text-blue-950 dark:text-white leading-tight`}>{u.name || 'Sin Nombre'}</div><div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{u.username || u.email}</div></div></td>
                      <td className="py-4"><span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : u.role === 'staff' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>{u.role === 'staff' ? 'Cuerpo Técnico' : u.role}</span></td>
                      <td className="py-4 text-right pr-4"><button onClick={() => onEditUser(u)} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"><Edit2 size={14} strokeWidth={3}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [role, setRole] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [dataLoaded, setDataLoaded] = useState({ users: false, gks: false, rivals: false, matches: false });
  const isDataLoading = !dataLoaded.users || !dataLoaded.gks || !dataLoaded.rivals || !dataLoaded.matches;

  const [goalkeepers, setGoalkeepers] = useState([DUMMY_GOALKEEPER]);
  const [usersList, setUsersList] = useState([{ id: 'admin-user', role: 'admin', username: 'admin', email: 'admin@atleti.com', password: '123', name: 'Administrador', photoUrl: '', active: true }]);
  const [rivals, setRivals] = useState([]);
  const [matches, setMatches] = useState([]);

  const [darkMode, setDarkMode] = useState(false);
  const [currentModule, setCurrentModule] = useState('inicio');
  const [notification, setNotification] = useState(null);
  
  const [activeSeason, setActiveSeason] = useState('2026/27');
  const [availableSeasons, setAvailableSeasons] = useState(['2026/27']);
  
  const [selectedGkId, setSelectedGkId] = useState(null);
  const [isGkFormOpen, setIsGkFormOpen] = useState(false);
  const [editingGk, setEditingGk] = useState(null);
  const [isRivalFormOpen, setIsRivalFormOpen] = useState(false);
  const [editingRival, setEditingRival] = useState(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [isTechDecModalOpen, setIsTechDecModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isMatchPlanModalOpen, setIsMatchPlanModalOpen] = useState(false);
  const [isAddSeasonModalOpen, setIsAddSeasonModalOpen] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);

  const [viewLockerRoom, setViewLockerRoom] = useState(true);
  const [lockerSelectedGk, setLockerSelectedGk] = useState(null);

  useEffect(() => {
    if (!auth) { setLoadingAuth(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Custom token mismatch, falling back to anonymous login");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        console.error("Error Auth:", error);
        setLoadingAuth(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setDataLoaded({ users: true, gks: true, rivals: true, matches: true });
      return;
    }

    const gkRef = collection(db, 'artifacts', appId, 'public', 'data', 'goalkeepers');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const rivalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rivals');
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (uList.length === 0 && user.uid) {
        const defaultAdmin = { role: 'admin', username: 'admin', email: 'admin@atleti.com', password: '123', name: 'Administrador', photoUrl: '', active: true };
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', 'admin-user'), defaultAdmin).catch(console.error);
        setUsersList([{ id: 'admin-user', ...defaultAdmin }]);
      } else if (uList.length > 0) {
        setUsersList(uList);
        if (appUser) { const updatedMe = uList.find(u => u.id === appUser.id); if (updatedMe) { setAppUser(updatedMe); setRole(updatedMe.role); } }
      }
      setDataLoaded(prev => ({...prev, users: true}));
    }, (error) => { console.error("Error leyendo usuarios:", error); setDataLoaded(prev => ({...prev, users: true})); });

    const unsubGk = onSnapshot(gkRef, (snapshot) => {
      const gks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (gks.length === 0 && user.uid) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', DUMMY_GOALKEEPER.id), DUMMY_GOALKEEPER).catch(console.error);
        setGoalkeepers([DUMMY_GOALKEEPER]);
      } else if (gks.length > 0) {
        setGoalkeepers(gks);
      }
      setDataLoaded(prev => ({...prev, gks: true}));
    }, (error) => { console.error("Error leyendo porteros:", error); setDataLoaded(prev => ({...prev, gks: true})); });

    const unsubRivals = onSnapshot(rivalsRef, (snapshot) => {
      setRivals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setDataLoaded(prev => ({...prev, rivals: true}));
    }, (error) => { console.error("Error leyendo rivales:", error); setDataLoaded(prev => ({...prev, rivals: true})); });

    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {
      const mList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(mList);
      const dbSeasons = Array.from(new Set(mList.map(m => m.season).filter(Boolean)));
      if (dbSeasons.length > 0) { setAvailableSeasons(prev => Array.from(new Set([...prev, ...dbSeasons])).sort().reverse()); }
      setDataLoaded(prev => ({...prev, matches: true}));
    }, (error) => { console.error("Error leyendo partidos:", error); setDataLoaded(prev => ({...prev, matches: true})); });

    return () => { unsubUsers(); unsubGk(); unsubRivals(); unsubMatches(); };
  }, [user, appUser]);

  const visibleGoalkeepers = useMemo(() => {
    if (role === 'admin' || role === 'staff') return goalkeepers;
    return goalkeepers.filter(gk => {
      const assigned = gk.assignedTo || [];
      if (Array.isArray(assigned)) { return assigned.includes('all') || assigned.includes(appUser?.id); }
      return assigned === 'all' || assigned === appUser?.id;
    });
  }, [goalkeepers, role, appUser]);

  const selectedGk = visibleGoalkeepers.find(gk => gk.id === selectedGkId) || visibleGoalkeepers[0] || DUMMY_GOALKEEPER;
  const currentUserData = usersList.find(u => u.id === appUser?.id) || {};

  const currentSeasonMatches = useMemo(() => {
    const seasonMatches = matches.filter(m => m.season === activeSeason || (!m.season && activeSeason === '2026/27'));
    if (role === 'admin') return seasonMatches;
    const visibleGkIds = visibleGoalkeepers.map(g => g.id);
    return seasonMatches.filter(m => m.goalkeeperIds?.some(id => visibleGkIds.includes(id)) || !m.goalkeeperIds || m.goalkeeperIds.length === 0);
  }, [matches, activeSeason, visibleGoalkeepers, role]);

  const showNotification = (msg, type = 'success') => { setNotification({ msg: String(msg), type }); setTimeout(() => setNotification(null), 3000); };

  const handleSeasonChange = (e) => { if (e.target.value === 'add_new') { setIsAddSeasonModalOpen(true); } else { setActiveSeason(e.target.value); } };

  const handleLogout = () => { setAppUser(null); setRole(null); };

  const handleSaveDoc = async (collectionName, data, isNew, successMsg) => {
    if (!db) return null;
    const docId = data.id || `${collectionName}-${Date.now()}`;
    let finalData = { ...data, id: docId };

    if (collectionName === 'goalkeepers' && isNew) {
      if(!finalData.stats) finalData.stats = { minutes: 0, starts: 0, subs: 0, goalsConceded: 0, cleanSheets: 0, penaltiesSaved: 0, penaltiesFaced: 0, teamMatches: 0, calledUpMatches: 0, playedMatches: 0, teamMinutes: 0 };
      if(!finalData.skills) finalData.skills = DUMMY_GOALKEEPER.skills;
      if(!finalData.performanceData) finalData.performanceData = [];
      if(!finalData.lastMatches) finalData.lastMatches = [];
      if(!finalData.form) finalData.form = 5.0;
      if(!finalData.age && finalData.birthYear) finalData.age = new Date().getFullYear() - parseInt(finalData.birthYear);
    }
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId), finalData, { merge: true });
      showNotification(successMsg); return docId;
    } catch (e) { showNotification(`Error al guardar en ${collectionName}`, "error"); return null; }
  };

  const handleSaveProfile = async (profileData) => {
    const updateData = { ...profileData };
    if (updateData.newPassword) { updateData.password = updateData.newPassword; }
    delete updateData.newPassword;
    await handleSaveDoc('users', updateData, false, "Perfil actualizado");
  };

  const handleSaveTechDecision = async (decisionData) => {
    if (!db || !selectedGkId) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId), { technicalDecision: decisionData }, { merge: true });
      showNotification("Decisión Técnica guardada con éxito"); setIsTechDecModalOpen(false);
    } catch(e) { showNotification("Error al guardar decisión", "error"); }
  };

  const handleSaveMatchPlan = async (planData) => {
    if (!db || !selectedGkId) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId), { matchPlan: planData }, { merge: true });
      showNotification("Plan de Partido guardado con éxito"); setIsMatchPlanModalOpen(false);
    } catch(e) { showNotification("Error al guardar plan de partido", "error"); }
  };

  const handleSaveStats = async (statsData) => {
    if (!db || !selectedGkId) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId), { form: statsData.form, stats: statsData.stats }, { merge: true });
      showNotification("Estadísticas actualizadas con éxito"); setIsStatsModalOpen(false);
    } catch(e) { showNotification("Error al guardar estadísticas", "error"); }
  };

  const handleDeleteDoc = async (collectionName, id) => {
    if (!db) return;
    if (!window.confirm('¿Seguro que deseas eliminar este elemento?')) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id)); showNotification("Elemento eliminado");
    } catch (e) { showNotification("Error al eliminar", "error"); }
  };

  const downloadBackup = () => {
    const backupData = { goalkeepers, users: usersList, rivals, matches, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `atleti_plan_partido_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showNotification("Backup descargado con éxito");
  };

  if (loadingAuth || (user && isDataLoading)) {
    return <div className="flex h-screen items-center justify-center bg-blue-950 text-white font-sans"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!appUser) return <LoginScreen users={usersList} onLogin={(u) => { setAppUser(u); setRole(u.role); }} />;

  const theme = {
    bg: darkMode ? 'dark bg-slate-900' : 'bg-slate-50',
    card: darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    text: darkMode ? 'text-slate-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
    border: darkMode ? 'border-slate-700' : 'border-slate-200'
  };

  const renderModule = () => {
    if (selectedGkId && currentModule === 'reporte_detalle') {
      return (
        <div className="space-y-4 pb-16 md:pb-0">
          <button onClick={() => setCurrentModule('porteros')} className="no-print text-sm font-bold text-slate-500 hover:text-blue-950 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 mb-2 transition-colors uppercase tracking-widest">← Volver a la lista</button>
          <DashboardView gk={selectedGk} allGks={visibleGoalkeepers} matches={currentSeasonMatches} rivals={rivals} theme={theme} darkMode={darkMode} activeSeason={activeSeason} onEditTechDec={() => setIsTechDecModalOpen(true)} onEditStats={() => setIsStatsModalOpen(true)} onEditMatchPlan={() => setIsMatchPlanModalOpen(true)} exportTrigger={exportTrigger} resetExportTrigger={() => setExportTrigger(0)} showNotification={showNotification} isDataLoading={isDataLoading} role={role} />
        </div>
      );
    }
    switch (currentModule) {
      case 'inicio': return <ModuleInicio gks={visibleGoalkeepers} matches={currentSeasonMatches} rivals={rivals} theme={theme} setModule={setCurrentModule} darkMode={darkMode} onEditMatch={(m) => { setEditingMatch(m); setIsMatchFormOpen(true); }} onDeleteMatch={(id) => handleDeleteDoc('matches', id)} isDataLoading={isDataLoading} currentUserData={currentUserData} viewLockerRoom={viewLockerRoom} setViewLockerRoom={setViewLockerRoom} onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)} role={role} />;
      case 'porteros': return <ModulePorteros gks={visibleGoalkeepers} role={role} onSelect={(id) => { setSelectedGkId(id); setCurrentModule('reporte_detalle'); }} onNew={() => { setEditingGk(null); setIsGkFormOpen(true); }} onEdit={(gk) => { setEditingGk(gk); setIsGkFormOpen(true); }} onDelete={(id) => handleDeleteDoc('goalkeepers', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'partidos': return <ModulePartidos matches={currentSeasonMatches} rivals={rivals} gks={visibleGoalkeepers} role={role} onNew={() => { setEditingMatch(null); setIsMatchFormOpen(true); }} onEdit={(match) => { setEditingMatch(match); setIsMatchFormOpen(true); }} onDelete={(id) => handleDeleteDoc('matches', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'rivales': return <ModuleRivales rivals={rivals} role={role} onNew={() => {setEditingRival(null); setIsRivalFormOpen(true);}} onEdit={(rival) => {setEditingRival(rival); setIsRivalFormOpen(true);}} onDelete={(id) => handleDeleteDoc('rivals', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'comparador': return <ModuleComparador gks={visibleGoalkeepers} theme={theme} darkMode={darkMode} />;
      case 'ajustes': return <ModuleAjustes users={usersList} currentUserData={currentUserData} role={role} onNewUser={() => {setEditingUser(null); setIsUserFormOpen(true);}} onEditUser={(u) => {setEditingUser(u); setIsUserFormOpen(true);}} onSaveProfile={handleSaveProfile} onBackup={downloadBackup} theme={theme} darkMode={darkMode} />;
      default: return <ModuleInicio gks={visibleGoalkeepers} matches={currentSeasonMatches} rivals={rivals} theme={theme} setModule={setCurrentModule} darkMode={darkMode} isDataLoading={isDataLoading} currentUserData={currentUserData} viewLockerRoom={viewLockerRoom} setViewLockerRoom={setViewLockerRoom} onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)} role={role} />;
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100`}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white no-print transform transition-all ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-bold text-xs tracking-wide">{notification.msg}</span>
        </div>
      )}
      <aside className={`hidden md:flex w-24 lg:w-28 h-screen overflow-hidden flex-shrink-0 flex-col bg-blue-950 text-white no-print z-20 transition-colors`}>
        <div className={`h-24 flex items-center justify-center border-b border-blue-900/50 pt-4 pb-4 shrink-0`}><Shield className="w-12 h-12 text-red-600 drop-shadow-[0_0_12px_rgba(220,38,38,0.4)]" /></div>
        <nav className="flex-1 py-2 flex flex-col gap-0 items-center justify-center w-full">
          <SidebarItem darkMode={darkMode} icon={<Home/>} label="INICIO" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
          <SidebarItem darkMode={darkMode} icon={<User/>} label="PORTEROS" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
          <SidebarItem darkMode={darkMode} icon={<CalendarDays/>} label="PARTIDOS" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
          {role !== 'staff' && <SidebarItem darkMode={darkMode} icon={<Swords/>} label="RIVALES" active={currentModule === 'rivales'} onClick={() => setCurrentModule('rivales')} />}
          <SidebarItem darkMode={darkMode} icon={<GitCompare/>} label="COMPARA" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
          {role !== 'staff' && <SidebarItem darkMode={darkMode} icon={<Settings/>} label="AJUSTES" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />}
        </nav>
        <div className="p-4 border-t border-blue-900/50 bg-blue-950 flex flex-col items-center justify-center gap-2 shrink-0">
          <div className={`flex flex-col items-center gap-2 overflow-hidden text-center ${role !== 'staff' ? 'cursor-pointer' : ''}`} onClick={() => role !== 'staff' && setCurrentModule('ajustes')} title={role !== 'staff' ? "Ir a ajustes" : "Perfil"}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-950 font-black shadow-inner overflow-hidden shrink-0 border-2 border-blue-500">
              {currentUserData.photoUrl ? ( <img src={currentUserData.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: `center ${currentUserData.photoOffsetY ?? 50}%` }} alt=""/> ) : ( currentUserData.name ? currentUserData.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : (role === 'admin' ? 'AD' : 'EN') )}
            </div>
            <div className="flex flex-col truncate w-full"><span className="text-[10px] font-black text-white truncate leading-tight">{currentUserData.name ? currentUserData.name.split(' ')[0] : 'Usuario'}</span></div>
          </div>
          <button onClick={handleLogout} className="text-blue-300 hover:text-red-400 p-2 rounded-xl hover:bg-blue-900 transition-colors" title="Cerrar sesión"><LogOut size={16}/></button>
        </div>
      </aside>
      <nav className={`md:hidden fixed bottom-0 left-0 w-full h-16 bg-blue-950 text-white border-t border-blue-900 flex justify-around items-center z-50 px-2 no-print pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.2)] rounded-t-3xl`}>
          <BottomNavItem icon={<Home/>} label="Inicio" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
          <BottomNavItem icon={<User/>} label="Porteros" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
          <BottomNavItem icon={<CalendarDays/>} label="Partidos" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
          <BottomNavItem icon={<GitCompare/>} label="Compara" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
          {role !== 'staff' && <BottomNavItem icon={<Settings/>} label="Ajustes" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />}
      </nav>
      <main className="flex-1 flex flex-col h-screen overflow-hidden print-full-width relative bg-slate-50 dark:bg-slate-900">
        <header className={`h-20 flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b ${theme.border} bg-white dark:bg-slate-900 no-print z-10 relative`}>
          <div>
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white">{currentModule === 'reporte_detalle' ? 'INFORME DEL PORTERO' : currentModule}</h1>
            <p className={`text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold`}>Atlético de Madrid</p>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-auto">
               <Shield size={18} className="text-red-600" />
               <span className="text-lg lg:text-xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white drop-shadow-sm">ATLETI <span className="text-red-600">PLAN PARTIDO</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`px-2 py-1.5 md:px-4 md:py-2 rounded-xl border ${theme.border} bg-slate-100 dark:bg-slate-800 text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2`}>
              <select value={activeSeason} onChange={handleSeasonChange} className="bg-transparent outline-none cursor-pointer appearance-none text-slate-700 dark:text-slate-200">
                {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="add_new" className="font-bold text-blue-500">+ Añadir...</option>
              </select>
              <ChevronDown size={14} className="text-slate-500 pointer-events-none -ml-1" />
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border ${theme.border} bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`}>
              {darkMode ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            {currentModule === 'reporte_detalle' && (
              <button onClick={() => setExportTrigger(prev => prev + 1)} className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg shadow-red-900/20 font-black text-xs uppercase tracking-widest">
                <Download size={16} /> <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-24 md:pb-10">
          <div className="max-w-[1600px] mx-auto print-full-width">{renderModule()}</div>
        </div>
        {isGkFormOpen && <GkFormModal initialData={editingGk} users={usersList} onClose={() => setIsGkFormOpen(false)} onSave={(data) => handleSaveDoc('goalkeepers', data, !editingGk, "Portero guardado").then(id => {if(id){setIsGkFormOpen(false); if(!editingGk){setSelectedGkId(id); setCurrentModule('reporte_detalle');}}})} theme={theme} darkMode={darkMode} />}
        {isRivalFormOpen && <RivalFormModal initialData={editingRival} onClose={() => setIsRivalFormOpen(false)} onSave={(data) => handleSaveDoc('rivals', data, !editingRival, "Rival guardado").then(()=>setIsRivalFormOpen(false))} theme={theme} />}
        {isUserFormOpen && <UserFormModal initialData={editingUser} onClose={() => setIsUserFormOpen(false)} onSave={(data) => handleSaveDoc('users', data, !editingUser, "Usuario guardado").then(()=>setIsUserFormOpen(false))} theme={theme} />}
        {isMatchFormOpen && <MatchFormModal initialData={editingMatch} rivals={rivals} gks={visibleGoalkeepers} activeSeason={activeSeason} onClose={() => setIsMatchFormOpen(false)} onSave={(data) => handleSaveDoc('matches', data, !editingMatch, "Partido guardado").then(()=>setIsMatchFormOpen(false))} theme={theme} darkMode={darkMode} />}
        {isTechDecModalOpen && <TechDecisionModal initialData={selectedGk} onClose={() => setIsTechDecModalOpen(false)} onSave={handleSaveTechDecision} theme={theme} />}
        {isStatsModalOpen && <GkStatsModal initialData={selectedGk} onClose={() => setIsStatsModalOpen(false)} onSave={handleSaveStats} theme={theme} />}
        {isMatchPlanModalOpen && <MatchPlanModal initialData={selectedGk} onClose={() => setIsMatchPlanModalOpen(false)} onSave={handleSaveMatchPlan} theme={theme} />}
        {isAddSeasonModalOpen && <AddSeasonModal onClose={() => setIsAddSeasonModalOpen(false)} onSave={(newSeason) => { setAvailableSeasons(prev => Array.from(new Set([...prev, newSeason])).sort().reverse()); setActiveSeason(newSeason); setIsAddSeasonModalOpen(false); }} theme={theme} />}
        {lockerSelectedGk && <LockerPlanModal gk={lockerSelectedGk} onClose={() => setLockerSelectedGk(null)} theme={theme} darkMode={darkMode} />}
      </main>
    </div>
  );
}