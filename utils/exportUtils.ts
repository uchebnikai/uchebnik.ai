import pptxgen from "pptxgenjs";
import { Slide, SubjectConfig } from "../types";
import { UserSettings } from "../types";

export const handleDownloadPPTX = (slides: Slide[], activeSubject: SubjectConfig | null, userSettings: UserSettings) => {
    const p = new pptxgen();
    p.defineSlideMaster({
        title: 'MASTER', background: { color: 'FFFFFF' },
        objects: [ {rect:{x:0,y:0,w:'100%',h:0.15,fill:{color:'4F46E5'}}}, {text: {text: "Uchebnik AI", options: {x: 0.5, y: '90%', fontSize: 10, color: 'D1D5DB'}}}, ],
        slideNumber: { x: '95%', y: '90%', fontSize: 10, color: '6B7280' }
    });
    const cover = p.addSlide({masterName:'MASTER'});
    cover.addText(activeSubject?.name || "Презентация", {x:1, y:2, w:'80%', fontSize:44, bold:true, color:'111827', align:'center'});
    if(userSettings.userName) cover.addText(`Автор: ${userSettings.userName}`, {x:1, y:3.5, w:'80%', fontSize:18, color:'4B5563', align:'center'});
    slides.forEach(s => {
        const slide = p.addSlide({masterName:'MASTER'});
        slide.addText(s.title, {x:0.5, y:0.8, w:'90%', fontSize:28, bold:true, color:'1F2937', fontFace:'Arial'});
        slide.addText(s.content.map(t=>({text:t, options:{bullet:true, breakLine:true}})), {x:0.5, y:1.8, w:'90%', h:'60%', fontSize:18, color:'374151', fontFace:'Arial', lineSpacing:32});
        if(s.notes) slide.addNotes(s.notes);
    });
    p.writeFile({fileName: 'Presentation.pptx'});
};