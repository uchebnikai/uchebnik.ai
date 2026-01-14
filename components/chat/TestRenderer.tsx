import React, { useState } from 'react';
import { FileText, X, FileType, Loader2, Download, Printer, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import * as docx from 'docx';
import { jsPDF } from "jspdf";
import { TestData, TestQuestion } from '../../types';
import { cleanMathText } from '../../utils/text';
import { CodeBlock } from '../ui/CodeBlock';

// Cache font buffer at module level to avoid re-fetching
let cachedFontBuffer: ArrayBuffer | null = null;
const FONT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
const WATERMARK_TEXT = "Генерирано чрез Uchebnik AI - uchebnikai.com";

const BG_LABELS = ['А)', 'Б)', 'В)', 'Г)', 'Д)', 'Е)'];

// Helper to ensure option has a label
const ensureLabel = (opt: string, index: number): string => {
    if (!opt) return "";
    
    // 1. Strip any existing prefixes that look like labels
    const cleanOpt = opt.replace(/^([а-яА-Яa-zA-Z0-9][).]\s*)+/, '').trim();
    
    // 2. Prepend the consistent standard label
    const label = BG_LABELS[index] || `${String.fromCharCode(65 + index)})`;
    return `${label} ${cleanOpt}`;
};

// Helper to ensure the correct answer in the key has a label for multiple choice questions
const getFormattedCorrectAnswer = (q: TestQuestion): string => {
    if (!q.correctAnswer) return "-";
    if (q.type !== 'multiple_choice' || !q.options) return q.correctAnswer;

    // Strip labels from current correct answer and all options for comparison
    const cleanCorrect = q.correctAnswer.replace(/^([а-яА-Яa-zA-Z0-9][).]\s*)+/, '').trim().toLowerCase();
    
    const index = q.options.findIndex(opt => {
        const cleanOpt = opt.replace(/^([а-яА-Яa-zA-Z0-9][).]\s*)+/, '').trim().toLowerCase();
        return cleanOpt === cleanCorrect;
    });

    if (index !== -1) {
        return ensureLabel(q.correctAnswer, index);
    }

    return q.correctAnswer;
};

// Helper to convert SVG String to PNG Base64 for Export
const svgToPng = (svgString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600; 
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if(ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(600 / img.width, 400 / img.height);
          const w = img.width * scale || 600;
          const h = img.height * scale || 400;
          const x = (600 - w) / 2;
          const y = (400 - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          resolve(canvas.toDataURL('image/png'));
      } else {
          reject("No canvas context");
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const TestRenderer = ({ data }: { data: TestData }) => {
  const [visible, setVisible] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!data || !data.questions || !Array.isArray(data.questions)) {
      return (
          <div className="mt-4 p-6 bg-red-50 dark:bg-red-900/20 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
              <AlertCircle className="shrink-0" size={24} />
              <div>
                  <p className="font-bold">Грешка при визуализация на теста</p>
                  <p className="text-sm opacity-80">Данните от AI са повредени или непълни.</p>
              </div>
          </div>
      );
  }

  const handleDownloadWord = async () => {
    const processedQuestions = await Promise.all(data.questions.map(async (q) => {
        let imageRun = null;
        if (q.geometryData?.svg) {
            try {
                const pngBase64 = await svgToPng(q.geometryData.svg);
                const base64Data = pngBase64.split(',')[1];
                imageRun = new docx.ImageRun({
                    data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)),
                    transformation: { width: 300, height: 200 },
                    type: "png"
                });
            } catch (e) {
                console.error("Failed to convert SVG for Word", e);
            }
        }
        return { ...q, imageRun };
    }));

    const doc = new docx.Document({
        sections: [{
            properties: {},
            footers: {
                default: new docx.Footer({
                    children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: WATERMARK_TEXT,
                                    size: 16,
                                    color: "999999",
                                    italics: true
                                })
                            ],
                            alignment: docx.AlignmentType.LEFT
                        })
                    ]
                })
            },
            children: [
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Име: __________________________________________", size: 24 })],
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Клас: _________      Номер: _________", size: 24 })],
                    spacing: { after: 400 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: cleanMathText(data.title || 'Тест'), bold: true, size: 32 })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: `${data.subject || ''} | ${data.grade || ''}`, size: 24, color: "666666" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                ...processedQuestions.flatMap((q, index) => {
                    const elements = [
                        new docx.Paragraph({
                            children: [new docx.TextRun({ text: `${index + 1}. ${cleanMathText(q.question || '')}`, bold: true, size: 24 })],
                            spacing: { before: 200, after: 100 }
                        })
                    ];

                    if (q.imageRun) {
                        elements.push(new docx.Paragraph({
                            children: [q.imageRun],
                            alignment: docx.AlignmentType.CENTER,
                            spacing: { after: 100 }
                        }));
                    }

                    if (q.options && q.options.length > 0) {
                        q.options.forEach((opt, idx) => {
                            elements.push(new docx.Paragraph({
                                children: [new docx.TextRun({ text: cleanMathText(ensureLabel(opt, idx)), size: 24 })],
                                spacing: { after: 50 },
                                indent: { left: 720 }
                            }));
                        });
                    } else {
                        elements.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "____________________________________________________________________" })], spacing: { after: 100 } }));
                        elements.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "____________________________________________________________________" })], spacing: { after: 200 } }));
                    }
                    return elements;
                }),
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "Подпис на учител: ___________________        Подпис на ученик: ___________________", size: 24 })
                    ],
                    spacing: { before: 800, after: 300 }
                }),
                new docx.Paragraph({
                    children: [
                         new docx.TextRun({ text: "Оценка: ___________________", bold: true, size: 24 })
                    ],
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                     children: [new docx.TextRun({ text: "Ключ с отговори", bold: true, size: 28 })],
                     spacing: { before: 600, after: 200 },
                     pageBreakBefore: true
                }),
                ...data.questions.map((q, index) => 
                     new docx.Paragraph({
                         children: [new docx.TextRun({ text: `${index + 1}. ${cleanMathText(getFormattedCorrectAnswer(q))}`, size: 24 })]
                     })
                )
            ]
        }]
    });

    const blob = await docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.title || 'test').replace(/\s+/g, '_')}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
      setIsGeneratingPdf(true);
      try {
        const doc = new jsPDF();
        try {
            if (!cachedFontBuffer) {
                const fontBytes = await fetch(FONT_URL).then(res => res.arrayBuffer());
                cachedFontBuffer = fontBytes;
            }
            const filename = "Roboto-Regular.ttf";
            let binary = '';
            const bytes = new Uint8Array(cachedFontBuffer as ArrayBuffer);
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
        }
        
        const addWatermark = () => {
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(180);
            doc.text(WATERMARK_TEXT, 10, pageHeight - 10);
            doc.setTextColor(0);
        };

        doc.setFontSize(12);
        doc.text("Име: __________________________________________", 20, 20);
        doc.text("Клас: _________", 20, 30);
        doc.text("Номер: _________", 80, 30);
        doc.setFontSize(18);
        doc.text(cleanMathText(data.title || 'Тест'), 105, 50, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${data.subject || ''} | ${data.grade || ''}`, 105, 58, { align: 'center' });
        doc.setTextColor(0);
        
        let y = 70;
        
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            if (y > 250) { 
                addWatermark();
                doc.addPage(); 
                y = 20; 
            }
            doc.setFontSize(12);
            const questionText = `${i + 1}. ${cleanMathText(q.question || '')}`;
            const splitQ = doc.splitTextToSize(questionText, 170);
            doc.text(splitQ, 20, y);
            y += splitQ.length * 7;
            
            if (q.geometryData?.svg) {
                try {
                    const pngBase64 = await svgToPng(q.geometryData.svg);
                    if (y > 200) { 
                        addWatermark();
                        doc.addPage(); 
                        y = 20; 
                    }
                    doc.addImage(pngBase64, 'PNG', 25, y, 80, 60);
                    y += 65;
                } catch(e) {
                    y += 5;
                }
            }

            if (q.options && q.options.length > 0) {
               q.options.forEach((opt, idx) => {
                  if (y > 270) { 
                      addWatermark();
                      doc.addPage(); 
                      y = 20; 
                  }
                  doc.text(cleanMathText(ensureLabel(opt, idx)), 25, y);
                  y += 7;
               });
               y += 4;
            } else {
               doc.line(20, y+5, 190, y+5);
               doc.line(20, y+15, 190, y+15);
               y += 25;
            }
        }

        if (y > 230) { 
            addWatermark();
            doc.addPage(); 
            y = 40; 
        } else { 
            y += 20; 
        }
        doc.text("Подпис на учител: ___________________", 20, y);
        doc.text("Подпис на ученик: ___________________", 100, y);
        y += 15;
        doc.setFontSize(14);
        doc.text("Оценка: ___________________", 20, y);
        
        addWatermark();
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Ключ с отговори", 20, 20);
        doc.setFontSize(12);
        let ky = 35;
        data.questions.forEach((q, i) => {
             if (ky > 270) {
                addWatermark();
                doc.addPage();
                ky = 20;
             }
             doc.text(`${i + 1}. ${cleanMathText(getFormattedCorrectAnswer(q))}`, 20, ky);
             ky += 8;
        });
        addWatermark();
        doc.save(`${(data.title || 'test').replace(/\s+/g, '_')}.pdf`);
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
            <title>${cleanMathText(data.title || 'Тест')}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body { 
                    font-family: 'Roboto', sans-serif; 
                    padding: 60px; 
                    color: #000; 
                    line-height: 1.5; 
                    position: relative;
                    min-height: 100vh;
                }
                .header-fields { margin-bottom: 40px; font-size: 16px; display: flex; flex-direction: column; gap: 10px; }
                .field-row { border-bottom: 1px solid #eee; padding-bottom: 5px; }
                h1 { text-align: center; margin-top: 40px; margin-bottom: 5px; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
                .meta { text-align: center; color: #666; margin-bottom: 60px; font-size: 16px; font-weight: bold; }
                .question { margin-bottom: 35px; page-break-inside: avoid; }
                .q-text { font-weight: bold; margin-bottom: 15px; font-size: 18px; display: flex; gap: 10px; }
                .option { margin-left: 30px; margin-bottom: 8px; font-size: 16px; }
                .open-lines { margin-top: 20px; border-bottom: 1px solid #000; height: 40px; width: 100%; opacity: 0.3; }
                .footer-signatures { display: flex; justify-content: space-between; margin-top: 80px; page-break-inside: avoid; font-size: 14px; }
                .grade-field { margin-top: 40px; font-weight: bold; font-size: 20px; page-break-inside: avoid; border-top: 2px solid #000; padding-top: 20px; }
                .key { margin-top: 50px; page-break-before: always; }
                .geometry-container { margin: 25px 0; border: 1px solid #eee; padding: 20px; display: flex; justify-content: center; background: #fafafa; border-radius: 8px; }
                .geometry-container svg { max-width: 400px; height: auto; }
                
                .print-watermark {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                    pointer-events: none;
                }

                @media print {
                   @page { margin: 2cm; }
                   body { padding: 0; }
                   .print-watermark { display: block; }
                }
            </style>
        </head>
        <body>
            <div class="print-watermark">${WATERMARK_TEXT}</div>
            <div class="header-fields">
                <div class="field-row">Име: __________________________________________________________________</div>
                <div style="display: flex; gap: 40px;">
                    <div class="field-row">Клас: ___________</div>
                    <div class="field-row">Номер: ___________</div>
                </div>
            </div>
            <h1>${cleanMathText(data.title || 'Тест')}</h1>
            <div class="meta">${data.subject || ''} ${data.grade ? '| ' + data.grade : ''}</div>
            
            <div class="questions-container">
            ${data.questions.map((q, i) => `
                <div class="question">
                    <div class="q-text"><span>${i + 1}.</span> <span>${cleanMathText(q.question || '')}</span></div>
                    
                    ${q.geometryData ? `<div class="geometry-container">${q.geometryData.svg}</div>` : ''}
                    
                    ${q.options && q.options.length > 0
                        ? q.options.map((o, idx) => `<div class="option">${cleanMathText(ensureLabel(o, idx))}</div>`).join('') 
                        : `<div class="open-lines"></div><div class="open-lines"></div><div class="open-lines"></div>`}
                </div>
            `).join('')}
            </div>

            <div class="footer-signatures">
                <div>Подпис на учител: _______________________</div>
                <div>Подпис на ученик: _______________________</div>
            </div>
            <div class="grade-field">
                Оценка: ___________________
            </div>

            <div class="key">
                <h2 style="border-bottom: 2px solid #000; padding-bottom: 10px;">Ключ с отговори (За учителя)</h2>
                <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 15px; margin-top: 20px;">
                ${data.questions.map((q, i) => `<div><strong>${i + 1}.</strong> ${cleanMathText(getFormattedCorrectAnswer(q))}</div>`).join('')}
                </div>
                <div style="margin-top: 50px; font-size: 10px; color: #999;">${WATERMARK_TEXT}</div>
            </div>
            <script>
                document.fonts.ready.then(() => { window.print(); });
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
    <div className="mt-4 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-[32px] shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden ring-1 ring-black/5">
        <div className="p-6 md:p-8 bg-white dark:bg-[#0c0c0e] rounded-[28px] m-1 shadow-inner flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                        <GraduationCap size={24}/>
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-black text-xl md:text-2xl leading-tight text-zinc-900 dark:text-white tracking-tight">{data.title || 'Тест'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{data.subject}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"/>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{data.grade}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setVisible(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-400"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={handleDownloadWord} className="flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 group">
                    <FileType size={18} className="group-hover:scale-110 transition-transform"/> Word (.docx)
                </button>
                <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait group">
                    {isGeneratingPdf ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} className="group-hover:scale-110 transition-transform"/>} PDF
                </button>
                <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transition-all active:scale-95 group">
                    <Printer size={18} className="group-hover:scale-110 transition-transform"/> Печат
                </button>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar p-6 bg-zinc-50 dark:bg-black/40 rounded-3xl border border-zinc-200 dark:border-white/5 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-20"/>
                
                <div className="border-b-2 border-zinc-200 dark:border-white/10 pb-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 text-sm font-bold text-zinc-400">Име: <span className="border-b border-zinc-300 dark:border-zinc-700 inline-block w-40 sm:w-64 ml-2"/></div>
                        <div className="flex gap-4">
                            <div className="text-sm font-bold text-zinc-400">Клас: <span className="border-b border-zinc-300 dark:border-zinc-700 inline-block w-12 ml-1"/></div>
                            <div className="text-sm font-bold text-zinc-400">№: <span className="border-b border-zinc-300 dark:border-zinc-700 inline-block w-10 ml-1"/></div>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    {data.questions.map((q, i) => (
                        <div key={i} className="relative">
                            <div className="flex gap-3 mb-4">
                                <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{i + 1}.</span>
                                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>
                                        {q.question || ''}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            
                            {q.geometryData && (
                                <div className="mb-6 flex justify-center p-6 bg-white dark:bg-black/20 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                                    <div className="w-full max-w-[300px]" dangerouslySetInnerHTML={{__html: q.geometryData.svg}} />
                                </div>
                            )}

                            {q.options && q.options.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/5 shadow-sm group hover:border-indigo-500/50 transition-colors">
                                            <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-500 transition-colors shrink-0"></div>
                                            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 markdown-content">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                                    {ensureLabel(opt, idx)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="ml-8 space-y-4">
                                    <div className="h-px bg-zinc-200 dark:bg-white/10 w-full"/>
                                    <div className="h-px bg-zinc-200 dark:bg-white/10 w-full"/>
                                    <div className="h-px bg-zinc-200 dark:bg-white/10 w-full"/>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-10 mt-10 border-t-2 border-zinc-200 dark:border-white/10 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-lg">
                            <CheckCircle2 size={24}/>
                            Оценка: ______
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
                            {WATERMARK_TEXT}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-500/20">
                        <h5 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Ключ с отговори (Видим само тук)</h5>
                        <div className="space-y-3">
                            {data.questions.map((q, i) => (
                                <div key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex gap-2">
                                    <span className="font-bold text-indigo-600">{i+1}.</span>
                                    <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                            {getFormattedCorrectAnswer(q)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};