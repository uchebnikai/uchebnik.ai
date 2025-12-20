
import React, { useState } from 'react';
import { FileText, X, FileType, Loader2, Download, Printer } from 'lucide-react';
import * as docx from 'docx';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TestData } from '../../types';
import { cleanMathText, preprocessLatex } from '../../utils/text';
import { ChartRenderer } from './ChartRenderer';
import { CodeBlock } from '../ui/CodeBlock';

// Cache font buffer at module level to avoid re-fetching
let cachedFontBuffer: ArrayBuffer | null = null;
const FONT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";

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

  // Safety check for malformed data
  if (!data || !data.questions || !Array.isArray(data.questions)) {
      return (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              Грешка при визуализацията на теста. Данните са невалидни.
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
                    children: [new docx.TextRun({ text: cleanMathText(data.title || "Тест"), bold: true, size: 32 })],
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
                            children: [new docx.TextRun({ text: `${index + 1}. ${cleanMathText(q.question)}`, bold: true, size: 24 })],
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
                        q.options.forEach(opt => {
                            elements.push(new docx.Paragraph({
                                children: [new docx.TextRun({ text: cleanMathText(opt), size: 24 })],
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
            alert("Warning: Could not load Cyrillic font. Text might look incorrect.");
        }
        
        doc.setFontSize(12);
        doc.text("Име: __________________________________________", 20, 20);
        doc.text("Клас: _________", 20, 30);
        doc.text("Номер: _________", 80, 30);
        doc.setFontSize(18);
        doc.text(cleanMathText(data.title || "Тест"), 105, 50, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${data.subject || ''} | ${data.grade || ''}`, 105, 58, { align: 'center' });
        doc.setTextColor(0);
        
        let y = 70;
        
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            const questionText = `${i + 1}. ${cleanMathText(q.question)}`;
            const splitQ = doc.splitTextToSize(questionText, 170);
            doc.text(splitQ, 20, y);
            y += splitQ.length * 7;
            
            if (q.geometryData?.svg) {
                try {
                    const pngBase64 = await svgToPng(q.geometryData.svg);
                    if (y > 200) { doc.addPage(); y = 20; }
                    doc.addImage(pngBase64, 'PNG', 25, y, 80, 60);
                    y += 65;
                } catch(e) {
                    doc.setTextColor(150);
                    doc.text("[Чертеж - виж онлайн]", 25, y);
                    doc.setTextColor(0);
                    y += 10;
                }
            } else if (q.chartData) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text("[Графика - виж онлайн]", 25, y);
                doc.setTextColor(0);
                doc.setFontSize(12);
                y += 10;
            }

            if (q.options && q.options.length > 0) {
               q.options.forEach(opt => {
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.text(cleanMathText(opt), 25, y);
                  y += 7;
               });
               y += 4;
            } else {
               doc.line(20, y+5, 190, y+5);
               doc.line(20, y+15, 190, y+15);
               y += 25;
            }
        }

        if (y > 230) { doc.addPage(); y = 40; } else { y += 20; }
        doc.text("Подпис на учител: ___________________", 20, y);
        doc.text("Подпис на ученик: ___________________", 100, y);
        y += 15;
        doc.setFontSize(14);
        doc.text("Оценка: ___________________", 20, y);
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Ключ с отговори", 20, 20);
        doc.setFontSize(12);
        let ky = 35;
        data.questions.forEach((q, i) => {
             doc.text(`${i + 1}. ${cleanMathText(q.correctAnswer || '-')}`, 20, ky);
             ky += 8;
        });
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
            <title>${cleanMathText(data.title || "Тест")}</title>
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
                .chart-placeholder { border: 1px dashed #ccc; padding: 20px; text-align: center; color: #999; font-size: 12px; margin: 10px 0; }
                .geometry-container { margin: 15px 0; border: 1px solid #eee; padding: 10px; display: flex; justify-content: center; }
                .geometry-container svg { max-width: 300px; height: auto; }
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
            <h1>${cleanMathText(data.title || "Тест")}</h1>
            <div class="meta">${data.subject || ''} ${data.grade ? '| ' + data.grade : ''}</div>
            ${data.questions.map((q, i) => `
                <div class="question">
                    <div class="q-text">${i + 1}. ${cleanMathText(q.question)}</div>
                    
                    ${q.geometryData ? `<div class="geometry-container">${q.geometryData.svg}</div>` : ''}
                    ${q.chartData ? `<div class="chart-placeholder">[Графика: ${q.chartData.title || 'Данни'}]</div>` : ''}
                    
                    ${q.options && q.options.length > 0
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
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <h4 className="font-bold text-lg leading-tight">{cleanMathText(data.title || "Тест")}</h4>
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

        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-2 bg-white/50 dark:bg-black/20 rounded-xl border border-indigo-500/5">
            {data.questions.map((q, i) => (
                <div key={i} className="p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex gap-2 mb-3">
                        <span className="font-bold text-indigo-500 text-sm mt-0.5">{i + 1}.</span>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 markdown-content">
                            <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]} 
                                components={{
                                    p: ({node, ...props}) => <p className="mb-0" {...props} />,
                                    code: CodeBlock
                                }}
                            >
                                {preprocessLatex(q.question)}
                            </ReactMarkdown>
                        </div>
                    </div>
                    
                    {q.geometryData && (
                        <div className="mb-4 flex justify-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-indigo-500/10">
                            <div className="w-full max-w-[300px]" dangerouslySetInnerHTML={{__html: q.geometryData.svg}} />
                        </div>
                    )}

                    {q.chartData && (
                        <div className="mb-4 h-56 w-full border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden bg-white/50 dark:bg-black/20">
                            <ChartRenderer data={q.chartData} forceVisible={true} />
                        </div>
                    )}

                    {q.options && q.options.length > 0 && (
                        <div className="space-y-2 ml-6">
                            {q.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-white/20 shrink-0"></div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 markdown-content">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-0" {...props} />
                                            }}
                                        >
                                            {preprocessLatex(opt)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};
