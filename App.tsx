import React, { useState, useEffect, useRef } from 'react';
import { SubjectConfig, SubjectId, AppMode, Message, Slide, ChartData, GeometryData, UserSettings, Session, UserPlan, UserRole, TestData } from './types';
import { SUBJECTS, AI_MODELS } from './constants';
import { generateResponse } from './services/geminiService';
import { voskService, VoskLanguage } from './services/voskService';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { 
  Menu, X, Send, Image as ImageIcon, Loader2, ChevronRight, Download, Sparkles, Moon, Sun, Book, Copy, Check, Mic, MicOff, Share2, BellRing, BarChart2, LineChart as LineChartIcon, Ruler, ThumbsUp, ThumbsDown, Trash2, Settings, Type, Cpu, RotateCcw, User, Brain, FileJson, MessageSquare, Volume2, Square, Upload, ArrowRight, LayoutGrid, Folder, ChevronDown, ChevronUp, ArrowLeft, Database, Eye, Code, Projector, History, Plus, Edit2, Clock, Calendar, Phone, PhoneOff, Heart, MoreHorizontal, ArrowUpRight, Lock, Unlock, Shield, Key, LogOut, CheckCircle, XCircle, Palette, Monitor, Reply, Crown, Zap, AlertTriangle, Info, AlertCircle, HelpCircle, Camera, Mail, CreditCard, School, GraduationCap, Briefcase, FileText, Printer, FileType, Lightbulb
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import pptxgen from "pptxgenjs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as docx from 'docx';
import { jsPDF } from "jspdf";

import * as LucideIcons from 'lucide-react';
import { Session as SupabaseSession } from '@supabase/supabase-js';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon className={className} /> : <LucideIcons.HelpCircle className={className} />;
};

// --- Theme Helpers ---
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 }; // fallback Indigo 500
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const adjustBrightness = (col: {r:number, g:number, b:number}, percent: number) => {
    let R = col.r * (1 + percent / 100);
    let G = col.g * (1 + percent / 100);
    let B = col.b * (1 + percent / 100);
    R = Math.round(R < 255 ? R : 255);
    G = Math.round(G < 255 ? G : 255);
    B = Math.round(B < 255 ? B : 255);
    return `${R} ${G} ${B}`;
};

// --- Math & Text Utilities ---

const cleanMathText = (text: string): string => {
  if (!text) return "";
  
  // 1. Remove Markdown bold/italic wrappers if they break math
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "");

  // 2. Remove LaTeX delimiters
  clean = clean.replace(/\$/g, "");

  // 3. Common LaTeX/Math to Unicode Mappings
  const replacements: Record<string, string> = {
    '\\times': '×',
    '\\cdot': '·',
    '\\div': '÷',
    '\\le': '≤',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\infty': '∞',
    '\\pm': '±',
    '\\pi': 'π',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\Delta': '∆',
    '\\theta': 'θ',
    '\\sqrt': '√',
    'sqrt': '√',
    '\\circ': '°',
    '^2': '²',
    '^3': '³',
    '^0': '⁰',
    '^1': '¹',
    '^4': '⁴',
    '^5': '⁵',
    '^6': '⁶',
    '^7': '⁷',
    '^8': '⁸',
    '^9': '⁹',
    '^o': '°',
    '<=': '≤',
    '>=': '≥',
    '!=': '≠',
  };

  // Replace superscripts first
  clean = clean.replace(/\^(\d)/g, (match, p1) => {
      const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return map[p1] || match;
  });

  // Replace known latex commands
  Object.keys(replacements).forEach(key => {
     // Escape special regex chars in key if needed (like ^ or \)
     const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
     const regex = new RegExp(escapedKey, 'g');
     clean = clean.replace(regex, replacements[key]);
  });

  // Handle \sqrt{...} specially to just remove braces if simple
  clean = clean.replace(/√\{([^}]+)\}/g, "√$1");
  
  return clean;
};

// --- Security / Key Logic ---
const SECRET_SALT = "UCH_2025_SECURE_SALT_VS";

const generateChecksum = (core: string): string => {
  let hash = 0;
  const str = core + SECRET_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and take last 4 chars
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
};

const isValidKey = (key: string): boolean => {
  // Master Key
  if (key === "UCH-PRO-2025") return true;

  // Algorithmic Key: UCH-{CORE}-{CHECKSUM}
  const parts = key.split('-');
  if (parts.length !== 3) return false;
  if (parts[0] !== 'UCH') return false;
  
  const core = parts[1];
  const checksum = parts[2];
  
  return generateChecksum(core) === checksum;
};

// --- Components ---
const Button = ({ children, onClick, className, variant = 'primary', icon: Icon, disabled }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-500/20",
    secondary: "glass-button text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-white/10",
    ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const isWebCode = lang === 'html' || lang === 'xml';
  
  if (inline) {
    return <code className="bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words whitespace-pre-wrap" {...props}>{children}</code>;
  }

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-indigo-500/20 bg-white/50 dark:bg-black/30 shadow-sm backdrop-blur-sm w-full max-w-full">
       <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 dark:bg-white/5 border-b border-indigo-500/10">
          <div className="flex items-center gap-2">
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
             </div>
             <span className="ml-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">{lang || 'КОД'}</span>
          </div>

          {isWebCode && (
             <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-0.5 rounded-lg">
                <button onClick={() => setView('code')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Код</button>
                <button onClick={() => setView('preview')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Преглед</button>
             </div>
          )}
       </div>

       {view === 'code' ? (
          <div className="relative group/copy">
            <pre className="p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed custom-scrollbar bg-transparent max-w-full">
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
       ) : (
          <div className="w-full h-[400px] bg-white border-t border-gray-200">
             <iframe srcDoc={String(children)} title="Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-modals" />
          </div>
       )}
    </div>
  );
};

const ChartRenderer = ({ data }: { data: ChartData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><BarChart2 size={18} /></div>
        <span>Визуализирай данни</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Графика"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'line' ? (
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'var(--tooltip-bg, #fff)' }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GeometryRenderer = ({ data }: { data: GeometryData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Ruler size={18} /></div>
        <span>Покажи чертеж</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Чертеж"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="w-full overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-indigo-500/20 p-4 flex justify-center" dangerouslySetInnerHTML={{__html: data.svg}} />
    </div>
  );
};

const TestRenderer = ({ data }: { data: TestData }) => {
  const [visible, setVisible] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadWord = async () => {
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                // Header: Name, Class, Number
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Име: __________________________________________", size: 24, italics: false })],
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Клас: _________      Номер: _________", size: 24 })],
                    spacing: { after: 400 }
                }),
                
                // Title
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: cleanMathText(data.title), bold: true, size: 32 })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: `${data.subject} | ${data.grade || ''}`, size: 24, color: "666666" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                
                // Questions
                ...data.questions.flatMap((q, index) => [
                    new docx.Paragraph({
                        children: [new docx.TextRun({ text: `${index + 1}. ${cleanMathText(q.question)}`, bold: true, size: 24 })],
                        spacing: { before: 200, after: 100 }
                    }),
                    ...(q.options ? q.options.map(opt => 
                        new docx.Paragraph({
                            children: [new docx.TextRun({ text: cleanMathText(opt), size: 24 })],
                            spacing: { after: 50 },
                            indent: { left: 720 }
                        })
                    ) : [
                        new docx.Paragraph({ children: [new docx.TextRun({ text: "____________________________________________________________________" })], spacing: { after: 100 } }),
                        new docx.Paragraph({ children: [new docx.TextRun({ text: "____________________________________________________________________" })], spacing: { after: 200 } })
                    ])
                ]),
                
                // Footer: Signatures
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "Подпис на учител: ___________________        Подпис на ученик: ___________________", size: 24 })
                    ],
                    spacing: { before: 800, after: 300 }
                }),

                // Grade
                new docx.Paragraph({
                    children: [
                         new docx.TextRun({ text: "Оценка: ___________________", bold: true, size: 24 })
                    ],
                    spacing: { after: 200 }
                }),

                // Answer Key (New Page)
                new docx.Paragraph({
                     children: [new docx.TextRun({ text: "Ключ с отговори", bold: true, size: 28 })],
                     spacing: { before: 600, after: 200 },
                     pageBreakBefore: true
                }),
                ...data.questions.map((q, index) => 
                     new docx.Paragraph({
                         children: [new docx.TextRun({ text: `${index + 1}. ${cleanMathText(q.correctAnswer || '-')}`, size: 24 })]
                     })
                )
            ]
        }]
    });

    const blob = await docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
      setIsGeneratingPdf(true);
      try {
        const doc = new jsPDF();

        // Load font that supports Cyrillic and Math Symbols
        try {
            const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
            const filename = "Roboto-Regular.ttf";
            
            // Convert to base64
            let binary = '';
            const bytes = new Uint8Array(fontBytes);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const fontBase64 = window.btoa(binary);

            doc.addFileToVFS(filename, fontBase64);
            doc.addFont(filename, "Roboto", "normal");
            doc.setFont("Roboto");
        } catch (e) {
            console.error("Failed to load Cyrillic font", e);
            alert("Warning: Could not load Cyrillic font. Text might look incorrect.");
        }

        // --- Header Section ---
        doc.setFontSize(12);
        doc.text("Име: __________________________________________", 20, 20);
        doc.text("Клас: _________", 20, 30);
        doc.text("Номер: _________", 80, 30);

        // --- Title Section ---
        doc.setFontSize(18);
        doc.text(cleanMathText(data.title), 105, 50, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${data.subject} | ${data.grade || ''}`, 105, 58, { align: 'center' });
        doc.setTextColor(0);

        // --- Questions ---
        let y = 70;
        data.questions.forEach((q, i) => {
            if (y > 250) { doc.addPage(); y = 20; }
            
            doc.setFontSize(12);
            // Question Text
            const questionText = `${i + 1}. ${cleanMathText(q.question)}`;
            const splitQ = doc.splitTextToSize(questionText, 170);
            doc.text(splitQ, 20, y);
            y += splitQ.length * 7;

            // Options or Lines
            if (q.options) {
               q.options.forEach(opt => {
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.text(cleanMathText(opt), 25, y);
                  y += 7;
               });
               y += 4;
            } else {
               // Lines for open answer
               doc.line(20, y+5, 190, y+5);
               doc.line(20, y+15, 190, y+15);
               y += 25;
            }
        });
        
        // --- Signatures Footer ---
        if (y > 230) { doc.addPage(); y = 40; } else { y += 20; }
        
        doc.text("Подпис на учител: ___________________", 20, y);
        doc.text("Подпис на ученик: ___________________", 100, y);

        // --- Grade ---
        y += 15;
        doc.setFontSize(14);
        doc.text("Оценка: ___________________", 20, y);

        // --- Answer Key Page ---
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Ключ с отговори", 20, 20);
        doc.setFontSize(12);
        
        let ky = 35;
        data.questions.forEach((q, i) => {
             doc.text(`${i + 1}. ${cleanMathText(q.correctAnswer || '-')}`, 20, ky);
             ky += 8;
        });

        doc.save(`${data.title.replace(/\s+/g, '_')}.pdf`);
      } catch (e) {
        console.error("PDF Gen Error", e);
      } finally {
        setIsGeneratingPdf(false);
      }
  };

  const handlePrint = () => {
     const printWindow = window.open('', '', 'height=800,width=800');
     if (!printWindow) return;

     const html = `
        <html>
        <head>
            <title>${cleanMathText(data.title)}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body { font-family: 'Roboto', sans-serif; padding: 40px; color: #000; }
                .header-fields { margin-bottom: 40px; font-size: 16px; line-height: 1.8; }
                .field-row { margin-bottom: 10px; }
                
                h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
                .meta { text-align: center; color: #666; margin-bottom: 40px; font-size: 14px; }
                
                .question { margin-bottom: 25px; page-break-inside: avoid; }
                .q-text { font-weight: bold; margin-bottom: 10px; font-size: 16px; }
                .option { margin-left: 20px; margin-bottom: 5px; }
                .open-lines { margin-top: 15px; border-bottom: 1px solid #000; height: 30px; width: 100%; }
                
                .footer-signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                .grade-field { margin-top: 30px; font-weight: bold; font-size: 18px; page-break-inside: avoid; }

                .key { margin-top: 50px; page-break-before: always; }
                @media print {
                   @page { margin: 2cm; }
                }
            </style>
        </head>
        <body>
            <div class="header-fields">
                <div class="field-row">Име: _________________________________________________</div>
                <div class="field-row">Клас: _________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Номер: _________</div>
            </div>

            <h1>${cleanMathText(data.title)}</h1>
            <div class="meta">${data.subject} ${data.grade ? '| ' + data.grade : ''}</div>
            
            ${data.questions.map((q, i) => `
                <div class="question">
                    <div class="q-text">${i + 1}. ${cleanMathText(q.question)}</div>
                    ${q.options 
                        ? q.options.map(o => `<div class="option">${cleanMathText(o)}</div>`).join('') 
                        : `<div class="open-lines"></div><div class="open-lines"></div>`}
                </div>
            `).join('')}

            <div class="footer-signatures">
                <div>Подпис на учител: ___________________</div>
                <div>Подпис на ученик: ___________________</div>
            </div>

            <div class="grade-field">
                Оценка: ___________________
            </div>

            <div class="key">
                <h2>Ключ с отговори</h2>
                ${data.questions.map((q, i) => `<div>${i + 1}. ${cleanMathText(q.correctAnswer || '-')}</div>`).join('')}
            </div>
            <script>
                // Wait for fonts
                document.fonts.ready.then(() => {
                    window.print();
                });
            </script>
        </body>
        </html>
     `;
     
     printWindow.document.write(html);
     printWindow.document.close();
  };

  if (!visible) {
      return (
          <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><FileText size={18} /></div>
            <span>Покажи Тест</span>
          </button>
      );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <h4 className="font-bold text-lg leading-tight">{cleanMathText(data.title)}</h4>
                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">{data.questions.length} въпроса • {data.subject}</span>
            </div>
            <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <button onClick={handleDownloadWord} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                <FileType size={18}/> Word (.docx)
            </button>
            <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait">
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>} PDF
            </button>
             <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-zinc-500/20 transition-all active:scale-95">
                <Printer size={18}/> Print
            </button>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar p-2 bg-white/50 dark:bg-black/20 rounded-xl border border-indigo-500/5">
            {data.questions.map((q, i) => (
                <div key={i} className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                    <p className="font-bold text-sm mb-2">{i + 1}. {cleanMathText(q.question)}</p>
                    {q.options && (
                        <div className="space-y-1 ml-2">
                            {q.options.map((opt, idx) => (
                                <p key={idx} className="text-xs text-gray-600 dark:text-gray-300">{cleanMathText(opt)}</p>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1280; // Balanced size for AI and storage

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to JPEG 0.7
           resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
           resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string); // Fallback
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// --- Main App ---

interface GeneratedKey {
  code: string;
  isUsed: boolean;
}

export const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- State ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectConfig | null>(null);
  const [showSubjectDashboard, setShowSubjectDashboard] = useState(false); // Controls dashboard vs chat view
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.SOLVE);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [homeInputValue, setHomeInputValue] = useState('');
  const [pendingHomeMessage, setPendingHomeMessage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Navigation Folders
  const [schoolFolderOpen, setSchoolFolderOpen] = useState(true); 
  const [studentsFolderOpen, setStudentsFolderOpen] = useState(false);
  const [teachersFolderOpen, setTeachersFolderOpen] = useState(false);

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default Dark Mode
  const [showSettings, setShowSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Revised Home Views
  const [homeView, setHomeView] = useState<'landing' | 'school_select' | 'student_subjects' | 'teacher_subjects'>('landing');

  const [memoryUsage, setMemoryUsage] = useState(0); 
  const MAX_MEMORY = 50000; 
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Profile State
  const [userMeta, setUserMeta] = useState({ firstName: '', lastName: '', avatar: '' });
  const [editProfile, setEditProfile] = useState({ firstName: '', lastName: '', avatar: '', email: '', password: '', currentPassword: '' });

  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Plans & Limits
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [dailyImageCount, setDailyImageCount] = useState(0);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  
  // Key Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [targetPlan, setTargetPlan] = useState<UserPlan | null>(null);

  // Voice State
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    userName: '', 
    gradeLevel: '8-12', 
    textSize: 'normal', 
    haptics: true, 
    notifications: true, 
    sound: true, 
    reduceMotion: false, 
    responseLength: 'concise', 
    creativity: 'balanced', 
    languageLevel: 'standard',
    preferredModel: 'auto',
    // New Personalization Settings
    themeColor: '#6366f1',
    customBackground: null
  });
  const [unreadSubjects, setUnreadSubjects] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, subjectId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // --- Toast & Confirm State ---
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info'}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const addToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, {id, message, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // --- Refs ---
  const startingTextRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceCallRecognitionRef = useRef<any>(null); // Kept for voice call logic (uses WebSpeech for now as it's separate)
  
  // Refs for State management to handle stale closures
  const activeSubjectRef = useRef(activeSubject);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeModeRef = useRef(activeMode);
  const isVoiceCallActiveRef = useRef(isVoiceCallActive);
  const voiceMutedRef = useRef(voiceMuted);
  const voiceCallStatusRef = useRef(voiceCallStatus);
  const loadingSubjectsRef = useRef(loadingSubjects);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingTimeoutRef = useRef<any>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Auth Effect
  useEffect(() => {
    const syncProfile = (session: SupabaseSession | null) => {
        setSession(session);
        setAuthLoading(false);
        if (session) {
            setShowAuthModal(false);
        }
        if (session?.user?.user_metadata) {
            const meta = session.user.user_metadata;
            const firstName = meta.first_name || '';
            const lastName = meta.last_name || '';
            const avatar = meta.avatar_url || '';
            const email = session.user.email || '';
            
            setUserMeta({ firstName, lastName, avatar });
            setEditProfile({ firstName, lastName, avatar, email, password: '', currentPassword: '' });

            setUserSettings(prev => {
                const fullName = meta.full_name || `${firstName} ${lastName}`.trim();
                if (!prev.userName && fullName) return { ...prev, userName: fullName };
                return prev;
            });
        }
    };

    supabase.auth.getSession().then(({ data: { session } }) => syncProfile(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Loading Effect - User Partitioned
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = session?.user?.id;
      const sessionsKey = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      const settingsKey = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      const planKey = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';

      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      else setSessions([]); // Clear if no data for this user context

      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) setUserSettings(JSON.parse(savedSettings));
      else {
          // Reset to defaults if new user and no settings found
          if (userId) {
             setUserSettings({
                userName: session?.user?.user_metadata?.full_name || '', 
                gradeLevel: '8-12', 
                textSize: 'normal', 
                haptics: true, 
                notifications: true, 
                sound: true, 
                reduceMotion: false, 
                responseLength: 'concise', 
                creativity: 'balanced', 
                languageLevel: 'standard',
                preferredModel: 'auto',
                themeColor: '#6366f1',
                customBackground: null
              });
          } else {
             // Fallback for guest if needed, though they usually have localstorage already
          }
      }
      
      const savedPlan = localStorage.getItem(planKey);
      if (savedPlan) setUserPlan(savedPlan as UserPlan);
      else {
          // Legacy check for pro status only applies to guest or migration
          if (!userId) {
              const oldPro = localStorage.getItem('uchebnik_pro_status');
              if (oldPro === 'unlocked') {
                  setUserPlan('pro');
                  localStorage.setItem('uchebnik_user_plan', 'pro');
              } else {
                  setUserPlan('free');
              }
          } else {
              setUserPlan('free'); // Default new user to free
          }
      }

      // Admin keys are global for this device
      const savedAdminKeys = localStorage.getItem('uchebnik_admin_keys');
      if (savedAdminKeys) setGeneratedKeys(JSON.parse(savedAdminKeys));

      // Image limits are device specific for now, or could be user specific
      const today = new Date().toDateString();
      const lastUsageDate = localStorage.getItem('uchebnik_image_date');
      const lastUsageCount = localStorage.getItem('uchebnik_image_count');

      if (lastUsageDate !== today) {
          setDailyImageCount(0);
          localStorage.setItem('uchebnik_image_date', today);
          localStorage.setItem('uchebnik_image_count', '0');
      } else {
          setDailyImageCount(parseInt(lastUsageCount || '0'));
      }

      // Default to Dark Mode if not set
      if (!savedSettings) {
         setIsDarkMode(true);
      }
    }
    
    // Voice setup
    const loadVoices = () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices(); };
    if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
    
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarOpen(true);
  }, [session]);

  // Data Saving Effects - User Partitioned
  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_sessions_${userId}` : 'uchebnik_sessions';
      try { localStorage.setItem(key, JSON.stringify(sessions)); } catch(e) { console.error("Session storage error", e); } 
  }, [sessions, session]);

  useEffect(() => { 
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_settings_${userId}` : 'uchebnik_settings';
      try { localStorage.setItem(key, JSON.stringify(userSettings)); } catch(e) { console.error("Settings storage error", e); } 
  }, [userSettings, session]);

  useEffect(() => {
      const userId = session?.user?.id;
      const key = userId ? `uchebnik_plan_${userId}` : 'uchebnik_user_plan';
      try { localStorage.setItem(key, userPlan); } catch(e) {}
  }, [userPlan, session]);

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  // Apply Theme Colors
  useEffect(() => {
    if (userSettings.themeColor) {
      const rgb = hexToRgb(userSettings.themeColor);
      const root = document.documentElement;
      
      // Update primary palette variables
      root.style.setProperty('--primary-50', adjustBrightness(rgb, 90));
      root.style.setProperty('--primary-100', adjustBrightness(rgb, 80));
      root.style.setProperty('--primary-200', adjustBrightness(rgb, 60));
      root.style.setProperty('--primary-300', adjustBrightness(rgb, 40));
      root.style.setProperty('--primary-400', adjustBrightness(rgb, 20));
      root.style.setProperty('--primary-500', `${rgb.r} ${rgb.g} ${rgb.b}`);
      root.style.setProperty('--primary-600', adjustBrightness(rgb, -10));
      root.style.setProperty('--primary-700', adjustBrightness(rgb, -20));
      root.style.setProperty('--primary-800', adjustBrightness(rgb, -30));
      root.style.setProperty('--primary-900', adjustBrightness(rgb, -40));
      root.style.setProperty('--primary-950', adjustBrightness(rgb, -50));

      // Calculate Accent Color (Hue Shift)
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const accentHsl = { ...hsl, h: (hsl.h + 35) % 360 }; // +35 degree shift
      const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);

      // Update accent palette variables
      root.style.setProperty('--accent-50', adjustBrightness(accentRgb, 90));
      root.style.setProperty('--accent-100', adjustBrightness(accentRgb, 80));
      root.style.setProperty('--accent-200', adjustBrightness(accentRgb, 60));
      root.style.setProperty('--accent-300', adjustBrightness(accentRgb, 40));
      root.style.setProperty('--accent-400', adjustBrightness(accentRgb, 20));
      root.style.setProperty('--accent-500', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
      root.style.setProperty('--accent-600', adjustBrightness(accentRgb, -10));
      root.style.setProperty('--accent-700', adjustBrightness(accentRgb, -20));
      root.style.setProperty('--accent-800', adjustBrightness(accentRgb, -30));
      root.style.setProperty('--accent-900', adjustBrightness(accentRgb, -40));
      root.style.setProperty('--accent-950', adjustBrightness(accentRgb, -50));
    }

    // Toggle custom-bg-active class
    if (userSettings.customBackground) {
      document.body.classList.add('custom-bg-active');
    } else {
      document.body.classList.remove('custom-bg-active');
    }
  }, [userSettings.themeColor, userSettings.customBackground]);

  useEffect(() => {
    if(activeSessionId) {
      const s = sessions.find(s => s.id === activeSessionId);
      setMemoryUsage(s ? s.messages.reduce((acc, msg) => acc + (msg.text?.length || 0), 0) : 0);
    }
  }, [sessions, activeSessionId]);
  
  // Sync Refs
  useEffect(() => { activeSubjectRef.current = activeSubject; if(activeSubject && isVoiceCallActive) endVoiceCall(); }, [activeSubject]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { isVoiceCallActiveRef.current = isVoiceCallActive; }, [isVoiceCallActive]);
  useEffect(() => { voiceCallStatusRef.current = voiceCallStatus; }, [voiceCallStatus]);
  useEffect(() => { loadingSubjectsRef.current = loadingSubjects; }, [loadingSubjects]);

  // Handle auto-send from home input
  useEffect(() => {
    if (pendingHomeMessage && activeSubject?.id === SubjectId.GENERAL && activeSessionId) {
       handleSend(pendingHomeMessage);
       setPendingHomeMessage(null);
    }
  }, [activeSubject, activeSessionId, pendingHomeMessage]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId, isImageProcessing, showSubjectDashboard]);

  // Handle Mute Logic
  useEffect(() => {
    voiceMutedRef.current = voiceMuted;
    if (isVoiceCallActive) {
      if (voiceMuted) {
         if (voiceCallStatus === 'listening') {
             voiceCallRecognitionRef.current?.stop();
         }
      } else {
         if (voiceCallStatus === 'listening' || voiceCallStatus === 'idle') {
             startVoiceRecognition();
         }
      }
    }
  }, [voiceMuted, isVoiceCallActive]);

  // Trigger voice recognition when call becomes active
  useEffect(() => {
    if (isVoiceCallActive) {
      setVoiceCallStatus('listening');
      startVoiceRecognition();
    }
  }, [isVoiceCallActive]);

  // Cleanup effect for chat voice recognition (Vosk)
  useEffect(() => {
      return () => {
          if (voskService.isActive()) {
              voskService.stop();
          }
      };
  }, []);

  // --- Logic Helpers ---
  const checkImageLimit = (count = 1): boolean => {
      let limit = 4;
      if (userPlan === 'plus') limit = 12;
      if (userPlan === 'pro') limit = 9999;

      if (dailyImageCount + count > limit) {
          addToast(`Достигнахте лимита за изображения за деня (${limit}). Ъпгрейднете плана си за повече.`, 'error');
          return false;
      }
      return true;
  };

  const incrementImageCount = (count = 1) => {
      const newCount = dailyImageCount + count;
      setDailyImageCount(newCount);
      localStorage.setItem('uchebnik_image_count', newCount.toString());
  };

  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
  
  const createNewSession = (subjectId: SubjectId, role?: UserRole, initialMode?: AppMode) => {
    const greetingName = userSettings.userName ? `, ${userSettings.userName}` : '';
    let welcomeText = "";
    const subjectName = SUBJECTS.find(s => s.id === subjectId)?.name;

    // Smart Naming Logic
    const getModeName = (m: AppMode) => {
        switch(m) {
            case AppMode.SOLVE: return "Решаване";
            case AppMode.LEARN: return "Учене";
            case AppMode.TEACHER_TEST: return "Тест";
            case AppMode.TEACHER_PLAN: return "План";
            case AppMode.TEACHER_RESOURCES: return "Ресурси";
            case AppMode.DRAW: return "Рисуване";
            case AppMode.PRESENTATION: return "Презентация";
            case AppMode.CHAT: return "Чат";
            default: return "Чат";
        }
    };

    let sessionBaseName = subjectName;
    if (initialMode) {
        sessionBaseName = getModeName(initialMode);
    }
    
    // Calculate Naming: [Mode] #[Count + 1]
    const existingCount = sessions.filter(s => s.subjectId === subjectId && s.role === (role || userRole || undefined) && s.mode === initialMode).length;
    
    const sessionTitle = subjectId === SubjectId.GENERAL 
        ? `Общ Чат #${existingCount + 1}`
        : `${sessionBaseName} #${existingCount + 1}`;

    const newSession: Session = {
      id: crypto.randomUUID(), 
      subjectId, 
      title: sessionTitle, 
      createdAt: Date.now(), 
      lastModified: Date.now(), 
      preview: 'Начало', 
      messages: [], 
      role: role || userRole || undefined,
      mode: initialMode
    };

    if (subjectId === SubjectId.GENERAL) {
        welcomeText = `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!`;
    } else {
        if (role === 'teacher') {
             welcomeText = `Здравейте, колега! Аз съм Вашият AI асистент по **${subjectName}**. Как мога да Ви съдействам?`;
        } else {
             welcomeText = `Здравей${greetingName}! Аз съм твоят помощник по **${subjectName}**.`;
        }
    }

    newSession.messages.push({
        id: 'welcome-' + Date.now(), role: 'model', timestamp: Date.now(),
        text: welcomeText
    });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleUpdateAccount = async () => {
      try {
          const updates: any = {
              data: {
                  first_name: editProfile.firstName,
                  last_name: editProfile.lastName,
                  full_name: `${editProfile.firstName} ${editProfile.lastName}`.trim(),
                  avatar_url: editProfile.avatar
              }
          };

          const isEmailChange = editProfile.email !== session?.user?.email;
          const isPasswordChange = !!editProfile.password;

          // Require current password for sensitive changes
          if (isEmailChange || isPasswordChange) {
              if (!editProfile.currentPassword) {
                  addToast('Моля, въведете текущата си парола, за да запазите промените по акаунта.', 'error');
                  return;
              }

              // Verify current password via re-authentication
              const { error: signInError } = await supabase.auth.signInWithPassword({
                  email: session?.user?.email || '',
                  password: editProfile.currentPassword
              });

              if (signInError) {
                  addToast('Грешна текуща парола.', 'error');
                  return;
              }
          }

          if (isEmailChange) {
              updates.email = editProfile.email;
          }
          if (isPasswordChange) {
              updates.password = editProfile.password;
          }

          // Call updateUser
          const { error } = await supabase.auth.updateUser(updates, { emailRedirectTo: window.location.origin });

          if (error) throw error;

          setUserMeta({ 
              firstName: editProfile.firstName, 
              lastName: editProfile.lastName, 
              avatar: editProfile.avatar 
          });
          setUserSettings(prev => ({...prev, userName: updates.data.full_name}));
          
          let successMessage = 'Профилът е обновен успешно!';
          if (isEmailChange) {
             successMessage += ' Моля, проверете имейла си за потвърждение на промяната.';
          }
          
          // Clear sensitive fields
          setEditProfile(prev => ({ ...prev, password: '', currentPassword: '' }));
          addToast(successMessage, 'success');

      } catch (error: any) {
          addToast(error.message || 'Грешка при обновяване на профила.', 'error');
      }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resized = await resizeImage(file);
              setEditProfile(prev => ({ ...prev, avatar: resized }));
          } catch (err) {
              addToast('Грешка при качване на снимка', 'error');
          }
      }
  };

  // NEW Navigation Logic
  const handleSubjectChange = (subject: SubjectConfig, role?: UserRole) => {
    const targetRole = role || userRole;
    if (activeSubject?.id === subject.id && !showSubjectDashboard && userRole === targetRole) { 
        if (window.innerWidth < 1024) setSidebarOpen(false); 
        return; 
    }

    if (unreadSubjects.has(subject.id)) { 
        const newUnread = new Set(unreadSubjects); newUnread.delete(subject.id); setUnreadSubjects(newUnread); 
    }
    
    // Set the role if provided (crucial for sidebar navigation)
    if (role) setUserRole(role);

    // Special Handling for General Chat (No Dashboard, No Role)
    if (subject.id === SubjectId.GENERAL) {
        setActiveSubject(subject);
        setActiveMode(AppMode.CHAT);
        setShowSubjectDashboard(false);
        setUserRole(null); // Reset Role for General
    } else {
        // For other subjects, show Dashboard first if we are in a role, or just default to dashboard
        setActiveSubject(subject);
        setShowSubjectDashboard(true);
    }
    
    setInputValue(''); 
    setSelectedImages([]); 
    setIsImageProcessing(false); 
    setReplyingTo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // If switching to General, we load session immediately. 
    // If switching to school subject, we wait for dashboard choice to load/create session.
    if (subject.id === SubjectId.GENERAL) {
        const subSessions = sessions.filter(s => s.subjectId === subject.id).sort((a, b) => b.lastModified - a.lastModified);
        if (subSessions.length > 0) setActiveSessionId(subSessions[0].id); else createNewSession(subject.id);
    } else {
        setActiveSessionId(null); // Wait for dashboard choice
    }

    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleStartMode = (mode: AppMode) => {
      if (!activeSubject) return;
      setActiveMode(mode);
      setShowSubjectDashboard(false);
      
      // Look for a recent session with this mode or create new
      const relevantSessions = sessions.filter(s => s.subjectId === activeSubject.id && s.role === userRole && s.mode === mode).sort((a, b) => b.lastModified - a.lastModified);
      if (relevantSessions.length > 0) {
          setActiveSessionId(relevantSessions[0].id);
      } else {
          createNewSession(activeSubject.id, userRole || undefined, mode);
      }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    // Focus the input if possible
    setTimeout(() => {
       // Just ensuring focus
    }, 100);
  };

  const handleSend = async (overrideText?: string, overrideImages?: string[]) => {
    // Check session
    if (!session) {
        setShowAuthModal(true);
        return;
    }

    const currentSubject = activeSubjectRef.current;
    const currentSessionId = activeSessionIdRef.current;
    const currentMode = activeModeRef.current;
    const currentSessionsList = sessionsRef.current;
    const currentLoading = loadingSubjectsRef.current;

    const textToSend = overrideText || inputValue;
    
    // Only block if no text AND no images AND no override images
    if ((!textToSend.trim() && selectedImages.length === 0 && (!overrideImages || overrideImages.length === 0)) || !currentSubject || !currentSessionId) return;
    
    if (currentLoading[currentSubject.id]) return;

    if (isListening) { 
        voskService.stop();
        setIsListening(false); 
    }

    const currentSubId = currentSubject.id;
    const currentImgs = overrideImages || [...selectedImages];
    const sessId = currentSessionId;

    // Check Limits if images are involved
    if (currentImgs.length > 0 && !checkImageLimit(currentImgs.length)) {
        return;
    }

    // Capture reply context
    const replyContext = replyingTo;
    setReplyingTo(null); // Clear reply state

    const newUserMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: textToSend, 
        images: currentImgs, 
        timestamp: Date.now(),
        replyToId: replyContext?.id
    };

    setSessions(prev => prev.map(s => {
        if (s.id === sessId) {
            // NOTE: We no longer rename the session based on first message
            // Title is set in createNewSession to [Subject] #[N]
            return { ...s, messages: [...s.messages, newUserMsg], lastModified: Date.now(), preview: textToSend.substring(0, 50), role: userRole || undefined };
        }
        return s;
    }));

    setInputValue(''); setSelectedImages([]); if(fileInputRef.current) fileInputRef.current.value = '';
    setLoadingSubjects(prev => ({ ...prev, [currentSubId]: true }));

    // Prepare Prompt with Reply Context
    let finalPrompt = textToSend;
    if (replyContext) {
        const snippet = replyContext.text.substring(0, 300) + (replyContext.text.length > 300 ? '...' : '');
        const roleName = replyContext.role === 'user' ? 'User' : 'Assistant';
        finalPrompt = `[Replying to ${roleName}'s message: "${snippet}"]\n\n${textToSend}`;
    }

    if (userSettings.responseLength === 'concise') finalPrompt += " (Short answer)"; else finalPrompt += " (Detailed answer)";
    if (userSettings.creativity === 'strict') finalPrompt += " (Strict)"; else if (userSettings.creativity === 'creative') finalPrompt += " (Creative)";
    
    try {
      const sessionMessages = currentSessionsList.find(s => s.id === sessId)?.messages || [];
      const historyForAI = [...sessionMessages, newUserMsg];

      // Model selection logic with Lock check
      let preferredModel = userSettings.preferredModel;
      
      // If Auto is selected but Plan is free, fallback to Flash immediately
      if (preferredModel === 'auto' && userPlan === 'free') {
        preferredModel = 'gemini-2.5-flash';
      }
      // If Pro is strictly selected but user is free, fallback to Flash
      if (preferredModel === 'gemini-3-pro-preview' && userPlan === 'free') {
        preferredModel = 'gemini-2.5-flash';
      }

      const response = await generateResponse(currentSubId, currentMode, finalPrompt, currentImgs, historyForAI, preferredModel);
      
      // Increment limit if user sent images
      if (currentImgs.length > 0) {
          incrementImageCount(currentImgs.length);
      }

      setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'model', text: response.text, isError: response.isError, type: response.type as Message['type'], 
        slidesData: response.slidesData, testData: response.testData, chartData: response.chartData, geometryData: response.geometryData, images: response.images || [], timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, messages: [...s.messages, newAiMsg], lastModified: Date.now(), preview: response.text.substring(0, 50) } : s));

      if (activeSubjectRef.current?.id !== currentSubId) {
         setUnreadSubjects(prev => new Set(prev).add(currentSubId));
         if (userSettings.notifications) { 
             setNotification({ message: `Нов отговор: ${SUBJECTS.find(s => s.id === currentSubId)?.name}`, subjectId: currentSubId }); 
             setTimeout(() => setNotification(null), 4000); 
         }
      } else if (userSettings.notifications && userSettings.sound) {
         new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(()=>{});
      }
      return response.text;
    } catch (error) {
       console.error("HandleSend Error:", error);
       setLoadingSubjects(prev => ({ ...prev, [currentSubId]: false }));
       const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "Възникна грешка. Моля опитайте отново.", isError: true, timestamp: Date.now() };
       setSessions(prev => prev.map(s => s.id === sessId ? { ...s, messages: [...s.messages, errorMsg] } : s));
       return "Възникна грешка.";
    }
  };

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session) {
        setShowAuthModal(true);
        e.target.value = '';
        return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check limits before processing
      if (!checkImageLimit(files.length)) {
          e.target.value = '';
          return;
      }
      
      setIsImageProcessing(true);
      try {
        const processedImages = await Promise.all(
          Array.from(files).map(file => resizeImage(file as File))
        );
        setSelectedImages(prev => [...prev, ...processedImages]);
      } catch (err) {
        console.error("Image processing error", err);
        addToast("Грешка при обработката на изображението.", "error");
      } finally {
        setIsImageProcessing(false);
      }
      e.target.value = '';
    }
  };

  // Background Image Upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Resize to prevent massive base64 strings
        const resized = await resizeImage(file);
        setUserSettings(prev => ({ ...prev, customBackground: resized }));
      } catch (err) {
        console.error("Background processing error", err);
        addToast("Грешка при обработката на фона.", "error");
      }
    }
    e.target.value = '';
  };

  const onHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeInputValue.trim()) return;
    setPendingHomeMessage(homeInputValue);
    setHomeInputValue('');
    handleSubjectChange(SUBJECTS.find(s => s.id === SubjectId.GENERAL)!);
  };

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }); };
  const handleDeleteMessage = (mId: string) => activeSessionId && setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.id !== mId) } : s));
  
  const handleShare = async (text: string) => {
    if (navigator.share) {
        try {
            await navigator.share({ text });
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        handleCopy(text, 'share-fallback'); // Fallback to copy
        addToast('Текстът е копиран!', 'success');
    }
  };

  const deleteSession = (sId: string) => { 
    setConfirmModal({
      isOpen: true,
      title: 'Изтриване на чат',
      message: 'Сигурни ли сте, че искате да изтриете този чат? Това действие е необратимо.',
      onConfirm: () => {
        const nextSessions = sessionsRef.current.filter(s => s.id !== sId);
        setSessions(nextSessions); 
        if(sId === activeSessionIdRef.current) {
          const nextInSubject = nextSessions.find(s => s.subjectId === activeSubjectRef.current?.id);
          if(nextInSubject) setActiveSessionId(nextInSubject.id);
          else if (activeSubjectRef.current) {
               // Instead of immediately creating new session, we let the dashboard handle it or just clear
               setActiveSessionId(null);
               setShowSubjectDashboard(true);
          }
          else setActiveSessionId(null);
        }
        setConfirmModal(null);
        addToast('Чатът е изтрит', 'success');
      }
    });
  };

  const renameSession = (sId: string, title: string) => { setSessions(prev => prev.map(s => s.id === sId ? { ...s, title } : s)); setRenameSessionId(null); };
  
  const handleClearMemory = () => {
    setConfirmModal({
        isOpen: true,
        title: 'Изчистване на паметта',
        message: 'Сигурни ли сте? Това ще изтрие историята на текущия чат.',
        onConfirm: () => {
             if (activeSessionIdRef.current && activeSubjectRef.current) {
                setSessions(prev => prev.map(s => {
                   if (s.id === activeSessionIdRef.current) {
                     const greetingName = userSettings.userName ? `, ${userSettings.userName}` : '';
                     let welcomeText = "";
                     const subjectName = SUBJECTS.find(sub=>sub.id === s.subjectId)?.name;
                     if(s.subjectId === SubjectId.GENERAL) {
                         welcomeText = `Здравей${greetingName}! Аз съм uchebnik.ai. Попитай ме каквото и да е!`;
                     } else {
                         if(s.role === 'teacher') {
                             welcomeText = `Здравейте, колега! Аз съм Вашият AI асистент по **${subjectName}**. Как мога да Ви съдействам?`;
                         } else {
                             welcomeText = `Здравей${greetingName}! Аз съм твоят помощник по **${subjectName}**.`;
                         }
                     }
                     return { ...s, messages: [{ id: 'reset-'+Date.now(), role: 'model', text: welcomeText, timestamp: Date.now() }] };
                   }
                   return s;
                }));
                addToast('Паметта е изчистена', 'success');
              }
             setConfirmModal(null);
        }
    });
  };

  // Voice & TTS
  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); 
    if(audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }

    let hasEnded = false;
    const safeOnEnd = () => {
        if(hasEnded) return;
        hasEnded = true;
        if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
        utteranceRef.current = null;
        if(onEnd) onEnd();
    };

    const estimatedDuration = Math.max(3000, (text.length / 10) * 1000 + 2000); 
    speakingTimeoutRef.current = setTimeout(() => {
        console.warn("Speech synthesis timed out, forcing next turn.");
        safeOnEnd();
    }, estimatedDuration);

    const clean = text.replace(/[*#`_\[\]]/g, '').replace(/\$\$.*?\$\$/g, 'формула').replace(/http\S+/g, '');
    let lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    
    if ((!v && lang.startsWith('bg')) || !window.speechSynthesis) {
        const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(clean)}&tl=${lang.split('-')[0]}`);
        audioRef.current = a; 
        a.onended = safeOnEnd;
        a.onerror = (e) => { console.error("Audio error", e); safeOnEnd(); };
        a.play().catch((e) => { console.error("Audio play error", e); safeOnEnd(); });
    } else {
        const u = new SpeechSynthesisUtterance(clean); 
        u.lang = lang; 
        if(v) u.voice = v; 
        utteranceRef.current = u;
        u.onend = safeOnEnd;
        u.onerror = (e) => { console.error("Speech Synthesis Error", e); utteranceRef.current = null; safeOnEnd(); }
        window.speechSynthesis.speak(u);
    }
  };
  const handleSpeak = (txt: string, id: string) => { if(speakingMessageId === id) { window.speechSynthesis.cancel(); if(audioRef.current) audioRef.current.pause(); setSpeakingMessageId(null); return; } setSpeakingMessageId(id); speakText(txt, () => setSpeakingMessageId(null)); };

  const startVoiceCall = () => { 
    if (!session) {
        setShowAuthModal(true);
        return;
    }
    setIsVoiceCallActive(true); 
    // Effect will handle the rest
  };
  
  const endVoiceCall = () => { 
      setIsVoiceCallActive(false); 
      setVoiceCallStatus('idle'); 
      voiceCallRecognitionRef.current?.stop(); 
      window.speechSynthesis.cancel(); 
      utteranceRef.current = null;
      if(speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
  };

  const startVoiceRecognition = () => {
     if (voiceMutedRef.current) {
        setVoiceCallStatus('idle');
        voiceCallStatusRef.current = 'idle';
        return;
     }

     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if(!SR) { addToast('Гласовото разпознаване не се поддържа.', 'error'); endVoiceCall(); return; }
     
     try { voiceCallRecognitionRef.current?.stop(); } catch(e) {}

     const rec = new SR();
     rec.lang = activeSubjectRef.current?.id === SubjectId.ENGLISH ? 'en-US' : activeSubjectRef.current?.id === SubjectId.FRENCH ? 'fr-FR' : 'bg-BG';
     rec.continuous = false;
     rec.interimResults = false;
     
     rec.onstart = () => { 
         if(voiceMutedRef.current) { rec.stop(); return; }
         setVoiceCallStatus('listening');
         voiceCallStatusRef.current = 'listening';
     };
     
     rec.onresult = async (e: any) => {
        if(voiceMutedRef.current) return;

        const t = e.results[0][0].transcript;
        if(t.trim()) {
           setVoiceCallStatus('processing'); 
           voiceCallStatusRef.current = 'processing';
           
           // Removed Video Frame Capture

           // Send audio text
           const res = await handleSend(t);
           
           if(res) { 
               setVoiceCallStatus('speaking'); 
               voiceCallStatusRef.current = 'speaking';
               speakText(res, () => { 
                   if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } 
               }); 
           } else { 
               if(isVoiceCallActiveRef.current) { startVoiceRecognition(); } 
           }
        }
     };
     
     rec.onend = () => { 
         if(isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) {
             try { rec.start(); } catch(e){} 
         } 
     };
     rec.onerror = (e: any) => {
        if(e.error === 'no-speech' && isVoiceCallActiveRef.current && voiceCallStatusRef.current === 'listening' && !voiceMutedRef.current) {
            try { rec.start(); } catch(e){} 
        } else { console.log("Recognition error", e.error); }
     }

     voiceCallRecognitionRef.current = rec; 
     try { rec.start(); } catch(e) { console.error(e); }
  };

  const toggleListening = async () => {
    if (!session) {
        setShowAuthModal(true);
        return;
    }

    // Stop if currently listening
    if (isListening) {
        voskService.stop();
        setIsListening(false);
        return;
    }

    // Determine Language
    const lang: VoskLanguage = activeSubject?.id === SubjectId.ENGLISH ? 'en' :
                             activeSubject?.id === SubjectId.FRENCH ? 'fr' : 'bg';

    startingTextRef.current = inputValue; 

    // Start Native STT (Instant)
    await voskService.start(lang, {
        onModelLoading: () => {
             // Optional: can show small indicator if needed, but it's usually instant
             setIsModelLoading(false);
        },
        onModelLoaded: () => {
             setIsModelLoading(false);
             setIsListening(true);
             addToast("Говорете сега...", "success");
        },
        onPartial: (text) => {
             if (text) {
                // Combine stored starting text + partial
                const combined = `${startingTextRef.current} ${text}`;
                setInputValue(combined.replace(/\s+/g, ' ').trim());
             }
        },
        onResult: (text) => {
             if (text) {
                // Update starting text ref so next sentence appends correctly
                startingTextRef.current = `${startingTextRef.current} ${text}`;
                setInputValue(startingTextRef.current.replace(/\s+/g, ' ').trim());
             }
        },
        onError: (err) => {
             setIsModelLoading(false);
             setIsListening(false);
             addToast(err, "error");
        }
    });
  };

  const handleDownloadPPTX = (slides: Slide[]) => {
      const p = new pptxgen();
      p.defineSlideMaster({
          title: 'MASTER', background: { color: 'FFFFFF' },
          objects: [ {rect:{x:0,y:0,w:'100%',h:0.15,fill:{color:'4F46E5'}}}, {text: {text: "uchebnik.ai", options: {x: 0.5, y: '90%', fontSize: 10, color: 'D1D5DB'}}}, ],
          slideNumber: { x: '95%', y: '90%', fontSize: 10, color: '6B7280' }
      });
      const cover = p.addSlide({masterName:'MASTER'});
      cover.addText(SUBJECTS.find(s=>s.id === activeSubject?.id)?.name || "Презентация", {x:1, y:2, w:'80%', fontSize:44, bold:true, color:'111827', align:'center'});
      if(userSettings.userName) cover.addText(`Автор: ${userSettings.userName}`, {x:1, y:3.5, w:'80%', fontSize:18, color:'4B5563', align:'center'});
      slides.forEach(s => {
          const slide = p.addSlide({masterName:'MASTER'});
          slide.addText(s.title, {x:0.5, y:0.8, w:'90%', fontSize:28, bold:true, color:'1F2937', fontFace:'Arial'});
          slide.addText(s.content.map(t=>({text:t, options:{bullet:true, breakLine:true}})), {x:0.5, y:1.8, w:'90%', h:'60%', fontSize:18, color:'374151', fontFace:'Arial', lineSpacing:32});
          if(s.notes) slide.addNotes(s.notes);
      });
      p.writeFile({fileName: 'Presentation.pptx'});
  };

  const handleRate = (messageId: string, rating: 'up' | 'down') => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) { return { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, rating } : m) }; }
      return s;
    }));
  };

  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };
  
  const handleUnlockSubmit = () => {
    const key = unlockKeyInput.trim();
    if (isValidKey(key)) {
       const newPlan = targetPlan || 'pro';
       setUserPlan(newPlan);
       if (newPlan !== 'free') {
            setUserSettings(prev => ({ ...prev, preferredModel: 'gemini-3-pro-preview' }));
       }
       setShowUnlockModal(false);
       setUnlockKeyInput('');
       addToast(`Успешно активирахте план ${newPlan.toUpperCase()}!`, 'success');
    } else {
       addToast("Невалиден ключ.", 'error');
    }
  };

  const handleAdminLogin = () => {
    if (adminPasswordInput === "VS09091615!") {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setAdminPasswordInput('');
      addToast("Успешен вход в админ панела", 'success');
    } else {
      addToast("Грешна парола!", 'error');
    }
  };

  const generateKey = () => {
    const randomCore = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
    const checksum = generateChecksum(randomCore);
    const newKeyCode = `UCH-${randomCore}-${checksum}`;
    const newKeyObj: GeneratedKey = { code: newKeyCode, isUsed: false };
    const updatedKeys = [newKeyObj, ...generatedKeys];
    setGeneratedKeys(updatedKeys);
    localStorage.setItem('uchebnik_admin_keys', JSON.stringify(updatedKeys));
  };

  const renderLightbox = () => {
    if (!zoomedImage) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setZoomedImage(null)}>
        <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"><X size={24} /></button>
        <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
      </div>
    );
  };

  const renderAdminPanel = () => {
    // ... (rest of admin panel logic same as before)
    if (showAdminAuth) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative">
             <button onClick={() => setShowAdminAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500"><Shield size={32}/></div>
                <h2 className="text-xl font-bold">Админ Панел</h2>
             </div>
             <input 
               type="password" 
               value={adminPasswordInput}
               onChange={e => setAdminPasswordInput(e.target.value)}
               placeholder="Въведете парола"
               className="w-full bg-gray-100 dark:bg-black p-3 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold"
               autoFocus
             />
             <Button onClick={handleAdminLogin} className="w-full py-3">Вход</Button>
          </div>
        </div>
      );
    }

    if (showAdminPanel) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center pb-4 border-b border-indigo-500/10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500"/> Админ Панел</h2>
                <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Генерирай нов Premium ключ за достъп до Gemini 3.0 Pro.</p>
                <Button onClick={generateKey} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" icon={Key}>Генерирай Ключ</Button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/40 rounded-xl p-4 space-y-2 min-h-[200px]">
                {generatedKeys.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">Няма генерирани ключове</p>
                ) : (
                  generatedKeys.map((keyObj, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border animate-in slide-in-from-top-2 border-indigo-500/10`}>
                       <div className="flex flex-col">
                         <code className={`font-mono font-bold text-indigo-500`}>{keyObj.code}</code>
                         <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 text-emerald-500`}>
                            <CheckCircle size={10}/> Генериран
                         </span>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(keyObj.code); addToast('Копирано!', 'success'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Copy size={16}/></button>
                    </div>
                  ))
                )}
             </div>
             
             <Button variant="ghost" onClick={() => setShowAdminPanel(false)} className="w-full">Затвори</Button>
           </div>
        </div>
      );
    }

    return null;
  };

  const renderUpgradeModal = () => {
    // ... (rest of upgrade modal logic same as before)
    if (!showUnlockModal) return null;
    if (targetPlan) {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
                    <button onClick={() => {setTargetPlan(null); setShowUnlockModal(false);}} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                    <button onClick={() => setTargetPlan(null)} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"><ArrowLeft size={14}/> Назад</button>
                    <div className="flex flex-col items-center gap-4 text-center mt-4">
                        <div className={`p-4 rounded-2xl text-white shadow-xl ${targetPlan === 'plus' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'}`}>
                            {targetPlan === 'plus' ? <Zap size={32} fill="currentColor"/> : <Crown size={32} fill="currentColor"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Активирай {targetPlan === 'plus' ? 'Plus' : 'Pro'}</h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Въведете вашия код за достъп.</p>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={unlockKeyInput}
                        onChange={e => setUnlockKeyInput(e.target.value)}
                        placeholder="Въведете код"
                        className="w-full bg-gray-100 dark:bg-black p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider"
                        autoFocus
                    />
                    <Button onClick={handleUnlockSubmit} className={`w-full py-4 text-base shadow-lg border-none ${targetPlan === 'plus' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-orange-500/30'}`}>
                        Активирай
                    </Button>
                </div>
            </div>
        );
    }
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
        <div className="w-full max-w-5xl space-y-8 animate-in zoom-in-95 duration-300">
           <div className="flex justify-end">
             <button onClick={() => setShowUnlockModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24}/></button>
           </div>
           <div className="text-center space-y-4 mb-8">
               <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Избери своя план</h2>
               <p className="text-lg text-gray-400">Отключете пълния потенциал на uchebnik.ai</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-gray-200 dark:border-white/5 flex flex-col relative overflow-hidden">
                 <div className="mb-6">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free Plan</div>
                    <div className="text-3xl font-black">Безплатен</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> 4 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Стандартна скорост</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Basic AI (Gemini 2.5)</div>
                 </div>
                 <button disabled={true} className="w-full py-3 rounded-xl font-bold bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default">
                    {userPlan === 'free' ? 'Текущ план' : 'Стандартен'}
                 </button>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-500/10 scale-105 z-10">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={16}/> Plus Plan</div>
                    <div className="text-3xl font-black">Plus</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> 12 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> По-бърза скорост</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> Smarter AI (Gemini 3.0 Pro)</div>
                 </div>
                 <button 
                    onClick={() => { if(userPlan !== 'plus') setTargetPlan('plus'); }} 
                    disabled={userPlan === 'plus'}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${userPlan === 'plus' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'}`}
                 >
                    {userPlan === 'plus' ? 'Текущ план' : 'Избери Plus'}
                 </button>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-amber-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-amber-500/10">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={16}/> Pro Plan</div>
                    <div className="text-3xl font-black">Pro</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Неограничени изображения</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Най-бърза скорост</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Pro-level AI (Gemini 3.0 Pro)</div>
                 </div>
                 <button 
                    onClick={() => { if(userPlan !== 'pro') setTargetPlan('pro'); }}
                    disabled={userPlan === 'pro'} 
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${userPlan === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-orange-500/25'}`}
                 >
                    {userPlan === 'pro' ? 'Текущ план' : 'Избери Pro'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderProfileModal = () => null;

  const renderSidebar = () => {
      // ... (rest of sidebar code same as before)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    return (
      <>
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-[320px] 
          ${userSettings.customBackground ? 'bg-white/30 dark:bg-black/40 backdrop-blur-2xl border-white/10' : 'bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-white/5'}
          border-r transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
          <div className="p-6 pb-2">
            <button onClick={() => { setActiveSubject(null); setHomeView('landing'); setUserRole(null); if(isMobile) setSidebarOpen(false); }} className="flex items-center gap-3 w-full group mb-8">
               <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles size={20} fill="currentColor" />
               </div>
               <div className="text-left">
                  <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight font-display">uchebnik.ai</h1>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-500' : 'text-gray-500'}`}>
                    {userPlan === 'pro' ? 'PRO PLAN' : userPlan === 'plus' ? 'PLUS PLAN' : 'FREE PLAN'}
                  </p>
               </div>
            </button>
            <div className="space-y-1">
              <button onClick={() => { handleSubjectChange(SUBJECTS[0]); setHomeView('landing'); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group border ${activeSubject?.id === SubjectId.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'glass-button border-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/30'}`}>
                   <div className={`p-1.5 rounded-lg ${activeSubject?.id === SubjectId.GENERAL ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'}`}><MessageSquare size={18} /></div>
                   <span className="font-bold text-sm">Общ Чат</span>
                   {unreadSubjects.has(SubjectId.GENERAL) && <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
              
              {/* General Chat Sessions List */}
              {activeSubject?.id === SubjectId.GENERAL && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-indigo-500/20 pl-2 animate-in slide-in-from-top-2">
                     {sessions.filter(s => s.subjectId === SubjectId.GENERAL).map(s => (
                         <div key={s.id} className="flex items-center group/session">
                            <button 
                                onClick={() => { setActiveSessionId(s.id); if(isMobile) setSidebarOpen(false); }}
                                className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === s.id ? 'bg-indigo-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                {s.title}
                            </button>
                            <button onClick={() => deleteSession(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                         </div>
                     ))}
                     <button onClick={() => { createNewSession(SubjectId.GENERAL); if(isMobile) setSidebarOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                        <Plus size={12}/> Нов чат
                     </button>
                  </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
             {/* School Folder */}
             <div className="mt-2">
                 <button onClick={() => setSchoolFolderOpen(!schoolFolderOpen)} className="w-full flex items-center justify-between px-2 py-3 text-gray-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors">
                     <div className="flex items-center gap-2">
                         <School size={16} />
                         <span className="text-xs font-bold uppercase tracking-widest">Училище</span>
                     </div>
                     <ChevronDown size={14} className={`transition-transform duration-300 ${schoolFolderOpen ? 'rotate-180' : ''}`}/>
                 </button>
                 
                 {schoolFolderOpen && (
                     <div className="pl-4 space-y-1 animate-in slide-in-from-top-2">
                         
                         {/* Students Subfolder */}
                         <div className="border-l border-indigo-500/10 pl-2">
                             <button onClick={() => setStudentsFolderOpen(!studentsFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={14} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Ученици</span>
                                </div>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${studentsFolderOpen ? 'rotate-180' : ''}`}/>
                             </button>
                             
                             {studentsFolderOpen && (
                                 <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                     {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                         <div key={`student-${s.id}`}>
                                            <button 
                                                onClick={() => { handleSubjectChange(s, 'student'); if(isMobile) setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'student' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                <span className="truncate">{s.name}</span>
                                            </button>
                                            
                                            {/* Sessions List for this Subject (Student Role) */}
                                            {activeSubject?.id === s.id && userRole === 'student' && (
                                                <div className="ml-4 pl-2 border-l border-indigo-500/20 space-y-0.5 my-1">
                                                    {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'student').map(sess => (
                                                        <div key={sess.id} className="flex items-center group/session">
                                                            <button 
                                                                onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                            >
                                                                {sess.title}
                                                            </button>
                                                            <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { createNewSession(s.id, 'student', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                        <Plus size={10}/> Нов чат
                                                    </button>
                                                </div>
                                            )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         {/* Teachers Subfolder */}
                         <div className="border-l border-indigo-500/10 pl-2 mt-2">
                             <button onClick={() => setTeachersFolderOpen(!teachersFolderOpen)} className="w-full flex items-center justify-between px-2 py-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Учители</span>
                                </div>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${teachersFolderOpen ? 'rotate-180' : ''}`}/>
                             </button>
                             
                             {teachersFolderOpen && (
                                 <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1">
                                     {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map(s => (
                                         <div key={`teacher-${s.id}`}>
                                            <button 
                                                onClick={() => { handleSubjectChange(s, 'teacher'); if(isMobile) setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${activeSubject?.id === s.id && userRole === 'teacher' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                                <span className="truncate">{s.name}</span>
                                            </button>

                                            {/* Sessions List for this Subject (Teacher Role) */}
                                            {activeSubject?.id === s.id && userRole === 'teacher' && (
                                                <div className="ml-4 pl-2 border-l border-indigo-500/20 space-y-0.5 my-1">
                                                    {sessions.filter(sess => sess.subjectId === s.id && sess.role === 'teacher').map(sess => (
                                                        <div key={sess.id} className="flex items-center group/session">
                                                            <button 
                                                                onClick={() => { setActiveSessionId(sess.id); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }}
                                                                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${activeSessionId === sess.id ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                            >
                                                                {sess.title}
                                                            </button>
                                                            <button onClick={() => deleteSession(sess.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { createNewSession(s.id, 'teacher', activeMode); if(isMobile) setSidebarOpen(false); setShowSubjectDashboard(false); }} className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                        <Plus size={10}/> Нов чат
                                                    </button>
                                                </div>
                                            )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                     </div>
                 )}
             </div>

          </div>

          <div className={`p-4 border-t ${userSettings.customBackground ? 'border-white/10 bg-black/10' : 'border-gray-100 dark:border-white/5 bg-white/30 dark:bg-black/20'} space-y-3 backdrop-blur-md flex flex-col justify-center`}>
            {/* ... Rest of sidebar footer (profile) */}
             {userPlan !== 'pro' && (
               <button onClick={() => setShowUnlockModal(true)} className="w-full mb-1 group relative overflow-hidden rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-gradient-xy" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="relative z-10 flex items-center justify-between text-white">
                     <div>
                        <h3 className="font-black text-lg tracking-tight">Upgrade Plan</h3>
                        <p className="text-xs font-medium text-indigo-100 opacity-90">Отключи пълния потенциал</p>
                     </div>
                     <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <ArrowRight size={16} />
                     </div>
                  </div>
               </button>
             )}
             
             {session ? (
                 <div className="relative mb-1">
                    {profileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in z-40">
                                 <button onClick={() => {setShowSettings(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <Settings size={16} className="text-gray-500"/> Настройки
                                 </button>
                                 <button onClick={() => {setShowUnlockModal(true); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <CreditCard size={16} className="text-gray-500"/> Управление на плана
                                 </button>
                                  <button onClick={() => {addToast('Свържете се с нас в Discord за помощ.', 'info'); setProfileMenuOpen(false)}} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <HelpCircle size={16} className="text-gray-500"/> Помощ
                                 </button>
                                 <div className="h-px bg-gray-100 dark:bg-white/5 mx-2" />
                                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-sm font-medium flex items-center gap-3 transition-colors">
                                    <LogOut size={16}/> Изход
                                 </button>
                            </div>
                        </>
                    )}
                    
                    <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-indigo-500/10 group">
                         <img 
                           src={userMeta.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} 
                           alt="Profile" 
                           className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10"
                         />
                         <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">
                                {userMeta.firstName && userMeta.lastName 
                                    ? `${userMeta.firstName} ${userMeta.lastName}`
                                    : (userSettings.userName || 'Потребител')}
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${userPlan === 'pro' ? 'text-amber-500' : userPlan === 'plus' ? 'text-indigo-500' : 'text-gray-500'}`}>
                                {userPlan === 'pro' ? 'Pro Plan' : userPlan === 'plus' ? 'Plus Plan' : 'Free Plan'}
                            </div>
                         </div>
                         <ChevronUp size={16} className={`text-gray-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                 </div>
             ) : (
                 <button onClick={() => setShowAuthModal(true)} className="w-full mb-1 flex items-center gap-3 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                     <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20"><User size={20}/></div>
                     <div className="text-left">
                         <div className="text-sm">Вход</div>
                         <div className="text-[10px] opacity-80">Запази прогреса си</div>
                     </div>
                 </button>
             )}

             <a href="https://discord.gg/4SB2NGPq8h" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95 group">
                <svg width="20" height="20" viewBox="0 0 127 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.07 72.07 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.15 105.15 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96a75.2 75.2 0 0 0 6.57-12.8 69.1 69.1 0 0 1-10.46-5.01c.96-.71 1.9-1.44 2.81-2.19 26.25 12.31 54.54 12.31 80.8 0 .91.75 1.85 1.48 2.81 2.19a69.1 69.1 0 0 1-10.47 5.01 75.2 75.2 0 0 0 6.57 12.8A105.73 105.73 0 0 0 126.6 80.22c2.96-23.97-2.1-47.57-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60.08 31 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Zm42.2 0C78.38 65.69 73.2 60.08 73.2 60.08 73.2 53.23c0-6.85 5.1-12.46 11.45-12.46 6.42 0 11.53 5.61 11.45 12.46 0 6.85-5.03 12.46-11.45 12.46Z" fill="currentColor"/></svg>
                Влез в Discord
             </a>
          </div>
        </aside>
      </>
    );
  };

  const renderSubjectDashboard = () => {
    // ... (rest of dashboard logic)
    if (!activeSubject) return null;
      
    const isStudent = userRole === 'student';
    
    return (
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center relative overflow-x-hidden ${userSettings.customBackground ? 'bg-transparent' : 'bg-white dark:bg-zinc-950'}`}>
         <button onClick={() => { setActiveSubject(null); setHomeView('school_select'); }} className="absolute top-6 left-6 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors z-20"><ArrowLeft size={24}/></button>

         <div className="max-w-3xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className={`w-24 h-24 mx-auto rounded-[32px] ${activeSubject.color} flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 rotate-3`}>
                 <DynamicIcon name={activeSubject.icon} className="w-12 h-12" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white font-display tracking-tight">{activeSubject.name}</h1>
             <p className="text-xl text-gray-500 dark:text-gray-400">{isStudent ? 'Какво ще правим днес?' : 'Инструменти за учителя'}</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                 {isStudent ? (
                     <>
                         <button onClick={() => handleStartMode(AppMode.SOLVE)} className="group p-6 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <Zap size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">За решаване</h3>
                             <p className="text-gray-500 font-medium">Помощ със задачи и упражнения.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.LEARN)} className="group p-6 bg-white dark:bg-zinc-900 border border-emerald-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-emerald-500/30">
                             <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                 <Book size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">За учене</h3>
                             <p className="text-gray-500 font-medium">Обяснения на уроци и концепции.</p>
                         </button>
                     </>
                 ) : (
                     <>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_TEST)} className="group p-6 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-indigo-500/30">
                             <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <CheckCircle size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">Създай Тест</h3>
                             <p className="text-gray-500 font-medium">Генерирай въпроси и отговори за проверка.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_PLAN)} className="group p-6 bg-white dark:bg-zinc-900 border border-amber-500/10 rounded-3xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:border-amber-500/30">
                             <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl w-fit mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                 <FileJson size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">План на урок</h3>
                             <p className="text-gray-500 font-medium">Структурирай урока и целите.</p>
                         </button>
                         <button onClick={() => handleStartMode(AppMode.TEACHER_RESOURCES)} className="col-span-full group p-6 bg-white dark:bg-zinc-900 border border-pink-500/10 rounded-3xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl hover:shadow-2xl hover:border-pink-500/30">
                             <div className="p-3 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-2xl w-fit mb-4 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                 <LightbulbIcon size={24}/>
                             </div>
                             <h3 className="text-2xl font-bold mb-2">Идеи и Ресурси</h3>
                             <p className="text-gray-500 font-medium">Интерактивни задачи и материали.</p>
                         </button>
                     </>
                 )}
             </div>
         </div>
      </div>
    );
  };

  // ... (rest of render functions same as before)
  
  // Helpers for rendering Lightbulb icon which wasn't imported from lucide directly in main list
  const LightbulbIcon = ({size}: {size: number}) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
  );

  const renderWelcome = () => (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden ${userSettings.customBackground ? 'bg-transparent' : 'bg-white dark:bg-zinc-950'}`}>
      {!userSettings.customBackground && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/20 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none"></div>}
      
      {homeView === 'landing' && (
        <div className="max-w-5xl w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10 animate-in fade-in zoom-in-95 duration-700">
          
          <button onClick={() => setShowAdminAuth(true)} className="absolute top-0 right-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors">
              <Shield size={16} />
          </button>

          <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6 px-2">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-indigo-500/20 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 md:mb-6 backdrop-blur-xl shadow-lg">
                <Sparkles size={12} className="text-indigo-500" />
                <span>AI Учебен Асистент 2.0</span>
             </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 tracking-tighter leading-[1.1] md:leading-[1] font-display">
              Здравей{userMeta.firstName ? `, ${userMeta.firstName}` : ''}.
            </h1>
            <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed px-4">Твоят интелигентен помощник за училище. Какво ще учим днес?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full px-4 md:px-12 max-w-4xl">
            {/* General Chat */}
            <button onClick={() => handleSubjectChange(SUBJECTS[0])} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-zinc-900 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-accent-700 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out overflow-hidden ring-4 ring-transparent hover:ring-indigo-500/20">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-white/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md"><MessageSquare size={24} className="md:w-8 md:h-8" /></div>
                  <div><h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-3">Общ Чат</h3><p className="opacity-70 text-base md:text-lg font-medium">Попитай каквото и да е.</p></div>
                  <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm bg-white/20 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">Старт <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
               </div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-accent-500 blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            </button>

            {/* School Menu Entry */}
            <button onClick={() => setHomeView('school_select')} className="group relative h-64 md:h-80 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-left bg-white dark:bg-zinc-900 border border-indigo-500/10 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98]">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"><School size={24} className="md:w-8 md:h-8" /></div>
                  <div><h3 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2 md:mb-3">Училище</h3><p className="text-zinc-500 mt-1 md:mt-2 text-base md:text-lg font-medium">Ученици и Учители</p></div>
                  <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm text-zinc-600 dark:text-zinc-300 bg-gray-100 dark:bg-white/5 w-fit px-4 md:px-6 py-2 md:py-3 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">Влез <ArrowRight size={14} className="md:w-4 md:h-4" /></div>
               </div>
            </button>
          </div>

          <footer className="w-full py-8 text-center mt-auto opacity-60 hover:opacity-100 transition-opacity">
              <p className="text-xs font-medium text-gray-400">
                  Created by <a href="https://instagram.com/vanyo_idk" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">Vanyo</a> & <a href="https://instagram.com/svetlyo_idk" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">Svetlyo</a>
              </p>
          </footer>
        </div>
      )}

      {/* School Selection View */}
      {homeView === 'school_select' && (
        <div className="max-w-5xl w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-500">
             <button onClick={() => setHomeView('landing')} className="absolute top-0 left-4 md:left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold"><ArrowLeft size={20}/> Назад</button>
             <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-12 tracking-tight">Избери Роля</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 md:px-12">
                 {/* Student */}
                 <button onClick={() => { setHomeView('student_subjects'); setUserRole('student'); }} className="group relative h-72 rounded-[40px] p-8 text-left bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-white/20 rounded-3xl w-fit backdrop-blur-md"><GraduationCap size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2">Ученик</h3><p className="opacity-80 font-medium text-lg">Помощ с уроци и задачи.</p></div>
                     </div>
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]"/>
                 </button>

                 {/* Teacher */}
                 <button onClick={() => { setHomeView('teacher_subjects'); setUserRole('teacher'); }} className="group relative h-72 rounded-[40px] p-8 text-left bg-white dark:bg-zinc-900 border border-indigo-500/10 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="p-4 bg-gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-3xl w-fit"><Briefcase size={40}/></div>
                         <div><h3 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white">Учител</h3><p className="text-zinc-500 font-medium text-lg">Тестове, планове и ресурси.</p></div>
                     </div>
                 </button>
             </div>
        </div>
      )}

      {/* Subjects Grid (Shared for Student/Teacher) */}
      {(homeView === 'student_subjects' || homeView === 'teacher_subjects') && (
        <div className="max-w-7xl w-full py-8 md:py-12 px-4 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
           <button onClick={() => setHomeView('school_select')} className="mb-8 md:mb-10 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold group"><div className="p-3 bg-white dark:bg-zinc-900 rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div> Назад към роли</button>
           <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight px-2">{homeView === 'student_subjects' ? 'Ученик' : 'Учител'} • Предмети</h2>
           <p className="text-gray-500 px-2 mb-10 font-medium">Избери предмет, за да започнеш.</p>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
              {SUBJECTS.filter(s => s.id !== SubjectId.GENERAL).map((s, i) => (
                <button key={s.id} onClick={() => handleSubjectChange(s)} style={{animationDelay: `${i*50}ms`}} className="group flex flex-col items-center text-center p-6 md:p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[32px] border border-indigo-500/20 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 animate-in fade-in fill-mode-backwards">
                   <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl ${s.color} text-white flex items-center justify-center mb-4 md:mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}><DynamicIcon name={s.icon} className="w-8 h-8 md:w-10 md:h-10" /></div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl mb-2">{s.name}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">Натисни за старт</p>
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );

  const renderHistoryDrawer = () => {
      // ... (rest of history drawer logic)
    if (!historyDrawerOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setHistoryDrawerOpen(false)} />
        <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-indigo-500/20 backdrop-blur-3xl">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><History size={24} className="text-indigo-500"/> История</h2>
              <button onClick={() => setHistoryDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
           </div>
           
           <div className="space-y-4">
             {sessions.length === 0 && <p className="text-center text-gray-400 py-10">Няма запазени разговори.</p>}
             {sessions.map(s => (
               <div key={s.id} className={`group p-4 rounded-2xl border transition-all ${activeSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-white/5 border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/20'}`}>
                  {renameSessionId === s.id ? (
                    <div className="flex items-center gap-2">
                       <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} className="flex-1 bg-white dark:bg-black px-2 py-1 rounded border border-indigo-300 outline-none text-sm"/>
                       <button onClick={() => renameSession(s.id, renameValue)} className="p-1.5 text-green-600 bg-green-50 rounded-lg"><Check size={14}/></button>
                       <button onClick={() => setRenameSessionId(null)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><X size={14}/></button>
                    </div>
                  ) : (
                    <div onClick={() => { setActiveSessionId(s.id); setHistoryDrawerOpen(false); if(activeSubject?.id !== s.subjectId) { const sub = SUBJECTS.find(sub => sub.id === s.subjectId); if(sub) setActiveSubject(sub); } }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-sm truncate pr-2 text-zinc-800 dark:text-zinc-200">{s.title}</h3>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setRenameSessionId(s.id); setRenameValue(s.title); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Trash2 size={12}/></button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-2">{s.preview}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                         <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10`}>{SUBJECTS.find(sub => sub.id === s.subjectId)?.name}</span>
                         <span>{new Date(s.lastModified).toLocaleDateString()}</span>
                         {s.role && <span className={`px-2 py-0.5 rounded-full ${s.role === 'student' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>{s.role === 'student' ? 'Ученик' : 'Учител'}</span>}
                      </div>
                    </div>
                  )}
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  // ... (rest of voice call overlay)
  const renderVoiceCallOverlay = () => {
    if (!isVoiceCallActive) return null;
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden">
        
        {/* Controls Header */}
        <div className="absolute top-6 right-6 z-20">
           <button onClick={endVoiceCall} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"><X size={28}/></button>
        </div>
        
        {/* Main Visualizer */}
        <div className="relative mb-12 z-10">
           <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 backdrop-blur-sm border border-white/10 ${voiceCallStatus === 'listening' ? 'bg-indigo-600/80 shadow-[0_0_100px_rgba(79,70,229,0.6)] scale-110' : voiceCallStatus === 'speaking' ? 'bg-emerald-500/80 shadow-[0_0_100px_rgba(16,185,129,0.6)] scale-105' : 'bg-zinc-800/80'}`}>
               {voiceCallStatus === 'listening' ? <Mic size={64} className="text-white animate-pulse"/> : 
                voiceCallStatus === 'speaking' ? <Volume2 size={64} className="text-white animate-bounce"/> :
                <Loader2 size={64} className="text-white animate-spin"/>}
           </div>
           {voiceCallStatus === 'listening' && (
              <>
                 <div className="absolute inset-0 border border-white/30 rounded-full animate-ping"/>
                 <div className="absolute inset-0 border border-indigo-500/50 rounded-full animate-ping delay-300"/>
              </>
           )}
        </div>

        {/* Text Status */}
        <div className="z-10 text-center mb-16 space-y-2">
           <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
              {voiceCallStatus === 'listening' ? "Слушам те..." : 
               voiceCallStatus === 'processing' ? "Мисля..." : 
               voiceCallStatus === 'speaking' ? "Говоря..." : 
               voiceMuted ? "Заглушен" : "Свързване..."}
           </h2>
           <p className="text-white/60 text-lg font-medium tracking-wide">
              {activeSubject?.name} • Разговорен режим
           </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-6 z-10">
           <button onClick={() => setVoiceMuted(!voiceMuted)} className={`p-6 rounded-full transition-all backdrop-blur-md border border-white/10 ${voiceMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {voiceMuted ? <MicOff size={32}/> : <Mic size={32}/>}
           </button>
           
           <button onClick={endVoiceCall} className="p-6 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg shadow-red-600/40 transition-all hover:scale-105 border border-red-500">
              <PhoneOff size={32}/>
           </button>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className={`flex-1 flex flex-col relative h-full ${userSettings.customBackground ? 'bg-transparent' : 'bg-[#f9fafb] dark:bg-[#09090b]'}`}>
      <header className={`sticky top-0 lg:top-4 mx-0 lg:mx-8 z-30 h-16 lg:h-18 
        ${userSettings.customBackground ? 'bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/10' : 'bg-white/80 dark:bg-black/80 lg:bg-white/70 lg:dark:bg-black/60 backdrop-blur-xl border-white/20 dark:border-white/10'} 
        border-b lg:border lg:shadow-sm lg:rounded-3xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 pt-safe`}>
         <div className="flex items-center gap-3 lg:gap-5 overflow-hidden flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 shrink-0"><Menu size={24}/></button>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${activeSubject?.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}><DynamicIcon name={activeSubject?.icon || 'Book'} className="w-5 h-5 lg:w-6 lg:h-6"/></div>
            <div className="overflow-hidden min-w-0 flex-1">
               <h2 className="font-bold text-zinc-900 dark:text-white leading-none text-base lg:text-lg tracking-tight truncate pr-2">{activeSubject?.name}</h2>
               {activeSubject?.id === SubjectId.GENERAL ? (
                   <div className="text-xs text-gray-500 font-medium mt-1">Chat Assistant</div>
               ) : (
                   <div className="text-xs text-gray-500 font-medium mt-1 flex gap-2">
                       {userRole === 'student' ? 'Ученик' : 'Учител'} • 
                       {activeMode === AppMode.SOLVE ? ' Решаване' : 
                        activeMode === AppMode.LEARN ? ' Учене' : 
                        activeMode === AppMode.TEACHER_TEST ? ' Тест' : 
                        activeMode === AppMode.TEACHER_PLAN ? ' План' : ' Чат'}
                   </div>
               )}
            </div>
         </div>
         <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-2">
             <Button variant="secondary" onClick={startVoiceCall} className="w-10 h-10 lg:w-12 lg:h-12 p-0 rounded-full border-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30" icon={Phone} />
             <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
             <Button variant="primary" onClick={() => activeSubject && createNewSession(activeSubject.id, userRole || undefined, activeMode)} className="h-9 lg:h-10 px-3 lg:px-4 text-xs lg:text-sm rounded-xl shadow-none"><Plus size={16} className="lg:w-[18px] lg:h-[18px]"/><span className="hidden sm:inline">Нов</span></Button>
             <Button variant="ghost" onClick={() => setHistoryDrawerOpen(true)} className="w-9 h-9 lg:w-10 lg:h-10 p-0 rounded-full" icon={History} />
         </div>
      </header>

      {/* Overlays */}
      {renderHistoryDrawer()}
      {renderVoiceCallOverlay()}

      <div className={`flex-1 overflow-y-auto px-2 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth ${userSettings.textSize === 'large' ? 'text-lg' : userSettings.textSize === 'small' ? 'text-sm' : 'text-base'}`}>
         <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-40 pt-2 lg:pt-4">
            {currentMessages.map((msg) => (
               <div key={msg.id} id={msg.id} className={`group flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-700 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`relative group px-5 py-4 lg:px-8 lg:py-6 max-w-[90%] md:max-w-[85%] lg:max-w-[75%] backdrop-blur-md shadow-sm break-words overflow-hidden min-w-0 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-accent-600 text-white rounded-[24px] lg:rounded-[32px] rounded-br-none shadow-xl shadow-indigo-500/20' : 'glass-panel text-zinc-800 dark:text-zinc-200 rounded-[24px] lg:rounded-[32px] rounded-bl-none border-indigo-500/20'}`}>
                     
                     {/* Quote Block for Replies */}
                     {msg.replyToId && (() => {
                        const rMsg = currentMessages.find(m => m.id === msg.replyToId);
                        if (rMsg) return (
                           <div className="mb-3 pl-3 border-l-2 border-current/30 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => document.getElementById(rMsg.id)?.scrollIntoView({behavior:'smooth', block:'center'})}>
                              <div className="font-bold mb-0.5">{rMsg.role === 'user' ? 'Ти' : 'uchebnik.ai'}</div>
                              <div className="truncate italic">{rMsg.text ? rMsg.text.substring(0, 100) : (rMsg.images?.length ? '[Изображение]' : '')}</div>
                           </div>
                        )
                     })()}

                     {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x">
                            {msg.images.map((img, i) => ( img && typeof img === 'string' ? ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-40 lg:h-56 rounded-2xl object-cover border border-white/20 snap-center shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"/> ) : null ))}
                        </div>
                     )}
                     
                     {msg.type === 'slides' && msg.slidesData && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-4 border-b border-indigo-500/20"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-500"/> Генерирана Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-lg shadow-emerald-500/20"><Download size={14}/> Изтегли PPTX</button></div>
                           <div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-white/40 dark:bg-black/40 p-5 rounded-2xl border border-indigo-500/10"><h4 className="font-bold mb-3 text-base text-indigo-600 dark:text-indigo-400">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div>
                        </div>
                     )}

                     {msg.type === 'test_generated' && msg.testData && (
                        <TestRenderer data={msg.testData} />
                     )}

                     {msg.text && <div className="markdown-content w-full break-words overflow-hidden"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>{msg.text}</ReactMarkdown></div>}
                     {msg.chartData && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && <GeometryRenderer data={msg.geometryData} />}
                     
                     <div className={`text-[10px] mt-2 lg:mt-4 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-60`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        {msg.role === 'user' && <Check size={12} />}
                     </div>
                  </div>

                  <div className={`flex gap-1 px-4 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     {/* Action Buttons */}
                     <div className="flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-indigo-500/20 rounded-full p-1.5 shadow-sm mt-1">
                        {msg.role === 'model' && (
                           <>
                             <button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp size={14} className="lg:w-4 lg:h-4"/></button>
                             <button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown size={14} className="lg:w-4 lg:h-4"/></button>
                             <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 self-center"/>
                           </>
                        )}
                        <button onClick={() => handleReply(msg)} className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Отговор"><Reply size={14} className="lg:w-4 lg:h-4"/></button>
                        <button onClick={() => handleSpeak(msg.text, msg.id)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${speakingMessageId === msg.id ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`}>{speakingMessageId === msg.id ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleShare(msg.text)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Share2 size={14} className="lg:w-4 lg:h-4"/></button>
                     </div>
                  </div>
               </div>
            ))}
            
            {loadingSubjects[activeSubject.id] && (
               <div className="flex gap-4 pl-4 animate-in fade-in duration-500">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white dark:bg-zinc-900 border border-indigo-500/20 flex items-center justify-center shadow-sm"><Sparkles size={18} className="text-indigo-500 animate-pulse-slow"/></div>
                  <div className="bg-white/50 dark:bg-white/5 px-6 py-4 rounded-[24px] lg:rounded-[32px] rounded-bl-sm border border-indigo-500/20 flex items-center gap-2 backdrop-blur-md">
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"/>
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-100"/>
                     <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200"/>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-6 lg:h-10"/>
         </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-2 lg:px-4 pointer-events-none z-40 flex justify-center pb-safe">
         <div className="w-full max-w-3xl pointer-events-auto mb-4 lg:mb-6">
            
            {/* Reply Banner */}
            {replyingTo && (
               <div className="mb-2 mx-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 fade-in">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Reply size={16}/>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Отговор на {replyingTo.role === 'user' ? 'теб' : 'uchebnik.ai'}</span>
                        <span className="text-sm font-medium truncate text-zinc-800 dark:text-zinc-200">{replyingTo.text || "Изображение"}</span>
                     </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                     <X size={16}/>
                  </button>
               </div>
            )}

            <div className={`relative 
               ${userSettings.customBackground ? 'bg-white/50 dark:bg-black/50 border-white/20' : 'bg-white/80 dark:bg-zinc-900/80 border-white/10'}
               backdrop-blur-xl border shadow-2xl rounded-[28px] transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white dark:focus-within:bg-black p-2 flex items-end gap-2 ${activeSubject && loadingSubjects[activeSubject.id] ? 'opacity-70 pointer-events-none' : ''}`}>
               
               {/* Attach Button */}
               <button onClick={() => fileInputRef.current?.click()} disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors">
                  <ImageIcon size={20} strokeWidth={2}/>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />

               {/* Voice Button - Updated with Loading State */}
               <button onClick={toggleListening} disabled={(activeSubject ? loadingSubjects[activeSubject.id] : false) || isModelLoading} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>
                  {isModelLoading ? <Loader2 size={20} className="animate-spin text-indigo-500"/> : isListening ? <MicOff size={20}/> : <Mic size={20} strokeWidth={2}/>}
               </button>

               {/* Textarea */}
               <div className="flex-1 py-2">
                   <textarea 
                      value={inputValue}
                      onChange={e => {
                          setInputValue(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                      }}
                      onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !(activeSubject && loadingSubjects[activeSubject.id])){e.preventDefault(); handleSend();}}} 
                      placeholder={isListening ? "Слушам..." : replyingTo ? "Напиши отговор..." : "Напиши съобщение..."}
                      disabled={activeSubject ? loadingSubjects[activeSubject.id] : false}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-900 dark:text-zinc-100 placeholder-gray-400 resize-none max-h-32 min-h-[24px] leading-6"
                      rows={1}
                      style={{ height: '24px' }}
                   />
               </div>

               {/* Send Button */}
               <button onClick={() => handleSend()} disabled={(!inputValue.trim() && !selectedImages.length) || (activeSubject && loadingSubjects[activeSubject.id])} className="flex-none w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                  <ArrowUpRight size={22} strokeWidth={2.5} />
               </button>

               {/* Image Preview Overlay */}
               {selectedImages.length > 0 && (
                   <div className="absolute bottom-full left-0 mb-2 ml-2 flex gap-2">
                      {selectedImages.map((img, i) => ( 
                          <div key={i} className="relative group shrink-0 animate-in zoom-in-95">
                              <img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg"/>
                              <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                          </div>
                      ))}
                   </div>
               )}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium opacity-60">AI може да допуска грешки.</p>
         </div>
      </div>
    </div>
  );

  // ... (rest of returns same as before)
  if (authLoading) {
    return (
       <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
       </div>
    );
  }

  // Helpers for Settings
  const isPremium = userPlan === 'plus' || userPlan === 'pro';

  return (
    <div className="flex h-full w-full relative overflow-hidden text-foreground">
      {/* Background Image Layer */}
      {userSettings.customBackground && (
         <div 
           className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500"
           style={{ backgroundImage: `url(${userSettings.customBackground})` }}
         />
      )}
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => { if(e.target === e.currentTarget) setShowAuthModal(false) }}>
           <div className="relative w-full max-w-md">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20}/></button>
              <Auth isModal={true} onSuccess={() => setShowAuthModal(false)} />
           </div>
        </div>
      )}

      {renderSidebar()}
      
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden transition-all duration-300">
        {renderAdminPanel()}
        {renderUpgradeModal()}
        {renderProfileModal()}
        {renderLightbox()}
        
        {confirmModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-indigo-500/20 animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
                <p className="text-gray-500 mb-6">{confirmModal.message}</p>
                <div className="flex justify-end gap-3">
                   <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">Отказ</button>
                   <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors">Потвърди</button>
                </div>
             </div>
          </div>
        )}

        {/* Dynamic View Rendering */}
        {!activeSubject ? renderWelcome() : showSubjectDashboard ? renderSubjectDashboard() : renderChat()}
      </main>

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right fade-in duration-300 ${t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : t.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-white/80 dark:bg-zinc-800/80 border-indigo-500/20 text-zinc-800 dark:text-zinc-200'}`}>
             {t.type === 'error' ? <AlertCircle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : <Info size={18}/>}
             <span className="font-medium text-sm">{t.message}</span>
          </div>
        ))}
      </div>
      
      {showSettings && (
  <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-white/90 dark:bg-zinc-900/90 w-full max-w-2xl h-[85vh] rounded-[32px] border border-white/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 backdrop-blur-xl ring-1 ring-black/5">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
         <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-800 dark:text-white font-display">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Settings size={24}/></div>
                Настройки
            </h2>
            <p className="text-sm text-gray-500 font-medium ml-1">Управлявай своя профил и предпочитания</p>
         </div>
         <button onClick={() => setShowSettings(false)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-zinc-900 dark:hover:text-white"><X size={24}/></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
          
          {/* Account */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <User size={18} className="text-indigo-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Профил</h3>
             </div>
             
             <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-colors">
                            <img src={editProfile.avatar || "https://cdn-icons-png.freepik.com/256/3276/3276580.png"} className="w-full h-full rounded-full object-cover bg-gray-100"/>
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={20} className="text-white"/>
                        </div>
                    </div>
                    <button onClick={() => avatarInputRef.current?.click()} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">Промени снимка</button>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </div>

                {/* Fields */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Име</label>
                        <input value={editProfile.firstName} onChange={e => setEditProfile({...editProfile, firstName: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 transition-all font-medium"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Фамилия</label>
                        <input value={editProfile.lastName} onChange={e => setEditProfile({...editProfile, lastName: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 transition-all font-medium"/>
                    </div>
                    <div className="col-span-full space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Имейл</label>
                        <input value={editProfile.email} onChange={e => setEditProfile({...editProfile, email: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 transition-all font-medium"/>
                    </div>
                    
                    <div className="col-span-full pt-4 border-t border-gray-100 dark:border-white/5 mt-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-1 flex items-center gap-2"><Lock size={14}/> Сигурност</h4>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">Въведете текущата парола, за да запазите промени по имейл или парола.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">Текуща Парола</label>
                                <input type="password" value={editProfile.currentPassword} onChange={e => setEditProfile({...editProfile, currentPassword: e.target.value})} className="w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 transition-all font-medium"/>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">Нова Парола</label>
                                <input type="password" value={editProfile.password} onChange={e => setEditProfile({...editProfile, password: e.target.value})} placeholder="Непроменена" className="w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 transition-all font-medium"/>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             <div className="flex justify-end pt-4">
                 <Button onClick={handleUpdateAccount} className="px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20" icon={Check}>Запази Промените</Button>
             </div>
          </section>

          {/* Personalization */}
          <section className="space-y-6 relative">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Palette size={18} className="text-pink-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Персонализация</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Color */}
                <div className={`bg-gray-50/50 dark:bg-white/5 p-5 rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-4 relative ${!isPremium ? 'opacity-80' : ''}`}>
                    <label className="text-sm font-bold flex items-center gap-2">Основен Цвят</label>
                    <div className={`flex flex-wrap gap-3 ${!isPremium ? 'pointer-events-none' : ''}`}>
                        {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(c => (
                            <button key={c} onClick={() => setUserSettings(prev => ({...prev, themeColor: c}))} className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center ${userSettings.themeColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 dark:ring-offset-zinc-900' : 'hover:scale-105'}`} style={{backgroundColor: c}}>
                                {userSettings.themeColor === c && <Check size={16} className="text-white drop-shadow-md"/>}
                            </button>
                        ))}
                         <div className="relative">
                             <input type="color" value={userSettings.themeColor} onChange={e => setUserSettings(prev => ({...prev, themeColor: e.target.value}))} className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer z-10"/>
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400"><Plus size={18}/></div>
                         </div>
                    </div>
                    {!isPremium && (
                        <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                            <div className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Lock size={12}/> Plus/Pro
                            </div>
                        </div>
                    )}
                </div>

                 {/* Dark Mode - Always Free */}
                <div className="bg-gray-50/50 dark:bg-white/5 p-5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold flex items-center gap-2 mb-1">{isDarkMode ? <Moon size={16} className="text-indigo-400"/> : <Sun size={16} className="text-amber-500"/>} Режим</div>
                        <div className="text-xs text-gray-500">{isDarkMode ? 'Тъмна тема' : 'Светла тема'}</div>
                    </div>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Background */}
                <div className={`col-span-full bg-gray-50/50 dark:bg-white/5 p-5 rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-4 relative ${!isPremium ? 'opacity-80' : ''}`}>
                     <div className="flex justify-between items-center">
                        <label className="text-sm font-bold flex items-center gap-2"><ImageIcon size={16}/> Фон на чата</label>
                        {userSettings.customBackground && isPremium && <button onClick={() => setUserSettings(prev => ({...prev, customBackground: null}))} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">Премахни</button>}
                     </div>
                     
                     <div className={`h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden group bg-white/50 dark:bg-black/20 ${!isPremium ? 'pointer-events-none' : ''}`} onClick={() => isPremium && backgroundInputRef.current?.click()}>
                         {userSettings.customBackground ? (
                             <>
                                <img src={userSettings.customBackground} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold flex items-center gap-2"><Edit2 size={16}/> Промени</span>
                                </div>
                             </>
                         ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                 <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full"><Upload size={24}/></div>
                                 <div className="text-center">
                                     <span className="text-sm font-bold block">Качи изображение</span>
                                     <span className="text-xs opacity-70">JPG, PNG до 5MB</span>
                                 </div>
                             </div>
                         )}
                         <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*"/>
                     </div>
                     {!isPremium && (
                        <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                             <div className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Lock size={12}/> Plus/Pro
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </section>

          {/* AI Settings */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Cpu size={18} className="text-emerald-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">AI Настройки</h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                     { label: 'Клас / Ниво', key: 'gradeLevel', options: [['1-4', '1-4 клас'], ['5-7', '5-7 клас'], ['8-12', '8-12 клас'], ['university', 'Студент']] },
                     { label: 'Размер на текста', key: 'textSize', options: [['small', 'Малък'], ['normal', 'Нормален'], ['large', 'Голям']] },
                     { label: 'Дължина на отговора', key: 'responseLength', options: [['concise', 'Кратък'], ['detailed', 'Подробен']] },
                 ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">{field.label}</label>
                        <div className="relative">
                            <select value={(userSettings as any)[field.key]} onChange={e => setUserSettings({...userSettings, [field.key]: e.target.value as any})} className="w-full appearance-none bg-gray-50 dark:bg-black/20 p-3.5 pr-10 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 font-medium transition-all text-sm">
                               {field.options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                 ))}
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">AI Модел</label>
                    <div className="relative">
                        <select value={userSettings.preferredModel} onChange={e => setUserSettings({...userSettings, preferredModel: e.target.value as any})} className="w-full appearance-none bg-gray-50 dark:bg-black/20 p-3.5 pr-10 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 font-medium transition-all text-sm">
                           {AI_MODELS.map(m => (
                               <option key={m.id} value={m.id} disabled={m.id === 'gemini-3-pro-preview' && userPlan === 'free'}>
                                   {m.name} {m.id === 'gemini-3-pro-preview' && userPlan === 'free' ? '(Plus/Pro)' : ''}
                               </option>
                           ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    </div>
                 </div>
             </div>
          </section>

          {/* Data */}
          <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                <Database size={18} className="text-amber-500"/>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Данни</h3>
             </div>
             
             <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                 <button onClick={handleClearMemory} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group text-left">
                     <div className="flex items-center gap-4">
                         <div className="p-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl"><Trash2 size={18}/></div>
                         <div>
                             <div className="text-sm font-bold text-red-600 dark:text-red-400">Изчисти паметта</div>
                             <div className="text-xs text-red-400/70">Изтрий всички съобщения в текущия чат</div>
                         </div>
                     </div>
                     <ArrowRight size={18} className="text-red-300 group-hover:text-red-500 transition-colors"/>
                </button>
             </div>
          </section>

      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default App;