import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, Plus, ChevronDown, CheckCircle2, AlertCircle, Goal, Edit2, X, Upload,
  Home, Users, CalendarDays, Swords, BarChart2, Database, Key, MapPin, RotateCcw, Activity,
  GitCompare, ArrowRight, ArrowLeft, LogOut, CloudRain, Target, Eye, Monitor, FileText, Trophy, 
  Zap, UploadCloud, Search, ChevronRight, User, Settings, Moon, Sun, Shield
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

// Normalizamos el appId para evitar errores de Firebase si contiene barras inclinadas
const appId = (typeof __app_id !== 'undefined' && __app_id) ? String(__app_id).replace(/[\/\\]/g, '_') : 'plan-de-partido';

// URL del escudo subido a GitHub (se usa en toda la app)
const ESCUDO_ATM_URL = "/Plan-de-Partido/escudo-atm.png";

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

// --- LISTA DE TUS EQUIPOS ---
const TEAMS_LIST = [
  "ALEVÍN A",
  "BENJAMÍN A",
  "BENJAMÍN B",
  "PREBENJAMÍN A"
];

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
// SISTEMA PDF ENTERPRISE PREMIUM (Vectorial jsPDF con Fotos Fundidas, Donuts, QR e Iconos)
// ==========================================

// Helper para cargar jsPDF
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

// Generador de SVG a Base64 para Iconos en PDF
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

// Generador de Gráficos "Donut"
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

// Helper para cargar fuentes personalizadas (Roboto) y replicar UI
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

// Cargador de fotos con FADE OUT en el fondo (Recrea la UI)
const loadGkPhotoBase64 = async (url, fallbackName, darkMode) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = 400; const height = 480; // Proporción retrato 4:5
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Recorte ajustado (equivalente a object-position: center 15%)
      const imgRatio = img.width / img.height;
      const targetRatio = width / height;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      
      if (imgRatio > targetRatio) {
        sWidth = img.height * targetRatio; sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / targetRatio; sy = (img.height - sHeight) * 0.15; 
      }
      
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
      
      // Aplicar máscara de fundido suave (Mask linear gradient desde el 40%)
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
    
    // Cargar Fuentes Personalizadas
    await loadCustomFonts(doc);

    // --- HELPER PARA ESCUDO RIVAL ---
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

    // Paleta Dinámica (Modo Día / Modo Noche)
    const p = darkMode ? {
      bg: [15, 23, 42],        // slate-900
      card: [30, 41, 59],      // slate-800
      cardAlt: [2, 6, 23],     // slate-950
      textMain: [255, 255, 255],
      textMuted: [148, 163, 184], // slate-400
      line: [51, 65, 85],      // slate-700
      watermark: [41, 52, 69], // blend
      accentRedBg: [127, 29, 29],   // red-900
      accentRedBorder: [153, 27, 27], // red-800
      accentRedTitle: [254, 202, 202], // red-200
      accentRedText1: [255, 255, 255],
      accentRedText2: [254, 226, 226]  // red-100
    } : {
      bg: [248, 250, 252],     // slate-50
      card: [255, 255, 255],   // white
      cardAlt: [241, 245, 249], // slate-100
      textMain: [15, 23, 42],  // slate-900
      textMuted: [100, 116, 139], // slate-500
      line: [226, 232, 240],   // slate-200
      watermark: [241, 245, 249], // slate-100
      accentRedBg: [255, 255, 255], // white
      accentRedBorder: [254, 202, 202], // red-200
      accentRedTitle: [220, 38, 38], // red-600
      accentRedText1: [15, 23, 42],  // slate-900
      accentRedText2: [71, 85, 105]  // slate-600
    };

    // Calcular Datos
    const teamMatches = gk.stats?.teamMatches || Math.max(matches.length, (gk.stats?.starts || 0) + (gk.stats?.subs || 0));
    const teamMinutes = gk.stats?.teamMinutes || teamMatches * 90;
    const playedMatches = gk.stats?.playedMatches || ((gk.stats?.starts || 0) + (gk.stats?.subs || 0));
    
    const minsPercent = teamMinutes > 0 ? Math.round(((gk.stats?.minutes || 0) / teamMinutes) * 100) : 0;
    const startsPercent = teamMatches > 0 ? Math.round(((gk.stats?.starts || 0) / teamMatches) * 100) : 0;
    const subsPercent = teamMatches > 0 ? Math.round(((gk.stats?.subs || 0) / teamMatches) * 100) : 0;
    const goalsPercent = playedMatches > 0 ? Math.min(100, Math.round(((gk.stats?.goalsConceded || 0) / playedMatches) * 50)) : 0;
    const cleanSheetsPercent = playedMatches > 0 ? Math.round(((gk.stats?.cleanSheets || 0) / playedMatches) * 100) : 0;
    const penaltiesPercent = (gk.stats?.penaltiesFaced || 0) > 0 ? Math.round(((gk.stats?.penaltiesSaved || 0) / gk.stats.penaltiesFaced) * 100) : 0;

    // ==========================================
    // LÓGICA CORREGIDA: PRÓXIMO PARTIDO (SOLO FUTUROS)
    // ==========================================
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignorar la hora, solo fecha

    const gkMatchesForPdf = matches.filter(m => m.goalkeeperIds?.includes(gk.id));
    
    // Ordenamos de más cercano a más lejano y filtramos solo los que son HOY o en el FUTURO
    const futureMatches = gkMatchesForPdf
      .map(m => ({ ...m, parsedDate: new Date(m.date) }))
      .filter(m => {
         m.parsedDate.setHours(0,0,0,0);
         return m.parsedDate >= today;
      })
      .sort((a, b) => a.parsedDate - b.parsedDate);

    const nextMatchPdf = futureMatches.length > 0 ? futureMatches[0] : null;
    const rivalPdf = nextMatchPdf ? rivals.find(r => r.id === nextMatchPdf.rivalId) : null;
    // ==========================================

    // Generar URL para QR apuntando a la VISTA PÚBLICA de tu app
    const baseUrl = window.location.origin + window.location.pathname;
    const statsUrl = `${baseUrl}?public_gk=${gk.id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(statsUrl)}&color=0b132b&margin=10`;

    // Carga de Recursos Asíncronos
    const iconActColor = darkMode ? '#ffffff' : '#0f172a';
    const [photoB64, iTarget, iShield, iSwords, iGit, iGoal, iCalendar, iPin, iActivity, rivalShieldB64, qrB64, atletiShieldB64] = await Promise.all([
      loadGkPhotoBase64(gk.photoUrl, gk.name, darkMode),
      loadIconB64('target', '#3b82f6'), loadIconB64('shield', '#ef4444'), loadIconB64('swords', '#10b981'),
      loadIconB64('gitCompare', '#3b82f6'), loadIconB64('goal', '#eab308'), loadIconB64('calendar', '#3b82f6'),
      loadIconB64('mapPin', '#ef4444'), loadIconB64('activity', iconActColor),
      loadImgToB64(rivalPdf?.shieldUrl),
      loadImgToB64(qrApiUrl),
      loadImgToB64(ESCUDO_ATM_URL)
    ]);

    const pageWidth = 297; const pageHeight = 210;

    const drawBackground = () => {
      doc.setFillColor(...p.bg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const drawHeader = () => {
      doc.setTextColor(...p.textMain);
      doc.setFont("Roboto", "bolditalic");
      
      // Tracking-tighter effect para el título
      doc.setFontSize(26);
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.8);
      doc.text("ATLETI PLAN PARTIDO", 15, 22);
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0); // reset
      
      doc.setFontSize(10);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(...p.textMuted);
      doc.text("DEPARTAMENTO DE PORTEROS • ATLÉTICO DE MADRID", 15, 29);

      // Badge Temporada
      doc.setFillColor(220, 38, 38); // red-600
      doc.roundedRect(pageWidth - 65, 14, 50, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("Roboto", "bold");
      doc.text(`Temp. ${activeSeason}`, pageWidth - 40, 21, { align: 'center' });
      
      // Separador
      doc.setDrawColor(...p.line);
      doc.setLineWidth(0.5);
      doc.line(15, 36, pageWidth - 15, 36);
    };

    // --- PÁGINA 1: PORTADA PREMIUM ---
    doc.setFillColor(11, 19, 43); // Deep Navy Blue background for cover
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Watermark Background
    doc.setTextColor(20, 30, 60);
    doc.setFontSize(250);
    doc.setFont("Roboto", "bolditalic");
    doc.text(String(gk.number || ''), pageWidth / 2 + 70, 160, { align: 'center' });

    // Código QR Dinámico en la esquina superior derecha de la Portada
    if (qrB64) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - 38, 14, 23, 23, 2, 2, 'F'); // Placa blanca de respaldo del QR
      doc.addImage(qrB64, 'PNG', pageWidth - 36.5, 15.5, 20, 20);
    }

    // LEFT HALF (Match Details)
    const leftCX = 74;

    if (nextMatchPdf) {
      // League Pill
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(leftCX - 60, 35, 120, 8, 4, 4, 'F'); 
      doc.setTextColor(11, 19, 43);
      doc.setFontSize(8.5); 
      doc.setFont("Roboto", "bold");
      const leagueText = `${nextMatchPdf.league || 'LIGA'} • ${nextMatchPdf.group || 'GRUPO'} • JORNADA ${nextMatchPdf.matchday || '-'}`;
      doc.text(leagueText.toUpperCase(), leftCX, 40.5, { align: 'center' }); 

      // Venue & Date
      doc.setTextColor(239, 68, 68); // Corporate Red
      doc.setFontSize(12);
      doc.setFont("Roboto", "bold");
      if (iPin) doc.addImage(iPin, 'PNG', leftCX - doc.getTextWidth(nextMatchPdf.field || 'CAMPO POR DEFINIR')/2 - 10, 48.5, 6, 6);
      doc.text((nextMatchPdf.field || 'CAMPO POR DEFINIR').toUpperCase(), leftCX, 53, { align: 'center' });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(formatDate(nextMatchPdf.date), leftCX, 61, { align: 'center' });

      // Matchup Area
      const shieldY = 90;

      // Atleti
      if (atletiShieldB64) {
          doc.addImage(atletiShieldB64, 'PNG', leftCX - 40 - 15, shieldY, 32, 32);
      } else if (iShield) {
          doc.addImage(iShield, 'PNG', leftCX - 40 - 15, shieldY, 32, 32);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("Roboto", "bold");
      doc.text((nextMatchPdf.myTeam || 'ATLETI').toUpperCase(), leftCX - 39, shieldY + 42, { align: 'center', maxWidth: 45 });

      // Time
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(leftCX - 20, shieldY + 6, 40, 16, 6, 6, 'F'); 
      doc.setTextColor(11, 19, 43);
      doc.setFontSize(22); 
      doc.setFont("Roboto", "bolditalic");
      doc.text(nextMatchPdf.time || '--:--', leftCX, shieldY + 18, { align: 'center' }); 
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2);
      doc.text("HORA", leftCX, shieldY + 33, { align: 'center' });
      if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

      // Rival
      if (rivalShieldB64) {
          doc.addImage(rivalShieldB64, 'PNG', leftCX + 10 + 15, shieldY, 32, 32);
      } else if (iSwords) {
          doc.addImage(iSwords, 'PNG', leftCX + 10 + 15, shieldY, 32, 32);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("Roboto", "bold");
      doc.text((rivalPdf?.name || 'RIVAL').toUpperCase(), leftCX + 41, shieldY + 42, { align: 'center', maxWidth: 45 });

      // Match Stats Bottom Left
      const statsY = 168;

      doc.setTextColor(148, 163, 184); 
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.text("GOLES RIVAL", leftCX - 35, statsY, {align: 'center'});
      
      doc.setFillColor(255, 255, 255); 
      doc.roundedRect(leftCX - 50, statsY + 4, 30, 14, 7, 7, 'F'); 
      doc.setTextColor(239, 68, 68); 
      doc.setFontSize(24);
      doc.setFont("Roboto", "bolditalic");
      doc.text(String(nextMatchPdf.goalsScored || rivalPdf?.goalsScored || '0'), leftCX - 35, statsY + 15, {align: 'center'});

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.text("RACHA RIVAL", leftCX + 35, statsY, {align: 'center'});
      
      if (nextMatchPdf.streak && nextMatchPdf.streak.length > 0) {
          let stX = leftCX + 35 - ((nextMatchPdf.streak.length * 12) / 2) + 6;
          nextMatchPdf.streak.forEach(res => {
              if (res === 'V') doc.setFillColor(16, 185, 129); // Emerald
              else if (res === 'E') doc.setFillColor(59, 130, 246); // Blue
              else doc.setFillColor(239, 68, 68); // Red

              doc.circle(stX, statsY + 11, 5, 'F'); 
              doc.setTextColor(255,255,255);
              doc.setFontSize(9); 
              doc.setFont("Roboto", "bold");
              doc.text(res, stX, statsY + 11, {align: 'center', baseline: 'middle'}); 
              stX += 12;
          });
      } else {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(14);
          doc.text("--", leftCX + 35, statsY + 11, {align: 'center'});
      }
    } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("Roboto", "bold");
        doc.text("SIN PARTIDO PROGRAMADO", leftCX, 100, { align: 'center' });
    }

    // Separator line
    if(typeof doc.setGState === 'function') {
        doc.setDrawColor(255, 255, 255);
        doc.setGState(new doc.GState({opacity: 0.1}));
        doc.line(148.5, 20, 148.5, pageHeight - 20);
        doc.setGState(new doc.GState({opacity: 1}));
    }

    // RIGHT HALF (Player Details)
    const rightCX = 222;

    // Polaroid
    const polW = 65;
    const polH = 85;
    const polX = rightCX - polW/2;
    const polY = 35;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(polX, polY, polW, polH, 2, 2, 'F');
    if (photoB64) {
        doc.addImage(photoB64, 'PNG', polX + 3, polY + 3, polW - 6, polH - 18);
    }
    
    doc.setTextColor(11, 19, 43);
    doc.setFontSize(6);
    doc.setFont("Roboto", "bold");
    doc.text(gk.team.toUpperCase(), polX + 3, polY + polH - 9);
    doc.setFontSize(9);
    doc.text(`${gk.number} - ${gk.name.toUpperCase()}`, polX + 3, polY + polH - 3);

    // Titles below photo
    doc.setTextColor(212, 175, 55); // Gold
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2);
    doc.text("PLAN DE PARTIDO", rightCX, polY + polH + 18, { align: 'center' });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("Roboto", "bolditalic");
    doc.text(`${gk.number} - ${gk.name.toUpperCase()}`, rightCX, polY + polH + 32, { align: 'center' });

    // Footer Text
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("Roboto", "bold");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(2);
    doc.text("DEPARTAMENTO DE PORTEROS", pageWidth / 2, pageHeight - 12, { align: 'center' });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    // --- PÁGINA 2: DASHBOARD (Antigua Página 1) ---
    doc.addPage();
    drawBackground();
    drawHeader();

    // 1. TARJETA DE PERFIL (Izquierda)
    doc.setFillColor(...p.card);
    doc.setDrawColor(...p.line);
    doc.roundedRect(15, 45, 85, 150, 4, 4, 'FD');

    // Número de fondo gigante (Marca de agua)
    doc.setTextColor(...p.watermark);
    doc.setFont("Roboto", "bolditalic");
    doc.setFontSize(140);
    doc.text(String(gk.number || ''), 80, 160, { align: 'right', angle: 0 });

    // Fotografía Fundida
    if (photoB64) {
      doc.addImage(photoB64, 'PNG', 15, 45, 85, 102);
    }
    
    // Títulos de Jugador
    doc.setTextColor(...p.textMain);
    doc.setFontSize(26);
    doc.setFont("Roboto", "bolditalic");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.5);
    doc.text(gk.name.toUpperCase(), 57, 137, { align: 'center', maxWidth: 80 });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);
    
    doc.setTextColor(239, 68, 68); // red-500
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.text(`#${gk.number || '-'} | ${gk.team.toUpperCase()}`, 57, 144, { align: 'center' });

    // Información Perfil
    let py = 158;
    const addProfileRow = (label, val) => {
      doc.setTextColor(...p.textMuted);
      doc.setFont("Roboto", "bold");
      doc.setFontSize(9);
      doc.text(label.toUpperCase(), 22, py);
      
      doc.setTextColor(...p.textMain);
      doc.text(String(val).toUpperCase(), 93, py, { align: 'right' });
      
      doc.setDrawColor(...p.line);
      doc.setLineWidth(0.2);
      doc.line(22, py + 3, 93, py + 3);
      py += 11;
    };

    addProfileRow("Nacionalidad", gk.nationality || '--');
    addProfileRow("Edad", `${gk.age || '--'} años`);
    addProfileRow("Pie Domin.", gk.foot || '--');

    // Caja Estado de Forma
    doc.setFillColor(...p.cardAlt);
    doc.setDrawColor(...p.line);
    doc.roundedRect(22, 175, 71, 15, 2, 2, 'FD'); 
    if (iActivity) doc.addImage(iActivity, 'PNG', 26, 178, 9, 9);
    doc.setTextColor(...p.textMuted);
    doc.setFontSize(7);
    doc.setFont("Roboto", "bold");
    doc.text("FORMA ACTUAL", 38, 184);
    
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.setFontSize(16);
    doc.text(String(gk.form || '5.0'), 88, 185, { align: 'right' });

    // 2. PANEL DERECHO
    const rightX = 108;
    
    // Título Estadísticas
    doc.setTextColor(...p.textMain);
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("ESTADÍSTICAS GLOBALES TEMPORADA", rightX, 50);

    // Grillas con Donuts
    let statY = 56;
    const drawStatBox = (px, py, title, val, subtitle, colorHex, percent) => {
      doc.setFillColor(...p.card); 
      doc.setDrawColor(...p.line);
      doc.roundedRect(px, py, 54, 30, 3, 3, 'FD');
      
      doc.setTextColor(...p.textMuted);
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.text(title.toUpperCase(), px + 5, py + 8);
      
      doc.setTextColor(...p.textMain);
      doc.setFontSize(18);
      doc.text(String(val), px + 5, py + 19);

      doc.setTextColor(...p.textMuted);
      doc.setFontSize(7);
      doc.setFont("Roboto", "normal");
      doc.text(subtitle, px + 5, py + 26);

      const donutB64 = generateDonutBase64(percent, colorHex, darkMode);
      doc.addImage(donutB64, 'PNG', px + 33, py + 10, 17, 17);
    };

    drawStatBox(rightX, statY, "Minutos Jugados", gk.stats?.minutes || 0, "min. jugados totales", "#3b82f6", minsPercent);
    drawStatBox(rightX + 59, statY, "Titularidades", gk.stats?.starts || 0, `${gk.stats?.starts || 0} de ${teamMatches} partidos`, "#8b5cf6", startsPercent);
    drawStatBox(rightX + 118, statY, "Suplencias", gk.stats?.subs || 0, `${gk.stats?.subs || 0} de ${teamMatches} partidos`, "#6366f1", subsPercent);
    
    statY += 34;
    drawStatBox(rightX, statY, "Goles Encajados", gk.stats?.goalsConceded || 0, `Promedio: ${playedMatches ? ((gk.stats?.goalsConceded || 0) / playedMatches).toFixed(2) : 0}`, "#ef4444", goalsPercent);
    drawStatBox(rightX + 59, statY, "Porterías Cero", gk.stats?.cleanSheets || 0, "Ratio clean sheets", "#10b981", cleanSheetsPercent);
    drawStatBox(rightX + 118, statY, "Penaltis Parados", gk.stats?.penaltiesSaved || 0, `De ${gk.stats?.penaltiesFaced || 0} penaltis`, "#06b6d4", penaltiesPercent);

    // Plan de Partido
    const planY = statY + 41;
    doc.setTextColor(...p.textMain);
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    if (iTarget) doc.addImage(iTarget, 'PNG', rightX, planY - 4, 5, 5);
    doc.text("PLAN DE PARTIDO & DECISIÓN TÉCNICA", rightX + 7, planY);

    // Caja Plan
    doc.setFillColor(...p.card);
    doc.setDrawColor(...p.line);
    doc.roundedRect(rightX, planY + 6, 113, 56, 3, 3, 'FD');

    let pLineY = planY + 16;
    const addPlanLine = (title, text, iconImage) => {
      if (iconImage) doc.addImage(iconImage, 'PNG', rightX + 4, pLineY - 3, 4, 4);
      doc.setTextColor(...p.textMuted);
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.text(title, rightX + 10, pLineY);
      
      doc.setTextColor(...p.textMain);
      doc.setFont("Roboto", "normal");
      doc.text(text || '--', rightX + 10, pLineY + 5, { maxWidth: 100 });
      pLineY += 12;
    };

    addPlanLine("OBJ. DEFENSIVO", gk.matchPlan?.defensive, iShield);
    addPlanLine("OBJ. OFENSIVO", gk.matchPlan?.offensive, iSwords);
    addPlanLine("OBJ. TÁCTICO", gk.matchPlan?.tactical, iGit);
    addPlanLine("ASPECTOS CLAVES", gk.matchPlan?.keyAspects, iGoal);

    // Caja Decisión Técnica
    doc.setFillColor(...p.accentRedBg);
    doc.setDrawColor(...p.accentRedBorder);
    doc.roundedRect(rightX + 118, planY + 6, 54, 56, 3, 3, 'FD');

    doc.setTextColor(...p.accentRedTitle);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.text("RECOMENDACIÓN", rightX + 124, planY + 15);
    
    doc.setDrawColor(239, 68, 68);
    doc.line(rightX + 124, planY + 18, rightX + 166, planY + 18);

    doc.setTextColor(...p.accentRedText1);
    doc.setFontSize(11);
    doc.setFont("Roboto", "bolditalic");
    doc.text(gk.technicalDecision?.title || 'Pendiente', rightX + 124, planY + 25, { maxWidth: 45 });

    doc.setTextColor(...p.accentRedText2);
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.text(gk.technicalDecision?.reason || '--', rightX + 124, planY + 36, { maxWidth: 45 });

    // --- PÁGINA 3: HISTORIAL DE PARTIDOS (Paginación automática) ---
    doc.addPage();
    drawBackground();
    drawHeader();

    if (iCalendar) doc.addImage(iCalendar, 'PNG', 15, 43, 6, 6);
    doc.setTextColor(...p.textMain);
    doc.setFontSize(16);
    doc.setFont("Roboto", "bolditalic");
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(-0.5);
    doc.text("HISTORIAL COMPLETO DE PARTIDOS", 23, 48);
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);

    // Header Tabla
    let tY = 56;
    doc.setFillColor(...p.card);
    doc.setDrawColor(...p.line);
    doc.roundedRect(15, tY, pageWidth - 30, 10, 2, 2, 'FD');
    
    doc.setTextColor(...p.textMuted);
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    doc.text("FECHA", 20, tY + 7);
    doc.text("COMPETICIÓN", 60, tY + 7);
    doc.text("RIVAL", 140, tY + 7);
    doc.text("CAMPO", 200, tY + 7);
    doc.text("GOLES", 265, tY + 7);
    tY += 14;

    const gkMatchesAll = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenados del más reciente al más antiguo para el historial
    
    if (gkMatchesAll.length === 0) {
      doc.setTextColor(...p.textMain);
      doc.setFont("Roboto", "normal");
      doc.text("No hay partidos registrados en el historial para este portero.", 20, tY + 5);
    } else {
      gkMatchesAll.forEach((m) => {
        if (tY > pageHeight - 20) {
          doc.addPage();
          drawBackground();
          drawHeader();
          tY = 40;
        }

        const rival = rivals.find(r => r.id === m.rivalId);
        
        doc.setDrawColor(...p.line);
        doc.line(15, tY + 10, pageWidth - 15, tY + 10);
        
        doc.setTextColor(...p.textMuted);
        doc.setFont("Roboto", "normal");
        doc.text(m.date || '--', 20, tY + 6);
        
        doc.text(`${m.league || '--'} ${m.matchday ? `(J${m.matchday})` : ''}`, 60, tY + 6);
        
        doc.setTextColor(...p.textMain);
        doc.setFont("Roboto", "bold");
        doc.text(rival?.name?.toUpperCase() || 'DESCONOCIDO', 140, tY + 6, { maxWidth: 55 });
        
        doc.setTextColor(...p.textMuted);
        doc.setFont("Roboto", "normal");
        if (iPin) doc.addImage(iPin, 'PNG', 196, tY + 3, 3, 3);
        doc.text(m.field || '--', 200, tY + 6, { maxWidth: 60 });
        
        doc.setTextColor(239, 68, 68); // Goles siempre rojos para destacar
        doc.setFont("Roboto", "bold");
        doc.text(String(m.goalsScored || rival?.goalsScored || '-'), 265, tY + 6);
        
        tY += 12;
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
// GENERADOR DE PDF MAESTRO (VERSIÓN ÉLITE ESTRUCTURADA - CORRECCIÓN LOGO Y MEDALLA VECTORIAL)
// ==========================================
const exportarInformePDFVectorial = async (gk, informe, darkMode, showNotification) => {
  try {
    showNotification(`Generando PDF Premium de ${informe.tipo.toUpperCase()}...`, "success");
    
    const jspdfModule = await loadJsPDF();
    const doc = new jspdfModule.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadCustomFonts(doc);

    const p = { 
      bg: [248, 250, 252], 
      textMain: [15, 23, 42], 
      textMuted: [100, 116, 139], 
      line: [226, 232, 240], 
      card: [255, 255, 255], 
      accent: [220, 38, 38], // Rojo Atleti
      blueDark: [11, 19, 43] // Azul Marino Atleti
    };

    const photoB64 = await loadGkPhotoBase64(gk.photoUrl, gk.name, false);
    
    const safeImgLoad = (url) => new Promise(resolve => {
        if(!url) return resolve(null);
        const img = new Image(); img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null); img.src = url;
    });

    const [atletiShieldB64, rivalShieldB64, torneoLogoB64, iActivity, iTarget, iGit] = await Promise.all([
        safeImgLoad(ESCUDO_ATM_URL),
        informe.rivalId ? safeImgLoad(rivals?.find(r => r.id === informe.rivalId)?.shieldUrl) : Promise.resolve(null),
        informe.logoTorneo ? safeImgLoad(informe.logoTorneo) : Promise.resolve(null),
        loadIconB64('activity', '#e11d48'), 
        loadIconB64('target', '#3b82f6'), 
        loadIconB64('gitCompare', '#10b981')
    ]);

    const pageWidth = 210; const pageHeight = 297;

    // ==========================================
    // 1. PORTADA PREMIUM
    // ==========================================
    doc.setFillColor(...p.blueDark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(20, 30, 60);
    doc.setFontSize(250);
    doc.setFont("Roboto", "bolditalic");
    doc.text(String(gk.number || ''), pageWidth / 2, 220, { align: 'center' });

    if (photoB64) doc.addImage(photoB64, 'PNG', 35, 40, 140, 168);
    
    const titulos = {
      'objetivos': "PLANIFICACIÓN Y OBJETIVOS",
      'partido': "ANÁLISIS DE RENDIMIENTO EN PARTIDO",
      'flash': "INFORME DE SCOUTING FLASH",
      'torneo': "INFORME DE TORNEO",
      'semestral': "EVALUACIÓN DE RENDIMIENTO SEMESTRAL"
    };
    const tituloString = titulos[informe.tipo] || "INFORME TÉCNICO";
    
    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(212, 175, 55); 
    const tituloWidth = doc.getTextWidth(tituloString);
    const centerX = (pageWidth - tituloWidth) / 2;
    doc.text(tituloString, centerX, 230);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont("Roboto", "bolditalic");
    doc.text(gk.name.toUpperCase(), pageWidth / 2, 242, { align: 'center' });

    doc.setFillColor(220, 38, 38);
    let subtitleText = `${gk.team || 'ATLETI'} | ${informe.fecha || ''}`;
    if (informe.tipo === 'torneo' && informe.titulo) subtitleText = `${informe.titulo.toUpperCase()} | ${gk.team} | ${informe.fecha}`;
    
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    const textWidth = doc.getTextWidth(subtitleText) + 8;
    doc.roundedRect((pageWidth / 2) - (textWidth / 2), 249, textWidth, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(subtitleText, pageWidth / 2, 253.5, { align: 'center' });

    // Logos Inferiores Alineados
    if (atletiShieldB64) doc.addImage(atletiShieldB64, 'PNG', pageWidth - 45, 255, 30, 30);
    if (informe.tipo === 'torneo' && torneoLogoB64) {
        // Logo de torneo equilibrado en la izquierda, misma altura
        doc.addImage(torneoLogoB64, 'PNG', 15, 255, 30, 30); 
    }

    // ==========================================
    // 2. SISTEMA DE DIBUJO ESTRUCTURADO (INTERIOR)
    // ==========================================
    doc.addPage();
    doc.setFillColor(...p.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let currentY = 45;

    const drawPageHeader = () => {
        doc.setFillColor(...p.card); doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setDrawColor(...p.line); doc.setLineWidth(0.5); doc.line(0, 30, pageWidth, 30);
        doc.setTextColor(...p.textMain); doc.setFontSize(18); doc.setFont("Roboto", "bolditalic");
        doc.text(tituloString, 15, 18);
        doc.setFontSize(9); doc.setFont("Roboto", "bold"); doc.setTextColor(...p.textMuted);
        
        let subtitleHeader = informe.fecha || '';
        if (informe.tipo === 'torneo') subtitleHeader = `${informe.titulo || ''} • ${gk.team} • ${informe.fecha}`;
        else if (informe.rival) subtitleHeader = `VS ${informe.rival.toUpperCase()} • ${informe.fecha}`;
        
        doc.text(subtitleHeader, 15, 24);
        if (atletiShieldB64) doc.addImage(atletiShieldB64, 'PNG', pageWidth - 25, 5, 20, 20);
        if (informe.tipo === 'torneo' && torneoLogoB64) doc.addImage(torneoLogoB64, 'PNG', 150, 5, 20, 20);
    };
    drawPageHeader();

    const checkPageBreak = (requiredHeight) => {
        if (currentY + requiredHeight > pageHeight - 20) {
            doc.addPage(); doc.setFillColor(...p.bg); doc.rect(0, 0, pageWidth, pageHeight, 'F');
            drawPageHeader(); currentY = 45;
            return true;
        }
        return false;
    };

    const printHeader = (title, iconB64 = null) => {
        checkPageBreak(15);
        if (iconB64) {
            doc.addImage(iconB64, 'PNG', 15, currentY - 1, 6, 6);
            doc.setTextColor(...p.textMain); doc.setFontSize(12); doc.setFont("Roboto", "bold");
            doc.text(title.toUpperCase(), 23, currentY + 3.5);
        } else {
            doc.setFillColor(...p.accent); doc.roundedRect(15, currentY, 4, 8, 1, 1, 'F');
            doc.setTextColor(...p.textMain); doc.setFontSize(12); doc.setFont("Roboto", "bold");
            doc.text(title.toUpperCase(), 23, currentY + 6.5);
        }
        currentY += 12;
    };

    const printBox = (x, y, w, h, label, value, bg = p.card) => {
        doc.setFillColor(...bg); doc.setDrawColor(...p.line); doc.roundedRect(x, y, w, h, 2, 2, 'FD');
        doc.setTextColor(...p.textMuted); doc.setFontSize(7); doc.setFont("Roboto", "bold"); 
        if (bg !== p.card) doc.setTextColor(203, 213, 225); 
        doc.text(label.toUpperCase(), x + 4, y + 5.5);
        if (bg === p.card) doc.setTextColor(...p.textMain); else doc.setTextColor(255, 255, 255);
        doc.setFontSize(11); doc.setFont("Roboto", "bolditalic"); doc.text(String(value || '--'), x + 4, y + 12, { maxWidth: w - 8 });
    };

    const printText = (label, text) => {
        if (!text || text.trim() === '') return;
        const width = pageWidth - 30; doc.setFont("Roboto", "normal"); doc.setFontSize(9);
        const lines = doc.splitTextToSize(String(text), width - 10);
        const h = (lines.length * 4.5) + 12;
        checkPageBreak(h + 5);
        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, width, h, 2, 2, 'FD');
        doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(label.toUpperCase(), 20, currentY + 7);
        doc.setTextColor(...p.textMain); doc.setFontSize(9); doc.setFont("Roboto", "normal"); doc.text(lines, 20, currentY + 13.5);
        currentY += h + 4;
    };

    const printDots = (x, y, label, scoreStr, max = 4, isRightCol = false) => {
        const score = parseInt(scoreStr) || 0;
        doc.setTextColor(...p.textMain); doc.setFontSize(8); doc.setFont("Roboto", "bold");
        let safeLabel = label; if(doc.getTextWidth(safeLabel) > 40) safeLabel = safeLabel.substring(0, 18) + '...';
        doc.text(safeLabel, x, y);
        let dX = isRightCol ? x + 40 : x + 50; 
        for(let i=1; i<=max; i++) {
           doc.setFillColor(i <= score ? p.accent[0] : 226, i <= score ? p.accent[1] : 232, i <= score ? p.accent[2] : 240);
           doc.circle(dX, y - 1.2, 1.8, 'F'); dX += 6;
        }
        doc.setTextColor(...p.textMuted); doc.setFontSize(7); doc.text(`${score}/${max}`, dX + 2, y);
    };

    const getValColor = (valStr) => {
        if (!valStr) return p.card; const upper = valStr.toUpperCase();
        if (upper === 'BAJA') return [220, 38, 38];   
        if (upper === 'MEDIA') return [249, 115, 22]; 
        if (upper === 'ALTA') return [234, 179, 8];   
        if (upper === 'EXCEPCIONAL') return [16, 185, 129]; 
        return p.accent; 
    };

    // Helper Dibujo Vectorial Medalla/Copa
    const drawMedalIcon = (x, y, rank) => {
        if (rank === 1) { // Copa Dorada
            doc.setFillColor(250, 204, 21); // yellow-400
            doc.triangle(x-3, y-4, x+3, y-4, x, y+2, 'F');
            doc.rect(x-1.5, y+2, 3, 2, 'F');
            doc.rect(x-2.5, y+4, 5, 1.5, 'F');
            doc.setFillColor(253, 224, 71); // Detalles
            doc.circle(x-3.5, y-2, 1.5, 'F'); doc.circle(x+3.5, y-2, 1.5, 'F');
        } else { // Medalla (Plata o Bronce)
            doc.setFillColor(220, 38, 38); doc.triangle(x-2, y-4, x, y-1, x, y-4, 'F'); // Cinta roja
            doc.setFillColor(255, 255, 255); doc.triangle(x+2, y-4, x, y-1, x, y-4, 'F'); // Cinta blanca
            doc.setFillColor(rank === 2 ? 148 : 180, rank === 2 ? 163 : 83, rank === 2 ? 184 : 9); // Color Metal
            doc.circle(x, y+1, 3, 'F');
            doc.setFillColor(255,255,255); doc.setFontSize(5); doc.text(String(rank), x, y+2, {align:'center'});
        }
    };

    // ==========================================
    // LÓGICA DE DIBUJO POR TIPO DE INFORME
    // ==========================================
    
    if (informe.tipo === 'torneo') {
        printHeader("Resumen del Torneo", iActivity);
        
        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 30, 2, 2, 'FD');
        
        doc.setTextColor(...p.blueDark); doc.setFontSize(16); doc.setFont("Roboto", "bolditalic");
        doc.text(String(informe.titulo).toUpperCase() || 'TORNEO NO DEFINIDO', 20, currentY + 10);
        doc.setTextColor(...p.textMuted); doc.setFontSize(9); doc.setFont("Roboto", "bold");
        doc.text(`${informe.ubicacionTorneo || '-'} | Superficie: ${informe.superficieTorneo || '-'}`, 20, currentY + 16);
        doc.setTextColor(...p.textMain); doc.text(`Categoría: ${gk.team}`, 20, currentY + 24);
        
        // MEDALLA DE POSICIÓN FINAL (Renderizada Vectorialmente)
        let medalla = informe.posFinalTorneo?.toUpperCase() || '-'; let mColor = p.blueDark; let mRank = 0;
        const posLower = (informe.posFinalTorneo || '').toLowerCase();
        if (posLower.includes('campe')) { mColor = [234, 179, 8]; mRank = 1; medalla = 'CAMPEÓN'; } 
        else if (posLower.includes('subcampe') || posLower.includes('segundo')) { mColor = [148, 163, 184]; mRank = 2; medalla = 'SUBCAMPEÓN'; } 
        else if (posLower.includes('tercer')) { mColor = [180, 83, 9]; mRank = 3; medalla = '3º PUESTO'; } 

        doc.setFillColor(...mColor); doc.roundedRect(125, currentY + 6, 55, 18, 2, 2, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont("Roboto", "bold"); 
        doc.text("POSICIÓN FINAL", 152.5, currentY + 12, {align: 'center'});
        if(mRank > 0) drawMedalIcon(132, currentY + 17.5, mRank); // Dibujar Medalla
        doc.setFontSize(11); doc.setFont("Roboto", "bolditalic"); 
        doc.text(medalla, 152.5 + (mRank > 0 ? 3 : 0), currentY + 19, {align: 'center'});
        currentY += 35;

        // SCOREBOARD ESTADÍSTICO GIGANTE
        printHeader("Resumen Estadístico del Portero", iTarget);
        let minsTotales = 0; let golesTotales = 0; let parTotales = informe.partidosTorneo?.length || 0;
        if (informe.partidosTorneo) {
            informe.partidosTorneo.forEach(m => {
                minsTotales += parseInt(m.minutes) || 0; 
                // Usar los goles marcados ESPECÍFICAMENTE al portero, si no está el dato, usa los del equipo.
                golesTotales += parseInt(m.goalsConcededByGk !== '-' && m.goalsConcededByGk ? m.goalsConcededByGk : m.goalsRival) || 0;
            });
        }
        const mediaGoles = parTotales > 0 ? (golesTotales / parTotales).toFixed(2) : '0.00';

        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 22, 2, 2, 'FD');
        let sbX = 25;
        const drawScoreItem = (val, lbl, w) => {
            doc.setTextColor(...p.textMain); doc.setFontSize(22); doc.setFont("Roboto", "bolditalic"); doc.text(String(val), sbX + (w/2), currentY + 13, {align:'center'});
            doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(lbl, sbX + (w/2), currentY + 19, {align:'center'});
            doc.setDrawColor(...p.line); if(w < 45) doc.line(sbX + w, currentY + 4, sbX + w, currentY + 18);
            sbX += w;
        };
        drawScoreItem(parTotales, "PJ", 45); drawScoreItem(minsTotales, "MIN TOTALES", 45); drawScoreItem(golesTotales, "GOLES REC.", 45); drawScoreItem(mediaGoles, "MEDIA G.C.", 45);
        currentY += 28;

        // CONTEXTO (GRID)
        const printTableLine = (x, y, w, label, val) => {
            doc.setFillColor(...p.bg); doc.rect(x, y, w, 8, 'F'); doc.setDrawColor(...p.line); doc.line(x, y+8, x+w, y+8);
            doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(label, x+2, y+5.5);
            doc.setTextColor(...p.textMain); doc.setFont("Roboto", "bolditalic"); doc.text(String(val||'-'), x+w-5, y+5.5, {align: 'right'});
        };

        const col1w = 85; const col2x = 110;
        printTableLine(15, currentY, col1w, "Nivel de Rivales", informe.ctxNivel); printTableLine(col2x, currentY, col1w, "Logística y Hotel", informe.ctxLogistica); currentY += 8;
        printTableLine(15, currentY, col1w, "Tiempos de Recuperación", informe.ctxCarga); printTableLine(col2x, currentY, col1w, "Campos / Arbitraje", informe.ctxInstalaciones); currentY += 12;

        // PARTIDOS
        printHeader("Detalle de Partidos Disputados");
        if (informe.partidosTorneo && informe.partidosTorneo.length > 0) {
            doc.setFillColor(...p.blueDark); doc.roundedRect(15, currentY, pageWidth-30, 10, 1, 1, 'F');
            doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("Roboto", "bold");
            doc.text("JORNADA/FASE", 18, currentY + 6.5); doc.text("RIVAL Y PAÍS", 55, currentY + 6.5);
            doc.text("GOLES R.", 155, currentY + 6.5); doc.text("MIN", 185, currentY + 6.5);
            currentY += 10;

            informe.partidosTorneo.forEach((m, idx) => {
                checkPageBreak(12);
                doc.setFillColor(idx % 2 === 0 ? p.card[0] : p.bg[0], idx % 2 === 0 ? p.card[1] : p.bg[1], idx % 2 === 0 ? p.card[2] : p.bg[2]);
                doc.rect(15, currentY, pageWidth-30, 10, 'F'); doc.setDrawColor(...p.line); doc.line(15, currentY+10, pageWidth-15, currentY+10);
                doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text(m.matchday || '-', 18, currentY + 6.5);
                doc.setTextColor(...p.textMain); doc.text(`${m.rival || '-'} ${m.country ? '('+m.country+')' : ''}`, 55, currentY + 6.5, {maxWidth: 90});
                doc.setTextColor(220,38,38); doc.text(String(m.goalsRival || '-'), 155, currentY + 6.5);
                doc.setTextColor(...p.textMuted); doc.text(String(m.minutes || '-'), 185, currentY + 6.5);
                currentY += 10;
            });
            currentY += 5;
        } else {
            doc.setTextColor(...p.textMuted); doc.setFontSize(9); doc.text("No se añadieron partidos al informe.", 15, currentY + 5); currentY += 15;
        }

        printHeader("Contexto Médico del Portero");
        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 20, 2, 2, 'FD');
        doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); doc.text("ESTADO INICIAL:", 20, currentY + 7); doc.text("INCIDENCIAS EN TORNEO:", 110, currentY + 7);
        doc.setTextColor(...p.textMain); doc.setFontSize(9); doc.setFont("Roboto", "normal"); doc.text(informe.medInicial || 'Óptimo', 20, currentY + 14); doc.text(informe.medIncidencias || 'Ninguna', 110, currentY + 14);
        currentY += 25;

        // PÁGINA 3 (Valoraciones y Observaciones Torneo)
        doc.addPage(); doc.setFillColor(...p.bg); doc.rect(0, 0, pageWidth, pageHeight, 'F'); drawPageHeader(); currentY = 45;

        printHeader("Perfil Psicológico y Actitudinal (1 a 5)", iGit);
        const printDotsCol = (x, y, items, isRight) => {
            let tempY = y; items.forEach(it => { printDots(x, tempY, it.l, informe[it.k], 5, isRight); tempY += 10; }); return tempY;
        };
        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 45, 2, 2, 'FD');
        printDotsCol(20, currentY + 10, [{l:'Personalidad', k:'valPersonalidad'}, {l:'Capacidad Mando', k:'valMando'}, {l:'Concentración', k:'valConc'}, {l:'Confianza', k:'valConfianza'}], false);
        printDotsCol(115, currentY + 10, [{l:'Gestión Error', k:'valError'}, {l:'Mentalidad Comp.', k:'valMentalidad'}, {l:'Actitud tras Gol', k:'valActitudGol'}], true);
        currentY += 55;

        printHeader("Evolución y Táctica (1 a 5)", iTarget);
        doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 35, 2, 2, 'FD');
        printDotsCol(20, currentY + 10, [{l:'1º vs Último Part.', k:'valPrimerUltimo'}, {l:'Adapt. Ritmo', k:'valRitmo'}, {l:'Adapt. Entorno', k:'valEntorno'}], false);
        printDotsCol(115, currentY + 10, [{l:'Rend. 1vs1', k:'val1v1'}, {l:'Organización', k:'valOrg'}, {l:'Comunicación', k:'valCom'}], true);
        currentY += 45;

        printHeader("Situaciones Específicas y Conclusión");
        printText("Rendimiento en Penaltis", informe.obsPenaltis);
        printText("Puntos Positivos", informe.obsPos);
        printText("Áreas de Mejora", informe.obsImprovements);
        printText("Acciones Decisivas", informe.obsDecisivas);

        printHeader("Valoración Final del Torneo");
        printBox(15, currentY, 60, 20, "EVALUACIÓN DEL CUERPO TÉCNICO", informe.valoracionGeneral, getValColor(informe.valoracionGeneral));
    }

    else if (informe.tipo === 'partido') {
        printHeader("Contexto del Encuentro", iActivity);
        doc.setFillColor(...p.blueDark); doc.roundedRect(15, currentY, 180, 22, 3, 3, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont("Roboto", "bolditalic"); doc.text(`VS ${informe.rival ? informe.rival.toUpperCase() : 'DESCONOCIDO'}`, 22, currentY + 14);
        doc.setFontSize(10); doc.setTextColor(148,163,184); doc.text(`${informe.partidoCompeticion || 'Competición'} | Jornada ${informe.partidoJornada || '-'}`, 22, currentY + 19);
        doc.setFillColor(220,38,38); doc.roundedRect(155, currentY + 4, 30, 14, 2, 2, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont("Roboto", "bold"); doc.text(informe.partidoResultado || '- : -', 170, currentY + 13.5, {align:'center'}); currentY += 28;
        printBox(15, currentY, 55, 18, "ESTADO", informe.partidoTitular || 'Titular'); printBox(75, currentY, 55, 18, "MINUTOS", informe.partidoMinutos || '-'); printBox(135, currentY, 60, 18, "NOTA GLOBAL", `${informe.nota || '-'}/10`, p.accent); currentY += 25;
        printHeader("Registro Rápido Estadístico"); const stats = [{l:'Paradas',v:informe.statParadas},{l:'Salidas',v:informe.statSalidas},{l:'Centros',v:informe.statCentros},{l:'Pases',v:informe.statPases},{l:'1 vs 1',v:informe.stat1v1},{l:'A.B.P.',v:informe.statABP},{l:'Errores',v:informe.statErrores},{l:'Goles Rec.',v:informe.statGoles}]; let sX = 15; stats.forEach((s, i) => { printBox(sX, currentY, 40, 16, s.l, s.v || '0'); sX += 45; if ((i + 1) % 4 === 0) { sX = 15; currentY += 20; }});
        printHeader("Evaluación por Áreas"); let vX = 15; ['Tecnico', 'Tactico', 'Fisico', 'Mental'].forEach(a => { printBox(vX, currentY, 40, 16, a.toUpperCase(), `${informe[`val${a}Partido`] || '-'}/5`); vX += 45; }); currentY += 25;
        printHeader("Análisis Técnico y Táctico", iTarget); printText("Paradas Relevantes", informe.obsParadas); printText("Análisis de Goles Recibidos", informe.obsGoles); printText("Juego Aéreo y Dominio del Área", informe.obsAereo); printText("Juego con los Pies y Distribución", informe.obsPies); printText("Fuera del Área y Coberturas", informe.obsFueraArea); printText("Uno vs Uno", informe.obs1v1); printText("Acciones a Balón Parado", informe.obsABP); printText("Comunicación y Liderazgo", informe.obsComunicacion); printText("Aspecto Mental y Resiliencia", informe.obsMental);
        printHeader("Información Adicional", iGit); printText("Cronología", informe.partidoCronologia); printText("Fortalezas en el partido", informe.planFortalezas); printText("Debilidades a corregir", informe.planDebilidades);
    }
    
    else if (informe.tipo === 'objetivos') {
        printHeader("Objetivos Definidos", iTarget); printText("Principal (Corto Plazo)", informe.objetivo1); printText("Secundario (Medio Plazo)", informe.objetivo2); printText("Físico / Mental", informe.objetivo3); currentY += 5;
        printHeader("Evaluación de Competencias", iActivity); const accionesMap = { objDefBlocajeFrontal: 'Blocaje Frontales Medio y Raso', objDefBlocajeLatRaso: 'Blocaje lateral raso', objDefBlocajeLatMed: 'Blocaje lateral media altura', objDefDesvioRaso: 'Desvío raso', objDefDesvioMed: 'Desvío a Media Altura', objDefReduccion: 'Reducción de espacios y Posición Cruz', objDefApertura: 'Apertura', objDefReincorp: 'Reincorporaciones', objDefBlocajeAereo: 'Blocaje Aéreo', objDefDespeje: 'Despeje de Puños', objOfPaseManoRaso: 'Pase mano raso', objOfPaseManoAlto: 'Pase mano alto', objOfPaseManoPicado: 'Pase mano picado', objOfPerfilamiento: 'Perfilamiento y Controles', objOfPaseRasoPie: 'Pase Raso con el Pie', objOfPaseAltoPie: 'Pase alto con el Pie', objOfVoleas: 'Voleas' }; const evalActions = Object.keys(accionesMap).filter(key => informe[key] && informe[key] !== '').map(key => ({ label: accionesMap[key], score: parseInt(informe[key]) }));
        evalActions.forEach(action => { checkPageBreak(18); doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(15, currentY, pageWidth - 30, 14, 2, 2, 'FD'); doc.setTextColor(...p.textMain); doc.setFontSize(10); doc.setFont("Roboto", "bold"); doc.text(action.label, 20, currentY + 9); let pillBg = [16, 185, 129], pillText = [255,255,255], pillLabel = "COMP. INCONSCIENTE"; if (action.score <= 2) { pillBg = [220, 38, 38]; pillLabel = "INC. INCONSCIENTE"; } else if (action.score === 3) { pillBg = [249, 115, 22]; pillLabel = "INC. CONSCIENTE"; } else if (action.score === 4) { pillBg = [251, 191, 36]; pillText = [15,23,42]; pillLabel = "COMP. CONSCIENTE"; } doc.setFillColor(...pillBg); doc.roundedRect(115, currentY + 3, 48, 8, 2, 2, 'F'); doc.setTextColor(...pillText); doc.setFontSize(7); doc.text(pillLabel, 139, currentY + 8.5, { align: 'center' }); doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.text("NOTA:", 170, currentY + 9); doc.setTextColor(...p.textMain); doc.setFontSize(12); doc.text(String(action.score), 184, currentY + 9.5); currentY += 16; });
        currentY += 5; printHeader("Observaciones Generales"); printText("Conclusiones y Próximos Pasos", informe.objObservacionFinal);
    }
    
    else if (informe.tipo === 'flash') {
        printHeader("Perfil Inicial"); printBox(15, currentY, 40, 20, "TIPO", informe.flashTipo || '-'); printBox(58, currentY, 40, 20, "ALTURA", informe.flashAltura || '-'); printBox(101, currentY, 40, 20, "NIVEL ACTUAL", informe.flashNivel || '-'); printBox(144, currentY, 51, 20, "POTENCIAL", informe.flashPotencial || '-'); currentY += 25;
        printHeader("Análisis Psicológico"); printBox(15, currentY, 40, 20, "PERSONALIDAD", informe.flashPersonalidad || '-'); printBox(58, currentY, 40, 20, "COMUNICACIÓN", informe.flashComunicacionTipo || '-'); printBox(101, currentY, 40, 20, "CONCENTRACIÓN", `${informe.flashConcentracionNota || '-'}/5`); printBox(144, currentY, 51, 20, "RESILIENCIA AL ERROR", `${informe.flashResilienciaNota || '-'}/5`); currentY += 25;
        printHeader("Valoraciones Técnico-Tácticas"); printText("Fase Ofensiva", informe.flashObsOf); printText("Fase Defensiva", informe.flashObsDef); currentY += 5; printHeader("Veredicto de Scouting");
        if (informe.flashEstado) { const isNoCont = informe.flashEstado === 'NO CONTINÚA'; const isSegui = informe.flashEstado === 'SEGUIMIENTO'; doc.setFillColor(isNoCont ? 220 : (isSegui ? 249 : 16), isNoCont ? 38 : (isSegui ? 115 : 185), isNoCont ? 38 : (isSegui ? 22 : 129)); doc.roundedRect(15, currentY, pageWidth - 30, 15, 2, 2, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("Roboto", "bolditalic"); doc.text(String(informe.flashEstado).toUpperCase(), pageWidth / 2, currentY + 10, { align: 'center' }); currentY += 20; }
        printText("Justificación Técnica", informe.flashJustificacion); if (informe.flashPropuesta) printText("Propuesta", informe.flashPropuesta);
    }
    
    else if (informe.tipo === 'semestral') {
        printHeader("Datos de Competición"); let bX = 15; [ {l:'Jornada', v:informe.jornadaActual}, {l:'Convocatorias', v:informe.convocatorias}, {l:'Titularidades', v:informe.titular}, {l:'Goles Encajados', v:informe.golesEncajados}].forEach((d,i) => { printBox(bX, currentY, 40, 16, d.l, d.v); bX += 45; }); currentY += 20; bX = 15;
        [ {l:'Min. Pos 1', v:informe.minPos1}, {l:'Min. Pos 2', v:informe.minPos2}, {l:'Torneos Conv.', v:informe.torneosConvocado}, {l:'Torneos Jugados', v:informe.torneosAsistidos}].forEach((d,i) => { printBox(bX, currentY, 40, 16, d.l, d.v); bX += 45; }); currentY += 25;
        const printDotsGrid = (items, maxP) => { doc.setFillColor(...p.card); doc.setDrawColor(...p.line); const gridH = Math.ceil(items.length / 2) * 10 + 10; checkPageBreak(gridH + 10); doc.roundedRect(15, currentY, 180, gridH, 2, 2, 'FD'); let dY = currentY + 10; items.forEach((it, idx) => { const isRight = idx % 2 !== 0; printDots(isRight ? 110 : 20, dY, it.l, informe[it.k], maxP, isRight); if (isRight) dY += 10; }); currentY += gridH + 8; };
        printHeader("Valoración Deportiva (Cualidades Generales)", iActivity); printDotsGrid([ {l: 'Rep. Téc. Defensivo', k: 'repTecDefensivo'}, {l: 'Rep. Téc. Ofensivo', k: 'repTecOfensivo'}, {l: 'Adecuación Recursos', k: 'adecuacionRecursos'}, {l: 'Nivel Competitivo', k: 'nivelCompetitivo'}, {l: 'Constancia Rend.', k: 'constanciaRendimiento'}, {l: 'Comprensión Juego', k: 'comprensionJuego'}, {l: 'Implicación Entrenos', k: 'implicacionEntrenamientos'}, {l: 'Liderazgo Grupo', k: 'liderazgoGrupo'}, {l: 'Destreza General', k: 'destrezaGeneral'}, {l: 'Conciencia Obj.', k: 'concienciaObjetivos'}, {l: 'Motivación Indiv.', k: 'motivacionIndividual'}, {l: 'Comp. Actitudinal', k: 'comportamientoActitudinal'} ], 4);
        printHeader("Cualidades Puesto Específico", iTarget); printDotsGrid([ {l: 'Posición Básica', k: 'posicionBasica'}, {l: 'Blocaje', k: 'blocaje'}, {l: 'Colocación', k: 'colocacion'}, {l: 'Desplazamientos', k: 'desplazamientosCaidas'}, {l: 'Dominio Área', k: 'dominioArea'}, {l: 'Reinicio Juego', k: 'reinicioJuego'}, {l: 'Uno contra uno', k: 'unoContraUno'}, {l: 'Velocidad Espec.', k: 'velocidadEspecifica'}, {l: 'Agilidad', k: 'agilidad'} ], 4);
        printHeader("Fases de Juego y Actitud (1 a 5)", iGit); printDotsGrid([ {l: 'Ataque', k: 'ataque'}, {l: 'Defensa', k: 'defensa'}, {l: 'Transición Ofensiva', k: 'transOf'}, {l: 'Transición Defensiva', k: 'transDef'}, {l: 'Sociabilidad', k: 'sociabilidad'}, {l: 'Constancia Actitud', k: 'constanciaAct'}, {l: 'Disciplina', k: 'disciplina'}, {l: 'Actitud', k: 'actitud'}, {l: 'Compromiso', k: 'compromiso'}, {l: 'Evolución', k: 'evolucion'} ], 5);
        printHeader("Desarrollo y Observaciones"); printText("Paradas y Juego Ofensivo", informe.obsTecnicoTacticas || informe.obsParadas); printText("Goles Encajados y Fase Defensiva", informe.obsActitudinales || informe.obsGoles); printText("Análisis Extendido", informe.obsMental || informe.extendedAnalysis);
        printHeader("Control Académico"); checkPageBreak(30); let aX = 15; ['1', '2', '3'].forEach(ev => { doc.setFillColor(...p.card); doc.setDrawColor(...p.line); doc.roundedRect(aX, currentY, 55, 25, 2, 2, 'FD'); doc.setTextColor(...p.textMain); doc.setFontSize(9); doc.setFont("Roboto", "bold"); doc.text(`${ev}ª EVALUACIÓN`, aX + 5, currentY + 6); doc.setFontSize(8); doc.setTextColor(...p.textMuted); doc.text(`Media: ${informe[`eval${ev}Media`] || '-'}`, aX + 5, currentY + 12); doc.text(`Asignaturas: ${informe[`eval${ev}Asig`] || '-'}`, aX + 5, currentY + 17); doc.text(`Suspensos: ${informe[`eval${ev}Susp`] || '-'}`, aX + 5, currentY + 22); aX += 62; }); currentY += 35;
        printHeader("Valoración Final"); printBox(15, currentY, 60, 20, "NOTA GLOBAL SEMESTRE", informe.valoracionGeneral || 'MEDIA', getValColor(informe.valoracionGeneral));
    }

    doc.save(`INFORME_${informe.tipo.toUpperCase()}_${gk.name.replace(/\s+/g, '_').toUpperCase()}_${informe.fecha}.pdf`);
    showNotification("PDF Exportado con Éxito", "success");

  } catch (error) {
    console.error("Error PDF Historial:", error);
    showNotification("Error generando PDF", "error");
  }
};

// ==========================================
// COMPONENTES DE UI REUTILIZABLES (DRY)
// ==========================================

const BaseModal = ({ theme, title, icon, onClose, maxWidth = "max-w-2xl", headerClass = "bg-blue-50 dark:bg-blue-900/10", children, customFooter, onSave, saveText = "Guardar", saveButtonClass = "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-200">
    <div className={`w-full ${maxWidth} rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
      <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center rounded-t-[3rem] ${headerClass}`}>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-950 dark:text-white">
          {icon} {title}
        </h2>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
      </div>
      
      {children}

      {customFooter ? customFooter : (
        <div className={`p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={onSave} className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors ${saveButtonClass}`}>{saveText}</button>
        </div>
      )}
    </div>
  </div>
);

const FormInput = ({ label, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}
    <input className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors ${props.type === 'number' && props.className?.includes('text-emerald') ? props.className : ''}`} {...props} />
  </div>
);

const FormSelect = ({ label, children, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}
    <select className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-blue-950 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors cursor-pointer`} {...props}>
      {children}
    </select>
  </div>
);

const FormTextarea = ({ label, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{label}</label>}
    <textarea className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors shadow-inner resize-none text-xs`} {...props} />
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [role, setRole] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [dataLoaded, setDataLoaded] = useState({ users: false, gks: false, rivals: false, matches: false });
  const isDataLoading = !dataLoaded.users || !dataLoaded.gks || !dataLoaded.rivals || !dataLoaded.matches;

  const [goalkeepers, setGoalkeepers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [rivals, setRivals] = useState([]);
  const [matches, setMatches] = useState([]);
  const [informesList, setInformesList] = useState([]); // NUEVO ESTADO PARA INFORMES

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

  // Estados del Vestuario e Plan táctico inmersivo
  const [viewLockerRoom, setViewLockerRoom] = useState(true);
  const [lockerSelectedGk, setLockerSelectedGk] = useState(null);

  // NUEVO: Leer el QR para abrir directamente el perfil del portero
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gkParam = params.get('gk');
    if (gkParam) {
      setSelectedGkId(gkParam);
      setCurrentModule('reporte_detalle');
    }
  }, []);

  useEffect(() => {
    if (!auth) { setLoadingAuth(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { showNotification("Error de autenticación", "error"); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const gkRef = collection(db, 'artifacts', appId, 'public', 'data', 'goalkeepers');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const rivalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rivals');
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const informesRef = collection(db, 'artifacts', appId, 'public', 'data', 'informes'); // NUEVA REFERENCIA

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (uList.length === 0 && user.uid) {
        const defaultAdmin = {
          role: 'admin',
          username: 'admin',
          email: 'admin@atleti.com',
          password: '123',
          name: 'Administrador',
          photoUrl: ''
        };
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', 'admin-user'), defaultAdmin).catch(console.error);
        setUsersList([{ id: 'admin-user', ...defaultAdmin }]);
      } else {
        setUsersList(uList);
        if (appUser) {
           const updatedMe = uList.find(u => u.id === appUser.id);
           if (updatedMe) {
               setAppUser(updatedMe);
               setRole(updatedMe.role);
           }
        }
      }
      setDataLoaded(prev => ({...prev, users: true}));
    });

    const unsubGk = onSnapshot(gkRef, (snapshot) => {
      const gks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoalkeepers(gks);
      setDataLoaded(prev => ({...prev, gks: true}));
    });

    const unsubRivals = onSnapshot(rivalsRef, (snapshot) => {
      setRivals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setDataLoaded(prev => ({...prev, rivals: true}));
    });

    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {
      const mList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(mList);
      const dbSeasons = Array.from(new Set(mList.map(m => m.season).filter(Boolean)));
      if (dbSeasons.length > 0) {
        setAvailableSeasons(prev => Array.from(new Set([...prev, ...dbSeasons])).sort().reverse());
      }
      setDataLoaded(prev => ({...prev, matches: true}));
    });

    // NUEVO LISENER PARA INFORMES
    const unsubInformes = onSnapshot(informesRef, (snapshot) => {
      setInformesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUsers(); unsubGk(); unsubRivals(); unsubMatches(); unsubInformes(); };
  }, [user, appUser]);

  const visibleGoalkeepers = useMemo(() => {
    if (role === 'admin' || role === 'staff') return goalkeepers;
    return goalkeepers.filter(gk => {
      const assigned = gk.assignedTo || [];
      if (Array.isArray(assigned)) {
        return assigned.includes('all') || assigned.includes(appUser?.id);
      }
      return assigned === 'all' || assigned === appUser?.id;
    });
  }, [goalkeepers, role, appUser]);

  const selectedGk = visibleGoalkeepers.find(gk => gk.id === selectedGkId) || visibleGoalkeepers[0] || DUMMY_GOALKEEPER;
  const currentUserData = usersList.find(u => u.id === appUser?.id) || {};

  const currentSeasonMatches = useMemo(() => {
    const seasonMatches = matches.filter(m => m.season === activeSeason || (!m.season && activeSeason === '2026/27'));
    if (role === 'admin') return seasonMatches;
    
    // Filtrar los partidos para que los entrenadores/staff SOLO vean los partidos de sus porteros asignados
    const visibleGkIds = visibleGoalkeepers.map(g => g.id);
    return seasonMatches.filter(m => m.goalkeeperIds?.some(id => visibleGkIds.includes(id)) || !m.goalkeeperIds || m.goalkeeperIds.length === 0);
  }, [matches, activeSeason, visibleGoalkeepers, role]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSeasonChange = (e) => {
    if (e.target.value === 'add_new') {
      setIsAddSeasonModalOpen(true);
    } else {
      setActiveSeason(e.target.value);
    }
  };

  const handleLogout = () => {
    setAppUser(null);
    setRole(null);
  };

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
      showNotification(successMsg);
      return docId;
    } catch (e) {
      showNotification(`Error al guardar en ${collectionName}`, "error");
      return null;
    }
  };

  const handleSaveProfile = async (profileData) => {
    const updateData = { ...profileData };
    if (updateData.newPassword) {
      updateData.password = updateData.newPassword;
    }
    delete updateData.newPassword;
    await handleSaveDoc('users', updateData, false, "Perfil actualizado");
  };

  const handleSaveTechDecision = async (decisionData) => {
    if (!db || !selectedGkId) return;
    try {
      const gkRef = doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId);
      await setDoc(gkRef, { technicalDecision: decisionData }, { merge: true });
      showNotification("Decisión Técnica guardada con éxito");
      setIsTechDecModalOpen(false);
    } catch(e) { showNotification("Error al guardar decisión", "error"); }
  };

  const handleSaveMatchPlan = async (planData) => {
    if (!db || !selectedGkId) return;
    try {
      const gkRef = doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId);
      await setDoc(gkRef, { matchPlan: planData }, { merge: true });
      showNotification("Plan de Partido guardado con éxito");
      setIsMatchPlanModalOpen(false);
    } catch(e) { showNotification("Error al guardar plan de partido", "error"); }
  };

  const handleSaveStats = async (statsData) => {
    if (!db || !selectedGkId) return;
    try {
      const gkRef = doc(db, 'artifacts', appId, 'public', 'data', 'goalkeepers', selectedGkId);
      await setDoc(gkRef, { form: statsData.form, stats: statsData.stats }, { merge: true });
      showNotification("Estadísticas actualizadas con éxito");
      setIsStatsModalOpen(false);
    } catch(e) { showNotification("Error al guardar estadísticas", "error"); }
  };

  const handleDeleteDoc = async (collectionName, id) => {
    if (!db) return;
    if (!window.confirm('¿Seguro que deseas eliminar este elemento?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
      showNotification("Elemento eliminado");
    } catch (e) { showNotification("Error al eliminar", "error"); }
  };

  const downloadBackup = () => {
    const backupData = { goalkeepers, users: usersList, rivals, matches, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atleti_plan_partido_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Backup descargado con éxito");
  };

  if (loadingAuth || (user && isDataLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-950 text-white font-sans">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const theme = {
    bg: darkMode ? 'dark bg-slate-900' : 'bg-slate-50',
    card: darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    text: darkMode ? 'text-slate-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
    border: darkMode ? 'border-slate-700' : 'border-slate-200'
  };

  // --- NUEVA VISTA PÚBLICA PARA COMPARTIR POR QR ---
  const urlParams = new URLSearchParams(window.location.search);
  const publicGkId = urlParams.get('public_gk');

  if (publicGkId) {
    const publicGk = goalkeepers.find(g => g.id === publicGkId) || DUMMY_GOALKEEPER;
    const publicMatches = matches.filter(m => m.season === activeSeason || (!m.season && activeSeason === '2026/27'));
    
    return (
      <div className={`flex h-screen w-full overflow-y-auto font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 custom-scrollbar p-4 md:p-8`}>
        <div className="max-w-[1600px] mx-auto w-full space-y-4">
           {/* Cabecera Pública Personalizada */}
           <div className="flex justify-between items-center mb-6 no-print bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex items-center gap-4">
               <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm" />
               <div>
                 <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white leading-none">ATLETI <span className="text-red-600">PLAN PARTIDO</span></h1>
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Informe Público del Jugador</p>
               </div>
             </div>
             <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-xl border ${theme.border} bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-inner`}>
               {darkMode ? <Sun size={20} className="text-slate-400" /> : <Moon size={20} className="text-slate-500" />}
             </button>
           </div>
           
           {/* Vista de reporte engañando a la app con role="staff" para que sea Solo Lectura */}
           <DashboardView 
              gk={publicGk} 
              allGks={[publicGk]} 
              matches={publicMatches} 
              rivals={rivals} 
              theme={theme} 
              darkMode={darkMode} 
              activeSeason={activeSeason} 
              role="staff" 
              isDataLoading={false}
           />
        </div>
      </div>
    );
  }

  // Si no hay QR público, pedimos login normal
  if (!appUser) {
    return <LoginScreen users={usersList} onLogin={(u) => { setAppUser(u); setRole(u.role); }} />;
  }

  const renderModule = () => {
    if (selectedGkId && currentModule === 'reporte_detalle') {
      return (
        <div className="space-y-4 pb-16 md:pb-0">
          <button onClick={() => setCurrentModule('porteros')} className="no-print text-sm font-bold text-slate-500 hover:text-blue-950 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 mb-2 transition-colors uppercase tracking-widest">
            ← Volver a la lista
          </button>
          <DashboardView 
             gk={selectedGk} 
             allGks={visibleGoalkeepers} 
             matches={currentSeasonMatches} 
             rivals={rivals} 
             theme={theme} 
             darkMode={darkMode} 
             activeSeason={activeSeason} 
             onEditTechDec={() => setIsTechDecModalOpen(true)} 
             onEditStats={() => setIsStatsModalOpen(true)} 
             onEditMatchPlan={() => setIsMatchPlanModalOpen(true)} 
             exportTrigger={exportTrigger} 
             resetExportTrigger={() => setExportTrigger(0)}
             showNotification={showNotification} 
             isDataLoading={isDataLoading} 
             role={role}
          />
        </div>
      );
    }

    switch (currentModule) {
      case 'inicio': return (
        <ModuleInicio 
          gks={visibleGoalkeepers} 
          matches={currentSeasonMatches} 
          rivals={rivals} 
          theme={theme} 
          setModule={setCurrentModule} 
          darkMode={darkMode} 
          onEditMatch={(m) => { setEditingMatch(m); setIsMatchFormOpen(true); }} 
          onDeleteMatch={(id) => handleDeleteDoc('matches', id)} 
          isDataLoading={isDataLoading} 
          currentUserData={currentUserData} 
          viewLockerRoom={viewLockerRoom}
          setViewLockerRoom={setViewLockerRoom}
          onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)}
          role={role}
        />
      );
      case 'porteros': return <ModulePorteros gks={visibleGoalkeepers} role={role} onSelect={(id) => { setSelectedGkId(id); setCurrentModule('reporte_detalle'); }} onNew={() => { setEditingGk(null); setIsGkFormOpen(true); }} onEdit={(gk) => { setEditingGk(gk); setIsGkFormOpen(true); }} onDelete={(id) => handleDeleteDoc('goalkeepers', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'partidos': return <ModulePartidos matches={currentSeasonMatches} rivals={rivals} gks={visibleGoalkeepers} role={role} onNew={() => { setEditingMatch(null); setIsMatchFormOpen(true); }} onEdit={(match) => { setEditingMatch(match); setIsMatchFormOpen(true); }} onDelete={(id) => handleDeleteDoc('matches', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'rivales': return <ModuleRivales rivals={rivals} role={role} onNew={() => {setEditingRival(null); setIsRivalFormOpen(true);}} onEdit={(rival) => {setEditingRival(rival); setIsRivalFormOpen(true);}} onDelete={(id) => handleDeleteDoc('rivals', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'comparador': return <ModuleComparador gks={visibleGoalkeepers} theme={theme} darkMode={darkMode} />;
      case 'ajustes': return <ModuleAjustes users={usersList} currentUserData={currentUserData} role={role} onNewUser={() => {setEditingUser(null); setIsUserFormOpen(true);}} onEditUser={(u) => {setEditingUser(u); setIsUserFormOpen(true);}} onSaveProfile={handleSaveProfile} onBackup={downloadBackup} theme={theme} darkMode={darkMode} />;
      case 'informes': return <ModuleInformes gks={visibleGoalkeepers} theme={theme} darkMode={darkMode} existingReports={informesList} onSave={async (data) => { const id = await handleSaveDoc('informes', data, !data.id, data.isDraft ? "Borrador guardado" : "Informe finalizado"); if (id && !data.id) data.id = id; return id; }} onDelete={(id) => handleDeleteDoc('informes', id)} showNotification={showNotification} />;
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

      {/* SIDEBAR (Desktop Only) */}
      <aside className={`hidden md:flex w-24 lg:w-28 h-screen overflow-hidden flex-shrink-0 flex-col bg-blue-950 text-white no-print z-20 transition-colors`}>
        <div className={`h-24 flex items-center justify-center border-b border-blue-900/50 pt-4 pb-4 shrink-0`}>
          <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(220,38,38,0.4)]" />
        </div>

        <nav className="flex-1 py-2 flex flex-col gap-0 items-center justify-center w-full">
          <SidebarItem darkMode={darkMode} icon={<Home/>} label="INICIO" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
          <SidebarItem darkMode={darkMode} icon={<User/>} label="PORTEROS" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
          <SidebarItem darkMode={darkMode} icon={<CalendarDays/>} label="PARTIDOS" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
          {role !== 'staff' && <SidebarItem darkMode={darkMode} icon={<Swords/>} label="RIVALES" active={currentModule === 'rivales'} onClick={() => setCurrentModule('rivales')} />}
          <SidebarItem darkMode={darkMode} icon={<GitCompare/>} label="COMPARA" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
          <SidebarItem darkMode={darkMode} icon={<FileText/>} label="INFORMES" active={currentModule === 'informes'} onClick={() => setCurrentModule('informes')} />
          {role !== 'staff' && <SidebarItem darkMode={darkMode} icon={<Settings/>} label="AJUSTES" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />}
        </nav>

        <div className="p-4 border-t border-blue-900/50 bg-blue-950 flex flex-col items-center justify-center gap-2 shrink-0">
          <div className={`flex flex-col items-center gap-2 overflow-hidden text-center ${role !== 'staff' ? 'cursor-pointer' : ''}`} onClick={() => role !== 'staff' && setCurrentModule('ajustes')} title={role !== 'staff' ? "Ir a ajustes" : "Perfil"}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-950 font-black shadow-inner overflow-hidden shrink-0 border-2 border-blue-500">
              {currentUserData.photoUrl ? (
                <img src={currentUserData.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: `center ${currentUserData.photoOffsetY ?? 50}%` }} alt=""/>
              ) : (
                currentUserData.name ? currentUserData.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : (role === 'admin' ? 'AD' : 'EN')
              )}
            </div>
            <div className="flex flex-col truncate w-full">
              <span className="text-[10px] font-black text-white truncate leading-tight">{currentUserData.name ? currentUserData.name.split(' ')[0] : 'Usuario'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-blue-300 hover:text-red-400 p-2 rounded-xl hover:bg-blue-900 transition-colors" title="Cerrar sesión"><LogOut size={16}/></button>
        </div>
      </aside>

      {/* BOTTOM NAVIGATION (Mobile Only) */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full h-16 bg-blue-950 text-white border-t border-blue-900 flex justify-around items-center z-50 px-2 no-print pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.2)] rounded-t-3xl`}>
          <BottomNavItem icon={<Home/>} label="Inicio" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
          <BottomNavItem icon={<User/>} label="Porteros" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
          <BottomNavItem icon={<CalendarDays/>} label="Partidos" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
          <BottomNavItem icon={<GitCompare/>} label="Compara" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
          <BottomNavItem icon={<FileText/>} label="Informes" active={currentModule === 'informes'} onClick={() => setCurrentModule('informes')} />
          <BottomNavItem icon={<Settings/>} label="Ajustes" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />}
      </nav>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print-full-width relative bg-slate-50 dark:bg-slate-900">
        {/* TOPBAR */}
        <header className={`h-20 flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b ${theme.border} bg-white dark:bg-slate-900 no-print z-10 relative`}>
          <div>
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white">
              {currentModule === 'reporte_detalle' ? 'INFORME DEL PORTERO' : currentModule}
            </h1>
            <p className={`text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold`}>Atlético de Madrid</p>
          </div>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-auto">
               <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-5 h-5 object-contain" />
               <span className="text-lg lg:text-xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white drop-shadow-sm">
                 ATLETI <span className="text-red-600">PLAN PARTIDO</span>
               </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className={`px-2 py-1.5 md:px-4 md:py-2 rounded-xl border ${theme.border} bg-slate-100 dark:bg-slate-800 text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2`}>
              <select 
                value={activeSeason} 
                onChange={handleSeasonChange} 
                className="bg-transparent outline-none cursor-pointer appearance-none text-slate-700 dark:text-slate-200"
              >
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

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-24 md:pb-10">
          <div className="max-w-[1600px] mx-auto print-full-width">
            {renderModule()}
          </div>
        </div>

        {/* MODALES GLOBALES (Ahora refactorizados usando BaseModal y componentes de formulario) */}
        {isGkFormOpen && <GkFormModal initialData={editingGk} users={usersList} onClose={() => setIsGkFormOpen(false)} onSave={(data) => handleSaveDoc('goalkeepers', data, !editingGk, "Portero guardado").then(id => {if(id){setIsGkFormOpen(false); if(!editingGk){setSelectedGkId(id); setCurrentModule('reporte_detalle');}}})} theme={theme} darkMode={darkMode} />}
        {isRivalFormOpen && <RivalFormModal initialData={editingRival} onClose={() => setIsRivalFormOpen(false)} onSave={(data) => handleSaveDoc('rivals', data, !editingRival, "Rival guardado").then(()=>setIsRivalFormOpen(false))} theme={theme} />}
        {isUserFormOpen && <UserFormModal initialData={editingUser} onClose={() => setIsUserFormOpen(false)} onSave={(data) => handleSaveDoc('users', data, !editingUser, "Usuario guardado").then(()=>setIsUserFormOpen(false))} theme={theme} />}
        {isMatchFormOpen && <MatchFormModal initialData={editingMatch} rivals={rivals} gks={visibleGoalkeepers} activeSeason={activeSeason} onClose={() => setIsMatchFormOpen(false)} onSave={(data) => handleSaveDoc('matches', data, !editingMatch, "Partido guardado").then(()=>setIsMatchFormOpen(false))} theme={theme} darkMode={darkMode} />}
        
        {/* MODALES DE EDICIÓN DEL REPORTE */}
        {isTechDecModalOpen && <TechDecisionModal initialData={selectedGk} onClose={() => setIsTechDecModalOpen(false)} onSave={handleSaveTechDecision} theme={theme} />}
        {isStatsModalOpen && <GkStatsModal initialData={selectedGk} onClose={() => setIsStatsModalOpen(false)} onSave={handleSaveStats} theme={theme} />}
        {isMatchPlanModalOpen && <MatchPlanModal initialData={selectedGk} onClose={() => setIsMatchPlanModalOpen(false)} onSave={handleSaveMatchPlan} theme={theme} />}
        {isAddSeasonModalOpen && <AddSeasonModal onClose={() => setIsAddSeasonModalOpen(false)} onSave={(newSeason) => { setAvailableSeasons(prev => Array.from(new Set([...prev, newSeason])).sort().reverse()); setActiveSeason(newSeason); setIsAddSeasonModalOpen(false); }} theme={theme} />}

        {/* MODAL INMERSIVO DE PLAN DE PARTIDO DESDE EL VESTUARIO VIRTUAL */}
        {lockerSelectedGk && (
          <LockerPlanModal 
            gk={lockerSelectedGk} 
            onClose={() => setLockerSelectedGk(null)} 
            theme={theme}
            darkMode={darkMode}
          />
        )}

      </main>
    </div>
  );
}

// ==========================================
// PANTALLA DE LOGIN
// ==========================================
const LoginScreen = ({ users, onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  
  const submit = (e) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    setTimeout(() => {
      const user = users.find(x => (x.username === u || x.email === u) && x.password === p);
      if (user) { 
        if(user.active === false) { 
          setError("Cuenta desactivada.");
          setIsAuthenticating(false);
        } else {
          setIsEntering(true);
          setTimeout(() => onLogin(user), 700);
        }
      } else {
        setError("Usuario o contraseña incorrectos");
        setIsAuthenticating(false);
      }
    }, 600);
  };
  
  return (
    <div className={`h-screen w-full flex bg-blue-950 overflow-hidden transition-all duration-700 ease-in-out ${isEntering ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Lado Izquierdo */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-900 to-blue-950 overflow-hidden flex-col justify-end p-24">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
            <img src={ESCUDO_ATM_URL} alt="" className="w-[800px] h-[800px] object-contain transform -rotate-12 opacity-50 grayscale" />
        </div>
        <div className="relative z-20 flex flex-col">
          <h3 className="text-3xl xl:text-4xl font-black text-red-500/90 italic uppercase tracking-tighter mb-4 drop-shadow-xl">
            "Nunca dejes de creer"
          </h3>
          <h2 className="text-6xl xl:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">
            Observa.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">Reacciona.</span><br/>Lidera.
          </h2>
          <div className="border-l-4 border-red-500 pl-6 max-w-xl backdrop-blur-sm bg-blue-950/20 p-4 rounded-r-2xl">
            <p className="text-blue-100 text-lg font-medium">
              Software de alto rendimiento diseñado exclusivamente para optimizar la toma de decisiones, y el plan de partido de nuestros porteros.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col justify-center px-10 md:px-16 py-12 bg-white z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-blue-600"></div>
        
        <div className="flex flex-col items-center text-center mb-12">
          <img src={ESCUDO_ATM_URL} alt="Atleti" className="h-24 w-auto mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.2)]" />
          <h1 className="text-blue-950 text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 whitespace-nowrap">ATLETI <span className="text-red-600">PLAN PARTIDO</span></h1>
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
              Departamento de porteros
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 text-sm md:text-base font-black tracking-widest uppercase mt-1">
              Atlético de Madrid
            </span>
          </div>
        </div>

        <form onSubmit={submit} className="w-full space-y-8">
          <div className="relative group">
            <input type="text" id="user" required className="peer w-full bg-transparent border-b-2 border-slate-200 text-slate-800 px-1 py-3 pt-6 outline-none focus:border-red-600 transition-colors placeholder-transparent" placeholder="Usuario" value={u} onChange={e=>setU(e.target.value)} disabled={isAuthenticating}/>
            <label htmlFor="user" className="absolute left-1 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-red-600 pointer-events-none">
              Usuario o Email
            </label>
          </div>

          <div className="relative group">
            <input type="password" id="pass" required className="peer w-full bg-transparent border-b-2 border-slate-200 text-slate-800 px-1 py-3 pt-6 outline-none focus:border-red-600 transition-colors placeholder-transparent" placeholder="Contraseña" value={p} onChange={e=>setP(e.target.value)} disabled={isAuthenticating}/>
            <label htmlFor="pass" className="absolute left-1 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-red-600 pointer-events-none">
              Contraseña
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="text-red-500 shrink-0"/>
              <p className="text-red-600 text-xs font-bold">{String(error)}</p>
            </div>
          )}
          
          <div className="pt-6">
            <button type="submit" disabled={isAuthenticating || isEntering} className="relative w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_8px_25px_rgba(220,38,38,0.3)] transition-all hover:scale-[1.02] hover:bg-red-700 overflow-hidden group disabled:opacity-80 disabled:scale-100 flex items-center justify-center h-14">
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:animate-shimmer"></div>
              
              {isAuthenticating ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative z-10">Acceder</span>
              )}
            </button>
            
            <div className="mt-8 text-center flex items-center justify-center gap-3 opacity-90">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-red-500/80"></div>
              <p className="text-slate-500 text-[10px] font-black italic tracking-widest uppercase">
                "Donde empieza nuestra defensa."
              </p>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-blue-500/80"></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTES UI BÁSICOS Y SKELETONS
// ==========================================

const SkeletonCard = () => (
  <div className="animate-pulse rounded-[3rem] border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50 h-64 w-full"></div>
);

const SkeletonMatch = () => (
  <div className="animate-pulse rounded-[3rem] border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50 h-72 w-full"></div>
);

const BottomNavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${active ? 'text-red-500' : 'text-slate-400 hover:text-slate-300'}`}>
    {React.cloneElement(icon, { size: active ? 22 : 20, strokeWidth: active ? 2.5 : 2 })}
    <span className={`text-[9px] font-bold ${active ? 'font-black tracking-widest uppercase' : ''}`}>{label}</span>
  </button>
);

const MatchScoreboardCard = ({ match, rival, gks, onEdit, onDelete, theme, layout = 'grid' }) => {
  const convocados = gks.filter(gk => match.goalkeeperIds?.includes(gk.id));
  
  return (
    <div className={`rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-sm dark:shadow-md overflow-hidden relative flex flex-col group ${layout === 'wide' ? 'md:col-span-2' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 dark:from-blue-900/20 to-transparent pointer-events-none" />

      {/* BARRA DE COMPETICIÓN */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 py-3 px-4 text-center relative z-10 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[10px] md:text-xs font-black uppercase text-blue-950 dark:text-blue-400 tracking-[0.15em]">
          {match.league || 'Competición por definir'} {match.group && ` • ${match.group}`} {match.matchday && ` • JORNADA ${match.matchday}`}
        </span>
        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase">{match.season || '2026/27'}</span>
      </div>

      {/* Cabecera */}
      <div className="text-center pt-5 pb-3 relative z-10 px-4">
        <div className="flex justify-center items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
          <MapPin size={16} />
          <span className="text-xs md:text-sm uppercase font-black tracking-widest">{match.field || 'Campo por definir'}</span>
        </div>
        <p className="text-slate-800 dark:text-white text-sm font-bold tracking-wide">{formatDate(match.date)}</p>
      </div>

      {/* Escudos y Hora */}
      <div className="flex items-center justify-between px-6 md:px-12 py-6 relative z-10 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col items-center flex-1">
          <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-transform group-hover:scale-105" />
          <span className="text-blue-950 dark:text-white font-black mt-4 text-[10px] md:text-xs text-center drop-shadow-sm uppercase break-words whitespace-normal px-2 w-full max-w-[120px]">{match.myTeam || 'Atleti'}</span>
        </div>

        <div className="flex flex-col items-center px-4 md:px-8">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-3 md:px-8 md:py-4 rounded-[2rem] shadow-inner backdrop-blur-md">
             <span className="text-xl md:text-3xl font-black text-blue-950 dark:text-white tracking-widest">{match.time || '--:--'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-[0.2em]">Hora</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          {rival?.shieldUrl ? (
             <img src={rival.shieldUrl} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-sm transition-transform group-hover:scale-105" alt="Rival"/>
          ) : (
             <Swords className="w-16 h-16 md:w-24 md:h-24 text-slate-300 dark:text-slate-600" />
          )}
          <span className="text-blue-950 dark:text-white font-black mt-4 text-[10px] md:text-xs text-center drop-shadow-sm uppercase break-words whitespace-normal px-2 w-full max-w-[120px]">
             {rival?.name || 'Rival'}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center relative z-10 mt-auto gap-4 md:gap-0 rounded-b-[3rem]">
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
           <span className="text-[10px] md:text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Convocatoria</span>
           {convocados.length > 0 ? (
             <div className="flex -space-x-3">
               {convocados.map(gk => (
                 <img key={gk.id} src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} title={gk.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-sm bg-slate-200 dark:bg-slate-700" style={{ objectPosition: 'center 15%' }} alt=""/>
               ))}
             </div>
           ) : (
             <span className="text-[10px] text-slate-400 font-bold italic">Sin asignar</span>
           )}
        </div>

        <div className="flex items-center gap-4 md:gap-8 justify-center w-full md:w-auto">
           <div className="flex flex-col items-center md:items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Goles Favor</span>
              <span className="text-lg md:text-2xl font-black text-blue-950 dark:text-white">{match.goalsScored || rival?.goalsScored || '--'}</span>
           </div>
           
           <div className="flex flex-col items-center md:items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Racha Rival</span>
              <StreakDisplay streak={match.streak} />
           </div>

           {(onEdit || onDelete) && (
             <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3 md:pl-4 ml-1 md:ml-2">
               {onEdit && (
                 <button onClick={() => onEdit(match)} className="p-2 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl transition-colors">
                   <Edit2 size={16}/>
                 </button>
               )}
               {onDelete && (
                 <button onClick={() => onDelete(match.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl transition-colors">
                   <X size={16}/>
                 </button>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const StreakDisplay = ({ streak }) => {
  if (!streak || streak.length === 0) return <span className="text-sm font-black text-slate-300 dark:text-slate-600">---</span>;
  return (
    <div className="flex gap-1.5 justify-end mt-1">
      {streak.map((res, i) => (
        <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${res === 'V' ? 'bg-emerald-500' : res === 'E' ? 'bg-blue-500' : 'bg-red-500'}`}>
          <span className="leading-none pt-[1px]">{res}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// VESTUARIO VIRTUAL 2.5D INTERACTIVO
// ==========================================
function VestuarioVirtual({ gks, onOpenPlan, theme }) {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[3rem] p-6 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Fondo inmersivo: Luces tipo estadio / vestuario premium */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 px-2 relative z-10">
        <div>
          <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            Centro de Mando: Vestuario
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Selecciona a un portero para configurar su plan táctico</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg">
            <img src={ESCUDO_ATM_URL} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Atleti KMP Report</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {gks.map(gk => (
          <div 
            key={gk.id} 
            onClick={() => onOpenPlan(gk)}
            className="group cursor-pointer relative flex flex-col w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-700/50 hover:border-red-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:-translate-y-2"
          >
            {/* Tira LED Superior */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800 group-hover:bg-red-500 group-hover:shadow-[0_0_10px_#ef4444] transition-colors duration-500 z-20"></div>

            {/* Imagen del portero (Hero) */}
            <div className="absolute inset-0 z-0">
              <img 
                src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} 
                alt={gk.name}
                className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                style={{ objectPosition: 'center 15%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>

            {/* Número en marca de agua gigante */}
            <span className="absolute top-4 right-4 text-slate-800/50 font-black italic text-6xl md:text-7xl z-10 group-hover:text-red-500/20 transition-colors duration-500 select-none">
              {gk.number}
            </span>

            {/* HUD Overlay (Aparece en Hover) */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-slate-950/40 backdrop-blur-[2px]">
               <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-slate-900/80 text-red-500 mb-3 shadow-[0_0_15px_rgba(220,38,38,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-500">
                  <Target size={28} strokeWidth={2.5} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Ver Plan Táctico</span>
            </div>

            {/* Info inferior (Siempre visible) */}
            <div className="mt-auto relative z-30 p-6 flex flex-col justify-end">
               <div className="flex items-end justify-between mb-2">
                 <div>
                    <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-md">{gk.name}</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mt-2">{gk.team}</p>
                 </div>
               </div>

               {/* Micro-stats */}
               <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800/80">
                 <div>
                   <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Forma</span>
                   <span className="text-sm font-black text-emerald-400">{gk.form || '5.0'}</span>
                 </div>
                 <div>
                   <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min. Jugados</span>
                   <span className="text-sm font-black text-white">{gk.stats?.minutes || 0}</span>
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MODAL DE PLAN DE PARTIDO DESDE EL VESTUARIO
// ==========================================
function LockerPlanModal({ gk, onClose, theme, darkMode }) {
  const recommendation = gk.technicalDecision || { title: 'PENDIENTE', reason: 'Sin valoración técnica actualmente.' };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/95 backdrop-blur-md p-4 no-print animate-fade-in">
      <div className={`w-full max-w-4xl rounded-[3rem] border ${theme.border} bg-slate-950 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}>
        {/* Encabezado Táctico */}
        <div className="p-8 border-b border-slate-850 flex justify-between items-center bg-gradient-to-r from-red-950/30 to-blue-950/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-500 bg-slate-900 flex-shrink-0 shadow-lg">
              <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} alt=""/>
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{gk.name}</h2>
              <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-1">PLAN DE PARTIDO PERSONALIZADO</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-900 hover:bg-red-900 text-slate-400 hover:text-white rounded-full transition-colors shadow-lg"><X size={20}/></button>
        </div>

        {/* Contenido Planificación */}
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Shield size={18} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Defensivo</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.defensive || 'No definido.'}</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Swords size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Ofensivo</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.offensive || 'No definido.'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <GitCompare size={18} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Objetivo Táctico</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.tactical || 'No definido.'}</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Goal size={18} className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Aspectos Claves</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{gk.matchPlan?.keyAspects || 'No definido.'}</p>
            </div>
          </div>

          {/* Tarjeta de Decisión Técnica al final */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-red-950/20 to-slate-900 border border-red-900/40 p-6 rounded-[2rem] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Recomendación de Titularidad</span>
              <h4 className="text-xl font-black italic tracking-tighter text-slate-200 uppercase leading-tight mb-2">{recommendation.title}</h4>
              <p className="text-xs text-slate-400 font-medium">{recommendation.reason}</p>
            </div>
            <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-slate-950/80 border border-slate-800 shadow-inner">
              <span className="text-4xl">🧤</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-850 flex justify-end bg-slate-950/40">
          <button onClick={onClose} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-900/30">
            Confirmar Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MÓDULOS DE LA APLICACIÓN
// ==========================================
function ModuleInicio({ gks, matches, rivals, theme, setModule, darkMode, onEditMatch, onDeleteMatch, isDataLoading, currentUserData, viewLockerRoom, setViewLockerRoom, onOpenLockerPlan, role }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMatches = [...matches]
    .filter(m => m.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const [weatherData, setWeatherData] = useState({ temp: '--', desc: 'Cargando...', city: 'Madrid', isRainy: false });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current_weather=true`);
        const wData = await weatherRes.json();
        const current = wData.current_weather;
        let desc = 'DESPEJADO';
        let isRainy = false;
        if ([51,53,55,61,63,65,80,81,82,95,96,99].includes(current.weathercode)) { desc = 'LLUVIA'; isRainy = true; }
        else if ([71,73,75,85,86].includes(current.weathercode)) { desc = 'NIEVE'; isRainy = true; }
        else if ([1,2,3].includes(current.weathercode)) { desc = 'NUBLADO'; }
        setWeatherData({ temp: String(Math.round(current.temperature)), desc, city: 'MADRID', isRainy });
      } catch (e) {
        setWeatherData({ temp: '--', desc: 'ERROR', city: 'MADRID', isRainy: false });
      }
    };
    fetchWeather();
  }, []);

  const hour = new Date().getHours();
  let greeting = "BUENOS DÍAS";
  if (hour >= 13 && hour < 20) greeting = "BUENAS TARDES";
  else if (hour >= 20 || hour < 5) greeting = "BUENAS NOCHES";

  const userName = currentUserData?.name ? currentUserData.name.split(' ')[0].toUpperCase() : 'ENTRENADOR';

  if (isDataLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <SkeletonCard />
           <div className="md:col-span-2 flex overflow-hidden gap-6"><SkeletonMatch /><SkeletonMatch className="hidden md:block" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-blue-950 rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden shadow-sm min-h-[140px]">
           <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
              <Shield size={180} />
           </div>
           <div className="relative z-10 text-left">
             <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
               {greeting}, {userName}
             </h2>
           </div>
         </div>

         <div className={`md:col-span-1 rounded-[2.5rem] p-6 flex items-center justify-between text-white relative overflow-hidden shadow-sm min-h-[140px] ${weatherData.isRainy ? 'bg-gradient-to-r from-slate-600 to-slate-800' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none -mr-8">
              {weatherData.isRainy ? <CloudRain size={120} /> : <Sun size={120} />}
           </div>
           <div className="flex items-center gap-4 z-10 w-full">
              <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-sm shrink-0">
                 {weatherData.isRainy ? <CloudRain size={36} /> : <Sun size={36} />}
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">{weatherData.city}</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black tracking-tighter leading-none">{weatherData.temp}º</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{weatherData.desc}</span>
                 </div>
              </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-center shadow-sm`}>
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 mb-4">
            <Users size={32} className="text-red-600"/>
          </div>
          <h2 className="text-5xl font-black text-blue-950 dark:text-white tracking-tighter mb-2">{gks.length}</h2>
          <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} font-black`}>Porteros Asignados</p>
        </div>

        <div className="md:col-span-2 overflow-hidden flex flex-col gap-4">
          <div className="flex justify-between items-end px-2 mb-2">
             <div className="text-left">
               <h3 className="text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white leading-none">Próximos Partidos</h3>
             </div>
             {upcomingMatches.length > 1 && <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">Desliza →</span>}
          </div>
          
          {upcomingMatches.length > 0 ? (
             <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 custom-scrollbar">
               {upcomingMatches.map(match => {
                  const r = rivals.find(r => r.id === match.rivalId);
                  return (
                    <div key={match.id} className="min-w-full lg:min-w-[85%] snap-center shrink-0">
                      <MatchScoreboardCard match={match} rival={r} gks={gks} theme={theme} darkMode={darkMode} onEdit={role !== 'staff' ? onEditMatch : null} onDelete={role !== 'staff' ? onDeleteMatch : null} />
                    </div>
                  )
               })}
             </div>
          ) : (
            <div className={`p-6 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-slate-400 h-[250px]`}>
              <CalendarDays size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">Sin partidos programados</p>
            </div>
          )}
        </div>
      </div>

      {/* Título de control de la sección de Porteros + Selector Visual */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-10 mb-4 px-2">
        <div className="text-left">
          <h3 className={`text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Tus Porteros</h3>
          <h4 className="text-2xl font-black italic uppercase tracking-tighter text-blue-950 dark:text-white mt-1 leading-none">Planificación del Plantel</h4>
        </div>
        
        {/* Selector Visual Premium */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 shadow-inner">
          <button 
            onClick={() => setViewLockerRoom(true)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${viewLockerRoom ? 'bg-blue-950 dark:bg-red-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            🚪 Vestuario 3D
          </button>
          <button 
            onClick={() => setViewLockerRoom(false)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${!viewLockerRoom ? 'bg-blue-950 dark:bg-red-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            📋 Tarjetas
          </button>
        </div>
      </div>

      {/* VISTA DEL VESTUARIO VIRTUAL O DE TARJETAS */}
      {viewLockerRoom ? (
        <VestuarioVirtual 
          gks={gks} 
          onOpenPlan={onOpenLockerPlan} 
          theme={theme}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gks.map(gk => (
            <div key={gk.id} onClick={() => setModule('porteros')} className={`p-4 rounded-[2rem] border ${theme.border} bg-white dark:bg-slate-800 hover:border-red-500/50 hover:shadow-lg cursor-pointer transition-all group relative overflow-hidden shadow-sm`}>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-transparent text-7xl font-black italic transform -skew-x-6 z-0 pointer-events-none select-none transition-all group-hover:scale-110" style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.05)' : '2px rgba(15, 23, 42, 0.05)' }}>
                {gk.number}
              </div>
              <div className="flex items-center gap-4 relative z-10 text-left">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 group-hover:border-red-500 transition-colors shrink-0 bg-slate-50 dark:bg-slate-900">
                  <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} alt=""/>
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase text-blue-950 dark:text-white tracking-tight drop-shadow-sm">{gk.name}</h4>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-500 mt-1.5 ml-0.5">{gk.team}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModulePorteros({ gks, role, onSelect, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  if (isDataLoading) return <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <p className={`text-sm font-medium ${theme.textMuted}`}>Gestiona los perfiles y accede a sus estadísticas.</p>
        {role === 'admin' && (
          <button onClick={onNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20">
            <Plus size={16} /> Crear Portero
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gks.map(gk => (
          <div key={gk.id} className={`rounded-[3rem] border ${theme.border} ${theme.card} overflow-hidden group relative flex flex-col shadow-sm hover:shadow-xl transition-shadow`}>
            <div onClick={() => onSelect(gk.id)} className="cursor-pointer flex-1 flex flex-col">
              <div className={`h-48 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'} relative overflow-hidden border-b`}>
                <img 
                  src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} 
                  className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-700" 
                  style={{ 
                    objectPosition: 'center 15%',
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' 
                  }} 
                  alt=""
                />
              </div>
              <div className="pt-4 pb-6 px-4 text-center relative z-20">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-transparent text-6xl font-black italic transform -skew-x-6 z-0 pointer-events-none select-none transition-all group-hover:scale-110" style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.05)' : '2px rgba(15, 23, 42, 0.05)' }}>
                  {gk.number}
                </span>
                <div className="relative z-10">
                  <h3 className={`text-xl font-black uppercase italic tracking-tighter ${darkMode ? 'text-white' : 'text-blue-950'}`}>{gk.name}</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 dark:text-red-500 mt-2 ml-1">{gk.team || 'Atlético de Madrid'}</p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 border-t ${theme.border} flex justify-center gap-3 mt-auto ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              {role !== 'staff' ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(gk); }} 
                  className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-blue-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white' : 'text-blue-600 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm'}`}
                >
                  <Edit2 size={14}/> Editar
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); onSelect(gk.id); }} 
                  className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-blue-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white' : 'text-blue-600 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm'}`}
                >
                  <Eye size={14}/> Ver Perfil
                </button>
              )}
              {role === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(gk.id); }} 
                  className={`flex flex-1 items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all ${darkMode ? 'text-red-400 bg-slate-800 border border-slate-700 hover:bg-red-500/20 hover:text-red-300' : 'text-red-600 bg-white border border-slate-200 hover:bg-red-50 shadow-sm'}`}
                >
                  <X size={14}/> Borrar
                </button>
              )}
            </div>
          </div>
        ))}
        {gks.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">No hay porteros asignados.</div>}
      </div>
    </div>
  );
}

function ModulePartidos({ matches, rivals, gks, role, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMatches = [...matches].filter(m => m.date >= todayStr).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastMatches = [...matches].filter(m => m.date < todayStr).sort((a, b) => new Date(b.date) - new Date(a.date)); // Descendente

  if (isDataLoading) return <div className="grid grid-cols-1 xl:grid-cols-2 gap-8"><SkeletonMatch/><SkeletonMatch/></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className={`text-sm font-medium ${theme.textMuted}`}>Gestiona el calendario y las convocatorias de tus porteros.</p>
        {role !== 'staff' && (
          <button onClick={onNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20">
            <Plus size={16} /> Añadir Partido
          </button>
        )}
      </div>

      {/* SECCIÓN PRÓXIMOS PARTIDOS */}
      <div>
        <h3 className="text-xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white mb-6 flex items-center gap-2"><CalendarDays className="text-red-500"/> Próximos Partidos</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {upcomingMatches.map(match => {
            const rival = rivals.find(r => r.id === match.rivalId);
            return <MatchScoreboardCard key={match.id} match={match} rival={rival} gks={gks} onEdit={role !== 'staff' ? onEdit : null} onDelete={role !== 'staff' ? onDelete : null} theme={theme} darkMode={darkMode} />
          })}
          
          {upcomingMatches.length === 0 && (
            <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm">
              <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No hay próximos partidos</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN HISTORIAL */}
      {pastMatches.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2"><RotateCcw className="text-slate-400"/> Historial de Partidos</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 opacity-80 hover:opacity-100 transition-opacity">
            {pastMatches.map(match => {
              const rival = rivals.find(r => r.id === match.rivalId);
              return <MatchScoreboardCard key={match.id} match={match} rival={rival} gks={gks} onEdit={role !== 'staff' ? onEdit : null} onDelete={role !== 'staff' ? onDelete : null} theme={theme} darkMode={darkMode} />
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleComparador({ gks, theme, darkMode }) {
  const [gk1Id, setGk1Id] = useState(gks[0]?.id || '');
  const [gk2Id, setGk2Id] = useState(gks[1]?.id || '');

  const gk1 = gks.find(g => g.id === gk1Id);
  const gk2 = gks.find(g => g.id === gk2Id);

  const radarData = useMemo(() => {
    if (!gk1 || !gk2) return [];
    return gk1.skills.map(s1 => {
      const s2 = gk2.skills.find(s => s.subject === s1.subject);
      return {
        subject: s1.subject,
        A: s1.A,
        B: s2 ? s2.A : 0,
        fullMark: 100
      };
    });
  }, [gk1, gk2]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card} text-center shadow-sm`}>
        <GitCompare className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl md:text-3xl font-black text-blue-950 dark:text-white uppercase tracking-tighter mb-2">Comparador de Rendimiento</h2>
        <p className={`text-sm font-medium mb-8 ${theme.textMuted}`}>Analiza y contrasta las habilidades y estadísticas de dos porteros cara a cara.</p>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <select value={gk1Id} onChange={(e) => setGk1Id(e.target.value)} className={`w-full md:w-64 border ${theme.border} rounded-[1rem] px-4 py-3 outline-none font-black text-sm cursor-pointer shadow-inner bg-slate-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500`}>
            <option value="">Selecciona Portero 1</option>
            {gks.map(g => <option key={g.id} value={g.id} disabled={g.id === gk2Id}>{g.name}</option>)}
          </select>
          <span className="text-slate-400 font-black uppercase text-xs">VS</span>
          <select value={gk2Id} onChange={(e) => setGk2Id(e.target.value)} className={`w-full md:w-64 border ${theme.border} rounded-[1rem] px-4 py-3 outline-none font-black text-sm cursor-pointer shadow-inner bg-slate-50 dark:bg-slate-900 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500`}>
            <option value="">Selecciona Portero 2</option>
            {gks.map(g => <option key={g.id} value={g.id} disabled={g.id === gk1Id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {gk1 && gk2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <CompareProfileCard gk={gk1} color="blue" theme={theme} darkMode={darkMode} />
            <CompareProfileCard gk={gk2} color="red" theme={theme} darkMode={darkMode} />
          </div>

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

const CompareProfileCard = ({ gk, color, theme, darkMode }) => (
  <div className={`p-5 rounded-[2rem] flex items-center gap-5 shadow-sm border ${theme.border} ${theme.card}`}>
    <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shrink-0 bg-slate-50 dark:bg-slate-900 ${color === 'blue' ? 'border-blue-500' : 'border-red-500'}`}>
      <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-full h-full object-cover" alt=""/>
    </div>
    <div>
      <h4 className={`font-black text-sm uppercase ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{gk.name}</h4>
      <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme.textMuted} mt-1.5 ml-0.5`}>{gk.team}</p>
    </div>
  </div>
);

const StatRow = ({ label, val1, val2, isHigherBetter, darkMode }) => {
  const isBetter = isHigherBetter ? parseFloat(val1) >= parseFloat(val2) : parseFloat(val1) <= parseFloat(val2);
  const isTie = parseFloat(val1) === parseFloat(val2);
  
  return (
    <div className={`flex justify-between items-center py-3 border-b last:border-0 ${darkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-base font-black ${isTie ? 'text-slate-400' : isBetter ? 'text-emerald-500' : 'text-slate-400'}`}>
        {val1}
      </span>
    </div>
  )
}

function ModuleRivales({ rivals, role, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  if (isDataLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-6"><SkeletonCard/><SkeletonCard/></div>;

  return (
    <div className="space-y-6">
      {role === 'admin' && (
        <div className="flex justify-end mb-6">
          <button onClick={onNew} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg">
            <Plus size={16} /> Añadir Rival
          </button>
        </div>
      )}

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
                <div className="absolute inset-0 bg-blue-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Upload size={24} className="text-white mb-2"/>
                   <span className="text-[10px] text-white font-black uppercase tracking-widest">Cambiar</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
             </label>
             {profileData.photoUrl && (
               <div className="w-32 mt-6">
                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <span>Ajustar Encuadre</span>
                 </div>
                 <input 
                   type="range" min="0" max="100" 
                   value={profileData.photoOffsetY ?? 50} 
                   onChange={(e) => setProfileData({...profileData, photoOffsetY: e.target.value})} 
                   className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
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
              <div className="flex justify-end pt-4">
                 <button onClick={() => {onSaveProfile(profileData); setProfileData({...profileData, newPassword: ''});}} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-colors shadow-lg">Guardar Cambios</button>
              </div>
           </div>
        </div>
      </div>

      {role === 'admin' && (
        <>
          <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3 text-blue-950 dark:text-white"><Database className="text-purple-500"/> Copia de Seguridad</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">Genera un archivo JSON con todos los datos (Porteros, Usuarios, Rivales). Guarda esto periódicamente.</p>
            <button onClick={onBackup} className="flex items-center justify-center w-full md:w-auto gap-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg">
              <Download size={18} /> Descargar Backup Completo
            </button>
          </div>

          <div className={`p-8 rounded-[3rem] border ${theme.border} ${theme.card}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-blue-950 dark:text-white"><Key className="text-emerald-500"/> Gestión de Usuarios</h3>
              <button onClick={onNewUser} className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-md">
                <Plus size={16} /> Nuevo Usuario
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest font-black text-slate-400">
                    <th className="pb-4 pl-4">Usuario</th>
                    <th className="pb-4">Rol</th>
                    <th className="pb-4 text-right pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-4 pl-4 flex items-center gap-4">
                        <img src={u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover" style={{ objectPosition: `center ${u.photoOffsetY ?? 50}%` }} alt="" />
                        <div>
                          <div className={`font-black text-sm uppercase text-blue-950 dark:text-white leading-tight`}>{u.name || 'Sin Nombre'}</div>
                          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{u.username || u.email}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : u.role === 'staff' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
                          {u.role === 'staff' ? 'Cuerpo Técnico' : u.role}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <button onClick={() => onEditUser(u)} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"><Edit2 size={14} strokeWidth={3}/></button>
                      </td>
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


// --- VISTA DETALLADA DEL PORTERO (DASHBOARD) ---
function DashboardView({ gk, allGks, matches, rivals, theme, darkMode, onEditTechDec, onEditStats, onEditMatchPlan, activeSeason, isDataLoading, exportTrigger, resetExportTrigger, showNotification, role }) {
  
  useEffect(() => {
    if (exportTrigger > 0) {
      exportarPDFVectorial(gk, matches, rivals, activeSeason, showNotification, darkMode).finally(() => {
        if (resetExportTrigger) resetExportTrigger();
      });
    }
  }, [exportTrigger]);

  if (isDataLoading) return <div className="space-y-6"><SkeletonCard/><SkeletonCard/></div>;
  if (!gk) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const gkMatches = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextMatch = gkMatches.filter(m => m.date >= todayStr)[0];
  const nextMatchRival = nextMatch ? rivals.find(r => r.id === nextMatch.rivalId) : null;

  const getGkState = (formScore) => {
    if (formScore >= 8.0) return { text: 'EN FORMA', icon: '🟢', color: 'text-emerald-500 dark:text-emerald-400' };
    if (formScore >= 5.0) return { text: 'REGULAR', icon: '🟠', color: 'text-orange-500 dark:text-orange-400' };
    return { text: 'BAJO', icon: '🔴', color: 'text-red-500 dark:text-red-400' };
  };
  const gkState = getGkState(gk.form || 5);

  const getTrend = (perfData) => {
    if (!perfData || perfData.length < 2) return { text: 'ESTABLE →', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
    const last = perfData[perfData.length - 1].goals;
    const prev = perfData[perfData.length - 2].goals;
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
  const goalsPercent = (gk.stats?.goalsConceded || 0) > 0 ? Math.min(100, Math.round(((gk.stats?.goalsConceded || 0) / Math.max(1, playedMatches)) * 50)) : 0;
  const cleanSheetsPercent = playedMatches > 0 ? Math.round(((gk.stats?.cleanSheets || 0) / playedMatches) * 100) : 0;
  const penaltiesPercent = (gk.stats?.penaltiesFaced || 0) > 0 ? Math.round(((gk.stats?.penaltiesSaved || 0) / gk.stats.penaltiesFaced) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:grid-cols-12">
        {/* TARJETA PERFIL */}
        <div className={`xl:col-span-4 rounded-[3rem] border ${theme.border} ${theme.card} overflow-hidden flex relative min-h-[380px] shadow-sm`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 dark:bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className={`w-2/5 ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-200'} relative flex flex-col justify-end border-r overflow-hidden`}>
            <div className="absolute inset-0 z-10">
              <img 
                src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} 
                alt={gk.name} 
                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" 
                style={{ 
                  objectPosition: 'center 15%', 
                  WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                }} 
                crossOrigin="anonymous"
              />
            </div>
            <span 
              className="absolute top-12 right-4 md:right-6 text-transparent text-8xl md:text-9xl font-black italic transform -skew-x-6 z-20 pointer-events-none select-none drop-shadow-xl" 
              style={{ WebkitTextStroke: darkMode ? '2px rgba(255, 255, 255, 0.2)' : '2px rgba(15, 23, 42, 0.1)' }}
            >
              {gk.number}
            </span>
            <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${darkMode ? 'from-slate-900' : 'from-white'} to-transparent z-10 pointer-events-none`}></div>
            <div className="relative z-20 text-center pb-6 px-2">
              <span 
                className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-transparent break-words leading-none" 
                style={{ WebkitTextStroke: darkMode ? '1.5px rgba(255, 255, 255, 0.95)' : '1.5px rgba(23, 37, 84, 0.95)' }}
              >
                {gk.name}
              </span>
              <p className="text-[11px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.3em] mt-2 drop-shadow-sm">{gk.team || 'Atlético de Madrid'}</p>
            </div>
          </div>
          
          <div className="w-3/5 p-6 md:p-8 flex flex-col justify-between z-10">
            <div>
              <div className="mt-2 space-y-4">
                <ProfileRow label="Equipo" value={gk.team || 'Atlético de Madrid'} theme={theme} />
                <ProfileRow label="Competición" value={`${gk.league || '--'} ${gk.group ? `(${gk.group})` : ''}`} theme={theme} />
                <ProfileRow label="Pie Domin." value={gk.foot || 'Derecho'} theme={theme} />
                <ProfileRow label="Mano Domin." value={gk.hand || 'Derecha'} theme={theme} />
              </div>
            </div>
            <div className={`mt-6 p-5 rounded-[2rem] ${darkMode ? 'bg-slate-900/80' : 'bg-slate-50 border border-slate-100'} flex items-center justify-between shadow-inner`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Forma</p>
                <div className="flex items-end gap-1"><span className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{gk.form || '5.0'}</span><span className={`text-xs mb-1 font-bold ${theme.textMuted}`}>/10</span></div>
              </div>
              <div className="flex gap-1.5">{gk.lastMatches?.map((m, i) => <div key={i} className={`w-3.5 h-3.5 rounded-full ${m === 'W' ? 'bg-emerald-500' : m === 'D' ? 'bg-blue-500' : 'bg-red-500'} shadow-sm`}></div>)}</div>
            </div>
          </div>
        </div>

        {/* WIDGET DINÁMICO DE PRÓXIMO PARTIDO */}
        <div className={`xl:col-span-8 h-full`}>
          {nextMatch ? (
             <MatchScoreboardCard match={nextMatch} rival={nextMatchRival} gks={[gk]} theme={theme} darkMode={darkMode} />
          ) : (
            <div className={`h-full p-8 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col items-center justify-center text-slate-400 dark:text-slate-500`}>
              <CalendarDays size={56} className="mb-4 opacity-50" />
              <p className="text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sin partidos inminentes</p>
              <p className="text-xs mt-2 font-medium">Este portero no está en ninguna convocatoria próxima.</p>
            </div>
          )}
        </div>
      </div>

      {/* ESTADÍSTICAS GRID */}
      <div>
        <div className="flex justify-between items-center mb-6 ml-2 group">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-950 dark:text-slate-300">Estadísticas Temporada {activeSeason}</h3>
          {role !== 'staff' && (
            <button onClick={onEditStats} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-sm no-print opacity-100" title="Editar Estadísticas">
              <Edit2 size={16} strokeWidth={3} />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 print:grid-cols-4">
          <StatCard title="Minutos Jugados" value={gk.stats?.minutes || 0} subtitle="min. jugados" color="stroke-blue-500" percent={minsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Titular" value={gk.stats?.starts || 0} subtitle={`${gk.stats?.starts || 0} / ${teamMatches}`} color="stroke-indigo-500" percent={startsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Suplente" value={gk.stats?.subs || 0} subtitle={`${gk.stats?.subs || 0} / ${teamMatches}`} color="stroke-violet-500" percent={subsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Goles Encajados" value={gk.stats?.goalsConceded || 0} subtitle={`Promedio: ${playedMatches ? ((gk.stats?.goalsConceded || 0) / playedMatches).toFixed(2) : 0}`} color="stroke-red-500" percent={goalsPercent} theme={theme} darkMode={darkMode} />
          <StatCard title="Porterías a Cero" value={gk.stats?.cleanSheets || 0} subtitle="Ratio clean sheets" color="stroke-emerald-500" percent={cleanSheetsPercent} theme={theme} darkMode={darkMode} />
          <StatCard title="Penaltis Parados" value={gk.stats?.penaltiesSaved || 0} subtitle={`de ${gk.stats?.penaltiesFaced || 0} penaltis`} color="stroke-cyan-500" percent={penaltiesPercent} theme={theme} darkMode={darkMode} />
          
          <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-center relative overflow-hidden shadow-sm`}>
             <h4 className={`text-[9px] uppercase tracking-widest font-black ${theme.textMuted} mb-3`}>Datos Globales</h4>
             <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Convocatorias</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.calledUpMatches || 0}/{gk.stats?.teamMatches || 0}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">{teamMatches > 0 ? Math.round(((gk.stats?.calledUpMatches || 0) / teamMatches) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Jugados</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.playedMatches || 0}/{gk.stats?.teamMatches || 0}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">{teamMatches > 0 ? Math.round(((gk.stats?.playedMatches || 0) / teamMatches) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Minutos</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-950 dark:text-white">{gk.stats?.minutes || 0}/{gk.stats?.teamMinutes || 0}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">{teamMinutes > 0 ? Math.round(((gk.stats?.minutes || 0) / teamMinutes) * 100) : 0}%</span>
                  </div>
                </div>
             </div>
          </div>

          <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-center relative overflow-hidden shadow-sm`}>
             <span className="text-4xl md:text-5xl mb-2 md:mb-3 drop-shadow-md">{gkState.icon}</span>
             <span className={`text-[10px] font-black uppercase tracking-widest ${gkState.color}`}>{gkState.text}</span>
          </div>
        </div>
      </div>

      {/* PLAN DE PARTIDO */}
      <div className={`rounded-[3rem] border ${theme.border} ${theme.card} p-8 flex flex-col shadow-sm relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white flex items-center gap-2">
            <Target size={18} className="text-blue-500"/> Plan de Partido
          </h3>
          {role !== 'staff' && (
            <button onClick={onEditMatchPlan} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-600 transition-all shadow-sm no-print opacity-100" title="Editar Plan de Partido">
              <Edit2 size={16} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
          <MatchPlanBox title="Objetivo Defensivo" icon={<Shield size={18} className="text-red-500"/>} content={gk.matchPlan?.defensive} darkMode={darkMode} />
          <MatchPlanBox title="Objetivo Ofensivo" icon={<Swords size={18} className="text-emerald-500"/>} content={gk.matchPlan?.offensive} darkMode={darkMode} />
          <MatchPlanBox title="Objetivo Táctico" icon={<GitCompare size={18} className="text-blue-500"/>} content={gk.matchPlan?.tactical} darkMode={darkMode} />
          <MatchPlanBox title="Aspectos Claves" icon={<Goal size={18} className="text-yellow-500"/>} content={gk.matchPlan?.keyAspects} darkMode={darkMode} />
        </div>
      </div>

      {/* GRÁFICOS (RADAR Y LÍNEA) Y DECISIÓN DE TITULARIDAD */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:grid-cols-12 print:break-inside-avoid">
        
        {/* RADAR: HABILIDADES */}
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

        {/* LÍNEA: EVOLUCIÓN Y TENDENCIA */}
        <div className={`xl:col-span-6 rounded-[3rem] border ${theme.border} ${theme.card} p-8 flex flex-col shadow-sm`}>
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white">Evolución (Últimos 5)</h3>
             <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl ${gkTrend.bg} ${gkTrend.color}`}>{gkTrend.text}</span>
          </div>
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
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm"></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Goles Encajados</span></div>
          </div>
        </div>

        {/* RECOMENDACIÓN TÉCNICA (MANUAL) */}
        <div className={`xl:col-span-3 rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 p-8 flex flex-col relative overflow-hidden shadow-sm dark:shadow-md group`}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
           <div className="flex justify-between items-center mb-6 relative z-10">
             <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
               <BarChart2 size={18}/> Decisión
             </h3>
             {role !== 'staff' && (
               <button onClick={onEditTechDec} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-600 transition-all shadow-sm no-print opacity-100" title="Editar Decisión">
                 <Edit2 size={14} strokeWidth={3} />
               </button>
             )}
           </div>
           
           <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 p-5 rounded-[2rem] mb-5 relative z-10 shadow-inner">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">Recomendación</span>
                 <span className="text-xl font-black italic tracking-tighter text-blue-950 dark:text-white leading-tight uppercase">{recommendation.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10"><strong className="text-slate-800 dark:text-slate-200 block mb-1">Motivo:</strong> {recommendation.reason}</p>
           </div>
        </div>
      </div>
    </div>
  );
}

const MatchPlanBox = ({ title, icon, content, darkMode }) => (
  <div className={`bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 p-5 rounded-[2rem] shadow-inner flex flex-col h-full`}>
     <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</span>
     </div>
     <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap flex-1">
       {content || <span className="text-slate-400 italic">No definido...</span>}
     </p>
  </div>
);

function MatchPlanModal({ initialData, onClose, onSave, theme }) {
  const [formData, setFormData] = useState({ 
    defensive: initialData?.matchPlan?.defensive || '', 
    offensive: initialData?.matchPlan?.offensive || '',
    tactical: initialData?.matchPlan?.tactical || '',
    keyAspects: initialData?.matchPlan?.keyAspects || ''
  });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-900 transition-colors shadow-inner text-xs resize-none font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-4xl rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 rounded-t-[3rem]`}>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-blue-950 dark:text-white"><Target className="text-blue-600 w-8 h-8" /> Plan de Partido</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Objetivo Defensivo</label>
            <textarea name="defensive" value={formData.defensive} onChange={handleChange} rows={4} className={inputClass} placeholder="Ej: Cerrar espacios en bloque bajo..." />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Objetivo Ofensivo</label>
            <textarea name="offensive" value={formData.offensive} onChange={handleChange} rows={4} className={inputClass} placeholder="Ej: Salida rápida por bandas..." />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Objetivo Táctico</label>
            <textarea name="tactical" value={formData.tactical} onChange={handleChange} rows={4} className={inputClass} placeholder="Ej: Mantener línea adelantada..." />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Aspectos Claves</label>
            <textarea name="keyAspects" value={formData.keyAspects} onChange={handleChange} rows={4} className={inputClass} placeholder="Ej: Sonreír, disfrutar, transmitir seguridad..." />
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-900/20">Guardar Plan</button>
        </div>
      </div>
    </div>
  );
}

function AddSeasonModal({ onClose, onSave, theme }) {
  const [seasonText, setSeasonText] = useState('');
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-900 transition-colors shadow-inner font-black text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-sm rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 rounded-t-[3rem]`}>
          <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-blue-950 dark:text-white"><CalendarDays className="text-blue-600 w-6 h-6" /> Nueva Temporada</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={18}/></button>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Introduce el nombre de la nueva temporada:</p>
          <input 
            type="text" 
            value={seasonText} 
            onChange={(e) => setSeasonText(e.target.value)} 
            placeholder="Ej: 2027/28" 
            className={inputClass} 
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && seasonText.trim() && onSave(seasonText.trim())}
          />
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={() => seasonText.trim() && onSave(seasonText.trim())} className="px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-900/20">Añadir</button>
        </div>
      </div>
    </div>
  );
}

function GkStatsModal({ initialData, onClose, onSave, theme }) {
  const [formData, setFormData] = useState({
    form: initialData?.form || 5.0, minutes: initialData?.stats?.minutes || 0, starts: initialData?.stats?.starts || 0, subs: initialData?.stats?.subs || 0,
    goalsConceded: initialData?.stats?.goalsConceded || 0, cleanSheets: initialData?.stats?.cleanSheets || 0, penaltiesSaved: initialData?.stats?.penaltiesSaved || 0, penaltiesFaced: initialData?.stats?.penaltiesFaced || 0,
    teamMatches: initialData?.stats?.teamMatches || 0, calledUpMatches: initialData?.stats?.calledUpMatches || 0, playedMatches: initialData?.stats?.playedMatches || 0, teamMinutes: initialData?.stats?.teamMinutes || 0
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = () => { onSave({ form: parseFloat(formData.form) || 5.0, stats: { minutes: parseInt(formData.minutes) || 0, starts: parseInt(formData.starts) || 0, subs: parseInt(formData.subs) || 0, goalsConceded: parseInt(formData.goalsConceded) || 0, cleanSheets: parseInt(formData.cleanSheets) || 0, penaltiesSaved: parseInt(formData.penaltiesSaved) || 0, penaltiesFaced: parseInt(formData.penaltiesFaced) || 0, teamMatches: parseInt(formData.teamMatches) || 0, calledUpMatches: parseInt(formData.calledUpMatches) || 0, playedMatches: parseInt(formData.playedMatches) || 0, teamMinutes: parseInt(formData.teamMinutes) || 0 } }); };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none text-slate-800 dark:text-white font-black focus:border-emerald-500 transition-colors shadow-inner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-3xl rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 rounded-t-[3rem]`}>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-emerald-950 dark:text-white"><Activity className="text-emerald-500 w-8 h-8" /> Editar Estadísticas</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Actualiza las estadísticas acumuladas y el estado de forma general de <strong className="text-slate-800 dark:text-white font-black uppercase">{initialData?.name}</strong>.</p>
          
          <div className="mb-6 bg-slate-100 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Datos Globales (Para Porcentajes)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Partidos Equipo</label><input type="number" name="teamMatches" value={formData.teamMatches} onChange={handleChange} className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Partidos Convocado</label><input type="number" name="calledUpMatches" value={formData.calledUpMatches} onChange={handleChange} className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Partidos Jugados</label><input type="number" name="playedMatches" value={formData.playedMatches} onChange={handleChange} className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Minutos Equipo</label><input type="number" name="teamMinutes" value={formData.teamMinutes} onChange={handleChange} className={inputClass} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Estado Forma (0-10)</label><input type="number" step="0.1" name="form" value={formData.form} onChange={handleChange} className={`${inputClass} text-emerald-600 dark:text-emerald-400 text-lg`} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Minutos Jugados</label><input type="number" name="minutes" value={formData.minutes} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Titularidades</label><input type="number" name="starts" value={formData.starts} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Suplencias</label><input type="number" name="subs" value={formData.subs} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Goles Encajados</label><input type="number" name="goalsConceded" value={formData.goalsConceded} onChange={handleChange} className={`${inputClass} text-red-600 dark:text-red-400`} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Porterías a Cero</label><input type="number" name="cleanSheets" value={formData.cleanSheets} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Penaltis Parados</label><input type="number" name="penaltiesSaved" value={formData.penaltiesSaved} onChange={handleChange} className={`${inputClass} text-blue-600 dark:text-blue-400`} /></div>
            <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Penaltis Totales</label><input type="number" name="penaltiesFaced" value={formData.penaltiesFaced} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm">Cancelar</button>
          <button onClick={handleSubmit} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/30">Guardar Estadísticas</button>
        </div>
      </div>
    </div>
  );
}

function TechDecisionModal({ initialData, onClose, onSave, theme }) {
  const [formData, setFormData] = useState({ title: initialData?.technicalDecision?.title || '', reason: initialData?.technicalDecision?.reason || '' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-900 transition-colors shadow-inner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-lg rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 rounded-t-[3rem]`}>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-blue-950 dark:text-white"><BarChart2 className="text-blue-600 w-8 h-8" /> Decisión Técnica</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Introduce la recomendación técnica para <strong className="text-slate-800 dark:text-white uppercase font-black">{initialData?.name}</strong>. Visible internamente.</p>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Recomendación (Título)</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Titular Indiscutible..." className={`${inputClass} font-black text-blue-950 dark:text-blue-400`} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Motivo / Justificación</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Ej: Mejor estado de forma..." rows={4} className={`${inputClass} font-medium resize-none`} />
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-900/20">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function MatchFormModal({ initialData, rivals, gks, onClose, onSave, theme, darkMode, activeSeason }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData || { date: '', time: '', field: '', rivalId: '', goalkeeperIds: [], streak: [], goalsScored: '', season: activeSeason || '2026/27', league: '', group: '', matchday: '', myTeam: TEAMS_LIST[0] });
  
  const [isCustomField, setIsCustomField] = useState(initialData?.field ? !['CD ATM Alcalá de Henares', 'CD Cerro Del Espino Majadahonda'].includes(initialData.field) : false);
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const toggleGk = (id) => {
    setFormData(prev => {
      const isSelected = prev.goalkeeperIds.includes(id);
      const newIds = isSelected ? prev.goalkeeperIds.filter(gkId => gkId !== id) : [...prev.goalkeeperIds, id];
      let newLeague = prev.league; let newGroup = prev.group;
      if (!isSelected) { const gk = gks.find(g => g.id === id); if (gk) { newLeague = gk.league || newLeague; newGroup = gk.group || newGroup; } }
      return { ...prev, goalkeeperIds: newIds, league: newLeague, group: newGroup };
    });
  };

  const addStreak = (res) => { if (formData.streak.length >= 5) return; setFormData(prev => ({ ...prev, streak: [...(prev.streak || []), res] })); };
  const clearStreak = () => setFormData(prev => ({ ...prev, streak: [] }));

  const handleSubmit = () => {
    if(!formData.date || !formData.rivalId) return alert("Fecha y Rival son obligatorios"); 
    onSave({ ...formData, id: initialData?.id });
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-2xl rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center`}>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-950 dark:text-white"><CalendarDays className="text-red-500" /> {initialData ? 'Editar Partido' : 'Nuevo Partido'}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="flex px-8 pt-8 pb-4">
          {['Contexto', 'Fecha & Lugar', 'Rival & Convocatoria'].map((title, idx) => (
             <div key={idx} className={`flex-1 text-center text-[10px] font-black uppercase tracking-widest pb-3 border-b-4 rounded-b-sm ${step === idx + 1 ? 'border-red-600 text-red-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <span className="hidden sm:inline">{title}</span><span className="sm:hidden">Paso {idx+1}</span>
             </div>
          ))}
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Temporada</label><input type="text" name="season" value={formData.season} onChange={handleChange} className={inputClass} placeholder="Ej: 2026/27" /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Jornada</label><input type="text" name="matchday" value={formData.matchday} onChange={handleChange} className={inputClass} placeholder="Ej: 14" /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-right-4">
              {/* Selector de Mi Equipo AÑADIDO AQUI */}
              <div className="mb-5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Mi Equipo</label>
                <select 
                  name="myTeam" 
                  value={formData.myTeam} 
                  onChange={handleChange} 
                  className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`}
                >
                  {TEAMS_LIST.map(team => <option key={team} value={team}>{team}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Fecha *</label><input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Hora</label><input type="time" name="time" value={formData.time} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Campo</label>
                {!isCustomField ? (
                  <select name="field" value={formData.field} onChange={(e) => { if (e.target.value === 'Otro') { setIsCustomField(true); setFormData({...formData, field: ''}); } else { handleChange(e); } }} className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`}>
                    <option value="">-- Selecciona campo --</option>
                    <option value="CD ATM Alcalá de Henares">CD ATM Alcalá de Henares</option>
                    <option value="CD Cerro Del Espino Majadahonda">CD Cerro Del Espino Majadahonda</option>
                    <option value="Otro">Otro (Especificar manual)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" name="field" value={formData.field} onChange={handleChange} className={inputClass} placeholder="Escribe el nombre del campo" />
                    <button type="button" onClick={() => { setIsCustomField(false); setFormData({...formData, field: ''}); }} className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-2xl transition-colors"><RotateCcw size={16}/></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Seleccionar Rival *</label>
                  <select name="rivalId" value={formData.rivalId} onChange={handleChange} className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`} required>
                    <option value="">-- Elige un rival --</option>
                    {rivals.map(r => <option key={r.id} value={r.id}>{r.name} {r.category && `(${r.category})`}</option>)}
                  </select>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mt-6 mb-2 pl-2">Goles a Favor rival (Opcional)</label>
                  <input type="number" name="goalsScored" value={formData.goalsScored} onChange={handleChange} className={inputClass} placeholder="Ej: 45" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Racha del Rival</label>
                  <div className="flex flex-col gap-3">
                     <div className="flex gap-3">
                        <button type="button" onClick={() => addStreak('V')} className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-md transition-colors">V</button>
                        <button type="button" onClick={() => addStreak('E')} className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black shadow-md transition-colors">E</button>
                        <button type="button" onClick={() => addStreak('D')} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black shadow-md transition-colors">D</button>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 h-14">
                        {formData.streak && formData.streak.map((res, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ${res === 'V' ? 'bg-emerald-500' : res === 'E' ? 'bg-blue-500' : 'bg-red-500'}`}>
                             <span className="leading-none pt-[1px]">{res}</span>
                          </div>
                        ))}
                        {(!formData.streak || formData.streak.length === 0) && <span className="text-xs text-slate-400 italic font-medium">Pulsa los botones para añadir...</span>}
                        <div className="flex-1"></div>
                        <button type="button" onClick={clearStreak} className="text-slate-400 hover:text-red-500 transition-colors p-2"><RotateCcw size={18}/></button>
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">Porteros Convocados</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {gks.map(gk => {
                    const isSelected = formData.goalkeeperIds.includes(gk.id);
                    return (
                      <div key={gk.id} onClick={() => toggleGk(gk.id)} className={`cursor-pointer p-4 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 hover:shadow-sm'}`}>
                         <div className="relative">
                           <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm" style={{ objectPosition: 'center 15%' }} alt=""/>
                           {isSelected && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-white dark:border-slate-800 shadow-sm"><CheckCircle2 size={12} className="text-white" strokeWidth={3}/></div>}
                         </div>
                         <span className={`text-xs text-center font-black uppercase truncate w-full ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>{gk.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          {step > 1 ? (
             <button onClick={() => setStep(step - 1)} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase text-slate-500 hover:text-blue-950 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"><ArrowLeft size={16} strokeWidth={3}/> Atrás</button>
          ) : (
             <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-red-500">Cancelar</button>
          )}

          {step < 3 ? (
             <button onClick={() => setStep(step + 1)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase bg-blue-950 hover:bg-blue-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-2 shadow-lg">Siguiente <ArrowRight size={16} strokeWidth={3}/></button>
          ) : (
             <button onClick={handleSubmit} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-900/20"><CheckCircle2 size={18} strokeWidth={3}/> Guardar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function GkFormModal({ initialData, users, onClose, onSave, theme, darkMode }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialData?.name || '', number: initialData?.number || '', team: initialData?.team || '', photoUrl: initialData?.photoUrl || '', 
    birthYear: initialData?.birthYear || '', nationality: initialData?.nationality || '', foot: initialData?.foot || 'Derecho', hand: initialData?.hand || 'Derecha',
    assignedTo: initialData?.assignedTo || ['all'], league: initialData?.league || '', group: initialData?.group || '',
    skills: initialData?.skills || [ { subject: 'Reflejos', A: 50, fullMark: 100 }, { subject: 'Juego Aéreo', A: 50, fullMark: 100 }, { subject: '1 vs 1', A: 50, fullMark: 100 }, { subject: 'Distribución', A: 50, fullMark: 100 }, { subject: 'Anticipación', A: 50, fullMark: 100 } ]
  });
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSkillChange = (index, value) => {
    const newSkills = [...formData.skills];
    newSkills[index].A = parseInt(value) || 0;
    setFormData({ ...formData, skills: newSkills });
  };
  const handleImageUpload = useImageUploader((base64) => setFormData(prev => ({ ...prev, photoUrl: base64 })));

  const toggleAssign = (userId) => {
    let newAssigned = [...(Array.isArray(formData.assignedTo) ? formData.assignedTo : [formData.assignedTo])];
    if (userId === 'all') {
      newAssigned = ['all'];
    } else {
      newAssigned = newAssigned.filter(id => id !== 'all');
      if (newAssigned.includes(userId)) newAssigned = newAssigned.filter(id => id !== userId);
      else newAssigned.push(userId);
      
      if (newAssigned.length === 0) newAssigned = ['all'];
    }
    setFormData({ ...formData, assignedTo: newAssigned });
  };

  const handleSubmit = () => { if(!formData.name) return; onSave({ ...formData, id: initialData?.id }); };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-900 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-2xl rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center`}>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-950 dark:text-white"><User className="text-red-500" /> {initialData ? 'Editar Portero' : 'Crear Portero'}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="flex px-8 pt-8 pb-4">
          {['Identidad', 'Físico & Liga', 'Atributos'].map((title, idx) => (
             <div key={idx} className={`flex-1 text-center text-[10px] font-black uppercase tracking-widest pb-3 border-b-4 rounded-b-sm ${step === idx + 1 ? 'border-red-600 text-red-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <span className="hidden sm:inline">{title}</span><span className="sm:hidden">Paso {idx+1}</span>
             </div>
          ))}
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="col-span-1 md:col-span-2 flex justify-center mb-6">
                <label className="flex flex-col items-center justify-center w-36 h-36 border-4 border-slate-100 dark:border-slate-700 border-dashed rounded-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" style={{objectPosition:'center 15%'}} />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400"><Upload className="mb-2 w-8 h-8"/> <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">Subir<br/>Foto</span></div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Nombre Completo *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Ej: Jan Oblak" required/></div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Dorsal</label><input type="number" name="number" value={formData.number} onChange={handleChange} className={inputClass} placeholder="Ej: 13"/></div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Asignar Visibilidad (Entrenadores y Staff)</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <button type="button" onClick={() => toggleAssign('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm ${(Array.isArray(formData.assignedTo) ? formData.assignedTo : [formData.assignedTo]).includes('all') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>Público (Todos)</button>
                    {users.filter(u => u.role === 'trainer' || u.role === 'staff').map(u => {
                      const isSelected = (Array.isArray(formData.assignedTo) ? formData.assignedTo : [formData.assignedTo]).includes(u.id);
                      return (
                        <button key={u.id} type="button" onClick={() => toggleAssign(u.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm flex items-center gap-1 ${isSelected ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                          {isSelected && <CheckCircle2 size={12}/>} {u.name} ({u.role === 'staff' ? 'Staff' : 'Entrenador'})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Equipo (Categoría)</label><input type="text" name="team" value={formData.team} onChange={handleChange} placeholder="Ej: Alevín A" className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Liga / Competición</label><input type="text" name="league" value={formData.league} onChange={handleChange} placeholder="Ej: 1ª Autonómica" className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Grupo</label><input type="text" name="group" value={formData.group} onChange={handleChange} placeholder="Ej: Grupo 2" className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Año Nacimiento</label><input type="number" name="birthYear" value={formData.birthYear} onChange={handleChange} placeholder="Ej: 2012" className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Nacionalidad</label><input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Ej: España" className={inputClass} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Pie Dominante</label>
                <select name="foot" value={formData.foot} onChange={handleChange} className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`}>
                  <option value="Derecho">Derecho</option><option value="Izquierdo">Izquierdo</option><option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Mano Dominante</label>
                <select name="hand" value={formData.hand} onChange={handleChange} className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`}>
                  <option value="Derecha">Derecha</option><option value="Izquierda">Izquierda</option><option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Ajusta los atributos técnicos base del portero para alimentar su gráfico de perfil analítico.</p>
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-5 bg-slate-50 dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="w-28 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{skill.subject}</span>
                  <input type="range" min="0" max="100" value={skill.A} onChange={(e) => handleSkillChange(index, e.target.value)} className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600" />
                  <span className="w-10 text-right text-base font-black text-red-600 dark:text-red-400">{skill.A}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          {step > 1 ? (
             <button onClick={() => setStep(step - 1)} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase text-slate-500 hover:text-blue-950 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"><ArrowLeft size={16} strokeWidth={3}/> Atrás</button>
          ) : (
             <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-red-500">Cancelar</button>
          )}

          {step < 3 ? (
             <button onClick={() => setStep(step + 1)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase bg-blue-950 hover:bg-blue-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-2 shadow-lg">Siguiente <ArrowRight size={16} strokeWidth={3}/></button>
          ) : (
             <button onClick={handleSubmit} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-900/20"><CheckCircle2 size={18} strokeWidth={3}/> Guardar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function RivalFormModal({ initialData, onClose, onSave, theme }) {
  const [formData, setFormData] = useState(initialData || { name: '', category: '', shieldUrl: '' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageUpload = useImageUploader((base64) => setFormData(prev => ({ ...prev, shieldUrl: base64 })));
  const handleSubmit = () => { if(!formData.name) return alert("Nombre obligatorio"); onSave({ ...formData, id: initialData?.id }); }
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-900 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-md rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center`}>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-950 dark:text-white"><Swords className="text-red-500 w-8 h-8" /> {initialData ? 'Editar Rival' : 'Añadir Rival'}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Nombre del Club</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: RSD ALCALÁ" className={inputClass} /></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Letra Equipo (Opcional)</label><input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Ej: A" className={inputClass} /></div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Escudo del Club</label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-4 border-slate-100 dark:border-slate-700 border-dashed rounded-[2rem] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-white dark:bg-slate-800 shadow-sm">
              {formData.shieldUrl ? <img src={formData.shieldUrl} className="h-full p-4 object-contain" alt="shield" /> : <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center"><Upload className="mb-2 w-8 h-8"/><span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Subir Escudo</span></div>}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={handleSubmit} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-900/20">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({ initialData, onClose, onSave, theme }) {
  const [formData, setFormData] = useState(initialData || { name: '', email: '', username: '', password: '123', role: 'trainer', photoUrl: '', photoOffsetY: 50 });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageUpload = useImageUploader((base64) => setFormData(prev => ({ ...prev, photoUrl: base64 })));
  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-900 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-md rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center`}>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-950 dark:text-white"><Key className="text-emerald-500 w-8 h-8" /> {initialData ? 'Editar Usuario' : 'Crear Usuario'}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center justify-center mb-4">
            <label className="w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden relative group shadow-md">
              {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: `center ${formData.photoOffsetY ?? 50}%` }} alt="Perfil" /> : <User size={40} className="text-slate-300 dark:text-slate-600" />}
              <div className="absolute inset-0 bg-blue-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={20} className="text-white mb-2"/>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {formData.photoUrl && (
               <div className="w-32 mt-5">
                 <div className="flex justify-center text-[9px] font-black tracking-widest uppercase text-slate-400 mb-2">Ajustar encuadre</div>
                 <input type="range" min="0" max="100" value={formData.photoOffsetY ?? 50} onChange={(e) => setFormData({...formData, photoOffsetY: e.target.value})} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
               </div>
            )}
          </div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Nombre Completo</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Pablo Fernández" className={inputClass} /></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Usuario</label><input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Ej: pablo.f" className={inputClass} /></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="usuario@atleti.com" className={inputClass} /></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Contraseña</label><input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña de acceso" className={inputClass} /></div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Rol del Sistema</label>
            <select name="role" value={formData.role} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
              <option value="trainer">Entrenador (Edita sus porteros)</option>
              <option value="staff">Cuerpo Técnico (Solo lectura)</option>
              <option value="admin">Administrador (Control total)</option>
            </select>
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20">Guardar</button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES UI PEQUEÑOS ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center gap-1 py-3 transition-all border-l-4
      ${active 
        ? `border-red-600 bg-white text-red-600 font-black shadow-lg` 
        : `border-transparent text-blue-200 hover:text-white hover:bg-blue-900 font-bold`}
    `}
  >
    {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2, className: active ? 'text-red-600' : '' })}
    <span className="text-[9px] uppercase tracking-widest mt-1">{label}</span>
  </button>
);

const ProfileRow = ({ label, value, theme }) => (
  <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700/50 pb-2">
    <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{label}</span>
    <span className="font-bold text-sm text-blue-950 dark:text-white">{value}</span>
  </div>
);

const StatCard = ({ title, value, subtitle, color, percent, showPercentInside, theme, darkMode }) => (
  <div className={`p-4 md:p-5 rounded-[2rem] border ${theme.border} ${theme.card} flex flex-col justify-between relative overflow-hidden shadow-sm`}>
    <div className="flex justify-between items-start mb-3 relative z-10">
      <h4 className={`text-[9px] uppercase tracking-widest font-black ${theme.textMuted} w-2/3 leading-tight`}>{title}</h4>
      <div className="w-10 h-10 relative flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path className={darkMode ? "stroke-slate-700" : "stroke-slate-100"} strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          {percent > 0 && (
            <path className={`${color}`} strokeWidth="4" fill="none" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          )}
        </svg>
        {showPercentInside && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[9px] font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{percent}%</span>
          </div>
        )}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-2xl font-black tracking-tighter mb-1 text-blue-950 dark:text-white leading-none">{value}</p>
      <p className={`text-[8px] font-bold uppercase tracking-widest ${theme.textMuted} truncate mt-1`}>{subtitle}</p>
    </div>
  </div>
);
// ==========================================
// MÓDULO DE INFORMES (Con Historial, Pestañas, Borrador, Edición y PDF)
// ==========================================
function ModuleInformes({ gks, theme, darkMode, onSave, onDelete, existingReports = [], showNotification }) {
  const [activeTab, setActiveTab] = useState('formulario'); // 'formulario' | 'historial'
  const [informeEditId, setInformeEditId] = useState(null);
  
  const [tipoInforme, setTipoInforme] = useState('semestral');
  const [porteroSeleccionado, setPorteroSeleccionado] = useState('');
  
  const MATCHDAY_OPTIONS = [
    'Grupos J1', 'Grupos J2', 'Grupos J3', 'Grupos J4', 'Grupos J5', 
    'Grupos J6', 'Grupos J7', 'Grupos J8', '1/16 final', '1/8 final', 
    '1/4 final', 'Semifinal', 'Final', '3º-4º puesto'
  ];

  const initialFormState = {
    fecha: new Date().toISOString().split('T')[0],
    titulo: '', contenido: '', rival: '', nota: '5',
    // Semestral
    jornadaActual: '', convocatorias: '', titular: '', minPos1: '', minPos2: '', golesEncajados: '', ausenciaLesion: '', ausenciaDisciplina: '', ausenciaDecTecnica: '', torneosAsistidos: '', torneosConvocado: '', repTecDefensivo: '3', repTecOfensivo: '3', adecuacionRecursos: '3', nivelCompetitivo: '3', constanciaRendimiento: '3', comprensionJuego: '3', implicacionEntrenamientos: '3', liderazgoGrupo: '3', destrezaGeneral: '3', concienciaObjetivos: '3', motivacionIndividual: '3', comportamientoActitudinal: '3', posicionBasica: '3', blocaje: '3', colocacion: '3', desplazamientosCaidas: '3', dominioArea: '3', reinicioJuego: '3', unoContraUno: '3', velocidadEspecifica: '3', agilidad: '3', ataque: '3', transDef: '3', defensa: '3', transOf: '3', obsTecnicoTacticas: '', sociabilidad: '3', constanciaAct: '3', disciplina: '3', actitud: '3', compromiso: '3', evolucion: '3', obsActitudinales: '', eval1Media: '', eval1Asig: '', eval1Susp: '', eval2Media: '', eval2Asig: '', eval2Susp: '', eval3Media: '', eval3Asig: '', eval3Susp: '', valoracionGeneral: 'MEDIA',
    // Partido
    partidoCompeticion: '', partidoJornada: '', partidoResultado: '', partidoTitular: 'Titular', partidoMinutos: '', statParadas: 0, statGoles: 0, statSalidas: 0, statCentros: 0, statPases: 0, stat1v1: 0, statErrores: 0, statABP: 0, obsParadas: '', obsGoles: '', obsAereo: '', obsPies: '', obsFueraArea: '', obs1v1: '', obsABP: '', obsComunicacion: '', obsMental: '', partidoCronologia: '', partidoVideos: '', partidoComparativa: '', valTecnicoPartido: '3', valTacticoPartido: '3', valFisicoPartido: '3', valMentalPartido: '3', planFortalezas: '', planDebilidades: '', planObjetivos: '',
    // Torneo
    ubicacionTorneo: '', hotelTorneo: '', logoTorneo: '', partidosTorneo: [], ctxNivel: '3', ctxLogistica: '3', ctxCarga: '3', ctxInstalaciones: '3', medInicial: '', medIncidencias: '', valPersonalidad: '3', valMando: '3', valConc: '3', valError: '3', valConfianza: '3', valMentalidad: '3', valActitudGol: '3', valPrimerUltimo: '3', valRitmo: '3', valMejoraBajon: '3', valEntorno: '3', val1v1: '3', valOrg: '3', valCom: '3', obsPenaltis: '', obsDecisivas: '', obsPos: '', obsImprovements: '',
    // Flash
    flashTipo: '', flashAltura: '', flashNivel: '', flashPotencial: '', flashPersonalidad: '', flashComunicacionTipo: '', flashComunicacionNota: '3', flashConcentracionNota: '3', flashResilienciaNota: '3', flashObsOf: '', flashObsDef: '', flashEstado: '', flashPropuesta: '', flashJustificacion: '',
    // Objetivos
    objDefBlocajeFrontal: '', objDefBlocajeLatRaso: '', objDefBlocajeLatMed: '', objDefDesvioRaso: '', objDefDesvioMed: '', objDefReduccion: '', objDefApertura: '', objDefReincorp: '', objDefBlocajeAereo: '', objDefDespeje: '', objOfPaseManoRaso: '', objOfPaseManoAlto: '', objOfPaseManoPicado: '', objOfPerfilamiento: '', objOfPaseRasoPie: '', objOfPaseAltoPie: '', objOfVoleas: '', objObservacionFinal: '', objetivo1: '', objetivo2: '', objetivo3: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCounter = (field, delta) => setFormData(prev => ({ ...prev, [field]: Math.max(0, (parseInt(prev[field]) || 0) + delta) }));

  const handleCopyData = (reportId) => {
     const report = existingReports.find(r => r.id === reportId);
     if(report) {
        setFormData(prev => ({
           ...prev, titulo: report.titulo || '', fecha: report.fecha || prev.fecha, ubicacionTorneo: report.ubicacionTorneo || '',
           hotelTorneo: report.hotelTorneo || '', logoTorneo: report.logoTorneo || '',
           partidosTorneo: (report.partidosTorneo || []).map(m => ({ ...m, id: Date.now() + Math.random(), goalsRival: '-', minutes: '' }))
        }));
     }
  };

  const handleImageUpload = (e) => {
     const file = e.target.files[0];
     if(file) {
        const reader = new FileReader();
        reader.onloadend = () => { setFormData(prev => ({ ...prev, logoTorneo: reader.result })); };
        reader.readAsDataURL(file);
     }
  };

  const addMatch = () => setFormData(prev => ({ ...prev, partidosTorneo: [...prev.partidosTorneo, { id: Date.now(), matchday: 'Grupos J1', rival: '', country: '', goalsATM: '-', goalsRival: '-', goalsConcededByGk: '-', minutes: '' }] }));
  const removeMatch = (id) => setFormData(prev => ({ ...prev, partidosTorneo: prev.partidosTorneo.filter(m => m.id !== id) }));
  const updateMatch = (id, field, value) => setFormData(prev => ({ ...prev, partidosTorneo: prev.partidosTorneo.map(m => m.id === id ? { ...m, [field]: value } : m) }));

  const handleEdit = (report) => {
    setTipoInforme(report.tipo);
    setPorteroSeleccionado(report.gkId);
    setInformeEditId(report.id);
    setFormData({ ...initialFormState, ...report });
    setActiveTab('formulario');
  };

  const resetForm = () => {
    setInformeEditId(null);
    setPorteroSeleccionado('');
    setFormData(initialFormState);
  };

  const handleSaveSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    if (!porteroSeleccionado) { showNotification("Debes seleccionar un portero", "error"); return; }
    
    const gkInfo = gks.find(g => g.id === porteroSeleccionado);
    const informeAguardar = {
      ...formData,
      tipo: tipoInforme,
      gkId: porteroSeleccionado,
      gkName: gkInfo?.name || 'Desconocido',
      fechaCreacion: new Date().toISOString(),
      isDraft: isDraft
    };

    if (informeEditId) informeAguardar.id = informeEditId;

    // 1. Guardar en Firebase y esperar a que termine
    const savedId = await onSave(informeAguardar);
    
    // 2. Si NO es borrador y se ha guardado bien, descargar el PDF automáticamente
    if (!isDraft && savedId !== null) {
       // Asegurarnos de usar el ID que nos dio Firebase si era nuevo
       if (!informeAguardar.id) informeAguardar.id = savedId;
       exportarInformePDFVectorial(gkInfo, informeAguardar, darkMode, showNotification);
    }

    resetForm();
    setActiveTab('historial');
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium placeholder-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm";
  const sectionTitleClass = "text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 mt-8 flex items-center gap-2";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1";

  const renderRadioGroup = (name, max, label) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-wrap gap-2">
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-full sm:w-1/2 leading-tight">{label}</span>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        {Array.from({ length: max }, (_, i) => i + 1).map(num => (
          <div key={num} onClick={() => setFormData(prev => ({ ...prev, [name]: String(num) }))} className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none ${formData[name] === String(num) ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
            {num}
          </div>
        ))}
      </div>
    </div>
  );

  const renderColoredRadioGroup = (name, label) => {
    const getColorClass = (num, isSelected) => {
      if (!isSelected) return 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400';
      if (num === 1 || num === 2) return 'bg-red-600 text-white shadow-md border-red-700';
      if (num === 3) return 'bg-orange-500 text-white shadow-md border-orange-600';
      if (num === 4) return 'bg-amber-400 text-blue-950 shadow-md border-amber-500';
      if (num === 5) return 'bg-emerald-600 text-white shadow-md border-emerald-700';
      return '';
    };

    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-wrap gap-2">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-full sm:w-1/2 leading-tight">{label}</span>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} onClick={() => setFormData(prev => ({ ...prev, [name]: String(num) }))} className={`border w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none ${getColorClass(num, formData[name] === String(num))}`}>
              {num}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const torneosPrevios = existingReports.filter(r => r.tipo === 'torneo');

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar">
      
      {/* Pestañas Superiores */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 shadow-inner">
          <button onClick={() => setActiveTab('formulario')} className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'formulario' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {informeEditId ? '✏️ Editando Informe' : '📝 Crear Informe'}
          </button>
          <button onClick={() => {setActiveTab('historial'); resetForm();}} className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'historial' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            📚 Historial
          </button>
        </div>
      </div>

      {activeTab === 'historial' && (
        <div className={`p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border ${theme.border} ${theme.card} shadow-sm mb-12 animate-in fade-in slide-in-from-bottom-4`}>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white mb-6">Historial de Informes</h2>
          {existingReports.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest">No hay informes guardados aún.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingReports.sort((a,b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).map(rep => {
                const gk = gks.find(g => g.id === rep.gkId) || { name: 'Desconocido', photoUrl: '' };
                return (
                  <div key={rep.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl border ${rep.isDraft ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'} shadow-sm gap-4`}>
                    <div className="flex items-center gap-3">
                      <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-10 h-10 rounded-full border border-slate-300 object-cover" alt="" />
                      <div>
                        <div className="font-black text-sm text-blue-950 dark:text-white uppercase">{gk.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rep.tipo} • {rep.fecha}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      {rep.isDraft && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase flex items-center">Borrador</span>}
                      {!rep.isDraft && (
                        <button onClick={() => exportarInformePDFVectorial(gk, rep, darkMode, showNotification)} className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors" title="Descargar PDF">
                          <Download size={14} strokeWidth={3}/>
                        </button>
                      )}
                      <button onClick={() => handleEdit(rep)} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 transition-colors" title="Editar">
                        <Edit2 size={14} strokeWidth={3}/>
                      </button>
                      <button onClick={() => onDelete(rep.id)} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Borrar">
                        <X size={14} strokeWidth={3}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'formulario' && (
        <div className={`p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border ${theme.border} ${theme.card} shadow-sm mb-12 animate-in fade-in slide-in-from-bottom-4`}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30 shrink-0">
                <FileText size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white leading-none">Generador de Informes</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted} mt-1`}>Departamento de Porteros</p>
              </div>
            </div>
            {informeEditId && (
               <button onClick={resetForm} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-1">
                 <X size={14}/> Cancelar Edición
               </button>
            )}
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50">
              <div>
                <label className={labelClass}>Tipo de Informe</label>
                <select value={tipoInforme} onChange={(e) => setTipoInforme(e.target.value)} className={`${inputClass} cursor-pointer font-bold text-blue-950 dark:text-blue-400`}>
                  <option value="partido">📝 Informe de Partido (Completo)</option>
                  <option value="semestral">📊 Informe Semestral</option>
                  <option value="torneo">🏆 Informe de Torneo</option>
                  <option value="flash">⚡ Informe Flash (Scouting)</option>
                  <option value="objetivos">🎯 Seguimiento y Objetivos</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>1. Datos e Información de Portero *</label>
                <select value={porteroSeleccionado} onChange={(e) => setPorteroSeleccionado(e.target.value)} className={`${inputClass} cursor-pointer font-bold`} required>
                  <option value="">-- Seleccionar... --</option>
                  {gks && gks.length > 0 ? gks.map(g => <option key={g.id} value={g.id}>{g.name.toUpperCase()} ({g.team})</option>) : null}
                </select>
              </div>
            </div>

            <div className="space-y-8 pb-10">
              
              {/* ============================================================== */}
              {/* SEGUIMIENTO DE OBJETIVOS (LISTA COMPLETA COLOREADA)            */}
              {/* ============================================================== */}
              {tipoInforme === 'objetivos' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Fecha de Evaluación</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                    <div><label className={labelClass}>Título de la Planificación</label><input type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej: Objetivos Mes de Octubre" className={inputClass} required/></div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">1-2: Inc. Inconsciente</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">3: Inc. Consciente</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">4: Comp. Consciente</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">5: Comp. Inconsciente</span></div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>🛡️ Acciones Defensivas</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                       {renderColoredRadioGroup('objDefBlocajeFrontal', 'Blocaje Frontales Medio y Raso')}
                       {renderColoredRadioGroup('objDefBlocajeLatRaso', 'Blocaje lateral raso')}
                       {renderColoredRadioGroup('objDefBlocajeLatMed', 'Blocaje lateral media altura')}
                       {renderColoredRadioGroup('objDefDesvioRaso', 'Desvío raso')}
                       {renderColoredRadioGroup('objDefDesvioMed', 'Desvío a Media Altura')}
                       {renderColoredRadioGroup('objDefReduccion', 'Reducción de espacios y Posición Cruz')}
                       {renderColoredRadioGroup('objDefApertura', 'Apertura')}
                       {renderColoredRadioGroup('objDefReincorp', 'Reincorporaciones')}
                       {renderColoredRadioGroup('objDefBlocajeAereo', 'Blocaje Aéreo')}
                       {renderColoredRadioGroup('objDefDespeje', 'Despeje de Puños')}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>⚔️ Acciones Ofensivas</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                       {renderColoredRadioGroup('objOfPaseManoRaso', 'Pase mano raso')}
                       {renderColoredRadioGroup('objOfPaseManoAlto', 'Pase mano alto')}
                       {renderColoredRadioGroup('objOfPaseManoPicado', 'Pase mano picado')}
                       {renderColoredRadioGroup('objOfPerfilamiento', 'Perfilamiento y Controles')}
                       {renderColoredRadioGroup('objOfPaseRasoPie', 'Pase Raso con el Pie')}
                       {renderColoredRadioGroup('objOfPaseAltoPie', 'Pase alto con el Pie')}
                       {renderColoredRadioGroup('objOfVoleas', 'Voleas')}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>Observación Final del Entrenador</h3>
                    <textarea name="objObservacionFinal" value={formData.objObservacionFinal} onChange={handleChange} rows="4" className={`${inputClass} resize-y`} placeholder="Conclusiones, próximos pasos a trabajar en campo..."></textarea>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* INFORME DE PARTIDO                                             */}
              {/* ============================================================== */}
              {tipoInforme === 'partido' && (
                <div className="space-y-10">
                  <div>
                    <h3 className={sectionTitleClass}>01 y 02 — Datos del Partido y Portero</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div><label className={labelClass}>Fecha</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                      <div><label className={labelClass}>Rival</label><input type="text" name="rival" value={formData.rival} onChange={handleChange} placeholder="Ej: Real Madrid" className={inputClass} required/></div>
                      <div><label className={labelClass}>Competición</label><input type="text" name="partidoCompeticion" value={formData.partidoCompeticion} onChange={handleChange} placeholder="Ej: Liga Autonómica" className={inputClass} /></div>
                      <div><label className={labelClass}>Jornada</label><input type="text" name="partidoJornada" value={formData.partidoJornada} onChange={handleChange} placeholder="Ej: 14" className={inputClass} /></div>
                      <div><label className={labelClass}>Resultado</label><input type="text" name="partidoResultado" value={formData.partidoResultado} onChange={handleChange} placeholder="ATM 2 - 1 RIV" className={inputClass} /></div>
                      <div className="flex gap-2">
                         <div className="flex-1">
                            <label className={labelClass}>Condición</label>
                            <select name="partidoTitular" value={formData.partidoTitular} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                              <option value="Titular">Titular</option>
                              <option value="Suplente">Suplente</option>
                            </select>
                         </div>
                         <div className="w-1/3">
                            <label className={labelClass}>Minutos</label>
                            <input type="number" name="partidoMinutos" value={formData.partidoMinutos} onChange={handleChange} placeholder="Ej: 90" className={inputClass} />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 mt-8">
                       <h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white flex items-center gap-2">⚡ Nivel 1 — Registro Rápido (En Partido)</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[{ id: 'statParadas', label: 'Paradas' }, { id: 'statSalidas', label: 'Salidas' }, { id: 'statCentros', label: 'Centros' }, { id: 'statPases', label: 'Pases' }, { id: 'stat1v1', label: '1 vs 1' }, { id: 'statABP', label: 'A.B.P.' }, { id: 'statErrores', label: 'Errores' }, { id: 'statGoles', label: 'Goles Rec.' }].map(stat => (
                        <div key={stat.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3 flex flex-col items-center border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</span>
                          <div className="flex items-center gap-3 w-full justify-center">
                            <div onClick={() => handleCounter(stat.id, -1)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 cursor-pointer hover:bg-red-100 hover:text-red-600 select-none shadow-sm">-</div>
                            <span className="text-xl font-black text-blue-950 dark:text-white w-8 text-center">{formData[stat.id]}</span>
                            <div onClick={() => handleCounter(stat.id, 1)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 cursor-pointer hover:bg-emerald-100 hover:text-emerald-600 select-none shadow-sm">+</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>04 al 12 — Análisis Específico Post-Partido</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div><label className={labelClass}>04 - Paradas Relevantes</label><textarea name="obsParadas" value={formData.obsParadas} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>05 - Goles Recibidos</label><textarea name="obsGoles" value={formData.obsGoles} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>06 - Juego Aéreo</label><textarea name="obsAereo" value={formData.obsAereo} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>07 - Juego con los Pies</label><textarea name="obsPies" value={formData.obsPies} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>08 - Fuera del Área</label><textarea name="obsFueraArea" value={formData.obsFueraArea} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>09 - 1 VS 1</label><textarea name="obs1v1" value={formData.obs1v1} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>10 - A.B.P.</label><textarea name="obsABP" value={formData.obsABP} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>11 - Comunicación y Organización</label><textarea name="obsComunicacion" value={formData.obsComunicacion} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div className="col-span-1 md:col-span-2"><label className={labelClass}>12 - Aspecto Mental</label><textarea name="obsMental" value={formData.obsMental} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>13 al 15 — Datos Adicionales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div><label className={labelClass}>13 - Cronología</label><textarea name="partidoCronologia" value={formData.partidoCronologia} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>14 - Enlaces a Vídeos</label><textarea name="partidoVideos" value={formData.partidoVideos} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>15 - Comparativa (Opcional)</label><textarea name="partidoComparativa" value={formData.partidoComparativa} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>16 — Valoración Global (1-5)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                      {renderRadioGroup('valTecnicoPartido', 5, 'Rendimiento Técnico')}
                      {renderRadioGroup('valTacticoPartido', 5, 'Rendimiento Táctico')}
                      {renderRadioGroup('valFisicoPartido', 5, 'Rendimiento Físico')}
                      {renderRadioGroup('valMentalPartido', 5, 'Rendimiento Mental')}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>17 — Plan de Mejora (Post-Partido)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div><label className={labelClass}>Fortalezas mostradas</label><textarea name="planFortalezas" value={formData.planFortalezas} onChange={handleChange} rows="3" className={`${inputClass} resize-y border-emerald-200 focus:ring-emerald-500`} placeholder="..." /></div>
                       <div><label className={labelClass}>Debilidades a corregir</label><textarea name="planDebilidades" value={formData.planDebilidades} onChange={handleChange} rows="3" className={`${inputClass} resize-y border-red-200 focus:ring-red-500`} placeholder="..." /></div>
                       <div><label className={labelClass}>Objetivos para la semana</label><textarea name="planObjetivos" value={formData.planObjetivos} onChange={handleChange} rows="3" className={`${inputClass} resize-y border-blue-200 focus:ring-blue-500`} placeholder="..." /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* INFORME SEMESTRAL                                              */}
              {/* ============================================================== */}
              {tipoInforme === 'semestral' && (
                <div className="space-y-8">
                  <div>
                    <h3 className={sectionTitleClass}>2. Datos de Competición</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className={labelClass}>Jornada Actual</label><input type="number" name="jornadaActual" value={formData.jornadaActual} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Convocatorias</label><input type="number" name="convocatorias" value={formData.convocatorias} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Titular</label><input type="number" name="titular" value={formData.titular} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Goles Encajados</label><input type="number" name="golesEncajados" value={formData.golesEncajados} onChange={handleChange} className={inputClass} /></div>
                      
                      <div><label className={labelClass}>Min. Pos 1</label><input type="number" name="minPos1" value={formData.minPos1} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Min. Pos 2</label><input type="number" name="minPos2" value={formData.minPos2} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Torneos Convocado</label><input type="number" name="torneosConvocado" value={formData.torneosConvocado} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Torneos Asistidos</label><input type="number" name="torneosAsistidos" value={formData.torneosAsistidos} onChange={handleChange} className={inputClass} /></div>

                      <div><label className={labelClass}>Ausencia Lesión</label><input type="number" name="ausenciaLesion" value={formData.ausenciaLesion} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Aus. Disciplina</label><input type="number" name="ausenciaDisciplina" value={formData.ausenciaDisciplina} onChange={handleChange} className={inputClass} /></div>
                      <div className="col-span-2"><label className={labelClass}>Aus. Dec. Técnica</label><input type="number" name="ausenciaDecTecnica" value={formData.ausenciaDecTecnica} onChange={handleChange} className={inputClass} /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>3. Valoración Deportiva (1-4)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                      <div className="col-span-full mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Cualidades Generales</span></div>
                      {renderRadioGroup('repTecDefensivo', 4, 'Repertorio técnico defensivo')}
                      {renderRadioGroup('repTecOfensivo', 4, 'Repertorio técnico ofensivo')}
                      {renderRadioGroup('adecuacionRecursos', 4, 'Adecuación de uso recursos')}
                      {renderRadioGroup('nivelCompetitivo', 4, 'Nivel competitivo')}
                      {renderRadioGroup('constanciaRendimiento', 4, 'Constancia en el rendimiento')}
                      {renderRadioGroup('comprensionJuego', 4, 'Comprensión del juego')}
                      {renderRadioGroup('implicacionEntrenamientos', 4, 'Implicación entrenamientos')}
                      {renderRadioGroup('liderazgoGrupo', 4, 'Liderazgo con el grupo')}
                      {renderRadioGroup('destrezaGeneral', 4, 'Destreza general etapa')}
                      {renderRadioGroup('concienciaObjetivos', 4, 'Conciencia objetivos')}
                      {renderRadioGroup('motivacionIndividual', 4, 'Motivación individual')}
                      {renderRadioGroup('comportamientoActitudinal', 4, 'Comportamiento actitudinal')}
                      
                      <div className="col-span-full mt-4 mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Cualidades Puesto 1: PORTERO</span></div>
                      {renderRadioGroup('posicionBasica', 4, 'Posición básica')}
                      {renderRadioGroup('blocaje', 4, 'Blocaje')}
                      {renderRadioGroup('colocacion', 4, 'Colocación')}
                      {renderRadioGroup('desplazamientosCaidas', 4, 'Desplazamientos y caídas')}
                      {renderRadioGroup('dominioArea', 4, 'Dominio del área (aéreo)')}
                      {renderRadioGroup('reinicioJuego', 4, 'Reinicio (mano y pie)')}
                      {renderRadioGroup('unoContraUno', 4, 'Uno contra uno')}
                      {renderRadioGroup('velocidadEspecifica', 4, 'Velocidad específica')}
                      {renderRadioGroup('agilidad', 4, 'Agilidad')}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>4. Valores por fase de Juego (1-5)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        {renderRadioGroup('ataque', 5, 'Ataque')}
                        {renderRadioGroup('transDef', 5, 'Transición Defensiva')}
                        {renderRadioGroup('defensa', 5, 'Defensa')}
                        {renderRadioGroup('transOf', 5, 'Transición Ofensiva')}
                      </div>
                      <div className="flex flex-col">
                        <label className={labelClass}>Observaciones Técnico-Tácticas</label>
                        <textarea name="obsTecnicoTacticas" value={formData.obsTecnicoTacticas} onChange={handleChange} rows="6" className={`${inputClass} resize-none h-full`} placeholder="Añade observaciones sobre el desempeño técnico y táctico..."></textarea>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>5. Valores Actitudinales (1-5)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        {renderRadioGroup('sociabilidad', 5, 'Sociabilidad')}
                        {renderRadioGroup('constanciaAct', 5, 'Constancia')}
                        {renderRadioGroup('disciplina', 5, 'Disciplina')}
                        {renderRadioGroup('actitud', 5, 'Actitud')}
                        {renderRadioGroup('compromiso', 5, 'Compromiso')}
                        {renderRadioGroup('evolucion', 5, 'Evolución')}
                      </div>
                      <div className="flex flex-col">
                        <label className={labelClass}>Observaciones Actitudinales</label>
                        <textarea name="obsActitudinales" value={formData.obsActitudinales} onChange={handleChange} rows="6" className={`${inputClass} resize-none h-full`} placeholder="Añade observaciones sobre el comportamiento, actitud, liderazgo..."></textarea>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>6. Control Académico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">1ª Evaluación</h4>
                        <div className="space-y-4">
                          <div><label className={labelClass}>Nota Media</label><input type="number" step="0.1" name="eval1Media" value={formData.eval1Media} onChange={handleChange} className={inputClass} placeholder="Ej: 7.5" /></div>
                          <div><label className={labelClass}>Nº Asignaturas</label><input type="number" name="eval1Asig" value={formData.eval1Asig} onChange={handleChange} className={inputClass} placeholder="Total materias" /></div>
                          <div><label className={labelClass}>Nº Suspensos</label><input type="number" name="eval1Susp" value={formData.eval1Susp} onChange={handleChange} className={inputClass} placeholder="Materias suspensas" /></div>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">2ª Evaluación</h4>
                        <div className="space-y-4">
                          <div><label className={labelClass}>Nota Media</label><input type="number" step="0.1" name="eval2Media" value={formData.eval2Media} onChange={handleChange} className={inputClass} placeholder="Ej: 7.5" /></div>
                          <div><label className={labelClass}>Nº Asignaturas</label><input type="number" name="eval2Asig" value={formData.eval2Asig} onChange={handleChange} className={inputClass} placeholder="Total materias" /></div>
                          <div><label className={labelClass}>Nº Suspensos</label><input type="number" name="eval2Susp" value={formData.eval2Susp} onChange={handleChange} className={inputClass} placeholder="Materias suspensas" /></div>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">3ª Evaluación</h4>
                        <div className="space-y-4">
                          <div><label className={labelClass}>Nota Media</label><input type="number" step="0.1" name="eval3Media" value={formData.eval3Media} onChange={handleChange} className={inputClass} placeholder="Ej: 7.5" /></div>
                          <div><label className={labelClass}>Nº Asignaturas</label><input type="number" name="eval3Asig" value={formData.eval3Asig} onChange={handleChange} className={inputClass} placeholder="Total materias" /></div>
                          <div><label className={labelClass}>Nº Suspensos</label><input type="number" name="eval3Susp" value={formData.eval3Susp} onChange={handleChange} className={inputClass} placeholder="Materias suspensas" /></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>7. Valoración General</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['BAJA', 'MEDIA', 'ALTA', 'EXCEPCIONAL'].map(val => (
                        <div 
                          key={val} 
                          onClick={() => setFormData(prev => ({ ...prev, valoracionGeneral: val }))} 
                          className={`cursor-pointer border-2 rounded-xl py-4 text-center font-black text-xs uppercase tracking-widest transition-all select-none ${formData.valoracionGeneral === val ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300'}`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* INFORME TORNEO                                                 */}
              {/* ============================================================== */}
              {tipoInforme === 'torneo' && (
                <div className="space-y-8">
                  {torneosPrevios.length > 0 && (
                     <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-5 shadow-inner">
                       <label className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-widest mb-3">
                          <Zap size={16} className="fill-amber-500" /> Copiar datos de un torneo previo (Opcional):
                       </label>
                       <select onChange={(e) => handleCopyData(e.target.value)} className={`${inputClass} border-amber-200 dark:border-amber-500/30 focus:ring-amber-500 cursor-pointer font-bold text-amber-900 dark:text-amber-100`}>
                          <option value="">-- Selecciona un torneo para importar datos generales --</option>
                          {torneosPrevios.map(r => (
                             <option key={r.id} value={r.id}>{r.titulo} - {r.gkName}</option>
                          ))}
                       </select>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Fecha de inicio</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                    <div><label className={labelClass}>Nombre del Torneo</label><input type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej: Torneo MIC 2026" className={inputClass} required/></div>
                    <div><label className={labelClass}>Ubicación</label><input type="text" name="ubicacionTorneo" value={formData.ubicacionTorneo} onChange={handleChange} placeholder="Ciudad / País" className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>Posición Final</label><input type="text" name="posFinalTorneo" value={formData.posFinalTorneo} onChange={handleChange} placeholder="Ej: Campeón" className={inputClass} /></div>
                      <div>
                        <label className={labelClass}>Superficie</label>
                        <select name="superficieTorneo" value={formData.superficieTorneo} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                          <option value="Césped Natural">Natural</option>
                          <option value="Césped Artificial">Artificial</option>
                          <option value="Fútbol Sala">Sala / Pista</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                     <label className={labelClass}>Logo del Torneo (Opcional)</label>
                     <div className="flex items-center gap-4">
                       {formData.logoTorneo && (
                         <div className="relative shrink-0">
                           <img src={formData.logoTorneo} alt="Logo" className="w-20 h-20 rounded-2xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 shadow-sm" />
                           <button type="button" onClick={() => setFormData(prev => ({...prev, logoTorneo: ''}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-colors"><X size={12} strokeWidth={4}/></button>
                         </div>
                       )}
                       <label className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                         <UploadCloud size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors text-center">Haz clic para subir el logo</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       </label>
                     </div>
                  </div>

                  <div>
                     <h3 className={sectionTitleClass}>2. Partidos y Rendimiento</h3>
                     <div className="space-y-4">
                        {formData.partidosTorneo.map(match => (
                           <div key={match.id} className="bg-slate-900 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-800 relative shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <select value={match.matchday} onChange={(e) => updateMatch(match.id, 'matchday', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-blue-500 transition-colors">
                                     {MATCHDAY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                  <input type="text" placeholder="Nombre Rival" value={match.rival} onChange={(e) => updateMatch(match.id, 'rival', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium placeholder-slate-500 outline-none focus:border-blue-500 transition-colors" />
                                  <input type="text" placeholder="País (Opcional)" value={match.country} onChange={(e) => updateMatch(match.id, 'country', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium placeholder-slate-500 outline-none focus:border-blue-500 transition-colors" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Goles ATM</label>
                                     <select value={match.goalsATM} onChange={(e) => updateMatch(match.id, 'goalsATM', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-blue-500 transition-colors">
                                        <option value="-">-</option>{[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Goles Rival</label>
                                     <select value={match.goalsRival} onChange={(e) => {
                                         updateMatch(match.id, 'goalsRival', e.target.value);
                                         // Si ponen '-', resetear goles encajados también
                                         if(e.target.value === '-') updateMatch(match.id, 'goalsConcededByGk', '-');
                                     }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-red-500 transition-colors">
                                        <option value="-">-</option>{[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                                     </select>
                                  </div>
                                  
                                  {/* CAMPO CONDICIONAL SI HAY GOLES DEL RIVAL */}
                                  <div>
                                     {match.goalsRival !== '-' && parseInt(match.goalsRival) > 0 ? (
                                        <div className="animate-in fade-in zoom-in duration-300">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 pl-2" title="Goles que encajó específicamente este portero">Recibidos GK</label>
                                            <select value={match.goalsConcededByGk} onChange={(e) => updateMatch(match.id, 'goalsConcededByGk', e.target.value)} className="w-full bg-amber-500/10 border border-amber-500/50 rounded-xl px-4 py-3 text-amber-500 font-bold outline-none focus:border-amber-400 focus:bg-amber-500/20 transition-all shadow-inner">
                                                <option value="-">-</option>
                                                {/* Crear array dinámico basado en los goles del rival */}
                                                {Array.from({length: parseInt(match.goalsRival) + 1}, (_, i) => i).map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                     ) : <div className="h-full"></div>}
                                  </div>

                                  <div className="flex gap-3 items-center">
                                     <div className="flex-1">
                                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-2">Min. Jugados</label>
                                         <input type="number" placeholder="Min" value={match.minutes} onChange={(e) => updateMatch(match.id, 'minutes', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium placeholder-slate-600 outline-none focus:border-blue-500 transition-colors" />
                                     </div>
                                     <button type="button" onClick={() => removeMatch(match.id)} className="mt-6 w-12 h-12 flex items-center justify-center text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0"><X size={24} strokeWidth={3}/></button>
                                  </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <button type="button" onClick={addMatch} className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-sm hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
                        + AÑADIR PARTIDO
                     </button>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>3. Contexto del Torneo y Estado Físico</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                      <div className="col-span-full mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Evaluación del Evento (1-5)</span></div>
                      {renderRadioGroup('ctxNivel', 5, 'Nivel de Rivales')}
                      {renderRadioGroup('ctxLogistica', 5, 'Logística y Hotel')}
                      {renderRadioGroup('ctxCarga', 5, 'Tiempos Recuperación')}
                      {renderRadioGroup('ctxInstalaciones', 5, 'Campos / Arbitraje')}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-full mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Contexto Médico del Portero</span></div>
                      <div><label className={labelClass}>Estado Inicial Médico</label><input type="text" name="medInicial" value={formData.medInicial} onChange={handleChange} placeholder="Ej: Óptimo" className={inputClass} /></div>
                      <div><label className={labelClass}>Incidencias Torneo</label><input type="text" name="medIncidencias" value={formData.medIncidencias} onChange={handleChange} placeholder="Ej: Ninguna" className={inputClass} /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>4. Análisis del Portero (1-5)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                      <div className="col-span-full mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Psicología y Liderazgo</span></div>
                      {renderRadioGroup('valPersonalidad', 5, 'Personalidad en Portería')}
                      {renderRadioGroup('valMando', 5, 'Capacidad de Mando')}
                      {renderRadioGroup('valConc', 5, 'Nivel de Concentración')}
                      {renderRadioGroup('valError', 5, 'Gestión del Error')}
                      {renderRadioGroup('valConfianza', 5, 'Confianza')}
                      {renderRadioGroup('valMentalidad', 5, 'Mentalidad Competitiva')}
                      {renderRadioGroup('valActitudGol', 5, 'Actitud tras Gol Encajado')}
                      
                      <div className="col-span-full mt-4 mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Evolución y Adaptación</span></div>
                      {renderRadioGroup('valPrimerUltimo', 5, 'Primer partido vs Último')}
                      {renderRadioGroup('valRitmo', 5, 'Adaptación Ritmo Competitivo')}
                      {renderRadioGroup('valMejoraBajon', 5, 'Mejora o Bajón Rendimiento')}
                      {renderRadioGroup('valEntorno', 5, 'Adaptación Entorno (Viaje...)')}
                      
                      <div className="col-span-full mt-4 mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Técnico / Táctico Específico</span></div>
                      {renderRadioGroup('val1v1', 5, 'Rendimiento en 1vs1')}
                      {renderRadioGroup('valOrg', 5, 'Organización del Equipo')}
                      {renderRadioGroup('valCom', 5, 'Comunicación')}
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>5. Observaciones Finales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                       <div><label className={labelClass}>Rendimiento en Penaltis (si los hubo)</label><textarea name="obsPenaltis" value={formData.obsPenaltis} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>Acciones decisivas del torneo</label><textarea name="obsDecisivas" value={formData.obsDecisivas} onChange={handleChange} rows="2" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>Puntos positivos Globales</label><textarea name="obsPos" value={formData.obsPos} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       <div><label className={labelClass}>Áreas de Mejora / Errores clave</label><textarea name="obsImprovements" value={formData.obsImprovements} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={sectionTitleClass}>6. Valoración General del Torneo</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['BAJA', 'MEDIA', 'ALTA', 'EXCEPCIONAL'].map(val => (
                        <div key={val} onClick={() => setFormData(prev => ({ ...prev, valoracionGeneral: val }))} className={`cursor-pointer border-2 rounded-xl py-4 text-center font-black text-xs uppercase tracking-widest transition-all select-none ${formData.valoracionGeneral === val ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300'}`}>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* INFORME FLASH (SCOUTING)                                       */}
              {/* ============================================================== */}
              {tipoInforme === 'flash' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Fecha</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">⚽ Perfil General</h4>
                        <div className="space-y-4">
                           <div>
                              <label className={labelClass}>Tipo Portero</label>
                              <select name="flashTipo" value={formData.flashTipo} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Línea">Línea</option>
                                 <option value="Dominador de área">Dominador de área</option>
                                 <option value="Moderno">Moderno</option>
                                 <option value="Reactivo">Reactivo</option>
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>Altura/Envergadura</label>
                              <select name="flashAltura" value={formData.flashAltura} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Bajo">Bajo</option>
                                 <option value="Medio">Medio</option>
                                 <option value="Alto">Alto</option>
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>Nivel Actual</label>
                              <select name="flashNivel" value={formData.flashNivel} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Bajo">Bajo</option>
                                 <option value="Medio">Medio</option>
                                 <option value="Alto">Alto</option>
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>Potencial</label>
                              <select name="flashPotencial" value={formData.flashPotencial} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Bajo">Bajo</option>
                                 <option value="Medio">Medio</option>
                                 <option value="Alto">Alto</option>
                              </select>
                           </div>
                        </div>
                     </div>
                     
                     <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">🧠 Aspectos Psicológicos</h4>
                        <div className="space-y-4">
                           <div>
                              <label className={labelClass}>Personalidad</label>
                              <select name="flashPersonalidad" value={formData.flashPersonalidad} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Valiente">Valiente</option>
                                 <option value="Tímido">Tímido</option>
                                 <option value="Líder">Líder</option>
                                 <option value="Comunicativo">Comunicativo</option>
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>Tipo de Comunicación</label>
                              <select name="flashComunicacionTipo" value={formData.flashComunicacionTipo} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                 <option value="">- Seleccionar -</option>
                                 <option value="Efectiva">Efectiva</option>
                                 <option value="Poco Efectiva">Poco Efectiva</option>
                              </select>
                           </div>
                           <div className="pt-2">
                              {renderRadioGroup('flashComunicacionNota', 5, 'Nota Comunicación')}
                              {renderRadioGroup('flashConcentracionNota', 5, 'Nota Concentración')}
                              {renderRadioGroup('flashResilienciaNota', 5, 'Nota Resiliencia (Error)')}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div><label className={labelClass}>Valoración Ofensiva</label><textarea name="flashObsOf" value={formData.flashObsOf} onChange={handleChange} rows="4" className={`${inputClass} resize-none`} placeholder="Distribución, juego de pies..." /></div>
                     <div><label className={labelClass}>Valoración Defensiva</label><textarea name="flashObsDef" value={formData.flashObsDef} onChange={handleChange} rows="4" className={`${inputClass} resize-none`} placeholder="Blocaje, 1vs1, salidas..." /></div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 mt-8">
                     <h3 className="text-center font-black text-sm uppercase tracking-widest text-blue-950 dark:text-white mb-6">Estado de Seguimiento (Semáforo) *</h3>
                     <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                       <div onClick={() => setFormData(prev => ({ ...prev, flashEstado: 'NO CONTINÚA', flashPropuesta: '' }))} className={`cursor-pointer flex-1 py-4 text-center font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm ${formData.flashEstado === 'NO CONTINÚA' ? 'bg-red-600 text-white border-2 border-red-800 shadow-md scale-105' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-400'}`}>🔴 NO CONTINÚA</div>
                       <div onClick={() => setFormData(prev => ({ ...prev, flashEstado: 'SEGUIMIENTO', flashPropuesta: '' }))} className={`cursor-pointer flex-1 py-4 text-center font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm ${formData.flashEstado === 'SEGUIMIENTO' ? 'bg-orange-500 text-white border-2 border-orange-700 shadow-md scale-105' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-orange-400'}`}>🟠 SEGUIMIENTO</div>
                       <div onClick={() => setFormData(prev => ({ ...prev, flashEstado: 'CONTINÚA' }))} className={`cursor-pointer flex-1 py-4 text-center font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm ${formData.flashEstado === 'CONTINÚA' ? 'bg-emerald-600 text-white border-2 border-emerald-800 shadow-md scale-105' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400'}`}>🟢 CONTINÚA</div>
                     </div>

                     {formData.flashEstado === 'CONTINÚA' && (
                       <div className="mb-8 animate-in slide-in-from-top-4 fade-in">
                         <label className="block text-center text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Propuesta para el jugador *</label>
                         <div className="flex justify-center gap-4">
                           <div onClick={() => setFormData(prev => ({ ...prev, flashPropuesta: 'ACADEMIA' }))} className={`cursor-pointer px-6 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all border-2 ${formData.flashPropuesta === 'ACADEMIA' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300'}`}>Academia</div>
                           <div onClick={() => setFormData(prev => ({ ...prev, flashPropuesta: 'ALTO RENDIMIENTO' }))} className={`cursor-pointer px-6 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all border-2 ${formData.flashPropuesta === 'ALTO RENDIMIENTO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300'}`}>Alto Rendimiento</div>
                         </div>
                       </div>
                     )}

                     <div><label className={labelClass}>Justificación Técnica</label><textarea name="flashJustificacion" value={formData.flashJustificacion} onChange={handleChange} rows="3" className={`${inputClass} resize-none`} placeholder="Explica brevemente la decisión tomada..." /></div>
                  </div>
                </div>
              )}

            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50 mt-12">
               <button type="button" onClick={(e) => handleSaveSubmit(e, true)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                 ⏳ Guardar Borrador
               </button>
               <button type="button" onClick={(e) => handleSaveSubmit(e, false)} className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20">
                 💾 Generar y Guardar (Final)
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
