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

// --- ENLACES A LA CLASIFICACIÓN RFFM ---
const ENLACES_RFFM = {
  "ALEVÍN A": "https://www.rffm.es/competicion/clasificaciones?temporada=22&competicion=26737923&grupo=26737925&jornada=4&tipojuego=2",
  "BENJAMÍN A": "https://www.rffm.es/competicion/clasificaciones?temporada=22&competicion=26738273&grupo=26743068&jornada=3&tipojuego=2",
  "BENJAMÍN B": "https://www.rffm.es/competicion/clasificaciones?temporada=22&competicion=26738273&grupo=26738277&jornada=3&tipojuego=2",
  "PREBENJAMÍN A": "https://www.rffm.es/competicion/clasificaciones?temporada=22&competicion=26738167&grupo=26738200&jornada=2&tipojuego=2"
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
      
      const fieldText = (nextMatchPdf.field || 'CAMPO POR DEFINIR').toUpperCase();
      const fieldWidth = doc.getTextWidth(fieldText);
      
      // Si el texto es muy largo, lo dividimos en dos líneas y centramos el icono con la primera línea
      if (fieldWidth > 80) {
          const splitField = doc.splitTextToSize(fieldText, 80);
          const firstLineWidth = doc.getTextWidth(splitField[0]);
          if (iPin) doc.addImage(iPin, 'PNG', leftCX - (firstLineWidth / 2) - 8, 45, 6, 6); // Icono más arriba
          doc.text(splitField, leftCX, 49.5, { align: 'center' }); // Texto en dos líneas
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(13);
          const fParts = (nextMatchPdf.date || '').split('-');
          const fStr = fParts.length === 3 ? `${fParts[2]}-${fParts[1]}-${fParts[0]}` : nextMatchPdf.date;
          doc.text(fStr, leftCX, 61, { align: 'center' }); // Fecha en formato DD-MM-YYYY
      } else {
          // Si el texto cabe en una línea, lo centramos normal
          if (iPin) doc.addImage(iPin, 'PNG', leftCX - (fieldWidth / 2) - 8, 48.5, 6, 6);
          doc.text(fieldText, leftCX, 53, { align: 'center' });
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(13);
          const fParts = (nextMatchPdf.date || '').split('-');
          const fStr = fParts.length === 3 ? `${fParts[2]}-${fParts[1]}-${fParts[0]}` : nextMatchPdf.date;
          doc.text(fStr, leftCX, 61, { align: 'center' });
      }

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

      // Match Stats Bottom Left (SOLO SI ES ALEVÍN A)
      if (gk.team && gk.team.toUpperCase().includes('ALEVÍN A')) {
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
    doc.setFont("Roboto", "bolditalic");
    
    // Reducir la fuente dinámicamente si el nombre es muy largo para que no se salga
    const fullNameCover = `${gk.number} - ${gk.name.toUpperCase()}`;
    let fontSizeCover = 26;
    doc.setFontSize(fontSizeCover);
    while (doc.getTextWidth(fullNameCover) > 130 && fontSizeCover > 10) {
        fontSizeCover -= 1;
        doc.setFontSize(fontSizeCover);
    }
    doc.text(fullNameCover, rightCX, polY + polH + 32, { align: 'center' });

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
    
    // Calcular altura para evitar que se monte si el nombre es muy largo
    const nameLines = doc.splitTextToSize(gk.name.toUpperCase(), 80);
    doc.text(nameLines, 57, 134, { align: 'center' });
    if(typeof doc.setCharSpace === 'function') doc.setCharSpace(0);
    
    // Bajamos el subtítulo dinámicamente dependiendo de si el nombre ocupa 1 o 2 líneas
    const extraSpace = nameLines.length > 1 ? 8 : 0;
    
    doc.setFillColor(239, 68, 68); // Fondo rojo corporativo
    doc.roundedRect(57 - 25, 138 + extraSpace, 50, 7, 2, 2, 'F'); // Badge rojo para resaltar el dorsal
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    doc.text(`DORSAL ${gk.number || '-'} | ${gk.team.toUpperCase()}`, 57, 143 + extraSpace, { align: 'center' });

    // Información Perfil
    let py = 158 + (extraSpace > 0 ? 5 : 0); // Ajustamos el inicio de la info si el nombre es largo
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

    // Header Tabla (Ajustado con RESULTADOS, CONDICIÓN y MINUTOS)
    let tY = 56;
    doc.setFillColor(...p.card);
    doc.setDrawColor(...p.line);
    doc.roundedRect(15, tY, pageWidth - 30, 10, 2, 2, 'FD');
    
    doc.setTextColor(...p.textMuted);
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    doc.text("FECHA", 20, tY + 7);
    doc.text("COMPETICIÓN", 50, tY + 7);
    doc.text("RIVAL", 110, tY + 7);
    doc.text("CAMPO", 175, tY + 7);
    doc.text("RES.", 238, tY + 7, { align: 'center' });
    doc.text("COND.", 258, tY + 7, { align: 'center' });
    doc.text("MIN.", 278, tY + 7, { align: 'center' });
    tY += 14;

    const gkMatchesAll = matches.filter(m => m.goalkeeperIds?.includes(gk.id)).sort((a, b) => new Date(b.date) - new Date(a.date));
    
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
        
        const fParts = (m.date || '').split('-');
        const fStr = fParts.length === 3 ? `${fParts[2]}/${fParts[1]}/${fParts[0]}` : m.date;
        doc.text(fStr || '--', 20, tY + 6);
        
        doc.text(`${m.league || '--'} ${m.matchday ? `(J${m.matchday})` : ''}`, 50, tY + 6);
        
        doc.setTextColor(...p.textMain);
        doc.setFont("Roboto", "bold");
        doc.text(rival?.name?.toUpperCase() || 'DESCONOCIDO', 110, tY + 6, { maxWidth: 60 });
        
        doc.setTextColor(...p.textMuted);
        doc.setFont("Roboto", "normal");
        if (iPin) doc.addImage(iPin, 'PNG', 171, tY + 3, 3, 3);
        doc.text(m.field || '--', 175, tY + 6, { maxWidth: 50 });
        
        // RESULTADO
        doc.setTextColor(...p.textMain); 
        doc.setFont("Roboto", "bold");
        const gAtm = m.goalsMyTeam !== undefined && m.goalsMyTeam !== '' ? m.goalsMyTeam : '-';
        const gRiv = m.goalsRival !== undefined && m.goalsRival !== '' ? m.goalsRival : '-';
        doc.text(`${gAtm} - ${gRiv}`, 238, tY + 6, { align: 'center' });
        
        // CONDICIÓN (TITULAR O SUPLENTE - CON CORTAFUEGOS DE TEXTO)
        let condText = '-';
        if (m.gkStarter && m.gkStarter[gk.id] !== undefined) {
            // Evaluamos de forma estricta para evitar que el texto "false" lo marque como TITULAR
            const isTitular = m.gkStarter[gk.id] === true || String(m.gkStarter[gk.id]) === 'true';
            condText = isTitular ? 'TIT' : 'SUP';
        }
        
        if (condText === 'TIT') doc.setTextColor(16, 185, 129); // Verde Esmeralda (Titular)
        else if (condText === 'SUP') doc.setTextColor(249, 115, 22); // Naranja Vibrante (Suplente)
        else doc.setTextColor(...p.textMuted);
        
        doc.text(condText, 258, tY + 6, { align: 'center' });

        // MINUTOS
        doc.setTextColor(...p.textMain);
        const minsJugados = (m.gkMinutes && m.gkMinutes[gk.id]) ? m.gkMinutes[gk.id] : '-';
        doc.text(String(minsJugados), 278, tY + 6, { align: 'center' });
        
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

    const [atletiShieldB64, rivalShieldB64, torneoLogoB64, qrCodeB64, iActivity, iTarget, iGit] = await Promise.all([
        safeImgLoad(ESCUDO_ATM_URL),
        informe.rivalId ? safeImgLoad(rivals?.find(r => r.id === informe.rivalId)?.shieldUrl) : Promise.resolve(null),
        informe.logoTorneo ? safeImgLoad(informe.logoTorneo) : Promise.resolve(null),
        // AHORA TOMA TU URL AUTOMÁTICAMENTE:
        (informe.tipo === 'torneo' && informe.id) ? safeImgLoad(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=torneo&id=${informe.id}`)}&margin=1`) : Promise.resolve(null),
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

    // Dibujar Código QR Centrado (Solo Torneo)
    if (informe.tipo === 'torneo' && qrCodeB64) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth / 2 - 12.5, 257, 25, 25, 2, 2, 'F');
        doc.addImage(qrCodeB64, 'PNG', pageWidth / 2 - 11.5, 258, 23, 23);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont("Roboto", "bold");
        doc.text("ESCANEAR INFORME", pageWidth / 2, 285, { align: 'center' });
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
        
        const fParts = (informe.fecha || '').split('-');
        const fStr = fParts.length === 3 ? `${fParts[2]}-${fParts[1]}-${fParts[0]}` : informe.fecha; // Formato DD-MM-YYYY

        if (informe.tipo === 'torneo') {
            doc.text(`${informe.titulo || ''} • ${gk.team} • ${fStr}`, 15, 24);
        } else if (informe.rival) {
            doc.text(`VS ${informe.rival.toUpperCase()} • `, 15, 24);
            doc.setTextColor(220, 38, 38); // Rojo corporativo
            doc.text(fStr, 15 + doc.getTextWidth(`VS ${informe.rival.toUpperCase()} • `), 24);
        } else {
            doc.text(fStr, 15, 24);
        }
        
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
            doc.text("FASE", 18, currentY + 6.5); 
            doc.text("PAÍS", 45, currentY + 6.5);
            doc.text("RIVAL", 60, currentY + 6.5);
            doc.text("RES.", 140, currentY + 6.5);
            doc.text("G. REC", 160, currentY + 6.5);
            doc.text("MIN", 185, currentY + 6.5);
            currentY += 10;

            informe.partidosTorneo.forEach((m, idx) => {
                checkPageBreak(12);
                doc.setFillColor(idx % 2 === 0 ? p.card[0] : p.bg[0], idx % 2 === 0 ? p.card[1] : p.bg[1], idx % 2 === 0 ? p.card[2] : p.bg[2]);
                doc.rect(15, currentY, pageWidth-30, 10, 'F'); doc.setDrawColor(...p.line); doc.line(15, currentY+10, pageWidth-15, currentY+10);
                doc.setTextColor(...p.textMuted); doc.setFontSize(8); doc.setFont("Roboto", "bold"); 
                
                doc.text(m.matchday || '-', 18, currentY + 6.5);
                
                // Extraemos siglas del país sin el emoji para que jsPDF no de error de codificación
                const countryCode = (m.country || '').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim().substring(0,3).toUpperCase() || '-';
                doc.text(countryCode, 45, currentY + 6.5);
                
                doc.setTextColor(...p.textMain); 
                doc.text(`${m.rival || '-'}`.toUpperCase(), 60, currentY + 6.5, {maxWidth: 70});
                
                // Resultado global del partido
                const resText = `${m.goalsATM !== '-' ? m.goalsATM : 0} - ${m.goalsRival !== '-' ? m.goalsRival : 0}`;
                doc.setTextColor(...p.textMuted);
                doc.text(resText, 140, currentY + 6.5);
                
                // Goles encajados por este portero
                const gRec = m.goalsConcededByGk !== '-' && m.goalsConcededByGk ? m.goalsConcededByGk : (m.goalsRival !== '-' ? m.goalsRival : 0);
                doc.setTextColor(220,38,38); 
                doc.text(String(gRec), 165, currentY + 6.5);
                
                doc.setTextColor(...p.textMuted); 
                doc.text(String(m.minutes || '0'), 185, currentY + 6.5);
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
        
        printHeader("Registro Rápido Estadístico"); 
        const stats = [{l:'Paradas',v:informe.statParadas},{l:'Salidas',v:informe.statSalidas},{l:'Centros',v:informe.statCentros},{l:'Pases',v:informe.statPases},{l:'1 vs 1',v:informe.stat1v1},{l:'A.B.P.',v:informe.statABP},{l:'Errores',v:informe.statErrores},{l:'Goles Rec.',v:informe.statGoles}]; 
        let sX = 15; stats.forEach((s, i) => { printBox(sX, currentY, 40, 16, s.l, s.v || '0'); sX += 45; if ((i + 1) % 4 === 0) { sX = 15; currentY += 20; }});
        
        printHeader("Evaluación por Áreas"); 
        let vX = 15; ['Tecnico', 'Tactico', 'Fisico', 'Mental'].forEach(a => { printBox(vX, currentY, 40, 16, a.toUpperCase(), `${informe[`val${a}Partido`] || '-'}/5`); vX += 45; }); currentY += 25;
        
        const buildFieldText = (val, obs) => {
            let res = '';
            if (val) res += `[ ${val.toUpperCase()} ]\n`;
            if (obs) res += obs;
            return res.trim();
        };

        printHeader("Análisis Técnico y Táctico", iTarget); 
        printText("Paradas Relevantes", buildFieldText(informe.valParadas, informe.obsParadas)); 
        printText("Goles Recibidos", buildFieldText(informe.valGoles !== '' ? `${informe.valGoles} GOLES` : '', informe.obsGoles)); 
        printText("Juego Aéreo", buildFieldText(informe.valAereo, informe.obsAereo)); 
        printText("Juego con los Pies", buildFieldText(informe.valPies, informe.obsPies)); 
        printText("Fuera del Área", buildFieldText(informe.valFueraArea, informe.obsFueraArea)); 
        printText("1 VS 1", buildFieldText(informe.val1v1, informe.obs1v1)); 
        printText("A.B.P.", buildFieldText(informe.valABP, informe.obsABP)); 
        printText("Comunicación / Org.", buildFieldText(informe.valComunicacion, informe.obsComunicacion)); 
        printText("Aspecto Mental", buildFieldText(informe.valMental, informe.obsMental));
        
        printHeader("Información Adicional", iGit); 
        let cronoStr = '';
        if (informe.partidoCronologiaList && informe.partidoCronologiaList.length > 0) {
            cronoStr = informe.partidoCronologiaList.map(c => `[${c.minuto}] - ${c.accion}`).join('\n');
        }
        printText("Cronología", cronoStr); 
        printText("Fortalezas", informe.planFortalezas); 
        printText("Debilidades a corregir", informe.planDebilidades);
        printText("Objetivos semanales", informe.planObjetivos);
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
// GENERADOR DE BRIEFING MATCHDAY PDF
// ==========================================
const exportarBriefingPDF = async (matches, rivals, gks, showNotification) => {
  try {
    if (showNotification) showNotification("Generando Briefing Matchday...", "success");
    const jspdfModule = await loadJsPDF();
    const doc = new jspdfModule.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadCustomFonts(doc);

    const safeImgLoad = (url) => new Promise(resolve => {
        if(!url) return resolve(null);
        const img = new Image(); img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null); img.src = url;
    });

    const atletiShieldB64 = await safeImgLoad(ESCUDO_ATM_URL);

    const pageWidth = 210; const pageHeight = 297;
    let currentY = 0;

    const drawHeader = () => {
        doc.setFillColor(11, 19, 43); // Deep Navy
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setFillColor(220, 38, 38);
        doc.rect(0, 0, pageWidth, 40, 'F');
        if (atletiShieldB64) doc.addImage(atletiShieldB64, 'PNG', 15, 8, 24, 24);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28); doc.setFont("Roboto", "bolditalic");
        doc.text("MATCHDAY BRIEFING", 45, 22);
        doc.setFontSize(10); doc.setFont("Roboto", "bold");
        doc.text(`DEPARTAMENTO DE PORTEROS • ATLÉTICO DE MADRID`, 45, 28);
        currentY = 55;
    };

    drawHeader();

    if (!matches || matches.length === 0) {
        doc.setTextColor(255, 255, 255); doc.setFontSize(14);
        doc.text("No hay partidos programados en los próximos días.", pageWidth/2, 100, {align: 'center'});
        doc.save('BRIEFING_MATCHDAY.pdf');
        return;
    }

    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const rival = rivals.find(r => r.id === m.rivalId);
        const rivalShield = await safeImgLoad(rival?.shieldUrl);

        if (currentY > 240) { doc.addPage(); drawHeader(); }

        doc.setFillColor(30, 41, 59);
        doc.roundedRect(15, currentY, pageWidth - 30, 45, 3, 3, 'F');

        doc.setFillColor(15, 23, 42);
        doc.roundedRect(20, currentY + 5, 35, 35, 2, 2, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont("Roboto", "bolditalic");
        doc.text(m.time || '--:--', 37.5, currentY + 20, {align: 'center'});
        doc.setTextColor(148, 163, 184); doc.setFontSize(9); doc.setFont("Roboto", "bold");
        doc.text(formatDate(m.date), 37.5, currentY + 28, {align: 'center'});

        if (atletiShieldB64) doc.addImage(atletiShieldB64, 'PNG', 65, currentY + 10, 16, 16);
        doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont("Roboto", "bold");
        doc.text(m.myTeam || 'ATLETI', 85, currentY + 20);

        doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.text("VS", 115, currentY + 20);

        if (rivalShield) doc.addImage(rivalShield, 'PNG', 130, currentY + 10, 16, 16);
        doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont("Roboto", "bold");
        let safeRivalName = rival?.name || 'RIVAL';
        if(doc.getTextWidth(safeRivalName) > 40) safeRivalName = safeRivalName.substring(0,20) + '...';
        doc.text(safeRivalName, 150, currentY + 20);

        doc.setTextColor(148, 163, 184); doc.setFontSize(8);
        doc.text(`COMPETICIÓN: ${m.league || '-'} • J${m.matchday || '-'}`, 65, currentY + 35);
        doc.setTextColor(248, 113, 113); 
        doc.text(`CAMPO: ${m.field || 'Por definir'}`, 65, currentY + 40);

        currentY += 55;
    }

    doc.setTextColor(148, 163, 184); doc.setFontSize(8);
    doc.text("Generado automáticamente por Atleti Plan de Partido", pageWidth/2, 285, {align: 'center'});

    doc.save(`BRIEFING_MATCHDAY_${formatDate(new Date().toISOString().split('T')[0]).replace(/\//g,'-')}.pdf`);
    if (showNotification) showNotification("Briefing Descargado Exitosamente", "success");

  } catch (error) {
    console.error("Error generando Briefing:", error);
    if (showNotification) showNotification("Error exportando PDF.", "error");
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
// COMPONENTE: VISTA PÚBLICA DE INFORME (PARA QR)
// ==========================================
function PublicReportView({ reportId, informesList, goalkeepers }) {
  const report = informesList.find(inf => inf.id === reportId);
  const gk = report ? goalkeepers.find(g => g.id === report.gkId) : null;

  if (!informesList.length || !goalkeepers.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-bold p-6 text-center">
      <div>
        <h1 className="text-2xl mb-2 text-red-500">❌ Informe no encontrado</h1>
        <p className="text-slate-400">El informe que intentas buscar ya no existe o el enlace es incorrecto.</p>
      </div>
    </div>
  );

  // Helper para medallas/emojis
  const getPosicionEmoji = (pos) => {
    if (!pos) return pos;
    const p = String(pos).toLowerCase();
    if (p.includes('campe')) return `🏆 ${pos}`;
    if (p.includes('subcampe') || p.includes('segundo')) return `🥈 ${pos}`;
    if (p.includes('tercer')) return `🥉 ${pos}`;
    return pos;
  };

  // Calcular Resumen Estadístico (Siempre definido)
  let minsTotales = 0; let golesTotales = 0; let parTotales = 0; let mediaGoles = '0.00';
  
  if (report.tipo === 'torneo' && report.partidosTorneo && Array.isArray(report.partidosTorneo)) {
      parTotales = report.partidosTorneo.length;
      report.partidosTorneo.forEach(m => {
          minsTotales += parseInt(m.minutes) || 0; 
          golesTotales += parseInt(m.goalsConcededByGk !== '-' && m.goalsConcededByGk ? m.goalsConcededByGk : m.goalsRival) || 0;
      });
      mediaGoles = parTotales > 0 ? (golesTotales / parTotales).toFixed(2) : '0.00';
  }

  // VISTA DEL INFORME PÚBLICO (Optimizada para Móvil / Tablet)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* 1. CABECERA PREMIUM (Foto y Título) */}
      <div className="bg-slate-950 text-white p-6 pt-10 shadow-xl rounded-b-[2rem] relative overflow-hidden">
        {/* Fondo Imagen Jugador si existe */}
        {gk?.photoUrl && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img src={gk.photoUrl} alt="" className="w-full h-full object-cover object-top filter blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
          </div>
        )}
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Shield size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {gk?.photoUrl && (
            <img src={gk.photoUrl} alt={gk.name} className="w-24 h-24 rounded-full object-cover object-top border-4 border-red-600 shadow-lg mb-4 bg-slate-800" />
          )}
          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block shadow-md">
            Informe Oficial • {report.tipo === 'torneo' ? 'Torneo' : 'Partido'}
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            {gk?.name || report.gkName}
          </h1>
          <p className="text-red-400 font-bold tracking-widest text-xs mb-4">{report.category || gk?.team || 'Atlético de Madrid'}</p>
          
          {report.tipo === 'torneo' && report.titulo && (
            <div className="w-full bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 border border-slate-800 shadow-inner">
               <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Torneo Disputado</span>
               <h2 className="text-lg font-bold text-amber-500">{report.titulo}</h2>
               <p className="text-xs text-slate-400">{report.fecha}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-6 relative z-20">
        
        {/* 2. NOTA GLOBAL Y POSICIÓN (Tarjetas Destacadas) */}
        {(report.posFinalTorneo || report.valoracionGeneral) && (
          <div className="grid grid-cols-2 gap-4">
             {report.posFinalTorneo && (
               <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Posición Final</span>
                 <span className="text-lg font-black text-slate-800 uppercase">{getPosicionEmoji(report.posFinalTorneo)}</span>
               </div>
             )}
             {report.valoracionGeneral && (
               <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nota Global</span>
                 <span className="text-2xl font-black text-red-600 uppercase">{report.valoracionGeneral}</span>
               </div>
             )}
          </div>
        )}

        {/* 3. RESUMEN ESTADÍSTICO (SCOREBOARD SI ES TORNEO) */}
        {report.tipo === 'torneo' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2 mb-4">
                <Activity size={16} className="text-blue-500"/> Resumen Estadístico
             </h3>
             <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-100">
                <div>
                   <span className="block text-2xl font-black italic text-slate-800">{parTotales}</span>
                   <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">PJ</span>
                </div>
                <div>
                   <span className="block text-2xl font-black italic text-slate-800">{minsTotales}</span>
                   <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min.</span>
                </div>
                <div>
                   <span className="block text-2xl font-black italic text-slate-800 text-red-500">{golesTotales}</span>
                   <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Goles Rec.</span>
                </div>
                <div>
                   <span className="block text-2xl font-black italic text-slate-800 text-blue-500">{mediaGoles}</span>
                   <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Media</span>
                </div>
             </div>
          </div>
        )}

        {/* 4. LISTADO DE PARTIDOS DISPUTADOS */}
        {report.tipo === 'torneo' && report.partidosTorneo && report.partidosTorneo.length > 0 && (
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2 mb-2">
                <Shield size={16} className="text-emerald-500"/> Detalle de Partidos
             </h3>
             <div className="space-y-3">
                {report.partidosTorneo.map((match, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>{match.matchday || `Partido ${idx+1}`} {match.country ? `• ${match.country}` : ''}</span>
                       <span>{match.minutes || '0'} Min. Jugados</span>
                     </div>
                     <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm mt-1">
                       <span className="font-bold text-sm text-slate-700 truncate pr-2">VS {match.rival || 'Desconocido'}</span>
                       <div className="flex gap-2 text-xs font-black shrink-0 items-center">
                         {/* Resultado global */}
                         <div className="flex gap-1 text-[10px] items-center mr-2 px-2 border-r border-slate-200" title="Resultado Global">
                            <span className="text-emerald-600">{match.goalsATM !== '-' ? match.goalsATM : 0}</span>
                            <span className="text-slate-400">-</span>
                            <span className="text-red-500">{match.goalsRival !== '-' ? match.goalsRival : 0}</span>
                         </div>
                         <span className="text-slate-400 text-[9px] uppercase hidden sm:inline">Rec:</span>
                         <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100" title="Goles recibidos por este portero">
                           {match.goalsConcededByGk !== '-' && match.goalsConcededByGk ? match.goalsConcededByGk : (match.goalsRival || 0)}
                         </span>
                       </div>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* 5. NOTAS DEL CUERPO TÉCNICO */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest ml-2 flex items-center gap-2 mb-2">
              <Target size={16} className="text-red-500"/> Notas del Cuerpo Técnico
          </h3>
          {[
            { label: "Paradas y Juego Ofensivo", val: report.obsParadas || report.obsTecnicoTacticas },
            { label: "Fase Defensiva y Goles", val: report.obsGoles || report.obsActitudinales },
            { label: "Rendimiento en Penaltis", val: report.obsPenaltis },
            { label: "Acciones Decisivas", val: report.obsDecisivas },
            { label: "Puntos Positivos", val: report.obsPos },
            { label: "Áreas de Mejora", val: report.obsImprovements },
            { label: "Análisis Extendido / Mental", val: report.obsMental || report.extendedAnalysis },
          ].map((item, idx) => (
             item.val && String(item.val).trim() !== '' ? (
               <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-600"></div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{item.val}</p>
               </div>
             ) : null
          ))}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (SEGURO PARA REACT HOOKS)
// ==========================================
export default function App() {
  // 1. DECLARACIÓN DE TODOS LOS ESTADOS (useState)
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
  const [informesList, setInformesList] = useState([]);

  // LÓGICA VISTA PÚBLICA POR QR
  const [publicReportViewId, setPublicReportViewId] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view');
    const idParam = searchParams.get('id');
    if ((viewParam === 'torneo' || viewParam === 'informe') && idParam) {
      return idParam;
    }
    return null;
  });

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

  const [viewLockerRoom, setViewLockerRoom] = useState(false);
  const [lockerSelectedGk, setLockerSelectedGk] = useState(null);

  // 2. DECLARACIÓN DE TODOS LOS EFECTOS (useEffect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gkParam = params.get('gk');
    if (gkParam && !publicReportViewId) {
      setSelectedGkId(gkParam);
      setCurrentModule('reporte_detalle');
    }
  }, [publicReportViewId]);

  useEffect(() => {
    if (!auth) { setLoadingAuth(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        if(!publicReportViewId) showNotification("Error de autenticación", "error"); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [publicReportViewId]);

  useEffect(() => {
    if (!user || !db) return;

    const gkRef = collection(db, 'artifacts', appId, 'public', 'data', 'goalkeepers');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const rivalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rivals');
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const informesRef = collection(db, 'artifacts', appId, 'public', 'data', 'informes');

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (uList.length === 0 && user.uid) {
        const defaultAdmin = {
          role: 'admin', username: 'admin', email: 'admin@atleti.com', password: '123', name: 'Administrador', photoUrl: ''
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
      setGoalkeepers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    const unsubInformes = onSnapshot(informesRef, (snapshot) => {
      setInformesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUsers(); unsubGk(); unsubRivals(); unsubMatches(); unsubInformes(); };
  }, [user, appUser]);

  // 3. DECLARACIÓN DE TODOS LOS USEMEMO (Antes de los if de renderizado)
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

  const currentSeasonMatches = useMemo(() => {
    const seasonMatches = matches.filter(m => m.season === activeSeason || (!m.season && activeSeason === '2026/27'));
    if (role === 'admin') return seasonMatches;
    
    const visibleGkIds = visibleGoalkeepers.map(g => g.id);
    return seasonMatches.filter(m => m.goalkeeperIds?.some(id => visibleGkIds.includes(id)) || !m.goalkeeperIds || m.goalkeeperIds.length === 0);
  }, [matches, activeSeason, visibleGoalkeepers, role]);

  // --- NUEVO: FILTRADO PRIVADO DE RIVALES PARA ENTRENADORES ---
  const visibleRivals = useMemo(() => {
    if (role === 'admin') return rivals;
    // Entrenadores ven los rivales que ellos mismos han creado 
    // (o los antiguos/globales que no tienen creador para no perder datos previos)
    return rivals.filter(r => r.createdBy === appUser?.id || !r.createdBy);
  }, [rivals, role, appUser]);

  // 4. FUNCIONES HELPER GLOBALES
  const selectedGk = visibleGoalkeepers.find(gk => gk.id === selectedGkId) || visibleGoalkeepers[0] || DUMMY_GOALKEEPER;
  const currentUserData = usersList.find(u => u.id === appUser?.id) || {};

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const theme = {
    bg: darkMode ? 'dark bg-[#070b18]' : 'bg-[#f4f6fb]',
    card: darkMode 
      ? 'bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
      : 'bg-white/80 backdrop-blur-xl border-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.05)]',
    text: darkMode ? 'text-slate-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
    border: darkMode ? 'border-white/10' : 'border-slate-200/70'
  };

  // ===============================================
  // 5. CONDICIONALES DE RENDERIZADO (Regla: Nunca antes de un Hook)
  // ===============================================

  // VISTA PÚBLICA (QR)
  if (publicReportViewId) {
    if (informesList.length === 0 && loadingAuth === false) {
        return (
          <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-sans">
             <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
    }
    return <PublicReportView reportId={publicReportViewId} informesList={informesList} goalkeepers={goalkeepers} />;
  }

  // APP PRIVADA: CARGANDO
  if (loadingAuth || (user && isDataLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-950 text-white font-sans">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // APP PRIVADA: LOGIN
  if (!appUser) {
    return <LoginScreen users={usersList} onLogin={(u) => { setAppUser(u); setRole(u.role); }} />;
  }

  // APP PRIVADA: DASHBOARD PRINCIPAL Y RENDER MODULES
  const renderModule = () => {
    if (selectedGkId && currentModule === 'reporte_detalle') {
      return (
        <div className="space-y-5 pb-16 md:pb-0">
          <button
            onClick={() => setCurrentModule('porteros')}
            className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 text-xs font-black text-slate-600 hover:text-blue-950 dark:text-slate-300 dark:hover:text-white shadow-sm hover:-translate-x-0.5 transition-all uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Volver a porteros
          </button>
          <DashboardView 
             gk={selectedGk} 
             allGks={visibleGoalkeepers} 
             matches={currentSeasonMatches} 
             rivals={visibleRivals} 
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
          rivals={visibleRivals} 
          theme={theme} 
          setModule={setCurrentModule} 
          onSelectGk={(id) => { setSelectedGkId(id); setCurrentModule('reporte_detalle'); }}
          darkMode={darkMode} 
          onEditMatch={(m) => { setEditingMatch(m); setIsMatchFormOpen(true); }} 
          onDeleteMatch={(id) => handleDeleteDoc('matches', id)} 
          isDataLoading={isDataLoading} 
          currentUserData={currentUserData} 
          viewLockerRoom={viewLockerRoom}
          setViewLockerRoom={setViewLockerRoom}
          onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)}
          role={role}
          showNotification={showNotification} 
        />
      );
      case 'porteros': return (
        <ModulePorteros 
          gks={visibleGoalkeepers} 
          matches={currentSeasonMatches}
          activeSeason={activeSeason}
          viewLockerRoom={viewLockerRoom}
          setViewLockerRoom={setViewLockerRoom}
          onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)}
          role={role} 
          onSelect={(id) => { setSelectedGkId(id); setCurrentModule('reporte_detalle'); }} 
          onNew={() => { setEditingGk(null); setIsGkFormOpen(true); }} 
          onEdit={(gk) => { setEditingGk(gk); setIsGkFormOpen(true); }} 
          onDelete={(id) => handleDeleteDoc('goalkeepers', id)} 
          theme={theme} 
          darkMode={darkMode} 
          isDataLoading={isDataLoading} 
        />
      );
      case 'partidos': return <ModulePartidos matches={currentSeasonMatches} rivals={visibleRivals} gks={visibleGoalkeepers} role={role} onNew={() => { setEditingMatch(null); setIsMatchFormOpen(true); }} onEdit={(match) => { setEditingMatch(match); setIsMatchFormOpen(true); }} onDelete={(id) => handleDeleteDoc('matches', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'rivales': return <ModuleRivales rivals={visibleRivals} role={role} onNew={() => {setEditingRival(null); setIsRivalFormOpen(true);}} onEdit={(rival) => {setEditingRival(rival); setIsRivalFormOpen(true);}} onDelete={(id) => handleDeleteDoc('rivals', id)} theme={theme} darkMode={darkMode} isDataLoading={isDataLoading} />;
      case 'comparador': return <ModuleComparador gks={visibleGoalkeepers} theme={theme} darkMode={darkMode} />;
      case 'ajustes': return <ModuleAjustes users={usersList} currentUserData={currentUserData} role={role} onNewUser={() => {setEditingUser(null); setIsUserFormOpen(true);}} onEditUser={(u) => {setEditingUser(u); setIsUserFormOpen(true);}} onSaveProfile={handleSaveProfile} onBackup={downloadBackup} theme={theme} darkMode={darkMode} />;
      case 'informes': return <ModuleInformes gks={visibleGoalkeepers} theme={theme} darkMode={darkMode} existingReports={informesList} onSave={async (data) => { const id = await handleSaveDoc('informes', data, !data.id, data.isDraft ? "Borrador guardado" : "Informe finalizado"); if (id && !data.id) data.id = id; return id; }} onDelete={(id) => handleDeleteDoc('informes', id)} showNotification={showNotification} />;
      default: return <ModuleInicio gks={visibleGoalkeepers} matches={currentSeasonMatches} rivals={visibleRivals} theme={theme} setModule={setCurrentModule} darkMode={darkMode} isDataLoading={isDataLoading} currentUserData={currentUserData} viewLockerRoom={viewLockerRoom} setViewLockerRoom={setViewLockerRoom} onOpenLockerPlan={(gk) => setLockerSelectedGk(gk)} role={role} showNotification={showNotification} />;
    }
  };
  
  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 relative ${darkMode ? 'dark bg-[#070b18] text-slate-100' : 'bg-[#f4f6fb] text-slate-800'}`}>
      {/* Halos ambientales sutiles estilo visionOS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full bg-red-500/5 dark:bg-red-600/10 blur-[120px]" />
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 999px; }
        .dark ::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.6); }
      `}</style>

      {notification && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/20 text-white no-print transform transition-all ${notification.type === 'error' ? 'bg-red-600/90' : 'bg-emerald-600/90'}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="font-bold text-xs tracking-wide">{notification.msg}</span>
        </div>
      )}

      {/* SIDEBAR FLOTANTE ESTILO VISION OS (Desktop) */}
      <div className="hidden md:flex p-3.5 pr-1 h-screen flex-shrink-0 no-print z-20">
        <aside className={`${sidebarCollapsed ? 'w-[84px]' : 'w-[250px]'} h-full flex flex-col rounded-[2rem] bg-gradient-to-b from-[#172554] via-[#10193d] to-[#0a1029] text-white border border-white/15 shadow-[0_20px_50px_rgba(10,16,41,0.35)] transition-all duration-300 relative overflow-hidden`}>
          {/* Brillo superior cristal */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Cabecera Logo + Botón Colapsar */}
          <div className={`px-4 pt-6 pb-5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} relative z-10`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]" />
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-black italic tracking-tight text-white">
                    PLANPARTIDO <span className="text-red-500">ATM</span>
                  </span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
                title="Contraer menú"
              >
                <ArrowLeft size={13} />
              </button>
            )}
          </div>

          {sidebarCollapsed && (
            <div className="flex justify-center pb-3 relative z-10">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                title="Expandir menú"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Separador sutil */}
          <div className="mx-4 h-px bg-white/10 mb-3" />

          {/* Navegación */}
          <nav className="flex-1 px-3 py-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar relative z-10">
            <SidebarItem collapsed={sidebarCollapsed} icon={<Home/>} label="Inicio" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
            <SidebarItem collapsed={sidebarCollapsed} icon={<User/>} label="Porteros" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
            <SidebarItem collapsed={sidebarCollapsed} icon={<CalendarDays/>} label="Partidos" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
            {role !== 'staff' && <SidebarItem collapsed={sidebarCollapsed} icon={<Swords/>} label="Rivales" active={currentModule === 'rivales'} onClick={() => setCurrentModule('rivales')} />}
            <SidebarItem collapsed={sidebarCollapsed} icon={<GitCompare/>} label="Comparador" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
            <SidebarItem collapsed={sidebarCollapsed} icon={<FileText/>} label="Informes" active={currentModule === 'informes'} onClick={() => setCurrentModule('informes')} />
            {role !== 'staff' && <SidebarItem collapsed={sidebarCollapsed} icon={<Settings/>} label="Ajustes" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />}
          </nav>

          {/* Footer Perfil Usuario */}
          <div className="p-3 mt-auto relative z-10">
            <div className={`p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
              <div
                className={`flex items-center gap-2.5 overflow-hidden ${role !== 'staff' ? 'cursor-pointer' : ''}`}
                onClick={() => role !== 'staff' && setCurrentModule('ajustes')}
                title={role !== 'staff' ? "Ir a ajustes" : "Perfil"}
              >
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-blue-950 font-black overflow-hidden shrink-0 ring-2 ring-white/25">
                  {currentUserData.photoUrl ? (
                    <img src={currentUserData.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: `center ${currentUserData.photoOffsetY ?? 50}%` }} alt=""/>
                  ) : (
                    currentUserData.name ? currentUserData.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : (role === 'admin' ? 'AD' : 'EN')
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-white truncate leading-tight">
                      {currentUserData.name || 'Entrenador'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-300/80">
                      {role === 'admin' ? 'ADMIN' : role === 'staff' ? 'STAFF' : 'COACH'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut size={16}/>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM NAVIGATION (Mobile Only - Glassmorphism) */}
      <nav className={`md:hidden fixed bottom-3 left-3 right-3 h-16 bg-[#10193d]/90 backdrop-blur-xl text-white border border-white/15 flex justify-around items-center z-50 px-2 no-print shadow-2xl rounded-[1.75rem]`}>
          <BottomNavItem icon={<Home/>} label="Inicio" active={currentModule === 'inicio'} onClick={() => setCurrentModule('inicio')} />
          <BottomNavItem icon={<User/>} label="Porteros" active={currentModule === 'porteros' || currentModule === 'reporte_detalle'} onClick={() => setCurrentModule('porteros')} />
          <BottomNavItem icon={<CalendarDays/>} label="Partidos" active={currentModule === 'partidos'} onClick={() => setCurrentModule('partidos')} />
          <BottomNavItem icon={<GitCompare/>} label="Compara" active={currentModule === 'comparador'} onClick={() => setCurrentModule('comparador')} />
          <BottomNavItem icon={<FileText/>} label="Informes" active={currentModule === 'informes'} onClick={() => setCurrentModule('informes')} />
          <BottomNavItem icon={<Settings/>} label="Ajustes" active={currentModule === 'ajustes'} onClick={() => setCurrentModule('ajustes')} />
      </nav>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print-full-width relative z-10">
        {/* TOPBAR FLOTANTE TRANSLÚCIDA */}
        <header className="px-4 md:px-8 pt-4 pb-2 flex-shrink-0 flex items-center justify-between no-print z-10 relative">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-blue-950 dark:text-white leading-none">
                {currentModule === 'reporte_detalle' ? 'INFORME DEL PORTERO' : currentModule}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Atlético de Madrid</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`px-3 py-2 rounded-2xl border ${theme.border} bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl text-xs font-bold flex items-center gap-1.5 shadow-sm`}>
              <select 
                value={activeSeason} 
                onChange={handleSeasonChange} 
                className="bg-transparent outline-none cursor-pointer appearance-none text-slate-700 dark:text-slate-200 pr-1"
              >
                {availableSeasons.map(s => <option key={s} value={s} className="text-slate-800">{s}</option>)}
                <option value="add_new" className="font-bold text-blue-500">+ Añadir...</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
            </div>
            
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-2xl border ${theme.border} bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl hover:scale-105 transition-all shadow-sm`}>
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
            </button>

            {currentModule === 'reporte_detalle' && (
              <button onClick={() => setExportTrigger(prev => prev + 1)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl transition-all shadow-lg shadow-red-600/25 font-black text-xs uppercase tracking-widest">
                <Download size={15} /> <span className="hidden sm:inline">Exportar PDF</span>
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

        {/* MODALES GLOBALES */}
        {isGkFormOpen && <GkFormModal initialData={editingGk} users={usersList} onClose={() => setIsGkFormOpen(false)} onSave={(data) => handleSaveDoc('goalkeepers', data, !editingGk, "Portero guardado").then(id => {if(id){setIsGkFormOpen(false); if(!editingGk){setSelectedGkId(id); setCurrentModule('reporte_detalle');}}})} theme={theme} darkMode={darkMode} />}
        
        {/* --- MODAL DE RIVAL CON ETIQUETA DE CREADOR --- */}
        {isRivalFormOpen && <RivalFormModal initialData={editingRival} onClose={() => setIsRivalFormOpen(false)} onSave={(data) => {
            if (!editingRival && appUser) data.createdBy = appUser.id; // Marca quién lo creó
            handleSaveDoc('rivals', data, !editingRival, "Rival guardado").then(()=>setIsRivalFormOpen(false));
        }} theme={theme} />}

        {/* Modal de Usuario INTACTO */}
        {isUserFormOpen && <UserFormModal initialData={editingUser} onClose={() => setIsUserFormOpen(false)} onSave={(data) => handleSaveDoc('users', data, !editingUser, "Usuario guardado").then(()=>setIsUserFormOpen(false))} theme={theme} />}
        
        {/* --- MODAL DE PARTIDO CON LOS RIVALES FILTRADOS --- */}
        {isMatchFormOpen && <MatchFormModal initialData={editingMatch} rivals={visibleRivals} gks={visibleGoalkeepers} activeSeason={activeSeason} onClose={() => setIsMatchFormOpen(false)} onSave={(data) => handleSaveDoc('matches', data, !editingMatch, "Partido guardado").then(()=>setIsMatchFormOpen(false))} theme={theme} darkMode={darkMode} />}
        
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
  const convocados = (gks || []).filter(gk => match.goalkeeperIds?.includes(gk.id));
  const enlaceRFFM = typeof ENLACES_RFFM !== 'undefined' ? ENLACES_RFFM[match.myTeam] : null;

  const hasScore = match.goalsMyTeam !== undefined && match.goalsMyTeam !== '' && match.goalsRival !== undefined && match.goalsRival !== '';
  const gAtm = parseInt(match.goalsMyTeam);
  const gRiv = parseInt(match.goalsRival);

  let outcomeBadge = null;
  if (hasScore && !isNaN(gAtm) && !isNaN(gRiv)) {
    if (gAtm > gRiv) outcomeBadge = { text: 'VICTORIA', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' };
    else if (gAtm === gRiv) outcomeBadge = { text: 'EMPATE', cls: 'bg-sky-500/20 text-sky-300 border-sky-400/30' };
    else outcomeBadge = { text: 'DERROTA', cls: 'bg-rose-500/20 text-rose-300 border-rose-400/30' };
  }

  const renderVenueIcon = () => {
    if (match.locationType === 'Visitante') {
      return (
        <svg className="w-3 h-3 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      );
    }
    if (match.locationType === 'Sede') {
      return (
        <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
        </svg>
      );
    }
    if (match.locationType === 'Local') {
      return <Home size={12} className="text-emerald-400 shrink-0" />;
    }
    return <MapPin size={12} className="text-emerald-400 shrink-0" />;
  };

  return (
    <div className={`rounded-[1.75rem] bg-gradient-to-br from-[#152246] via-[#0f1833] to-[#0a1024] text-white border border-blue-400/20 hover:border-sky-400/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_14px_34px_rgba(7,11,24,0.35)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_20px_42px_rgba(10,20,52,0.55)] hover:-translate-y-1 transition-all duration-300 overflow-hidden relative flex flex-col group ${layout === 'wide' ? 'md:col-span-2' : ''}`}>
      {/* Brillo ambiental superior */}
      <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-48 h-28 rounded-full bg-sky-500/10 blur-2xl group-hover:bg-sky-500/20 transition-colors duration-500" />

      {/* CABECERA COMPACTA: COMPETICIÓN + ACCIONES */}
      <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.matchday && (
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/30 text-[9px] font-black text-sky-300 uppercase shrink-0">
              J{match.matchday}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate" title={`${match.league || ''} ${match.group || ''}`}>
            {match.league || 'Competición'}{match.group ? ` · ${match.group}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {enlaceRFFM && enlaceRFFM !== "" && !enlaceRFFM.includes("AQUI_URL") && (
            <a
              href={enlaceRFFM}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-full bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/35 flex items-center justify-center transition-colors"
              title="Ver clasificación en RFFM"
              onClick={(e) => e.stopPropagation()}
            >
              <Trophy size={11} className="text-amber-300" />
            </a>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(match); }}
              className="w-6 h-6 rounded-full bg-white/8 hover:bg-sky-500/30 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Editar partido"
            >
              <Edit2 size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(match.id); }}
              className="w-6 h-6 rounded-full bg-white/8 hover:bg-red-500/35 border border-white/15 text-slate-300 hover:text-red-200 flex items-center justify-center transition-colors"
              title="Eliminar partido"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* PÍLDORA DE CAMPO Y FECHA */}
      <div className="px-4 pt-3.5 pb-1 flex justify-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 max-w-full">
          {renderVenueIcon()}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 truncate max-w-[155px]" title={match.field}>
            {match.field || 'Campo por definir'}
          </span>
          <span className="text-white/25 text-[10px]">·</span>
          <span className="text-[10px] font-extrabold text-sky-300 shrink-0 tabular-nums">
            {formatDate(match.date)}
          </span>
        </div>
      </div>

      {/* ENFRENTAMIENTO CENTRAL (3 COLUMNAS EQUILIBRADAS) */}
      <div className="px-4 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 relative z-10 flex-1">
        {/* Mi Equipo */}
        <div className="flex flex-col items-center text-center min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform">
            <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
          </div>
          <span className="mt-2 text-[11px] font-black uppercase tracking-tight text-white leading-tight line-clamp-2">
            {match.myTeam || 'ATLETI'}
          </span>
        </div>

        {/* Marcador o Hora */}
        <div className="flex flex-col items-center px-1">
          {hasScore ? (
            <>
              <div className="px-3.5 py-2 rounded-2xl bg-black/35 border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-2">
                <span className="text-xl font-black text-white tabular-nums leading-none">{match.goalsMyTeam}</span>
                <span className="text-xs font-bold text-slate-500">-</span>
                <span className="text-xl font-black text-rose-400 tabular-nums leading-none">{match.goalsRival}</span>
              </div>
              {outcomeBadge ? (
                <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${outcomeBadge.cls}`}>
                  {outcomeBadge.text}
                </span>
              ) : (
                <span className="mt-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-400">Final</span>
              )}
            </>
          ) : (
            <>
              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)]">
                <span className="text-lg sm:text-xl font-black text-white tracking-wider tabular-nums leading-none">
                  {match.time || '--:--'}
                </span>
              </div>
              <span className="mt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                Hora
              </span>
            </>
          )}
        </div>

        {/* Rival */}
        <div className="flex flex-col items-center text-center min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform">
            {rival?.shieldUrl ? (
              <img src={rival.shieldUrl} className="w-full h-full object-contain drop-shadow-sm" alt="Rival" />
            ) : (
              <Swords className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <span className="mt-2 text-[11px] font-extrabold uppercase tracking-tight text-slate-100 leading-tight line-clamp-2" title={rival?.name}>
            {rival?.name || 'Rival'}
          </span>
        </div>
      </div>

      {/* FOOTER COMPACTO: CONVOCATORIA + RACHA RIVAL */}
      <div className="px-4 py-2.5 bg-black/25 border-t border-white/10 flex items-center justify-between gap-2 relative z-10 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Porteros</span>
          {convocados.length > 0 ? (
            <div className="flex -space-x-2">
              {convocados.map(gk => {
                const isStarter = match.gkStarter?.[gk.id] === true || String(match.gkStarter?.[gk.id]) === 'true';
                const mins = match.gkMinutes?.[gk.id];
                return (
                  <img
                    key={gk.id}
                    src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`}
                    title={`${gk.name}${mins ? ` · ${mins} min` : ''}`}
                    className={`w-7 h-7 rounded-full object-cover border-2 bg-slate-800 ${isStarter ? 'border-emerald-400' : 'border-[#0f1833]'}`}
                    style={{ objectPosition: 'center 15%' }}
                    alt=""
                  />
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 font-semibold italic">Sin asignar</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Racha</span>
          <StreakDisplay streak={match.streak} />
        </div>
      </div>
    </div>
  );
};

const StreakDisplay = ({ streak }) => {
  if (!streak || streak.length === 0) return <span className="text-[10px] font-black text-slate-500">---</span>;
  return (
    <div className="flex gap-1 items-center">
      {streak.map((res, i) => (
        <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm ring-1 ring-white/15 ${res === 'V' ? 'bg-emerald-500' : res === 'E' ? 'bg-sky-500' : 'bg-rose-500'}`}>
          <span className="leading-none">{res}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// VESTUARIO VIRTUAL 2.5D INTERACTIVO (REDISEÑO PREMIUM + MINUTOS Y GOLES DINÁMICOS)
// ==========================================
function VestuarioVirtual({ gks, matches, onOpenPlan, theme }) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Algoritmo para calcular minutos y goles desde el calendario
  const calcularStatsReales = (gk) => {
    if (!matches) return { mins: gk.stats?.minutes || 0, goals: gk.stats?.goalsConceded || 0 };
    const pastGkMatches = matches.filter(m => m.date < todayStr && m.goalkeeperIds?.includes(gk.id));
    
    let dynamicMins = 0;
    let dynamicGoals = 0;
    let hasDynamic = false;
    
    pastGkMatches.forEach(m => {
       const mins = parseInt(m.gkMinutes?.[gk.id]);
       if (!isNaN(mins) && mins > 0) {
           dynamicMins += mins;
           hasDynamic = true;
           
           // LÓGICA CORREGIDA Y PRECISA
           let golesEncajados = 0;
           if (m.gkGoalsConceded && m.gkGoalsConceded[gk.id] !== undefined && m.gkGoalsConceded[gk.id] !== '') {
               golesEncajados = parseInt(m.gkGoalsConceded[gk.id]) || 0;
           } else {
               const jugaron = (m.goalkeeperIds || []).filter(id => parseInt(m.gkMinutes?.[id]) > 0);
               if (jugaron.length === 1 && jugaron.includes(gk.id)) {
                   golesEncajados = parseInt(m.goalsRival) || 0;
               }
           }
           dynamicGoals += golesEncajados;
       }
    });
    
    return {
      mins: hasDynamic ? dynamicMins : (gk.stats?.minutes || 0),
      goals: hasDynamic ? dynamicGoals : (gk.stats?.goalsConceded || 0)
    };
  };

  return (
    <div className="w-full bg-[#030712] rounded-[3rem] p-6 md:p-10 border border-slate-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Ambiente lumínico de vestuario profesional */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-blue-600/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 px-2 relative z-10">
        <div>
          <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            Centro de Mando: Vestuario
          </h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Selecciona la taquilla para diseñar el plan de partido</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-900 border border-slate-700/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
            <img src={ESCUDO_ATM_URL} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">KMP Tactic Room</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {gks.map(gk => {
          const statsReales = calcularStatsReales(gk);

          return (
          <div 
            key={gk.id} 
            onClick={() => onOpenPlan(gk)}
            className="group cursor-pointer relative flex flex-col w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 hover:border-red-500 transition-all duration-500 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:-translate-y-2"
          >
            {/* Placa Metálica de la Taquilla */}
            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-700 to-slate-800/90 border-b border-slate-600/50 flex items-center justify-between px-4 z-30 shadow-md">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 group-hover:shadow-[0_0_8px_#ef4444] transition-all"></div>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] truncate max-w-[110px]">{gk.team}</span>
               </div>
               <span className="text-xl font-black italic text-white drop-shadow-md">{gk.number}</span>
            </div>

            {/* Luz interior de la taquilla */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-white/5 blur-3xl group-hover:bg-red-500/20 transition-all duration-700 z-10"></div>

            {/* Imagen del portero */}
            <div className="absolute inset-0 pt-12 z-10">
              <img 
                src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} 
                alt={gk.name}
                className="w-full h-full object-cover grayscale-[0.7] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                style={{ objectPosition: 'center 10%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent h-full"></div>
            </div>

            {/* HUD Overlay (Pizarra Táctica) */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-slate-950/40 backdrop-blur-[2px]">
               <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-slate-900 text-red-500 mb-3 shadow-[0_0_20px_rgba(220,38,38,0.7)] transform scale-75 group-hover:scale-100 transition-transform duration-500">
                  <Target size={28} strokeWidth={2.5} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white drop-shadow-lg">Pizarra Táctica</span>
            </div>

            {/* Panel de Info Inferior */}
            <div className="mt-auto relative z-30 p-4 sm:p-5 flex flex-col justify-end">
               <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-md mb-4">{gk.name}</h4>

               <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/90 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-inner">
                 <div className="flex flex-col items-center justify-center p-1 border-r border-slate-700">
                   <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Forma</span>
                   <span className="text-xs sm:text-sm font-black text-emerald-400">{gk.form || '5.0'}</span>
                 </div>
                 <div className="flex flex-col items-center justify-center p-1 border-r border-slate-700">
                   <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Minutos</span>
                   <span className="text-xs sm:text-sm font-black text-white">{statsReales.mins}</span>
                 </div>
                 <div className="flex flex-col items-center justify-center p-1">
                   <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center leading-tight">G. Encaj.</span>
                   <span className="text-xs sm:text-sm font-black text-red-400">{statsReales.goals}</span>
                 </div>
               </div>
            </div>
          </div>
        )})}
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
function ModuleInicio({ gks, matches, rivals, theme, setModule, onSelectGk, darkMode, onEditMatch, onDeleteMatch, isDataLoading, currentUserData, role, showNotification }) {
  const parseSafeDate = (d, t) => {
    if (!d) return 0;
    const [y, mo, day] = d.split('-').map(Number);
    const [h, mi] = (t || '00:00').split(':').map(Number);
    return new Date(y, (mo || 1) - 1, day || 1, h || 0, mi || 0).getTime();
  };

  const normalizeStr = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingMatches = [...matches]
    .filter(m => m.date >= todayStr)
    .sort((a, b) => parseSafeDate(a.date, a.time) - parseSafeDate(b.date, b.time));

  const [weatherData, setWeatherData] = useState({
    temp: '--',
    desc: 'CARGANDO...',
    city: 'MADRID',
    isRainy: false,
    isCloudy: false,
    windGusts: 0,
    humidity: 0,
    precipProb: 0,
    sunset: '--:--'
  });
  const [countdown, setCountdown] = useState('');

  // Clima Táctico en tiempo real (Open-Meteo Madrid)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m&daily=sunset,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=1';
        const weatherRes = await fetch(url);
        const wData = await weatherRes.json();
        const cur = wData.current || {};
        const code = cur.weather_code ?? 0;

        let desc = 'DESPEJADO';
        let isRainy = false;
        let isCloudy = false;

        if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
          desc = 'LLUVIA';
          isRainy = true;
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
          desc = 'NIEVE';
          isRainy = true;
        } else if ([45, 48].includes(code)) {
          desc = 'NIEBLA';
          isCloudy = true;
        } else if ([1, 2, 3].includes(code)) {
          desc = 'NUBLADO';
          isCloudy = true;
        }

        const sunsetRaw = wData.daily?.sunset?.[0] || '';
        const sunsetTime = sunsetRaw.includes('T') ? sunsetRaw.split('T')[1].substring(0, 5) : '17:55';

        setWeatherData({
          temp: cur.temperature_2m !== undefined ? String(Math.round(cur.temperature_2m)) : '--',
          desc,
          city: 'MADRID',
          isRainy,
          isCloudy,
          windGusts: Math.round(cur.wind_gusts_10m ?? cur.wind_speed_10m ?? 0),
          humidity: Math.round(cur.relative_humidity_2m ?? 0),
          precipProb: Math.round(wData.daily?.precipitation_probability_max?.[0] ?? 0),
          sunset: sunsetTime
        });
      } catch (e) {
        setWeatherData({
          temp: '--', desc: 'SIN SEÑAL', city: 'MADRID',
          isRainy: false, isCloudy: false, windGusts: 0, humidity: 0, precipProb: 0, sunset: '--:--'
        });
      }
    };
    fetchWeather();
  }, []);

  // Cuenta atrás instantánea (sin parpadeo inicial en --h --m)
  const nextMatchObj = upcomingMatches[0] || null;
  useEffect(() => {
    if (!nextMatchObj || !nextMatchObj.date) {
      setCountdown('');
      return;
    }
    const [year, month, day] = nextMatchObj.date.split('-').map(Number);
    const [hours, minutes] = (nextMatchObj.time || '00:00').split(':').map(Number);
    const mDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);

    const updateClock = () => {
      const diff = mDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('EN JUEGO');
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      setCountdown(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m`);
    };

    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, [nextMatchObj?.id, nextMatchObj?.date, nextMatchObj?.time]);

  const hour = new Date().getHours();
  let greeting = "BUENOS DÍAS";
  if (hour >= 13 && hour < 20) greeting = "BUENAS TARDES";
  else if (hour >= 20 || hour < 5) greeting = "BUENAS NOCHES";

  const userName = currentUserData?.name ? currentUserData.name.split(' ')[0].toUpperCase() : 'ENTRENADOR';

  const nextMatchDate = nextMatchObj ? new Date(nextMatchObj.date) : null;
  const daysToNextMatch = nextMatchDate ? (nextMatchDate - new Date()) / (1000 * 60 * 60 * 24) : 999;
  const isGameday = daysToNextMatch <= 7;

  // --- CÁLCULO AUTOMÁTICO: MURO ATLÉTICO (KPIs Globales del Departamento) ---
  const pastMatchesAll = matches.filter(m => m.date < todayStr);
  let totalCleanSheets = 0;
  let totalAppearances = 0;
  let totalGoalsConceded = 0;
  let totalPenSaved = 0;
  let totalPenFaced = 0;
  let totalMatchesWithData = 0;

  pastMatchesAll.forEach(m => {
    const gkIds = m.goalkeeperIds || [];
    const playedGkIds = gkIds.filter(id => parseInt(m.gkMinutes?.[id]) > 0);
    const hasTeamScore = m.goalsRival !== undefined && m.goalsRival !== '';

    if (playedGkIds.length > 0 || hasTeamScore) {
      totalMatchesWithData += 1;
    }

    if (playedGkIds.length > 0) {
      playedGkIds.forEach(gkId => {
        totalAppearances += 1;
        let gEnc = 0;
        if (m.gkGoalsConceded && m.gkGoalsConceded[gkId] !== undefined && m.gkGoalsConceded[gkId] !== '') {
          gEnc = parseInt(m.gkGoalsConceded[gkId]) || 0;
        } else if (playedGkIds.length === 1) {
          gEnc = parseInt(m.goalsRival) || 0;
        }
        totalGoalsConceded += gEnc;
        if (gEnc === 0) totalCleanSheets += 1;

        const pS = parseInt(m.gkPenaltiesSaved?.[gkId]);
        const pF = parseInt(m.gkPenaltiesFaced?.[gkId]);
        if (!isNaN(pS)) totalPenSaved += pS;
        if (!isNaN(pF)) totalPenFaced += pF;
      });
    } else if (hasTeamScore) {
      totalGoalsConceded += parseInt(m.goalsRival) || 0;
    }
  });

  const cleanSheetPct = totalAppearances > 0 ? Math.round((totalCleanSheets / totalAppearances) * 100) : 0;
  const avgGoalsPerMatch = totalMatchesWithData > 0 ? (totalGoalsConceded / totalMatchesWithData).toFixed(2) : '0.00';
  const penSavePct = totalPenFaced > 0 ? Math.round((totalPenSaved / totalPenFaced) * 100) : 0;

  // Indicadores dinámicos del Clima Táctico
  const needsWetGlove = weatherData.isRainy || weatherData.precipProb >= 40 || weatherData.humidity >= 75;
  const aerialAlert = weatherData.windGusts >= 25;
  const fastPitch = weatherData.isRainy || weatherData.humidity >= 70 || weatherData.precipProb >= 35;

  const renderConditionTag = (locType) => {
    if (locType === 'Visitante') {
      return (
        <span className="inline-flex items-center gap-1 text-sky-300">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
          Visitante
        </span>
      );
    }
    if (locType === 'Sede') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-300">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
          </svg>
          Sede
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-emerald-300">
        <Home size={11} className="shrink-0" /> Local
      </span>
    );
  };

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <SkeletonMatch />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><SkeletonCard /></div>
          <div className="lg:col-span-4"><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* NIVEL 1 · BANNER MATCHDAY CON BOTÓN BRIEFING JORNADA      */}
      {/* ========================================================= */}
      {isGameday && nextMatchObj ? (
        <div className="bg-[#0a0f1c] rounded-[2.25rem] p-7 md:p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl border border-slate-800/90 group min-h-[300px]">
          <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-red-600/20 blur-[120px] rounded-full pointer-events-none group-hover:bg-red-600/30 transition-colors duration-700" />
          <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none group-hover:bg-blue-600/30 transition-colors duration-700" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
            {/* 1. Info Izquierda + Acciones (Ver Partidos & Briefing Jornada) */}
            <div className="flex flex-col items-center md:items-start w-full md:w-5/12 text-center md:text-left">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 flex items-center gap-2 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Matchday
              </span>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black uppercase italic tracking-tighter text-white leading-none drop-shadow-lg mb-2">
                {nextMatchObj.myTeam || 'ATLETI'} <span className="text-red-500 text-2xl lg:text-4xl mx-1">VS</span><br />
                {rivals.find(r => r.id === nextMatchObj.rivalId)?.name || 'RIVAL'}
              </h2>
              <p className="text-slate-400 font-bold text-xs lg:text-sm tracking-widest uppercase mb-6">
                {nextMatchObj.league || 'Competición Oficial'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => setModule('partidos')}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 border border-amber-400/50"
                >
                  <CalendarDays size={16} /> Ver Partidos
                </button>
                <button
                  onClick={() => exportarBriefingPDF(upcomingMatches, rivals, gks, showNotification)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 shadow-lg"
                  title="Descargar PDF con la hoja de ruta de la jornada"
                >
                  <FileText size={16} className="text-sky-300" /> Briefing Jornada
                </button>
              </div>
            </div>

            {/* 2. Escudos Enfrentados Centrales */}
            <div className="flex items-center justify-center gap-5 md:gap-7 w-full md:w-3/12">
              <img src={ESCUDO_ATM_URL} className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_25px_rgba(220,38,38,0.5)] transform hover:scale-110 transition-transform" alt="Atleti" />
              <span className="text-2xl md:text-3xl text-slate-500 font-black italic drop-shadow-md">VS</span>
              {rivals.find(r => r.id === nextMatchObj.rivalId)?.shieldUrl ? (
                <img src={rivals.find(r => r.id === nextMatchObj.rivalId).shieldUrl} className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] transform hover:scale-110 transition-transform" alt="Rival" />
              ) : (
                <Swords className="w-20 h-20 md:w-28 md:h-28 text-slate-600 drop-shadow-md" />
              )}
            </div>

            {/* 3. Cuenta Atrás y Línea de Tiempo Derecha */}
            <div className="flex flex-col items-center md:items-end w-full md:w-4/12">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-5 py-3.5 rounded-2xl flex flex-col items-center mb-2 shadow-inner min-w-[190px]">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-1">Inicia en</span>
                <span className="text-3xl lg:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-md">
                  {countdown || '--h --m'}
                </span>
              </div>

              {upcomingMatches.length > 1 && (
                <div className="w-full flex flex-col gap-3 mt-3 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-700 before:to-transparent">
                  {upcomingMatches.slice(1, 4).map((m) => {
                    const rInfo = rivals.find(r => r.id === m.rivalId);
                    return (
                      <div key={m.id} className="relative flex items-center justify-between md:justify-center group">
                        <div className="absolute left-0 md:left-1/2 w-5 h-5 rounded-full border-4 border-[#0a0f1c] bg-slate-700 group-hover:bg-red-500 transition-colors z-10 transform -translate-x-1/2 ml-3 md:ml-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>

                        <div className="pl-9 md:pl-0 md:w-1/2 md:pr-6 flex flex-col md:items-end justify-center w-full">
                          <div className="flex items-center gap-2 justify-start md:justify-end bg-slate-800/55 border border-slate-700/50 p-2 rounded-xl backdrop-blur-sm shadow-md">
                            <img src={ESCUDO_ATM_URL} className="w-5 h-5 object-contain" alt="Atleti" />
                            <span className="text-[8px] text-slate-500 font-black italic">VS</span>
                            {rInfo?.shieldUrl ? (
                              <img src={rInfo.shieldUrl} className="w-5 h-5 object-contain" alt="Rival" />
                            ) : (
                              <Swords className="w-5 h-5 text-slate-500" />
                            )}
                            <div className="ml-1.5 pl-2 border-l border-slate-600 flex flex-col text-left">
                              <span className="text-white text-[11px] font-black uppercase truncate max-w-[105px]">{m.myTeam || 'ATLETI'}</span>
                              <span className="text-red-400 text-[9px] font-black tracking-widest">{m.time || '--:--'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex md:w-1/2 md:pl-6 text-left justify-start">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{formatDate(m.date)}</span>
                            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md text-slate-200 text-[9px] font-black rounded uppercase border border-white/15 flex items-center gap-1 max-w-[140px] truncate">
                              <MapPin size={9} className="text-sky-400 shrink-0" />
                              <span className="truncate">{m.field || 'Por definir'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CABECERA VISION OS CUANDO NO HAY PARTIDO EN 7 DÍAS */
        <div className="rounded-[2.25rem] p-7 md:p-9 bg-gradient-to-r from-[#172554] via-[#111c44] to-[#24163b] text-white border border-white/15 shadow-[0_18px_40px_rgba(10,16,41,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-10">
            <Shield size={180} />
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/15 border border-sky-300/25 text-[10px] font-black uppercase tracking-widest text-sky-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Centro de Alto Rendimiento
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
              {greeting}, {userName}
            </h2>
            <p className="text-xs text-slate-300/85 font-medium mt-2">
              Control semanal de competición, condiciones de campo y rendimiento global de porteros.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => setModule('partidos')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <CalendarDays size={15} /> Calendario
            </button>
            {upcomingMatches.length > 0 && (
              <button
                onClick={() => exportarBriefingPDF(upcomingMatches, rivals, gks, showNotification)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/25"
              >
                <FileText size={15} /> Briefing Jornada
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NIVEL 2 · CLIMA TÁCTICO (2/3) + MURO ATLÉTICO KPIs (1/3)  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. MÓDULO CLIMA TÁCTICO · MADRID (2/3 ANCHO) */}
        <div className="lg:col-span-8 rounded-[2rem] p-6 sm:p-7 bg-gradient-to-br from-[#0284c7] via-[#2563eb] to-[#1e293b] text-white border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_18px_40px_rgba(30,58,138,0.28)] flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 w-72 h-56 rounded-full bg-slate-950/35 blur-3xl" />

          {/* Fila Superior: Icono + Temperatura + Recomendación de Guante */}
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                {weatherData.isRainy ? (
                  <CloudRain size={32} className="text-cyan-200" />
                ) : (
                  <Sun size={32} className="text-amber-300" />
                )}
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-sky-100/90">
                  Clima Táctico · {weatherData.city}
                </p>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none tabular-nums">
                    {weatherData.temp}°
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/95">
                    {weatherData.desc}
                  </span>
                </div>
              </div>
            </div>

            {/* Píldora Automática de Guante */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border text-[11px] font-black uppercase tracking-wider shadow-sm ${
              needsWetGlove
                ? 'bg-cyan-400/25 border-cyan-200/40 text-white'
                : 'bg-white/15 border-white/25 text-white'
            }`}>
              <svg className="w-4 h-4 text-cyan-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
              <span>{needsWetGlove ? 'Guante de Agua' : 'Grip Seco'}</span>
            </div>
          </div>

          {/* Fila Inferior: 3 Sub-tarjetas Tácticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 relative z-10">
            {/* 1. Rachas de Viento */}
            <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-100/85">Rachas Viento</span>
                <svg className="w-4 h-4 text-amber-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                  <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                  <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                </svg>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tabular-nums">{weatherData.windGusts}</span>
                <span className="text-xs font-bold text-sky-100/80">km/h</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${aerialAlert ? 'text-amber-300' : 'text-emerald-200'}`}>
                {aerialAlert ? '⚠ Alerta Juego Aéreo' : '✓ Juego Aéreo Estable'}
              </span>
            </div>

            {/* 2. Humedad / Lluvia */}
            <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-100/85">Humedad / Lluvia</span>
                <svg className="w-4 h-4 text-cyan-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="my-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white tabular-nums">{weatherData.humidity}%</span>
                <span className="text-xs font-extrabold text-cyan-200 tabular-nums">· {weatherData.precipProb}%</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                {fastPitch ? 'Césped Rápido' : 'Bote Normal'}
              </span>
            </div>

            {/* 3. Ocaso Solar */}
            <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-100/85">Ocaso Solar</span>
                <svg className="w-4 h-4 text-amber-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10V2" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m16 6-4 4-4-4" /><path d="M16 18a4 4 0 0 0-8 0" />
                </svg>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tabular-nums">{weatherData.sunset}</span>
                <span className="text-xs font-bold text-sky-100/80">h</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Control de Focos
              </span>
            </div>
          </div>
        </div>

        {/* 2. MURO ATLÉTICO · KPIs GLOBALES DEL DEPARTAMENTO (1/3 ANCHO) */}
        <div className="lg:col-span-4 rounded-[2rem] p-6 bg-gradient-to-br from-[#152246] via-[#0f1833] to-[#0a1024] text-white border border-blue-400/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_18px_40px_rgba(7,11,24,0.35)] flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-red-500/15 blur-3xl" />

          <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400 shrink-0">
                <Shield size={17} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white leading-tight">Muro Atlético</h3>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Rendimiento Global</p>
              </div>
            </div>
            <button
              onClick={() => setModule('porteros')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-black text-sky-300 transition-colors"
            >
              {gks.length} GK →
            </button>
          </div>

          <div className="space-y-2.5 relative z-10 flex-1 flex flex-col justify-center">
            {/* KPI 1: Porterías a 0 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Porterías a Cero</span>
                <span className="text-[11px] font-semibold text-emerald-300 mt-0.5 block">
                  {cleanSheetPct}% de actuaciones imbatido
                </span>
              </div>
              <span className="text-2xl font-black text-emerald-400 tabular-nums">{totalCleanSheets}</span>
            </div>

            {/* KPI 2: Promedio Goles Encajados */}
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Promedio Encajado</span>
                <span className="text-[11px] font-semibold text-slate-300 mt-0.5 block">
                  {totalGoalsConceded} goles en {totalMatchesWithData} partidos
                </span>
              </div>
              <span className="text-2xl font-black text-white tabular-nums">{avgGoalsPerMatch}</span>
            </div>

            {/* KPI 3: Efectividad en Penaltis */}
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Penaltis Parados</span>
                <span className="text-[11px] font-semibold text-cyan-300 mt-0.5 block">
                  {totalPenFaced > 0 ? `${penSavePct}% efectividad (${totalPenSaved}/${totalPenFaced})` : 'Sin penaltis registrados'}
                </span>
              </div>
              <span className="text-2xl font-black text-cyan-400 tabular-nums">{totalPenSaved}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NIVEL 3 · CARTELERA FIJA "TU JORNADA POR CATEGORÍAS"      */}
      {/* ========================================================= */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-sky-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <CalendarDays size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-950 dark:text-white leading-none">
                Tu Jornada por Categorías
              </h3>
              <p className={`text-[10px] font-semibold ${theme.textMuted} mt-1`}>
                Pulsa cualquier categoría para editar convocatoria, titularidad o resultado al instante
              </p>
            </div>
          </div>

          <button
            onClick={() => setModule('partidos')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 transition-all shadow-sm"
          >
            Ver calendario completo →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {TEAMS_LIST.map((teamName) => {
            const teamMatches = matches.filter(m => normalizeStr(m.myTeam) === normalizeStr(teamName));
            const nextM = [...teamMatches]
              .filter(m => m.date >= todayStr)
              .sort((a, b) => parseSafeDate(a.date, a.time) - parseSafeDate(b.date, b.time))[0];
            const lastM = [...teamMatches]
              .filter(m => m.date < todayStr)
              .sort((a, b) => parseSafeDate(b.date, b.time) - parseSafeDate(a.date, a.time))[0];

            const targetMatch = nextM || lastM || null;
            const isNext = Boolean(nextM);
            const isToday = isNext && targetMatch?.date === todayStr;
            const rivalObj = targetMatch ? rivals.find(r => r.id === targetMatch.rivalId) : null;
            const convocados = targetMatch ? gks.filter(gk => targetMatch.goalkeeperIds?.includes(gk.id)) : [];

            const hasScore = targetMatch && targetMatch.goalsMyTeam !== '' && targetMatch.goalsMyTeam !== undefined && targetMatch.goalsRival !== '' && targetMatch.goalsRival !== undefined;
            const gAtm = hasScore ? parseInt(targetMatch.goalsMyTeam) : null;
            const gRiv = hasScore ? parseInt(targetMatch.goalsRival) : null;

            let resColor = 'bg-white/10 text-slate-300 border-white/15';
            if (hasScore && !isNaN(gAtm) && !isNaN(gRiv)) {
              if (gAtm > gRiv) resColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
              else if (gAtm === gRiv) resColor = 'bg-sky-500/20 text-sky-300 border-sky-400/30';
              else resColor = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
            }

            return (
              <div
                key={teamName}
                onClick={() => {
                  if (targetMatch && role !== 'staff' && onEditMatch) onEditMatch(targetMatch);
                  else setModule('partidos');
                }}
                className="cursor-pointer rounded-[1.75rem] bg-gradient-to-br from-[#152246] via-[#0f1833] to-[#0a1024] text-white border border-blue-400/20 hover:border-sky-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_14px_32px_rgba(7,11,24,0.35)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_20px_42px_rgba(10,20,52,0.55)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Cabecera de Categoría */}
                <div className="px-4 py-3 bg-white/[0.05] border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={ESCUDO_ATM_URL} alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                      {teamName}
                    </span>
                  </div>

                  {targetMatch ? (
                    isToday ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/25 border border-red-400/40 text-[9px] font-black uppercase tracking-widest text-red-200 animate-pulse shrink-0">
                        Hoy
                      </span>
                    ) : isNext ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-[9px] font-black uppercase tracking-wider text-sky-300 shrink-0">
                        Próximo {targetMatch.matchday ? `· J${targetMatch.matchday}` : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[9px] font-black uppercase tracking-wider text-amber-300 shrink-0">
                        Descansa · Últ.
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[9px] font-bold uppercase text-slate-400 shrink-0">
                      Sin agenda
                    </span>
                  )}
                </div>

                {/* Cuerpo Central del Partido */}
                {targetMatch ? (
                  <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform">
                      {rivalObj?.shieldUrl ? (
                        <img src={rivalObj.shieldUrl} alt={rivalObj.name} className="w-full h-full object-contain drop-shadow-sm" />
                      ) : (
                        <Swords className="w-7 h-7 text-slate-400" />
                      )}
                    </div>

                    <h4 className="mt-2.5 text-xs font-extrabold uppercase tracking-tight text-white line-clamp-1" title={rivalObj?.name}>
                      {rivalObj?.name || 'Rival por definir'}
                    </h4>

                    {/* Condición Local/Visitante/Sede + Campo */}
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-300 max-w-full px-2">
                      {renderConditionTag(targetMatch.locationType)}
                      <span className="text-white/25">·</span>
                      <span className="truncate max-w-[125px] text-slate-400" title={targetMatch.field}>
                        {targetMatch.field || 'Por definir'}
                      </span>
                    </div>

                    {/* Hora (Próximo) o Resultado (Último si descansa) */}
                    {isNext ? (
                      <div className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-md flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300 tabular-nums">{formatDate(targetMatch.date)}</span>
                        <span className="text-white/25">·</span>
                        <span className="text-sm font-black text-sky-300 tabular-nums">{targetMatch.time || '--:--'}</span>
                      </div>
                    ) : (
                      <div className={`mt-3.5 px-3.5 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-2 ${resColor}`}>
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {hasScore ? `ATM ${targetMatch.goalsMyTeam} - ${targetMatch.goalsRival} RIV` : formatDate(targetMatch.date)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                    <CalendarDays size={26} className="text-slate-500 mb-2 opacity-60" />
                    <p className="text-[11px] font-bold text-slate-400">Sin partidos registrados</p>
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-sky-400 group-hover:underline">
                      Ir a Partidos →
                    </span>
                  </div>
                )}

                {/* Footer: Porteros Convocados + Acceso Rápido Edición */}
                <div className="px-4 py-2.5 bg-black/25 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {targetMatch ? (
                      convocados.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {convocados.map(gk => {
                              const isTit = targetMatch.gkStarter?.[gk.id] === true || String(targetMatch.gkStarter?.[gk.id]) === 'true';
                              return (
                                <img
                                  key={gk.id}
                                  src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`}
                                  title={`${gk.name} (${isTit ? 'TIT' : 'SUP'})`}
                                  className={`w-7 h-7 rounded-full object-cover border-2 bg-slate-800 ${isTit ? 'border-emerald-400' : 'border-[#0f1833]'}`}
                                  style={{ objectPosition: 'center 15%' }}
                                  alt=""
                                />
                              );
                            })}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            {convocados.length} conv.
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-amber-300/90 uppercase tracking-wider">
                          ⚠ Sin convocar
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500">---</span>
                    )}
                  </div>

                  {role !== 'staff' && targetMatch && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 group-hover:bg-sky-500/25 border border-white/10 group-hover:border-sky-400/35 text-[9px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors shrink-0">
                      <Edit2 size={10} /> Editar
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TARJETA SCOUTING VISION OS CON MINI RADAR
// ==========================================
function GkScoutingCard({ gk, matches = [], role, onSelect, onEdit, onDelete }) {
  // 1. Cálculo automático y exacto desde el calendario de partidos
  const todayStr = new Date().toISOString().split('T')[0];
  const normalizeStr = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const gkTeamNorm = normalizeStr(gk.team);

  const pastTeamMatches = matches.filter(m => normalizeStr(m.myTeam) === gkTeamNorm && m.date < todayStr);
  const hasDynamicMatches = pastTeamMatches.length > 0;
  const pastGkMatches = pastTeamMatches.filter(m => m.goalkeeperIds?.includes(gk.id));

  let dMins = 0, dGoals = 0, dCleanSheets = 0;

  pastGkMatches.forEach(m => {
    const minsJugados = parseInt(m.gkMinutes?.[gk.id]);
    if (!isNaN(minsJugados) && minsJugados > 0) {
      dMins += minsJugados;

      let golesEncajados = 0;
      if (m.gkGoalsConceded && m.gkGoalsConceded[gk.id] !== undefined && m.gkGoalsConceded[gk.id] !== '') {
        golesEncajados = parseInt(m.gkGoalsConceded[gk.id]) || 0;
      } else {
        const jugaron = (m.goalkeeperIds || []).filter(id => parseInt(m.gkMinutes?.[id]) > 0);
        if (jugaron.length === 1 && jugaron.includes(gk.id)) {
          golesEncajados = parseInt(m.goalsRival) || 0;
        }
      }

      dGoals += golesEncajados;
      if (golesEncajados === 0) dCleanSheets += 1;
    }
  });

  const stats = {
    form: Number(gk.form || 5.0).toFixed(1).replace('.', ','),
    mins: hasDynamicMatches ? dMins : (parseInt(gk.stats?.minutes) || 0),
    goals: hasDynamicMatches ? dGoals : (parseInt(gk.stats?.goalsConceded) || 0),
    cleanSheets: hasDynamicMatches ? dCleanSheets : (parseInt(gk.stats?.cleanSheets) || 0)
  };

  // 2. Edad automática según año de nacimiento
  const parsedBirth = parseInt(gk.birthYear);
  const computedAge = (!isNaN(parsedBirth) && parsedBirth > 1950)
    ? (new Date().getFullYear() - parsedBirth)
    : (gk.age || null);

  // 3. Geometría SVG del Mini Radar Técnico
  const skillsList = (Array.isArray(gk.skills) && gk.skills.length >= 3) ? gk.skills : DUMMY_GOALKEEPER.skills;
  const totalAxes = skillsList.length;
  const cx = 50, cy = 50, maxR = 38;

  const buildPolygonPoints = (scaleFn) =>
    skillsList.map((s, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / totalAxes;
      const r = maxR * scaleFn(s, i);
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');

  const dataVertices = skillsList.map((s, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / totalAxes;
    const norm = Math.max(0.15, Math.min(1, (Number(s.A) || 50) / 100));
    return {
      x: (cx + maxR * norm * Math.cos(angle)).toFixed(1),
      y: (cy + maxR * norm * Math.sin(angle)).toFixed(1)
    };
  });

  const natLower = normalizeStr(gk.nationality);
  const isSpain = !natLower || natLower.includes('espan');

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-[1.75rem] p-5 sm:p-6 bg-gradient-to-br from-[#152246] via-[#0f1833] to-[#0a1024] border border-blue-400/20 hover:border-sky-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_16px_36px_rgba(7,11,24,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_22px_45px_rgba(10,20,52,0.65)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden text-white"
    >
      {/* Brillo ambiental interior */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-sky-500/20 transition-colors duration-500" />

      {/* PARTE SUPERIOR: FOTO + DATOS + MINI RADAR */}
      <div className="flex items-center gap-4 sm:gap-5 relative z-10">
        {/* Foto cuadrada redondeada con estudio azul */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#33589e] via-[#223d72] to-[#132347] border border-sky-300/30 shadow-[0_8px_20px_rgba(0,0,0,0.4)] overflow-hidden shrink-0 relative">
          <img
            src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`}
            alt={gk.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ objectPosition: 'center 15%' }}
          />
          {gk.number && (
            <span className="absolute bottom-0 right-0 bg-[#0a1024]/85 backdrop-blur-md text-[10px] font-black text-sky-300 px-1.5 py-0.5 rounded-tl-lg border-t border-l border-white/15">
              #{gk.number}
            </span>
          )}
        </div>

        {/* Identidad y Etiquetas */}
        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-sky-200 transition-colors">
            {gk.name}
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-300/90 font-medium mt-1">
            {isSpain ? (
              <svg className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm" viewBox="0 0 16 12">
                <rect width="16" height="3" y="0" fill="#c60b1e" />
                <rect width="16" height="6" y="3" fill="#ffc400" />
                <rect width="16" height="3" y="9" fill="#c60b1e" />
              </svg>
            ) : (
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                {gk.nationality?.substring(0, 3)}
              </span>
            )}
            <span>
              Portero · {gk.team || 'Academia'}{computedAge ? ` · ${computedAge} años` : ''}
            </span>
          </div>

          {/* Píldoras de Equipo, Competición y Edición */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-slate-200">
              <img src={ESCUDO_ATM_URL} alt="" className="w-3.5 h-3.5 object-contain" />
              {gk.team || 'Atleti'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300 truncate max-w-[140px]">
              {gk.league || 'RFFM'}
            </span>

            {onEdit && role !== 'staff' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(gk); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/25 text-[10px] font-bold text-sky-300 hover:text-white transition-colors"
                title="Editar portero"
              >
                <Edit2 size={11} /> Editar
              </button>
            )}
            {onDelete && role === 'admin' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(gk.id); }}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 hover:bg-red-500/35 border border-red-400/25 text-red-400 hover:text-white transition-colors"
                title="Borrar portero"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Mini Radar SVG con vértices brillantes */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {[0.35, 0.68, 1].map((lvl, idx) => (
              <polygon
                key={idx}
                points={buildPolygonPoints(() => lvl)}
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
              />
            ))}
            {skillsList.map((_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / totalAxes;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={(cx + maxR * Math.cos(angle)).toFixed(1)}
                  y2={(cy + maxR * Math.sin(angle)).toFixed(1)}
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeWidth="1"
                />
              );
            })}
            <polygon
              points={buildPolygonPoints((s) => Math.max(0.15, Math.min(1, (Number(s.A) || 50) / 100)))}
              fill="rgba(56, 189, 248, 0.3)"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
            {dataVertices.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="2.6"
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* LÍNEA DIVISORIA */}
      <div className="h-px bg-white/10 my-4 relative z-10" />

      {/* PARTE INFERIOR: 4 MÉTRICAS AUTOMÁTICAS CON SEPARADORES VERTICALES */}
      <div className="grid grid-cols-4 divide-x divide-white/10 text-left relative z-10">
        <div className="pr-2 sm:pr-4">
          <span className="block text-lg sm:text-2xl font-extrabold text-sky-400 tracking-tight leading-none">
            {stats.form}
          </span>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-400 mt-1.5 truncate">
            Forma
          </span>
        </div>
        <div className="px-2 sm:px-4">
          <span className="block text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-none">
            {stats.mins}
          </span>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-400 mt-1.5 truncate">
            Minutos
          </span>
        </div>
        <div className="px-2 sm:px-4">
          <span className="block text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-none">
            {stats.goals}
          </span>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-400 mt-1.5 truncate">
            Goles Enc.
          </span>
        </div>
        <div className="pl-2 sm:pl-4">
          <span className="block text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-none">
            {stats.cleanSheets}
          </span>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-400 mt-1.5 truncate">
            Porterías a 0
          </span>
        </div>
      </div>
    </div>
  );
}

function ModulePorteros({ gks, matches = [], activeSeason, role, onSelect, onNew, onEdit, onDelete, isDataLoading }) {
  if (isDataLoading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonCard/><SkeletonCard/></div>;

  return (
    <div className="space-y-6">
      {/* Cabecera limpia estilo visionOS */}
      <div className="rounded-[1.75rem] p-5 sm:p-6 bg-gradient-to-r from-[#142042] via-[#101936] to-[#1a1635] text-white border border-white/15 shadow-[0_15px_35px_rgba(10,16,41,0.25)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
            Tus Porteros · Planificación del Plantel
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
            Departamento de Porteros · Atlético de Madrid
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <span className="px-3.5 py-2 rounded-full bg-sky-500/15 border border-sky-400/25 text-[11px] font-bold text-sky-300">
            {gks.length} en Plantilla
          </span>

          {activeSeason && (
            <span className="px-3.5 py-2 rounded-full bg-white/8 border border-white/15 text-[11px] font-bold text-slate-200">
              Temp. {activeSeason}
            </span>
          )}

          {role === 'admin' && (
            <button
              onClick={onNew}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider transition-all shadow-lg shadow-red-600/25"
            >
              <Plus size={14} /> Añadir Portero
            </button>
          )}
        </div>
      </div>

      {/* Grid directo de Tarjetas Scouting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gks.map(gk => (
          <GkScoutingCard
            key={gk.id}
            gk={gk}
            matches={matches}
            role={role}
            onSelect={() => onSelect(gk.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {gks.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
            No hay porteros asignados.
          </div>
        )}
      </div>
    </div>
  );
}

function ModulePartidos({ matches, rivals, gks, role, onNew, onEdit, onDelete, theme, darkMode, isDataLoading }) {
  const [equipoFiltro, setEquipoFiltro] = useState('Todos');

  const todayStr = new Date().toISOString().split('T')[0];

  const ordenDeseado = ["ALEVÍN A", "BENJAMÍN A", "BENJAMÍN B", "PREBENJAMÍN A"];
  const equiposUnicos = Array.from(new Set(matches.map(m => m.myTeam).filter(Boolean)));
  equiposUnicos.sort((a, b) => {
    const indexA = ordenDeseado.indexOf(a.toUpperCase());
    const indexB = ordenDeseado.indexOf(b.toUpperCase());
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  const equiposDisponibles = ['Todos', ...equiposUnicos];

  const filteredMatches = equipoFiltro === 'Todos'
    ? matches
    : matches.filter(m => m.myTeam === equipoFiltro);

  const upcomingMatches = [...filteredMatches]
    .filter(m => m.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || (a.time || '').localeCompare(b.time || ''));

  const pastMatches = [...filteredMatches]
    .filter(m => m.date < todayStr)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isDataLoading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"><SkeletonMatch/><SkeletonMatch/><SkeletonMatch/></div>;

  return (
    <div className="space-y-8">
      {/* CABECERA VISION OS */}
      <div className="rounded-[1.75rem] p-5 sm:p-6 bg-gradient-to-r from-[#142042] via-[#101936] to-[#1a1635] text-white border border-white/15 shadow-[0_15px_35px_rgba(10,16,41,0.25)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
            Calendario de Competición · Gestión de Partidos
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
            Convocatorias, sedes y resultados · Atlético de Madrid
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <span className="px-3.5 py-2 rounded-full bg-sky-500/15 border border-sky-400/25 text-[11px] font-bold text-sky-300">
            {upcomingMatches.length} Próximos
          </span>
          <span className="px-3.5 py-2 rounded-full bg-white/8 border border-white/15 text-[11px] font-bold text-slate-300">
            {pastMatches.length} Jugados
          </span>

          {role !== 'staff' && (
            <button
              onClick={onNew}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider transition-all shadow-lg shadow-red-600/25 ml-auto lg:ml-1"
            >
              <Plus size={14} /> Añadir Partido
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE FILTRO POR CATEGORÍA (PÍLDORAS CRISTAL) */}
      {equiposDisponibles.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {equiposDisponibles.map(equipo => (
            <button
              key={equipo}
              onClick={() => setEquipoFiltro(equipo)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border ${
                equipoFiltro === equipo
                  ? 'bg-[#142042] dark:bg-sky-500 text-white border-blue-400/40 shadow-md'
                  : 'bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white'
              }`}
            >
              {equipo}
            </button>
          ))}
        </div>
      )}

      {/* SECCIÓN PRÓXIMOS PARTIDOS (3 COLUMNAS COMPACTAS) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <CalendarDays size={16} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-950 dark:text-white">
            Próximos Partidos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {upcomingMatches.map(match => {
            const rival = rivals.find(r => r.id === match.rivalId);
            return (
              <MatchScoreboardCard
                key={match.id}
                match={match}
                rival={rival}
                gks={gks}
                onEdit={role !== 'staff' ? onEdit : null}
                onDelete={role !== 'staff' ? onDelete : null}
                theme={theme}
                darkMode={darkMode}
              />
            );
          })}

          {upcomingMatches.length === 0 && (
            <div className={`col-span-full py-12 text-center flex flex-col items-center justify-center rounded-[1.75rem] border ${theme.border} ${theme.card}`}>
              <CalendarDays className="w-10 h-10 text-slate-400 mb-3 opacity-60" />
              <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">
                No hay próximos partidos programados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN HISTORIAL DE PARTIDOS (3 COLUMNAS COMPACTAS) */}
      {matches.some(m => m.date < todayStr) && (
        <div className="pt-6 border-t border-slate-200/70 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-slate-500/10 dark:bg-white/10 border border-slate-400/20 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <RotateCcw size={15} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Historial de Partidos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pastMatches.map(match => {
              const rival = rivals.find(r => r.id === match.rivalId);
              return (
                <MatchScoreboardCard
                  key={match.id}
                  match={match}
                  rival={rival}
                  gks={gks}
                  onEdit={role !== 'staff' ? onEdit : null}
                  onDelete={role !== 'staff' ? onDelete : null}
                  theme={theme}
                  darkMode={darkMode}
                />
              );
            })}
            {pastMatches.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                No hay partidos jugados con este filtro.
              </div>
            )}
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
      {/* Permitimos a todos (excepto staff de solo lectura) crear rivales */}
      {role !== 'staff' && (
        <div className="flex justify-end mb-6">
          <button onClick={onNew} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg">
            <Plus size={16} /> Añadir Rival
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {rivals.map(rival => (
          <div key={rival.id} className={`p-6 rounded-[3rem] border ${theme.border} ${theme.card} flex flex-col items-center text-center relative group shadow-sm hover:shadow-xl transition-shadow`}>
            
            {/* Permitimos a todos (excepto staff) editar sus rivales */}
            {role !== 'staff' && (
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

// --- VISTA DETALLADA DEL PORTERO (DASHBOARD VISION OS) ---
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
  const enlaceRFFM = (nextMatch && typeof ENLACES_RFFM !== 'undefined') ? ENLACES_RFFM[nextMatch.myTeam] : null;
  const convocadosNext = nextMatch ? (allGks && allGks.length ? allGks : [gk]).filter(g => nextMatch.goalkeeperIds?.includes(g.id)) : [];

  const getGkState = (formScore) => {
    if (formScore >= 8.0) return { text: 'EN FORMA', dot: 'bg-emerald-400 shadow-[0_0_12px_#34d399]', pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', color: 'text-emerald-500 dark:text-emerald-400' };
    if (formScore >= 5.0) return { text: 'REGULAR', dot: 'bg-amber-400 shadow-[0_0_12px_#fbbf24]', pill: 'bg-amber-500/15 text-amber-300 border-amber-400/30', color: 'text-amber-500 dark:text-amber-400' };
    return { text: 'BAJO', dot: 'bg-red-500 shadow-[0_0_12px_#ef4444]', pill: 'bg-red-500/15 text-red-300 border-red-400/30', color: 'text-red-500 dark:text-red-400' };
  };
  const gkState = getGkState(gk.form || 5);

  const getTrend = (perfData) => {
    if (!perfData || perfData.length < 2) return { text: 'ESTABLE →', color: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-500/10 border border-slate-400/20' };
    const last = perfData[perfData.length - 1].goals;
    const prev = perfData[perfData.length - 2].goals;
    if (last < prev) return { text: 'EN MEJORA ↗', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/25' };
    if (last > prev) return { text: 'EN DECLIVE ↘', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border border-red-500/25' };
    return { text: 'ESTABLE →', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/25' };
  };
  const gkTrend = getTrend(gk.performanceData);

  const recommendation = gk.technicalDecision || { title: 'PENDIENTE', reason: 'Aún no se ha introducido una valoración técnica para este portero.' };

  // --- CÁLCULO 100% AUTOMÁTICO DESDE LOS PARTIDOS ---
  const normalizeStr = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const gkTeamNorm = normalizeStr(gk.team);

  const pastTeamMatches = matches.filter(m => normalizeStr(m.myTeam) === gkTeamNorm && m.date < todayStr);
  const hasDynamicMatches = pastTeamMatches.length > 0;

  const getMatchDuration = (teamName) => {
     const t = normalizeStr(teamName);
     if (t.includes('juvenil') || t.includes('aficionado') || t.includes('primer equipo')) return 90;
     if (t.includes('cadete')) return 80;
     if (t.includes('infantil')) return 70;
     if (t.includes('alevin')) return 50; 
     if (t.includes('prebenjamin')) return 40; 
     if (t.includes('benjamin')) return 50; 
     return 90; 
  };
  const minsPerMatch = getMatchDuration(gk.team);

  let dMins = 0, dStarts = 0, dSubs = 0, dGoals = 0, dCleanSheets = 0;
  let dConvocatorias = 0, finalPenaltiesSaved = 0, finalPenaltiesFaced = 0;

  const pastGkMatches = pastTeamMatches.filter(m => m.goalkeeperIds?.includes(gk.id));

  pastGkMatches.forEach(m => {
      dConvocatorias += 1;
      const minsJugados = parseInt(m.gkMinutes?.[gk.id]);
      
      if (!isNaN(minsJugados) && minsJugados > 0) {
          dMins += minsJugados;
          const isTitular = m.gkStarter?.[gk.id] === true || String(m.gkStarter?.[gk.id]) === 'true';
          if (isTitular) dStarts += 1; else dSubs += 1;
          
          let golesEncajados = 0;
          if (m.gkGoalsConceded && m.gkGoalsConceded[gk.id] !== undefined && m.gkGoalsConceded[gk.id] !== '') {
              golesEncajados = parseInt(m.gkGoalsConceded[gk.id]) || 0;
          } else {
              const jugaron = (m.goalkeeperIds || []).filter(id => parseInt(m.gkMinutes?.[id]) > 0);
              if (jugaron.length === 1 && jugaron.includes(gk.id)) {
                  golesEncajados = parseInt(m.goalsRival) || 0;
              }
          }

          dGoals += golesEncajados;
          if (golesEncajados === 0) dCleanSheets += 1; 

          const penSaved = parseInt(m.gkPenaltiesSaved?.[gk.id]);
          const penFaced = parseInt(m.gkPenaltiesFaced?.[gk.id]);
          if (!isNaN(penSaved)) finalPenaltiesSaved += penSaved;
          if (!isNaN(penFaced)) finalPenaltiesFaced += penFaced;
      }
  });

  const finalTeamMatches = hasDynamicMatches ? pastTeamMatches.length : (parseInt(gk.stats?.teamMatches) || 0);
  const finalTeamMinutes = hasDynamicMatches ? (finalTeamMatches * minsPerMatch) : (parseInt(gk.stats?.teamMinutes) || 0);
  
  const finalMinutes = hasDynamicMatches ? dMins : (parseInt(gk.stats?.minutes) || 0);
  const finalStarts = hasDynamicMatches ? dStarts : (parseInt(gk.stats?.starts) || 0);
  const finalSubs = hasDynamicMatches ? dSubs : (parseInt(gk.stats?.subs) || 0);
  const finalGoals = hasDynamicMatches ? dGoals : (parseInt(gk.stats?.goalsConceded) || 0);
  const finalCleanSheets = hasDynamicMatches ? dCleanSheets : (parseInt(gk.stats?.cleanSheets) || 0);
  const finalConvocatorias = hasDynamicMatches ? dConvocatorias : (parseInt(gk.stats?.calledUpMatches) || 0);

  const finalPlayedMatches = finalStarts + finalSubs;
  const safeTeamMatches = finalTeamMatches > 0 ? finalTeamMatches : 1;
  const safeTeamMinutes = finalTeamMinutes > 0 ? finalTeamMinutes : 1;
  const safePlayedMatches = finalPlayedMatches > 0 ? finalPlayedMatches : 1;

  const minsPercent = Math.min(100, Math.round((finalMinutes / safeTeamMinutes) * 100));
  const startsPercent = Math.min(100, Math.round((finalStarts / safeTeamMatches) * 100));
  const subsPercent = Math.min(100, Math.round((finalSubs / safeTeamMatches) * 100));
  const goalsPercent = finalPlayedMatches > 0 ? Math.min(100, Math.round((finalGoals / safePlayedMatches) * 50)) : 0;
  const cleanSheetsPercent = finalPlayedMatches > 0 ? Math.min(100, Math.round((finalCleanSheets / safePlayedMatches) * 100)) : 0;
  const penaltiesPercent = finalPenaltiesFaced > 0 ? Math.round((finalPenaltiesSaved / finalPenaltiesFaced) * 100) : 0;

  // Estado en el último partido
  const lastPlayedMatch = [...pastGkMatches].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  let lastMatchCond = null;
  if (lastPlayedMatch) {
      const isTit = lastPlayedMatch.gkStarter?.[gk.id] === true || String(lastPlayedMatch.gkStarter?.[gk.id]) === 'true';
      const mins = parseInt(lastPlayedMatch.gkMinutes?.[gk.id]) || 0;
      if (mins === 0) lastMatchCond = 'NO JUGÓ';
      else lastMatchCond = isTit ? 'TITULAR' : 'SUPLENTE';
  }

  // Edad y nacionalidad
  const parsedBirth = parseInt(gk.birthYear);
  const computedAge = (!isNaN(parsedBirth) && parsedBirth > 1950)
    ? (new Date().getFullYear() - parsedBirth)
    : (gk.age || null);
  const natLower = normalizeStr(gk.nationality);
  const isSpain = !natLower || natLower.includes('espan');

  return (
    <div className="flex flex-col gap-6 relative">
      {/* FILA SUPERIOR HERO: PERFIL VISION OS + PRÓXIMO PARTIDO */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:grid-cols-12">
        
        {/* 1. TARJETA DE IDENTIDAD DEL PORTERO (DEEP NAVY GLASS) */}
        <div className="xl:col-span-5 rounded-[2rem] bg-gradient-to-br from-[#152246] via-[#0f1833] to-[#0a1024] text-white border border-blue-400/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_45px_rgba(7,11,24,0.35)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
          {/* Halos de luz y dorsal de agua */}
          <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-red-600/10 blur-3xl" />
          <span className="pointer-events-none select-none absolute right-5 top-3 text-8xl font-black italic text-white/[0.04]">
            {gk.number}
          </span>

          {/* Cabecera Foto + Identidad */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl bg-gradient-to-b from-[#33589e] via-[#223d72] to-[#132347] border border-sky-300/35 shadow-[0_12px_28px_rgba(0,0,0,0.45)] overflow-hidden shrink-0 relative">
              <img
                src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`}
                alt={gk.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 15%' }}
                crossOrigin="anonymous"
              />
              {gk.number && (
                <span className="absolute bottom-0 right-0 bg-[#0a1024]/90 backdrop-blur-md text-xs font-black text-sky-300 px-2.5 py-1 rounded-tl-xl border-t border-l border-white/15">
                  #{gk.number}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300/90 mb-1">
                <img src={ESCUDO_ATM_URL} alt="" className="w-3.5 h-3.5 object-contain" />
                Ficha Oficial
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight break-words">
                {gk.name}
              </h2>

              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs text-slate-300 font-medium mt-1.5">
                {isSpain ? (
                  <svg className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm" viewBox="0 0 16 12">
                    <rect width="16" height="3" y="0" fill="#c60b1e" />
                    <rect width="16" height="6" y="3" fill="#ffc400" />
                    <rect width="16" height="3" y="9" fill="#c60b1e" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                    {gk.nationality?.substring(0, 3)}
                  </span>
                )}
                <span>Portero{computedAge ? ` · ${computedAge} años` : ''}</span>
              </div>

              {/* Etiquetas limpias sin solapamiento */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-[11px] font-bold text-red-200">
                  {gk.team || 'Atlético de Madrid'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-slate-200">
                  {gk.league || 'Competición'}{gk.group ? ` · ${gk.group}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Atributos Físicos / Técnicos en Cristal */}
          <div className="grid grid-cols-2 gap-3 my-5 relative z-10">
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Pie Dominante</span>
              <span className="block text-sm font-bold text-white mt-0.5">{gk.foot || 'Derecho'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Mano Dominante</span>
              <span className="block text-sm font-bold text-white mt-0.5">{gk.hand || 'Derecha'}</span>
            </div>
          </div>

          {/* Barra Inferior: Forma + Último Partido */}
          <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Forma Actual</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-sky-400 leading-none">{gk.form || '5.0'}</span>
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${gkState.pill}`}>
                <span className={`w-2 h-2 rounded-full ${gkState.dot}`} />
                {gkState.text}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              {gk.lastMatches && gk.lastMatches.length > 0 && (
                <div className="flex gap-1.5">
                  {gk.lastMatches.map((m, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${m === 'W' ? 'bg-emerald-400' : m === 'D' ? 'bg-sky-400' : 'bg-red-400'}`} />
                  ))}
                </div>
              )}
              {lastMatchCond && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                  lastMatchCond === 'TITULAR'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : lastMatchCond === 'SUPLENTE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-white/10 text-slate-300 border-white/15'
                }`}>
                  Últ. Partido: {lastMatchCond}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. WIDGET DE PRÓXIMO PARTIDO (VISION OS MATCHDAY GLASS) */}
        <div className="xl:col-span-7 h-full">
          {nextMatch ? (
            <div className="h-full rounded-[2rem] bg-gradient-to-br from-[#142042] via-[#0e1730] to-[#090e20] text-white border border-blue-400/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_45px_rgba(7,11,24,0.35)] overflow-hidden flex flex-col justify-between relative">
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-blue-500/15 blur-3xl" />

              {/* Cabecera Competición */}
              <div className="bg-white/[0.05] border-b border-white/10 px-5 py-3.5 flex flex-wrap items-center justify-center gap-2 relative z-10">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-sky-300 text-center">
                  {nextMatch.league || 'Competición por definir'} {nextMatch.group && `· ${nextMatch.group}`} {nextMatch.matchday && `· JORNADA ${nextMatch.matchday}`}
                </span>
                <span className="bg-white/10 border border-white/15 text-slate-200 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase">
                  {nextMatch.season || activeSeason}
                </span>
                {enlaceRFFM && enlaceRFFM !== "" && !enlaceRFFM.includes("AQUI_URL") && (
                  <a
                    href={enlaceRFFM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 p-1.5 rounded-full transition-colors flex items-center justify-center"
                    title="Ver clasificación en RFFM"
                  >
                    <Trophy size={13} className="text-amber-300" />
                  </a>
                )}
              </div>

              {/* Cuerpo Central Enfrentamiento */}
              <div className="px-6 py-6 flex-1 flex flex-col justify-center relative z-10">
                <div className="flex flex-col items-center mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                    <MapPin size={13} />
                    <span className="truncate max-w-[230px]">{nextMatch.field || 'Campo por definir'}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300 mt-1.5 tracking-wider">{formatDate(nextMatch.date)}</span>
                </div>

                <div className="flex items-center justify-between gap-4 sm:px-6">
                  {/* Escudo Atleti */}
                  <div className="flex flex-col items-center flex-1">
                    <img src={ESCUDO_ATM_URL} alt="Atleti" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_18px_rgba(239,68,68,0.4)]" />
                    <span className="font-black text-[11px] sm:text-xs text-white uppercase text-center mt-3 tracking-wide">
                      {nextMatch.myTeam || 'Atleti'}
                    </span>
                  </div>

                  {/* Hora / Marcador Cristal */}
                  <div className="flex flex-col items-center px-2">
                    <div className="px-5 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-widest">
                        {nextMatch.time || '--:--'}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-2">Hora</span>
                  </div>

                  {/* Escudo Rival */}
                  <div className="flex flex-col items-center flex-1">
                    {nextMatchRival?.shieldUrl ? (
                      <img src={nextMatchRival.shieldUrl} alt="Rival" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    ) : (
                      <Swords className="w-16 h-16 sm:w-20 sm:h-20 text-slate-500" />
                    )}
                    <span className="font-black text-[11px] sm:text-xs text-white uppercase text-center mt-3 tracking-wide max-w-[140px]">
                      {nextMatchRival?.name || 'Rival'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Convocatoria y Racha */}
              <div className="bg-black/25 border-t border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Convocatoria</span>
                  <div className="flex -space-x-2.5">
                    {convocadosNext.map(convGk => (
                      <img
                        key={convGk.id}
                        src={convGk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${convGk.name}`}
                        title={convGk.name}
                        className={`w-9 h-9 rounded-full object-cover border-2 ${convGk.id === gk.id ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-slate-800'} bg-slate-800`}
                        style={{ objectPosition: 'center 15%' }}
                        alt=""
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Racha Rival</span>
                  <StreakDisplay streak={nextMatch.streak} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[320px] rounded-[2rem] bg-gradient-to-br from-[#142042] via-[#0e1730] to-[#090e20] text-white border border-blue-400/20 shadow-[0_20px_45px_rgba(7,11,24,0.3)] p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <CalendarDays size={32} className="text-sky-400/80" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-white">Sin partidos inminentes</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs">Este portero no figura en ninguna convocatoria futura por ahora.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN ESTADÍSTICAS BENTO VISION OS */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-sky-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <Activity size={16} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-950 dark:text-white">
              Estadísticas Temporada {activeSeason}
            </h3>
          </div>

          {role !== 'staff' && (
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                <Zap size={12} /> Calculado del Calendario
              </span>
              <button
                onClick={onEditStats}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-blue-950 hover:text-white dark:hover:bg-sky-500 transition-all shadow-sm text-[10px] font-black uppercase tracking-wider no-print"
                title="Editar Estado de Forma"
              >
                <Edit2 size={12} /> Editar Forma
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
          <StatCard title="Minutos Jugados" value={finalMinutes} subtitle="min. jugados" color="stroke-sky-500" percent={minsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Titular" value={finalStarts} subtitle={`${finalStarts} de ${finalTeamMatches} partidos`} color="stroke-indigo-500" percent={startsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Partidos Suplente" value={finalSubs} subtitle={`${finalSubs} de ${finalTeamMatches} partidos`} color="stroke-violet-500" percent={subsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Goles Encajados" value={finalGoals} subtitle={`Promedio: ${finalPlayedMatches ? (finalGoals / finalPlayedMatches).toFixed(2) : '0.00'}`} color="stroke-rose-500" percent={goalsPercent} theme={theme} darkMode={darkMode} />
          <StatCard title="Porterías a Cero" value={finalCleanSheets} subtitle="Ratio clean sheets" color="stroke-emerald-500" percent={cleanSheetsPercent} showPercentInside={true} theme={theme} darkMode={darkMode} />
          <StatCard title="Penaltis Parados" value={finalPenaltiesSaved} subtitle={`de ${finalPenaltiesFaced} penaltis`} color="stroke-cyan-500" percent={penaltiesPercent} showPercentInside={finalPenaltiesFaced > 0} theme={theme} darkMode={darkMode} />
          
          {/* Tarjeta 7: Datos Globales */}
          <div className={`p-5 rounded-[1.75rem] border ${theme.border} ${theme.card} flex flex-col justify-between relative overflow-hidden`}>
            <h4 className={`text-[10px] uppercase tracking-widest font-black ${theme.textMuted} mb-3`}>Datos Globales</h4>
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/10 pb-2">
                <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Convocatorias</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-950 dark:text-white">{finalConvocatorias}/{finalTeamMatches}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">{finalTeamMatches > 0 ? Math.round((finalConvocatorias / finalTeamMatches) * 100) : 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/10 pb-2">
                <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Jugados</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-950 dark:text-white">{finalPlayedMatches}/{finalTeamMatches}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">{finalTeamMatches > 0 ? Math.round((finalPlayedMatches / finalTeamMatches) * 100) : 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold ${theme.textMuted} uppercase`}>Min. Equipo</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-950 dark:text-white">{finalMinutes}/{finalTeamMinutes}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">{finalTeamMinutes > 0 ? Math.round((finalMinutes / finalTeamMinutes) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 8: Semáforo de Rendimiento VisionOS */}
          <div className={`p-5 rounded-[1.75rem] border ${theme.border} ${theme.card} flex flex-col justify-center items-center text-center relative overflow-hidden`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 border ${
              (gk.form || 5) >= 8 ? 'bg-emerald-500/15 border-emerald-500/30' : (gk.form || 5) >= 5 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-red-500/15 border-red-500/30'
            }`}>
              <div className={`w-5 h-5 rounded-full ${gkState.dot}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${gkState.color}`}>{gkState.text}</span>
            <span className={`text-[10px] font-semibold ${theme.textMuted} mt-1`}>Valoración {gk.form || '5.0'} / 10</span>
          </div>
        </div>
      </div>

      {/* PLAN DE PARTIDO (PANEL CRISTAL AZUL PROFUNDO VISION OS) */}
      <div className="rounded-[2rem] bg-gradient-to-r from-[#142042] via-[#101936] to-[#171533] text-white border border-blue-400/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_20px_45px_rgba(10,16,41,0.28)] p-6 sm:p-8 flex flex-col relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Plan de Partido</h3>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Directrices tácticas individuales</p>
            </div>
          </div>
          {role !== 'staff' && (
            <button
              onClick={onEditMatchPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all no-print"
              title="Editar Plan de Partido"
            >
              <Edit2 size={13} /> Editar Plan
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
          <MatchPlanBox title="Objetivo Defensivo" icon={<Shield size={16} className="text-rose-400"/>} content={gk.matchPlan?.defensive} />
          <MatchPlanBox title="Objetivo Ofensivo" icon={<Swords size={16} className="text-emerald-400"/>} content={gk.matchPlan?.offensive} />
          <MatchPlanBox title="Objetivo Táctico" icon={<GitCompare size={16} className="text-sky-400"/>} content={gk.matchPlan?.tactical} />
          <MatchPlanBox title="Aspectos Claves" icon={<Goal size={16} className="text-amber-400"/>} content={gk.matchPlan?.keyAspects} />
        </div>
      </div>

      {/* GRÁFICOS ANALÍTICOS Y DECISIÓN TÉCNICA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:grid-cols-12 print:break-inside-avoid">
        
        {/* RADAR: HABILIDADES */}
        <div className={`xl:col-span-3 rounded-[2rem] border ${theme.border} ${theme.card} p-6 sm:p-7 flex flex-col items-center justify-center`}>
          <h3 className="text-xs font-black uppercase tracking-widest mb-3 w-full text-center text-blue-950 dark:text-white">Perfil Técnico</h3>
          <div className="w-full h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={gk.skills || DUMMY_GOALKEEPER.skills}>
                <PolarGrid stroke={darkMode ? 'rgba(148,163,184,0.2)' : '#cbd5e1'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 10, fontWeight: '800' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={gk.name} dataKey="A" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.35} strokeWidth={2.5} />
                <RechartsTooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '14px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LÍNEA: EVOLUCIÓN Y TENDENCIA */}
        <div className={`xl:col-span-6 rounded-[2rem] border ${theme.border} ${theme.card} p-6 sm:p-7 flex flex-col`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-950 dark:text-white">Evolución (Últimos 5)</h3>
            <span className={`text-[10px] font-black px-3.5 py-1 rounded-full ${gkTrend.bg} ${gkTrend.color}`}>{gkTrend.text}</span>
          </div>
          <div className="flex-1 min-h-[195px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gk.performanceData || DUMMY_GOALKEEPER.performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148,163,184,0.15)' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="match" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} axisLine={false} domain={[0, 'auto']} fontWeight="bold" />
                <RechartsTooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '14px', color: darkMode ? '#fff' : '#0f172a' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                <Line type="monotone" dataKey="goals" name="Goles Encajados" stroke="#ef4444" strokeWidth={3.5} dot={{ r: 4.5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Goles Encajados</span>
            </div>
          </div>
        </div>

        {/* RECOMENDACIÓN TÉCNICA (TARJETA CRISTAL OSCURA DESTACADA) */}
        <div className="xl:col-span-3 rounded-[2rem] bg-gradient-to-br from-[#1b1635] via-[#121936] to-[#0b1024] text-white border border-red-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_18px_40px_rgba(10,16,41,0.3)] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-red-500/20 rounded-full blur-2xl" />
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-red-300 flex items-center gap-2">
              <BarChart2 size={16} /> Decisión Técnica
            </h3>
            {role !== 'staff' && (
              <button
                onClick={onEditTechDec}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all no-print"
                title="Editar Decisión"
              >
                <Edit2 size={13} />
              </button>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="bg-white/[0.07] border border-white/15 backdrop-blur-md p-4 rounded-2xl mb-4">
              <span className="text-[9px] text-red-300/90 uppercase font-black tracking-widest block mb-1">Recomendación</span>
              <span className="text-lg font-black italic tracking-tight text-white leading-snug uppercase block">
                {recommendation.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              <strong className="text-white block mb-1 uppercase text-[10px] tracking-wider">Justificación:</strong>
              {recommendation.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MatchPlanBox = ({ title, icon, content }) => (
  <div className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/12 p-5 rounded-2xl backdrop-blur-md transition-all flex flex-col h-full">
    <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-2.5">
      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{title}</span>
    </div>
    <p className="text-xs font-medium text-slate-300 leading-relaxed whitespace-pre-wrap flex-1">
      {content || <span className="text-slate-500 italic">No definido...</span>}
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
  const [form, setForm] = useState(initialData?.form || 5.0);

  const handleSubmit = () => { 
    // Solo guardamos el 'form'. Respetamos las stats anteriores para no romper nada,
    // aunque en la vista ya se ignoran por estar automatizadas.
    onSave({ form: parseFloat(form) || 5.0, stats: initialData?.stats || {} }); 
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none text-slate-800 dark:text-white font-black focus:border-emerald-500 transition-colors shadow-inner text-center";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4 no-print">
      <div className={`w-full max-w-sm rounded-[3rem] border ${theme.border} bg-white dark:bg-slate-800 shadow-2xl flex flex-col`}>
        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 rounded-t-[3rem]`}>
          <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-emerald-950 dark:text-white"><Activity className="text-emerald-500 w-6 h-6" /> Estado de Forma</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full transition-colors shadow-sm"><X size={16}/></button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 text-center">
            Valora el estado actual de <strong className="text-slate-800 dark:text-white uppercase">{initialData?.name}</strong>.
            <br/><span className="text-[9px] uppercase tracking-widest opacity-70 mt-2 block">(El resto de estadísticas se calcula automáticamente desde los partidos)</span>
          </p>
          
          <div className="w-1/2">
            <label className="block text-[10px] text-center font-black uppercase tracking-widest text-slate-400 mb-2">Puntuación (0-10)</label>
            <input type="number" step="0.1" min="0" max="10" value={form} onChange={(e) => setForm(e.target.value)} className={`${inputClass} text-emerald-600 dark:text-emerald-400 text-2xl`} />
          </div>
        </div>
        <div className={`p-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem]`}>
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm">Cancelar</button>
          <button onClick={handleSubmit} className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/30">Guardar</button>
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
  const [formData, setFormData] = useState(initialData || { 
    date: '', time: '', field: '', rivalId: '', goalkeeperIds: [], 
    gkMinutes: {}, gkGoalsConceded: {}, gkStarter: {}, 
    streak: [], goalsMyTeam: '', goalsRival: '', goalsScored: '', 
    season: activeSeason || '2026/27', league: '', group: '', matchday: '', myTeam: TEAMS_LIST[0] 
  });
  
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
          {['Contexto', 'Fecha & Lugar', 'Rival & Resultados'].map((title, idx) => (
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
              <div className="mb-5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Mi Equipo</label>
                <select name="myTeam" value={formData.myTeam} onChange={handleChange} className={`${inputClass} font-bold text-blue-950 dark:text-white cursor-pointer`}>
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
                  
                  {/* CAMPO CONDICIONAL SOLO PARA ALEVÍN A */}
                  {formData.myTeam && formData.myTeam.toUpperCase().includes('ALEVÍN A') && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 pl-2">Goles Totales Rival (Solo Alevín A)</label>
                      <input type="number" name="goalsScored" value={formData.goalsScored} onChange={handleChange} className={`${inputClass} bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50 focus:ring-amber-500`} placeholder="Ej: 45" />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Resultado Final (Opcional)</label>
                  <div className="flex items-center gap-4">
                     <input type="number" name="goalsMyTeam" value={formData.goalsMyTeam} onChange={handleChange} className={`${inputClass} text-center font-black text-xl bg-slate-100 dark:bg-slate-800`} placeholder="ATM" />
                     <span className="font-black text-slate-400">-</span>
                     <input type="number" name="goalsRival" value={formData.goalsRival} onChange={handleChange} className={`${inputClass} text-center font-black text-xl text-red-500 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 focus:ring-red-500`} placeholder="RIV" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Racha del Rival (Tras el partido)</label>
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

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">Porteros Convocados y Rendimiento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gks.map(gk => {
                    const isSelected = formData.goalkeeperIds.includes(gk.id);
                    return (
                      <div key={gk.id} className={`p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 hover:shadow-sm'}`}>
                         <div onClick={() => toggleGk(gk.id)} className="cursor-pointer relative flex flex-row items-center w-full gap-4">
                           <div className="relative shrink-0">
                             <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm" style={{ objectPosition: 'center 15%' }} alt=""/>
                             {isSelected && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-white dark:border-slate-800 shadow-sm"><CheckCircle2 size={12} className="text-white" strokeWidth={3}/></div>}
                           </div>
                           <span className={`text-xs font-black uppercase truncate flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>{gk.name}</span>
                         </div>
                         
                         {/* Casillas de Rendimiento en Partido (Solo si está convocado) */}
                         {isSelected && (
                           <div className="w-full mt-2 pt-3 border-t border-blue-200 dark:border-blue-800/50 grid grid-cols-5 gap-2">
                             <div>
                               <label className="text-[8px] uppercase font-black tracking-widest text-slate-500 block mb-1 text-center truncate">Cond.</label>
                               <select 
                                 value={formData.gkStarter?.[gk.id] ? 'true' : 'false'} 
                                 onChange={(e) => setFormData(prev => ({...prev, gkStarter: {...(prev.gkStarter || {}), [gk.id]: e.target.value === 'true'}}))} 
                                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-blue-950 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <option value="true">TIT</option>
                                 <option value="false">SUP</option>
                               </select>
                             </div>
                             <div>
                               <label className="text-[8px] uppercase font-black tracking-widest text-slate-500 block mb-1 text-center truncate">Min.</label>
                               <input 
                                 type="number" placeholder="0" 
                                 value={formData.gkMinutes?.[gk.id] !== undefined ? formData.gkMinutes[gk.id] : ''} 
                                 onChange={(e) => setFormData(prev => ({...prev, gkMinutes: {...(prev.gkMinutes || {}), [gk.id]: e.target.value}}))} 
                                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-blue-950 dark:text-white outline-none focus:border-blue-500" 
                                 onClick={(e) => e.stopPropagation()} 
                               />
                             </div>
                             <div>
                               <label className="text-[8px] uppercase font-black tracking-widest text-red-500 block mb-1 text-center truncate" title="Goles Encajados">G.E.</label>
                               <input 
                                 type="number" placeholder="0" 
                                 value={formData.gkGoalsConceded?.[gk.id] !== undefined ? formData.gkGoalsConceded[gk.id] : ''} 
                                 onChange={(e) => setFormData(prev => ({...prev, gkGoalsConceded: {...(prev.gkGoalsConceded || {}), [gk.id]: e.target.value}}))} 
                                 className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-red-600 dark:text-red-400 outline-none focus:border-red-500" 
                                 onClick={(e) => e.stopPropagation()} 
                               />
                             </div>
                             <div>
                               <label className="text-[8px] uppercase font-black tracking-widest text-cyan-600 block mb-1 text-center truncate" title="Penaltis Parados">P. Par</label>
                               <input 
                                 type="number" placeholder="0" 
                                 value={formData.gkPenaltiesSaved?.[gk.id] !== undefined ? formData.gkPenaltiesSaved[gk.id] : ''} 
                                 onChange={(e) => setFormData(prev => ({...prev, gkPenaltiesSaved: {...(prev.gkPenaltiesSaved || {}), [gk.id]: e.target.value}}))} 
                                 className="w-full bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-900/50 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-cyan-600 dark:text-cyan-400 outline-none focus:border-cyan-500" 
                                 onClick={(e) => e.stopPropagation()} 
                               />
                             </div>
                             <div>
                               <label className="text-[8px] uppercase font-black tracking-widest text-cyan-600 block mb-1 text-center truncate" title="Penaltis Totales (Recibidos)">P. Tot</label>
                               <input 
                                 type="number" placeholder="0" 
                                 value={formData.gkPenaltiesFaced?.[gk.id] !== undefined ? formData.gkPenaltiesFaced[gk.id] : ''} 
                                 onChange={(e) => setFormData(prev => ({...prev, gkPenaltiesFaced: {...(prev.gkPenaltiesFaced || {}), [gk.id]: e.target.value}}))} 
                                 className="w-full bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-900/50 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-cyan-600 dark:text-cyan-400 outline-none focus:border-cyan-500" 
                                 onClick={(e) => e.stopPropagation()} 
                               />
                             </div>
                           </div>
                         )}
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
const SidebarItem = ({ icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    title={collapsed ? label : ''}
    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'justify-start px-3'} py-2.5 rounded-2xl transition-all duration-200 group relative
      ${active 
        ? 'bg-white/15 backdrop-blur-md text-white border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.15)] font-bold' 
        : 'text-slate-300/80 hover:text-white hover:bg-white/8 border border-transparent font-medium'}
    `}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all
      ${active 
        ? 'bg-red-500/20 text-red-400 border border-red-400/30 shadow-inner' 
        : 'text-slate-400 group-hover:text-white'}
    `}>
      {React.cloneElement(icon, { size: 17, strokeWidth: active ? 2.4 : 1.9 })}
    </div>
    {!collapsed && (
      <span className="ml-3 text-[13px] tracking-wide truncate">{label}</span>
    )}
  </button>
);

const ProfileRow = ({ label, value, theme }) => (
  <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700/50 pb-2">
    <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{label}</span>
    <span className="font-bold text-sm text-blue-950 dark:text-white">{value}</span>
  </div>
);

const StatCard = ({ title, value, subtitle, color, percent, showPercentInside, theme, darkMode }) => (
  <div className={`p-5 rounded-[1.75rem] border ${theme.border} ${theme.card} hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}>
    <div className="flex justify-between items-start gap-2 mb-3 relative z-10">
      <h4 className={`text-[10px] uppercase tracking-widest font-extrabold ${theme.textMuted} leading-snug`}>{title}</h4>
      <div className="w-11 h-11 relative flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path className={darkMode ? "stroke-slate-700/70" : "stroke-slate-200/80"} strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          {percent > 0 && (
            <path className={`${color}`} strokeWidth="3.8" strokeLinecap="round" fill="none" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          )}
        </svg>
        {showPercentInside && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[9px] font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{percent}%</span>
          </div>
        )}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-3xl font-extrabold tracking-tight text-blue-950 dark:text-white leading-none">{value}</p>
      <p className={`text-[10px] font-semibold ${theme.textMuted} truncate mt-1.5`}>{subtitle}</p>
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
    // Partido (Modificado para UX Ágil)
    partidoCompeticion: '', partidoJornada: '', partidoResultado: '', partidoTitular: 'Titular', partidoMinutos: '', statParadas: 0, statGoles: 0, statSalidas: 0, statCentros: 0, statPases: 0, stat1v1: 0, statErrores: 0, statABP: 0, 
    valParadas: '', obsParadas: '', valGoles: '', obsGoles: '', valAereo: '', obsAereo: '', valPies: '', obsPies: '', valFueraArea: '', obsFueraArea: '', val1v1: '', obs1v1: '', valABP: '', obsABP: '', valComunicacion: '', obsComunicacion: '', valMental: '', obsMental: '', 
    partidoCronologiaList: [], partidoVideos: '', partidoComparativa: '', valTecnicoPartido: '3', valTacticoPartido: '3', valFisicoPartido: '3', valMentalPartido: '3', planFortalezas: '', planDebilidades: '', planObjetivos: '',
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

  const addMatch = () => setFormData(prev => ({ ...prev, partidosTorneo: [...prev.partidosTorneo, { id: Date.now(), matchday: 'Grupos J1', rival: '', country: '🇪🇸 España', goalsATM: '-', goalsRival: '-', goalsConcededByGk: '-', minutes: '' }] }));
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

    const savedId = await onSave(informeAguardar);
    
    if (!isDraft && savedId !== null) {
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

  // Helper UX Ágil para el informe de partido
  const cronoOptions = useMemo(() => {
     const opts = [];
     for(let i=1; i<=45; i++) opts.push(`1T - ${i}'`);
     opts.push(`1T - 45+'`);
     for(let i=46; i<=90; i++) opts.push(`2T - ${i}'`);
     opts.push(`2T - 90+'`);
     opts.push(`Prórroga`);
     opts.push(`Penaltis`);
     return opts;
  }, []);

  const addCronologia = () => setFormData(prev => ({ ...prev, partidoCronologiaList: [...(prev.partidoCronologiaList || []), { id: Date.now(), minuto: "1T - 1'", accion: '' }] }));
  const removeCronologia = (id) => setFormData(prev => ({ ...prev, partidoCronologiaList: prev.partidoCronologiaList.filter(c => c.id !== id) }));
  const updateCronologia = (id, field, value) => setFormData(prev => ({ ...prev, partidoCronologiaList: prev.partidoCronologiaList.map(c => c.id === id ? { ...c, [field]: value } : c) }));

  const renderPartidoField = (num, title, stateValName, stateObsName, type, options) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
      <label className={labelClass}>{num} - {title}</label>
      {type === 'select' ? (
        <select value={formData[stateValName]} onChange={handleChange} name={stateValName} className={`${inputClass} !py-2.5 font-bold`}>
          <option value="">- Seleccionar -</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button 
              type="button" 
              key={opt}
              onClick={() => setFormData(prev => ({...prev, [stateValName]: opt}))}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-colors flex-1 min-w-[120px] ${formData[stateValName] === opt ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <input 
        type="text" 
        name={stateObsName} 
        value={formData[stateObsName]} 
        onChange={handleChange} 
        placeholder="Anotación adicional (opcional)..." 
        className={`${inputClass} !py-2.5 !text-xs bg-white dark:bg-slate-900`}
      />
    </div>
  );

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
                const fParts = (rep.fecha || '').split('-');
                const fStr = fParts.length === 3 ? `${fParts[2]}-${fParts[1]}-${fParts[0]}` : rep.fecha;
                
                return (
                  <div key={rep.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl border ${rep.isDraft ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'} shadow-sm gap-4`}>
                    <div className="flex items-center gap-3">
                      <img src={gk.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`} className="w-10 h-10 rounded-full border border-slate-300 object-cover" alt="" />
                      <div>
                        <div className="font-black text-sm text-blue-950 dark:text-white uppercase">{gk.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rep.tipo} • <span className="text-red-500 font-black">{fStr}</span></div>
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
              {/* INFORME DE PARTIDO (MODIFICADO PARA EXPERIENCIA ÁGIL UX)       */}
              {/* ============================================================== */}
              {tipoInforme === 'partido' && (
                <div className="space-y-10">
                  <div>
                    <h3 className={sectionTitleClass}>01 y 02 — Datos del Partido y Portero</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div><label className={labelClass}>Fecha</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required/></div>
                      <div><label className={labelClass}>Rival</label><input type="text" name="rival" value={formData.rival} onChange={handleChange} placeholder="Ej: Real Madrid" className={inputClass} required/></div>
                      <div><label className={labelClass}>Competición</label><input type="text" name="partidoCompeticion" value={formData.partidoCompeticion} onChange={handleChange} placeholder="Ej: Liga Autonómica" className={inputClass} /></div>
                      <div><label className={labelClass}>Jornada</label><input type="text" name="partidoJornada" value={formData.partidoJornada} onChange={handleChange} placeholder="Ej: 14" className={inputClass} /></div>
                      
                      <div><label className={labelClass}>Resultado</label><input type="text" name="partidoResultado" value={formData.partidoResultado} onChange={handleChange} placeholder="ATM 2 - 1 RIV" className={inputClass} /></div>
                      <div><label className={labelClass}>Nota Global (0-10)</label><input type="number" step="0.1" name="nota" value={formData.nota} onChange={handleChange} placeholder="Ej: 8.5" className={`${inputClass} font-black text-red-600`} /></div>
                      
                      <div className="col-span-2 flex gap-4">
                         <div className="flex-1">
                            <label className={labelClass}>Condición</label>
                            <select name="partidoTitular" value={formData.partidoTitular} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                              <option value="Titular">Titular</option>
                              <option value="Suplente">Suplente</option>
                            </select>
                         </div>
                         <div className="flex-1">
                            <label className={labelClass}>Minutos Jugados</label>
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
                       {renderPartidoField('04', 'Paradas Relevantes', 'valParadas', 'obsParadas', 'radio', ['Sí', 'No'])}
                       {renderPartidoField('05', 'Goles Recibidos', 'valGoles', 'obsGoles', 'select', [...Array(16).keys()])}
                       {renderPartidoField('06', 'Juego Aéreo', 'valAereo', 'obsAereo', 'radio', ['Bien ejecutado', 'Mal ejecutado'])}
                       {renderPartidoField('07', 'Juego con los Pies', 'valPies', 'obsPies', 'radio', ['Bien ejecutado', 'Mal ejecutado'])}
                       {renderPartidoField('08', 'Fuera del Área', 'valFueraArea', 'obsFueraArea', 'radio', ['Bien ejecutado', 'Mal ejecutado'])}
                       {renderPartidoField('09', '1 VS 1', 'val1v1', 'obs1v1', 'radio', ['Bien ejecutado', 'Mal ejecutado'])}
                       {renderPartidoField('10', 'A.B.P.', 'valABP', 'obsABP', 'radio', ['Bien ejecutado', 'Mal ejecutado', 'Bien posic. barrera', 'Mal posic. barrera'])}
                       {renderPartidoField('11', 'Comunicación / Org.', 'valComunicacion', 'obsComunicacion', 'radio', ['Bien ejecutado', 'Mal ejecutado'])}
                       
                       <div className="col-span-1 md:col-span-2">
                         {renderPartidoField('12', 'Aspecto Mental', 'valMental', 'obsMental', 'radio', ['Fuerte', 'Normal', 'Débil'])}
                       </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={sectionTitleClass}>13 al 15 — Datos Adicionales y Cronología</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                         <label className={labelClass}>13 - Cronología de Acciones</label>
                         <div className="space-y-3">
                           {(formData.partidoCronologiaList || []).map((crono) => (
                             <div key={crono.id} className="flex gap-2 items-start">
                               <select 
                                 value={crono.minuto} 
                                 onChange={(e) => updateCronologia(crono.id, 'minuto', e.target.value)}
                                 className={`${inputClass} !py-2.5 !w-32 font-bold !text-xs cursor-pointer`}
                               >
                                 {cronoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                               <input 
                                 type="text" 
                                 value={crono.accion} 
                                 onChange={(e) => updateCronologia(crono.id, 'accion', e.target.value)}
                                 placeholder="Descripción..."
                                 className={`${inputClass} !py-2.5 flex-1 !text-xs`}
                               />
                               <button type="button" onClick={() => removeCronologia(crono.id)} className="w-10 h-10 flex shrink-0 items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"><X size={16}/></button>
                             </div>
                           ))}
                           <button type="button" onClick={addCronologia} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">+ Añadir Acción</button>
                         </div>
                       </div>

                       <div className="flex flex-col gap-6">
                         <div><label className={labelClass}>14 - Enlaces a Vídeos</label><textarea name="partidoVideos" value={formData.partidoVideos} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="https://..." /></div>
                         <div><label className={labelClass}>15 - Comparativa (Opcional)</label><textarea name="partidoComparativa" value={formData.partidoComparativa} onChange={handleChange} rows="3" className={`${inputClass} resize-y`} placeholder="..." /></div>
                       </div>
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
                                  
                                  <select value={match.country} onChange={(e) => updateMatch(match.id, 'country', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer">
                                     <option value="">-- País (Opcional) --</option>
                                     <option value="🇪🇸 España">🇪🇸 España</option>
                                     <option value="🇵🇹 Portugal">🇵🇹 Portugal</option>
                                     <option value="🇫🇷 Francia">🇫🇷 Francia</option>
                                     <option value="🇮🇹 Italia">🇮🇹 Italia</option>
                                     <option value="🇬🇧 Inglaterra">🇬🇧 Inglaterra</option>
                                     <option value="🇩🇪 Alemania">🇩🇪 Alemania</option>
                                     <option value="🇳🇱 Países Bajos">🇳🇱 Países Bajos</option>
                                     <option value="🇧🇪 Bélgica">🇧🇪 Bélgica</option>
                                     <option value="🇦🇷 Argentina">🇦🇷 Argentina</option>
                                     <option value="🇧🇷 Brasil">🇧🇷 Brasil</option>
                                     <option value="🇺🇸 Estados Unidos">🇺🇸 Estados Unidos</option>
                                     <option value="🇯🇵 Japón">🇯🇵 Japón</option>
                                     <option value="🌍 Otro">🌍 Otro</option>
                                  </select>
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
                                         if(e.target.value === '-') updateMatch(match.id, 'goalsConcededByGk', '-');
                                     }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-red-500 transition-colors">
                                        <option value="-">-</option>{[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                                     </select>
                                  </div>
                                  
                                  <div>
                                     {match.goalsRival !== '-' && parseInt(match.goalsRival) > 0 ? (
                                        <div className="animate-in fade-in zoom-in duration-300">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 pl-2" title="Goles que encajó específicamente este portero">Recibidos GK</label>
                                            <select value={match.goalsConcededByGk} onChange={(e) => updateMatch(match.id, 'goalsConcededByGk', e.target.value)} className="w-full bg-amber-500/10 border border-amber-500/50 rounded-xl px-4 py-3 text-amber-500 font-bold outline-none focus:border-amber-400 focus:bg-amber-500/20 transition-all shadow-inner">
                                                <option value="-">-</option>
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
