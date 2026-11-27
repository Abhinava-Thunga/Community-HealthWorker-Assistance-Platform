import os
import re
from PIL import Image as PILImage
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted, Image, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

def to_roman(n):
    roman_map = [
        (1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'),
        (100, 'c'), (90, 'xc'), (50, 'l'), (40, 'xl'),
        (10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')
    ]
    result = ''
    for value, numeral in roman_map:
        while n >= value:
            result += numeral
            n -= value
    return result

class SetChapter1PageMarker(Flowable):
    def __init__(self):
        super(SetChapter1PageMarker, self).__init__()
        self.width = 0
        self.height = 0

    def draw(self):
        self.canv._chapter1_page = self.canv._pageNumber

class UniversityNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(UniversityNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        chap1_page = getattr(self, '_chapter1_page', 11)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages, chap1_page)
            super(UniversityNumberedCanvas, self).showPage()
        super(UniversityNumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages, chap1_page):
        page_num = self._pageNumber
        if page_num == 1:
            return  # Skip cover page
        
        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setFillColor(colors.black)
        
        # Running Header (pages 2+)
        self.drawString(54, 755, "Presidency University — Community Health Worker Assistance Platform")
        self.drawRightString(558, 755, "B.Tech Final Project Report (2026–27)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 749, 558, 749)
        
        # Running Footer: Centered at middle
        if page_num < chap1_page:
            # Roman numerals for front matter (Abstract is vi, etc.)
            roman_str = to_roman(page_num)
            self.drawCentredString(306, 32, roman_str)
        else:
            # Arabic numerals starting from 1 for Chapter 1+
            arabic_num = page_num - chap1_page + 1
            self.drawCentredString(306, 32, str(arabic_num))
            
        self.line(54, 44, 558, 44)
        self.restoreState()

def make_flowable_image(img_path, max_width=480, max_height=230):
    if not os.path.exists(img_path):
        return None
    try:
        with PILImage.open(img_path) as im:
            orig_w, orig_h = im.size
        aspect = orig_h / orig_w
        w = min(max_width, orig_w)
        h = w * aspect
        if h > max_height:
            h = max_height
            w = h / aspect
        return Image(img_path, width=w, height=h)
    except Exception as e:
        print(f"Error loading {img_path}: {e}")
        return None

def build_pdf():
    pdf_path = "Community_Health_Worker_Platform_Project_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    # Typography styles strictly in Times New Roman
    chap_style = ParagraphStyle(
        'ChapTitle', fontName='Times-Bold', fontSize=18, leading=24,
        alignment=1, textColor=colors.black, spaceBefore=12, spaceAfter=14, keepWithNext=True
    )
    sec_style = ParagraphStyle(
        'SecHeading', fontName='Times-Bold', fontSize=16, leading=22,
        alignment=0, textColor=colors.black, spaceBefore=14, spaceAfter=8, keepWithNext=True
    )
    subsec_style = ParagraphStyle(
        'SubSecHeading', fontName='Times-Bold', fontSize=14, leading=20,
        alignment=0, textColor=colors.black, spaceBefore=10, spaceAfter=6, keepWithNext=True
    )
    subsubsec_style = ParagraphStyle(
        'SubSubSecHeading', fontName='Times-Bold', fontSize=12, leading=18,
        alignment=0, textColor=colors.black, spaceBefore=8, spaceAfter=4, keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyJustified', fontName='Times-Roman', fontSize=12, leading=18,
        alignment=4, textColor=colors.black, spaceAfter=6
    )
    body_bold = ParagraphStyle(
        'BodyBold', fontName='Times-Bold', fontSize=12, leading=18,
        alignment=4, textColor=colors.black, spaceAfter=6
    )
    center_text = ParagraphStyle(
        'CenterT', fontName='Times-Roman', fontSize=12, leading=18,
        alignment=1, textColor=colors.black
    )
    center_bold = ParagraphStyle(
        'CenterB', fontName='Times-Bold', fontSize=12, leading=18,
        alignment=1, textColor=colors.black
    )
    
    table_caption = ParagraphStyle(
        'TableCaption', fontName='Times-Bold', fontSize=12, leading=16,
        alignment=1, textColor=colors.black, spaceBefore=8, spaceAfter=4, keepWithNext=True
    )
    fig_caption = ParagraphStyle(
        'FigCaption', fontName='Times-Italic', fontSize=12, leading=16,
        alignment=1, textColor=colors.black, spaceBefore=4, spaceAfter=10, keepWithNext=False
    )
    
    th_style = ParagraphStyle('TH', fontName='Times-Bold', fontSize=9.5, leading=13, alignment=1, textColor=colors.black)
    td_style = ParagraphStyle('TD', fontName='Times-Roman', fontSize=9, leading=12.5, textColor=colors.black)
    td_bold = ParagraphStyle('TDBold', fontName='Times-Bold', fontSize=9, leading=12.5, textColor=colors.black)
    code_style = ParagraphStyle('Code', fontName='Courier', fontSize=8, leading=10.5, textColor=colors.black)

    border_color = colors.HexColor("#CBD5E1")
    header_bg = colors.HexColor("#F1F5F9")
    card_bg = colors.HexColor("#F8FAFC")

    story = []

    # ================= COVER PAGE =================
    banner = make_flowable_image("docs/figures/image1.png", max_width=440, max_height=85)
    if banner:
        story.append(banner)
        story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("<b>PRESIDENCY UNIVERSITY</b>", center_bold))
        story.append(Paragraph("Private University Estd. in Karnataka State by Act No. 41 of 2013<br/>Itgalpura, Rajankunte, Yelahanka, Bengaluru – 560064", center_text))
    
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", center_bold))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.black, spaceBefore=10, spaceAfter=15))
    
    story.append(Paragraph("“COMMUNITY HEALTH WORKER ASSISTANCE PLATFORM”", ParagraphStyle('CoverT', fontName='Times-Bold', fontSize=18, leading=24, alignment=1, textColor=colors.black, spaceBefore=10, spaceAfter=10)))
    story.append(Paragraph("<b>A PROJECT REPORT</b>", center_bold))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the award of the degree of<br/><b>BACHELOR OF TECHNOLOGY</b><br/>IN<br/><b>INFORMATION SCIENCE AND ENGINEERING</b>", center_text))
    story.append(Spacer(1, 15))
    
    cov_table = [
        [Paragraph("<b>Submitted by:</b>", td_bold), Paragraph("<b>Under the guidance of:</b>", td_bold)],
        [
            Paragraph("<b>SWASTIK VINAYAK HEGDE</b> — 20231ISE0153<br/><b>ABHINAVA THUNGA K N</b> — 20231ISE0163<br/><b>NAGARAJ SHRIPAD BHAT</b> — 20231ISE0166", td_style),
            Paragraph("<b>Mr. HRITIK KUMAR</b><br/>Assistant Professor, Department of ISE<br/>Presidency School of Computer Science & Engg.<br/>Presidency University, Bengaluru", td_style)
        ]
    ]
    t_cov = Table(cov_table, colWidths=[250, 254])
    t_cov.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
    ]))
    story.append(t_cov)
    story.append(Spacer(1, 25))
    story.append(Paragraph("<b>DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING</b><br/><b>PRESIDENCY UNIVERSITY</b><br/>BENGALURU<br/><b>NOVEMBER 2026</b>", center_bold))
    story.append(PageBreak())

    # ================= BONAFIDE CERTIFICATE (Page ii) =================
    if banner:
        story.append(make_flowable_image("docs/figures/image1.png", max_width=400, max_height=75))
        story.append(Spacer(1, 8))
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", center_bold))
    story.append(Paragraph("<b>BONAFIDE CERTIFICATE</b>", ParagraphStyle('CertH', fontName='Times-Bold', fontSize=14, leading=18, alignment=1, textColor=colors.black, spaceBefore=6, spaceAfter=14)))
    
    story.append(Paragraph(
        "Certified that this report titled <b>“Community Health Worker Assistance Platform”</b> is a bonafide work carried out by "
        "<b>Mr. Swastik Vinayak Hegde (20231ISE0153)</b>, <b>Mr. Abhinava Thunga K N (20231ISE0163)</b>, and <b>Mr. Nagaraj Shripad Bhat (20231ISE0166)</b>, "
        "who have successfully carried out the project work and submitted the report for partial fulfillment of the requirements for the award of the degree of "
        "<b>BACHELOR OF TECHNOLOGY in INFORMATION SCIENCE AND ENGINEERING</b> during the academic year 2026–27.", body_style
    ))
    story.append(Spacer(1, 40))
    
    sigs = [
        [Paragraph("<b>Mr. Hritik Kumar</b>", center_bold), Paragraph("<b>Ms. Sumita Guddin</b>", center_bold), Paragraph("<b>Dr. Gopal K Shyam</b>", center_bold)],
        [Paragraph("Project Guide, PSCS<br/>Presidency University", center_text), Paragraph("Program Project Coordinator, PSCS<br/>Presidency University", center_text), Paragraph("Head of the Department, PSCS<br/>Presidency University", center_text)]
    ]
    t_sigs = Table(sigs, colWidths=[168, 168, 168])
    t_sigs.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
    story.append(t_sigs)
    story.append(PageBreak())

    # ================= VIVA-VOCE CERTIFICATE (Page iii) =================
    if banner:
        story.append(make_flowable_image("docs/figures/image1.png", max_width=400, max_height=75))
        story.append(Spacer(1, 8))
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", center_bold))
    story.append(Paragraph("<b>CERTIFICATE OF VIVA-VOCE-EXAMINATION</b>", ParagraphStyle('VivaH', fontName='Times-Bold', fontSize=14, leading=18, alignment=1, textColor=colors.black, spaceBefore=6, spaceAfter=14)))
    
    story.append(Paragraph(
        "This is to certify that <b>Mr. Swastik Vinayak Hegde (20231ISE0153)</b>, <b>Mr. Abhinava Thunga K N (20231ISE0163)</b>, and <b>Mr. Nagaraj Shripad Bhat (20231ISE0166)</b> "
        "have been subjected to the Viva-voce Examination on <b>28-11-2026</b> at Presidency University, Bengaluru.", body_style
    ))
    story.append(Spacer(1, 30))
    
    viva_table = [
        [Paragraph("<b>Examiner-1:</b>", td_bold), Paragraph("<b>Examiner-2:</b>", td_bold)],
        [Paragraph("Name: ____________________________<br/>Designation: _____________________<br/>University/College: ______________", td_style),
         Paragraph("Name: ____________________________<br/>Designation: _____________________<br/>University/College: ______________", td_style)]
    ]
    t_viva = Table(viva_table, colWidths=[250, 254])
    t_viva.setStyle(TableStyle([('BOX', (0,0), (-1,-1), 1, border_color), ('INNERGRID', (0,0), (-1,-1), 0.5, border_color), ('PADDING', (0,0), (-1,-1), 8)]))
    story.append(t_viva)
    story.append(PageBreak())

    # ================= DECLARATION (Page iv) =================
    story.append(Paragraph("<b>PRESIDENCY UNIVERSITY</b>", center_bold))
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", center_bold))
    story.append(Paragraph("<b>DECLARATION</b>", ParagraphStyle('DeclH', fontName='Times-Bold', fontSize=14, leading=18, alignment=1, textColor=colors.black, spaceBefore=6, spaceAfter=14)))
    
    story.append(Paragraph(
        "We, the students of final year B.Tech in <b>INFORMATION SCIENCE AND ENGINEERING</b>, at Presidency University, Bengaluru, named "
        "<b>SWASTIK VINAYAK HEGDE (20231ISE0153)</b>, <b>ABHINAVA THUNGA K N (20231ISE0163)</b>, and <b>NAGARAJ SHRIPAD BHAT (20231ISE0166)</b>, "
        "hereby declare that the project work titled <b>“COMMUNITY HEALTH WORKER ASSISTANCE PLATFORM”</b> has been independently carried out by us "
        "and submitted in partial fulfillment for the award of the degree of B.Tech in Information Science and Engineering during the academic year 2026–27. "
        "Further, the matter embodied in the project has not been submitted previously by anybody for the award of any Degree or Diploma to any other institution.", body_style
    ))
    story.append(Spacer(1, 15))
    
    decl_data = [
        [Paragraph("<b>Student Name</b>", td_bold), Paragraph("<b>Student USN</b>", td_bold), Paragraph("<b>Student Signature</b>", td_bold)],
        [Paragraph("<b>Swastik Vinayak Hegde</b>", td_style), Paragraph("20231ISE0153", td_style), Paragraph("____________________", td_style)],
        [Paragraph("<b>Abhinava Thunga K N</b>", td_style), Paragraph("20231ISE0163", td_style), Paragraph("____________________", td_style)],
        [Paragraph("<b>Nagaraj Shripad Bhat</b>", td_style), Paragraph("20231ISE0166", td_style), Paragraph("____________________", td_style)],
    ]
    t_decl = Table(decl_data, colWidths=[170, 160, 174])
    t_decl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
    ]))
    story.append(t_decl)
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>PLACE:</b> BENGALURU<br/><b>DATE:</b> 28-11-2026", body_style))
    story.append(PageBreak())

    # ================= ACKNOWLEDGEMENT (Page v) =================
    story.append(Paragraph("<b>ACKNOWLEDGEMENT</b>", chap_style))
    story.append(Paragraph(
        "For completing this project work, we have received the support and the guidance from many people whom we would like to mention with deep sense of gratitude and indebtedness. "
        "We extend our gratitude to our beloved <b>Chancellor</b>, <b>Vice Chancellor</b>, <b>Pro-Vice Chancellor</b>, and <b>Registrar</b> for their support and encouragement in completion of the project.<br/><br/>"
        "We express our cordial thanks to <b>Dr. Duraipandian N</b>, Dean PSCS, Presidency School of Computer Science and Engineering and the Management of Presidency University for providing the required facilities and intellectually stimulating environment that aided in the completion of our project work.<br/><br/>"
        "We are also thankful to <b>Dr. Gopal K Shyam</b>, Professor, Head of the Department, Presidency School of Computer Science and Engineering, Presidency University, for his mentorship and encouragement.<br/><br/>"
        "We would like to sincerely thank our internal guide <b>Mr. Hritik Kumar</b>, Assistant Professor, Department of ISE, Presidency University, for his moral support, motivation, timely guidance, and encouragement provided to us during the period of our project work.<br/><br/>"
        "We are grateful to <b>Mr. Muthuraju V</b>, School Project Coordinator, and <b>Ms. Sumita Guddin</b>, Program Project Coordinator, Presidency School of Computer Science and Engineering, for facilitating problem statements, coordinating reviews, monitoring progress, and providing their valuable support and guidance.<br/><br/>"
        "We are also grateful to Teaching and Non-Teaching staff of Presidency School of Computer Science and Engineering and also staff from other departments who have extended their valuable help and cooperation.", body_style
    ))
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>SWASTIK VINAYAK HEGDE &nbsp;&nbsp;|&nbsp;&nbsp; ABHINAVA THUNGA K N &nbsp;&nbsp;|&nbsp;&nbsp; NAGARAJ SHRIPAD BHAT</b>", center_bold))
    story.append(PageBreak())

    # ================= ABSTRACT (Page vi) =================
    story.append(Paragraph("<b>ABSTRACT</b>", chap_style))
    story.append(Paragraph(
        "Frontline community healthcare workers, predominantly Accredited Social Health Activists (ASHAs) and Auxiliary Nurse Midwives (ANMs) operating within primary-health ecosystems in India, coordinate maternal care, immunization, chronic-disease follow-up, and household visits under significant time and connectivity constraints. Paper registers and fragmented notebooks make patient retrieval slow, weaken longitudinal follow-up, and delay the recognition of danger signs. This project presents the <b>Community Health Worker (CHW) Assistance Platform</b>, a responsive web-first digital health system designed around field workflows and deployed as a cloud-accessible web application (<code>https://community-healthworker-assistance.onrender.com/login</code>). The platform uses a three-tier MERN architecture consisting of a React 18 single-page application, an Express and Node.js service tier, and MongoDB persistence through Mongoose.<br/><br/>"
        "The system features a strict two-role governance model (<b>ADMIN</b> and <b>WORKER</b>), compulsory unique ASHA Worker Field ID / Employee ID onboarding, email-based six-digit OTP verification, automated appointment confirmation emails dispatched to patients, and an interactive Admin Governance Panel where administrators verify, approve, or suspend health personnel accounts. In addition, the platform integrates a hybrid clinical-support layer: when connectivity is available, a constrained cloud assistant, referred to as <b>AshaBot</b> (powered by Google Gemini), receives the worker's clinical query and minimum necessary patient context and returns a tagged, uncertainty-aware clinical triage cue. When cloud connectivity is unavailable, a deterministic local rule engine parses supported vital signs and danger-sign keywords, producing an urgent, moderate, or routine escalation cue in 4.2 ms without network dependence.<br/><br/>"
        "Prototype measurements recorded mean latencies of 74.2 ms for worker login, 38.4 ms for multi-field patient search, 26.1 ms for health-record creation, 4.2 ms for offline triage, and 780.5 ms for cloud consultation; the local engine agreed with cloud risk categorizations in 48 of 50 synthetic vignettes (96.0%). These results demonstrate engineering feasibility, high responsiveness, and strict fail-safe continuity for community healthcare delivery.", body_style
    ))
    story.append(PageBreak())

    # ================= TABLE OF CONTENTS (Page vii) =================
    story.append(Paragraph("<b>TABLE OF CONTENTS</b>", chap_style))
    toc_data = [
        [Paragraph("<b>CHAPTER NO</b>", th_style), Paragraph("<b>TITLE</b>", th_style), Paragraph("<b>PAGE NO</b>", th_style)],
        [Paragraph("", td_bold), Paragraph("<b>ABSTRACT</b>", td_bold), Paragraph("vi", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>TABLE OF CONTENTS</b>", td_bold), Paragraph("vii", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>LIST OF FIGURES</b>", td_bold), Paragraph("ix", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>LIST OF TABLES</b>", td_bold), Paragraph("x", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>ABBREVIATIONS</b>", td_bold), Paragraph("xi", td_style)],
        [Paragraph("<b>1.</b>", td_bold), Paragraph("<b>INTRODUCTION</b><br/>&nbsp;&nbsp;1.1 BACKGROUND AND MOTIVATION<br/>&nbsp;&nbsp;1.2 SCOPE AND LIMITATIONS<br/>&nbsp;&nbsp;1.3 PROBLEM STATEMENT<br/>&nbsp;&nbsp;1.4 MOTIVATION<br/>&nbsp;&nbsp;1.5 METHODOLOGY OVERVIEW<br/>&nbsp;&nbsp;1.6 ORGANIZATION OF THE THESIS<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.6.1 Logical Flow of the Research Work<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.6.2 Contribution Mapping Across Chapters<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.6.3 Chapter Overview Summary", td_style), Paragraph("1<br/>1<br/>1<br/>2<br/>2<br/>3<br/>3<br/>3<br/>3<br/>3", td_style)],
        [Paragraph("<b>2.</b>", td_bold), Paragraph("<b>LITERATURE SURVEY</b><br/>&nbsp;&nbsp;2.1 INTRODUCTION TO RELATED WORK<br/>&nbsp;&nbsp;2.2 SURVEY OF EXISTING SYSTEMS<br/>&nbsp;&nbsp;2.3 RESEARCH GAPS IDENTIFIED<br/>&nbsp;&nbsp;2.4 OBJECTIVES OF THE STUDY<br/>&nbsp;&nbsp;2.5 SUMMARY", td_style), Paragraph("4<br/>4<br/>4<br/>5<br/>5<br/>5", td_style)],
        [Paragraph("<b>3.</b>", td_bold), Paragraph("<b>RESEARCH GAPS OF EXISTING METHODS</b><br/>&nbsp;&nbsp;3.1 STRUCTURAL AND ARCHITECTURAL DEFICIENCIES<br/>&nbsp;&nbsp;3.2 CLINICAL WORKFLOW AND VITALS INTEGRATION GAPS<br/>&nbsp;&nbsp;3.3 CONNECTIVITY, LATENCY, AND AI SAFETY BOUNDARIES<br/>&nbsp;&nbsp;3.4 COMPARATIVE GAP ANALYSIS<br/>&nbsp;&nbsp;3.5 SUMMARY", td_style), Paragraph("6<br/>6<br/>6<br/>6<br/>6<br/>7", td_style)],
        [Paragraph("<b>4.</b>", td_bold), Paragraph("<b>PROPOSED METHODOLOGY</b><br/>&nbsp;&nbsp;4.1 METHODOLOGY OUTLINE<br/>&nbsp;&nbsp;4.2 TOOLS, TECHNOLOGIES, PLATFORMS USED<br/>&nbsp;&nbsp;4.3 PROPOSED ARCHITECTURE<br/>&nbsp;&nbsp;4.4 OPERATIONAL SECURITY AND AUTHENTICATION ARCHITECTURE<br/>&nbsp;&nbsp;4.5 HYBRID GENAI AND OFFLINE TRIAGE METHODOLOGY<br/>&nbsp;&nbsp;4.6 WORKFLOW DIAGRAM AND CLOUD DEPLOYMENT<br/>&nbsp;&nbsp;4.7 SUMMARY", td_style), Paragraph("8<br/>8<br/>8<br/>9<br/>10<br/>10<br/>11<br/>11", td_style)],
        [Paragraph("<b>5.</b>", td_bold), Paragraph("<b>OBJECTIVES</b><br/>&nbsp;&nbsp;5.1 PRIMARY OBJECTIVE<br/>&nbsp;&nbsp;5.2 SPECIFIC ENGINEERING OBJECTIVES<br/>&nbsp;&nbsp;5.3 SECURITY, PRIVACY, AND RESPONSIBLE-AI CRITERIA<br/>&nbsp;&nbsp;5.4 SUMMARY", td_style), Paragraph("12<br/>12<br/>12<br/>12<br/>13", td_style)],
        [Paragraph("<b>6.</b>", td_bold), Paragraph("<b>SYSTEM DESIGN AND IMPLEMENTATION</b><br/>&nbsp;&nbsp;6.1 MODULE-WISE IMPLEMENTATION DETAILS<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.1.1 Authentication and Administrative Governance Module<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.1.2 Patient Cohort and Multi-Parameter Search Module<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.1.3 Priority-Driven Appointment Scheduler and Email Dispatch<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.1.4 Multi-Vital Clinical Intake and Dynamic Prescription Builder<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.1.5 Dual-Path Hybrid AI (AshaBot) and Deterministic Offline Engine<br/>&nbsp;&nbsp;6.2 DATABASE SCHEMA DESIGN AND ATTRIBUTES<br/>&nbsp;&nbsp;6.3 STATE TRANSITION MODELING<br/>&nbsp;&nbsp;6.4 ALGORITHMS AND FLOWCHART<br/>&nbsp;&nbsp;6.5 SUMMARY", td_style), Paragraph("14<br/>14<br/>14<br/>14<br/>14<br/>14<br/>14<br/>14<br/>16<br/>16<br/>16", td_style)],
        [Paragraph("<b>7.</b>", td_bold), Paragraph("<b>TIMELINE FOR EXECUTION OF PROJECT (GANTT CHART)</b><br/>&nbsp;&nbsp;7.1 PHASE-WISE DEVELOPMENT BREAKDOWN<br/>&nbsp;&nbsp;7.2 PROJECT EXECUTION SCHEDULE (GANTT CHART)<br/>&nbsp;&nbsp;7.3 WORK BREAKDOWN STRUCTURE<br/>&nbsp;&nbsp;7.4 SUMMARY", td_style), Paragraph("17<br/>17<br/>17<br/>17<br/>18", td_style)],
        [Paragraph("<b>8.</b>", td_bold), Paragraph("<b>OUTCOMES</b><br/>&nbsp;&nbsp;8.1 DELIVERED SOFTWARE ARTIFACTS<br/>&nbsp;&nbsp;8.2 MEASURABLE CLINICAL WORKFLOW OUTCOMES<br/>&nbsp;&nbsp;8.3 SYSTEM IMPACT AND FIELD READINESS<br/>&nbsp;&nbsp;8.4 SUMMARY", td_style), Paragraph("19<br/>19<br/>19<br/>19<br/>19", td_style)],
        [Paragraph("<b>9.</b>", td_bold), Paragraph("<b>RESULTS AND DISCUSSIONS</b><br/>&nbsp;&nbsp;9.1 EXPERIMENTAL SETUP AND ENVIRONMENT<br/>&nbsp;&nbsp;9.2 PERFORMANCE METRICS USED<br/>&nbsp;&nbsp;9.3 COMPARATIVE BENCHMARK RESULTS<br/>&nbsp;&nbsp;9.4 ANALYSIS AND INTERPRETATION OF RESULTS<br/>&nbsp;&nbsp;9.5 DISCUSSION ON OUTCOMES<br/>&nbsp;&nbsp;9.6 SUMMARY", td_style), Paragraph("20<br/>20<br/>20<br/>21<br/>21<br/>21<br/>22", td_style)],
        [Paragraph("<b>10.</b>", td_bold), Paragraph("<b>CONCLUSION AND FUTURE WORK</b><br/>&nbsp;&nbsp;10.1 SUMMARY OF CONTRIBUTIONS<br/>&nbsp;&nbsp;10.2 KEY FINDINGS<br/>&nbsp;&nbsp;10.3 LIMITATIONS OF THE STUDY<br/>&nbsp;&nbsp;10.4 SUGGESTIONS FOR FUTURE RESEARCH<br/>&nbsp;&nbsp;10.5 SUMMARY", td_style), Paragraph("23<br/>23<br/>23<br/>23<br/>24<br/>24", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>REFERENCES</b>", td_bold), Paragraph("25", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-A: PSEUDOCODE</b>", td_bold), Paragraph("27", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-B: SCREENSHOTS</b>", td_bold), Paragraph("28", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-C: ENCLOSURES</b>", td_bold), Paragraph("32", td_style)],
    ]
    t_toc = Table(toc_data, colWidths=[65, 385, 54])
    t_toc.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # ================= LIST OF FIGURES (Page ix) =================
    story.append(Paragraph("<b>LIST OF FIGURES</b>", chap_style))
    fig_data = [
        [Paragraph("<b>Sl. No.</b>", th_style), Paragraph("<b>Figure Name</b>", th_style), Paragraph("<b>Caption</b>", th_style), Paragraph("<b>Page No.</b>", th_style)],
        [Paragraph("1", td_style), Paragraph("Figure 4.1", td_bold), Paragraph("Three-Tier RESTful Client-Server Architectural Block Diagram", td_style), Paragraph("9", td_style)],
        [Paragraph("2", td_style), Paragraph("Figure 4.2", td_bold), Paragraph("End-to-End Authentication and Registration Sequence Diagram", td_style), Paragraph("10", td_style)],
        [Paragraph("3", td_style), Paragraph("Figure 4.3", td_bold), Paragraph("Hybrid Cloud-Offline AI Clinical-Support Flow", td_style), Paragraph("10", td_style)],
        [Paragraph("4", td_style), Paragraph("Figure 4.4", td_bold), Paragraph("Render Cloud Production Deployment Topology", td_style), Paragraph("11", td_style)],
        [Paragraph("5", td_style), Paragraph("Figure 6.1", td_bold), Paragraph("Entity-Relationship and Schema Association Architecture Diagram", td_style), Paragraph("14", td_style)],
        [Paragraph("6", td_style), Paragraph("Figure 6.2", td_bold), Paragraph("Appointment State Machine Transition Lifecycle Diagram", td_style), Paragraph("16", td_style)],
        [Paragraph("7", td_style), Paragraph("Figure 7.1", td_bold), Paragraph("Project Execution Schedule and Milestone Gantt Chart (July–November 2026)", td_style), Paragraph("17", td_style)],
        [Paragraph("8", td_style), Paragraph("Figure 7.2", td_bold), Paragraph("Clinical Workflow and Vitals Escalation Decision Tree", td_style), Paragraph("17", td_style)],
        [Paragraph("9", td_style), Paragraph("Figure 9.1", td_bold), Paragraph("System Operation Latency Benchmark and Synthetic Vignette Concordance", td_style), Paragraph("20", td_style)],
        [Paragraph("10", td_style), Paragraph("Figure B.1", td_bold), Paragraph("Worker and Administrator Sign-In Portal", td_style), Paragraph("28", td_style)],
        [Paragraph("11", td_style), Paragraph("Figure B.2", td_bold), Paragraph("Dedicated Admin Governance Dashboard (/admin)", td_style), Paragraph("28", td_style)],
        [Paragraph("12", td_style), Paragraph("Figure B.3", td_bold), Paragraph("Operational Field Analytics Dashboard", td_style), Paragraph("29", td_style)],
        [Paragraph("13", td_style), Paragraph("Figure B.4", td_bold), Paragraph("Citizen Registry and Multi-Field Search View", td_style), Paragraph("29", td_style)],
        [Paragraph("14", td_style), Paragraph("Figure B.5", td_bold), Paragraph("Priority-Driven Appointment Management View with Email Dispatch", td_style), Paragraph("30", td_style)],
        [Paragraph("15", td_style), Paragraph("Figure B.6", td_bold), Paragraph("Multi-Vital Clinical Documentation and Health Records View", td_style), Paragraph("30", td_style)],
        [Paragraph("16", td_style), Paragraph("Figure B.7", td_bold), Paragraph("AshaBot Frontline Clinical Decision Support Interface", td_style), Paragraph("31", td_style)],
        [Paragraph("17", td_style), Paragraph("Figure C.1", td_bold), Paragraph("IEEE Conference Acceptance Proof (ICAIDS-PM-26, Kuala Lumpur, Malaysia)", td_style), Paragraph("32", td_style)],
        [Paragraph("18", td_style), Paragraph("Figure C.2", td_bold), Paragraph("Paperpal Online Plagiarism Check Report (Verified 6% Similarity)", td_style), Paragraph("33", td_style)],
    ]
    t_fig = Table(fig_data, colWidths=[35, 65, 350, 54])
    t_fig.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_fig)
    story.append(PageBreak())

    # ================= LIST OF TABLES (Page x) =================
    story.append(Paragraph("<b>LIST OF TABLES</b>", chap_style))
    tab_data = [
        [Paragraph("<b>Sl. No.</b>", th_style), Paragraph("<b>Table Name</b>", th_style), Paragraph("<b>Table Caption</b>", th_style), Paragraph("<b>Page No.</b>", th_style)],
        [Paragraph("1", td_style), Paragraph("Table 1.1", td_bold), Paragraph("Paper-Based Field Bottlenecks and Corresponding Platform Capabilities", td_style), Paragraph("2", td_style)],
        [Paragraph("2", td_style), Paragraph("Table 2.1", td_bold), Paragraph("Literature Review Synthesis and Existing System Comparison Matrix", td_style), Paragraph("4", td_style)],
        [Paragraph("3", td_style), Paragraph("Table 2.2", td_bold), Paragraph("Hybrid AI Design Opportunity and Safety Boundary", td_style), Paragraph("5", td_style)],
        [Paragraph("4", td_style), Paragraph("Table 3.1", td_bold), Paragraph("Comparative Gap Analysis of Legacy mHealth Systems vs. Proposed Platform", td_style), Paragraph("6", td_style)],
        [Paragraph("5", td_style), Paragraph("Table 4.1", td_bold), Paragraph("Complete Technology Stack and System Tooling Specification", td_style), Paragraph("8", td_style)],
        [Paragraph("6", td_style), Paragraph("Table 4.2", td_bold), Paragraph("Hardware, Cloud Hosting, and Software Runtime Environment Specifications", td_style), Paragraph("8", td_style)],
        [Paragraph("7", td_style), Paragraph("Table 4.3", td_bold), Paragraph("Hybrid AI Components, Inputs, Outputs, and Controls", td_style), Paragraph("10", td_style)],
        [Paragraph("8", td_style), Paragraph("Table 5.1", td_bold), Paragraph("Project Objectives and Engineering Success Criteria", td_style), Paragraph("12", td_style)],
        [Paragraph("9", td_style), Paragraph("Table 6.1", td_bold), Paragraph("User Collection Schema Attributes and Constraints", td_style), Paragraph("15", td_style)],
        [Paragraph("10", td_style), Paragraph("Table 6.2", td_bold), Paragraph("Patient Collection Schema Attributes and Constraints", td_style), Paragraph("15", td_style)],
        [Paragraph("11", td_style), Paragraph("Table 6.3", td_bold), Paragraph("Appointment Collection Schema Attributes and Constraints", td_style), Paragraph("15", td_style)],
        [Paragraph("12", td_style), Paragraph("Table 6.4", td_bold), Paragraph("Health Record Collection Schema and Embedded Subdocuments", td_style), Paragraph("15", td_style)],
        [Paragraph("13", td_style), Paragraph("Table 6.5", td_bold), Paragraph("AI Conversation Schema and Retention Controls", td_style), Paragraph("16", td_style)],
        [Paragraph("14", td_style), Paragraph("Table 7.1", td_bold), Paragraph("Milestone Work Breakdown Structure and Deliverable Schedule", td_style), Paragraph("17", td_style)],
        [Paragraph("15", td_style), Paragraph("Table 8.1", td_bold), Paragraph("Delivered Software Modules and Implementation Scope", td_style), Paragraph("19", td_style)],
        [Paragraph("16", td_style), Paragraph("Table 8.2", td_bold), Paragraph("Field Operational Metric Comparison (Paper vs. Platform)", td_style), Paragraph("19", td_style)],
        [Paragraph("17", td_style), Paragraph("Table 9.1", td_bold), Paragraph("End-to-End System Test Cases and Functional Verification Matrix", td_style), Paragraph("20", td_style)],
        [Paragraph("18", td_style), Paragraph("Table 9.2", td_bold), Paragraph("Latency and Response-Time Benchmarks", td_style), Paragraph("20", td_style)],
        [Paragraph("19", td_style), Paragraph("Table 9.3", td_bold), Paragraph("Synthetic Clinical Vignette Concordance Analysis", td_style), Paragraph("21", td_style)],
        [Paragraph("20", td_style), Paragraph("Table C.1", td_bold), Paragraph("Mapping of Project Capabilities to UN Sustainable Development Goals (SDGs)", td_style), Paragraph("33", td_style)],
    ]
    t_tab = Table(tab_data, colWidths=[35, 65, 350, 54])
    t_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_tab)
    story.append(PageBreak())

    # ================= ABBREVIATIONS (Page xi) =================
    story.append(Paragraph("<b>ABBREVIATIONS</b>", chap_style))
    abbr_data = [
        [Paragraph("<b>Abbreviation</b>", th_style), Paragraph("<b>Full Form</b>", th_style), Paragraph("<b>Abbreviation</b>", th_style), Paragraph("<b>Full Form</b>", th_style)],
        [Paragraph("ABDM", td_bold), Paragraph("Ayushman Bharat Digital Mission", td_style), Paragraph("ABHA", td_bold), Paragraph("Ayushman Bharat Health Account", td_style)],
        [Paragraph("ANC", td_bold), Paragraph("Antenatal Care", td_style), Paragraph("ANM", td_bold), Paragraph("Auxiliary Nurse Midwife", td_style)],
        [Paragraph("API", td_bold), Paragraph("Application Programming Interface", td_style), Paragraph("ASHA", td_bold), Paragraph("Accredited Social Health Activist", td_style)],
        [Paragraph("BOLA", td_bold), Paragraph("Broken Object Level Authorization", td_style), Paragraph("BSON", td_bold), Paragraph("Binary JavaScript Object Notation", td_style)],
        [Paragraph("CHC", td_bold), Paragraph("Community Health Center", td_style), Paragraph("CHW", td_bold), Paragraph("Community Health Worker", td_style)],
        [Paragraph("CORS", td_bold), Paragraph("Cross-Origin Resource Sharing", td_style), Paragraph("CSP", td_bold), Paragraph("Content Security Policy", td_style)],
        [Paragraph("DPDP", td_bold), Paragraph("Digital Personal Data Protection", td_style), Paragraph("EHR", td_bold), Paragraph("Electronic Health Record", td_style)],
        [Paragraph("FHIR", td_bold), Paragraph("Fast Healthcare Interoperability Resources", td_style), Paragraph("HFR", td_bold), Paragraph("Health Facility Registry", td_style)],
        [Paragraph("HIS", td_bold), Paragraph("Hospital Information System", td_style), Paragraph("HL7", td_bold), Paragraph("Health Level Seven", td_style)],
        [Paragraph("HMAC", td_bold), Paragraph("Hash-Based Message Authentication Code", td_style), Paragraph("HPR", td_bold), Paragraph("Healthcare Professionals Registry", td_style)],
        [Paragraph("HSC", td_bold), Paragraph("Health Sub-Center", td_style), Paragraph("HTTPS", td_bold), Paragraph("HyperText Transfer Protocol Secure", td_style)],
        [Paragraph("JWT", td_bold), Paragraph("JSON Web Token", td_style), Paragraph("LMIC", td_bold), Paragraph("Low- and Middle-Income Countries", td_style)],
        [Paragraph("MERN", td_bold), Paragraph("MongoDB, Express.js, React.js, Node.js", td_style), Paragraph("NCD", td_bold), Paragraph("Non-Communicable Disease", td_style)],
        [Paragraph("NHA", td_bold), Paragraph("National Health Authority", td_style), Paragraph("NIST", td_bold), Paragraph("National Institute of Standards & Technology", td_style)],
        [Paragraph("NRHM", td_bold), Paragraph("National Rural Health Mission", td_style), Paragraph("ODM", td_bold), Paragraph("Object Data Mapper", td_style)],
        [Paragraph("OTP", td_bold), Paragraph("One-Time Password", td_style), Paragraph("OWASP", td_bold), Paragraph("Open Worldwide Application Security Project", td_style)],
        [Paragraph("PHC", td_bold), Paragraph("Primary Health Center", td_style), Paragraph("PNC", td_bold), Paragraph("Postnatal Care", td_style)],
        [Paragraph("PWA", td_bold), Paragraph("Progressive Web Application", td_style), Paragraph("RBAC", td_bold), Paragraph("Role-Based Access Control", td_style)],
        [Paragraph("ReDoS", td_bold), Paragraph("Regular Expression Denial of Service", td_style), Paragraph("REST", td_bold), Paragraph("Representational State Transfer", td_style)],
        [Paragraph("SMTP", td_bold), Paragraph("Simple Mail Transfer Protocol", td_style), Paragraph("SPA", td_bold), Paragraph("Single-Page Application", td_style)],
        [Paragraph("SpO2", td_bold), Paragraph("Peripheral Capillary Oxygen Saturation", td_style), Paragraph("SRS", td_bold), Paragraph("Software Requirements Specification", td_style)],
        [Paragraph("TLS", td_bold), Paragraph("Transport Layer Security", td_style), Paragraph("TTL", td_bold), Paragraph("Time-To-Live", td_style)],
        [Paragraph("WHO", td_bold), Paragraph("World Health Organization", td_style), Paragraph("XSS", td_bold), Paragraph("Cross-Site Scripting", td_style)],
    ]
    t_abbr = Table(abbr_data, colWidths=[55, 197, 55, 197])
    t_abbr.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_abbr)
    story.append(PageBreak())

    # ================= CHAPTER 1 (Starts Page 1) =================
    story.append(SetChapter1PageMarker())
    story.append(Paragraph("<b>CHAPTER 1: INTRODUCTION</b>", chap_style))
    story.append(Paragraph("1.1 BACKGROUND AND MOTIVATION", sec_style))
    story.append(Paragraph(
        "Community health workers (CHWs) constitute the cornerstone of universal healthcare access in developing economies, operating at the direct boundary between marginalized citizen populations and institutional health facilities (Agarwal et al., 2015 [1]). Within India's National Rural Health Mission (NRHM) and overarching National Health Mission (NHM), this frontline workforce is predominantly embodied by Accredited Social Health Activists (ASHAs) (Kumar et al., 2017 [2]). Working collaboratively with Auxiliary Nurse Midwives (ANMs) and Primary Health Center (PHC) medical officers, ASHAs deliver vital maternal, child, and preventive health services across rural and semi-urban habitations. Despite their criticality, these frontline cadres continue to rely heavily on physical paper registers and unformatted logbooks, creating severe bottlenecks in timely record retrieval, longitudinal tracking, and clinical danger sign escalation.", body_style
    ))
    
    story.append(Paragraph("1.2 SCOPE AND LIMITATIONS", sec_style))
    story.append(Paragraph(
        "The scope of this project encompasses the design, development, and cloud deployment of the <b>Community Health Worker (CHW) Assistance Platform</b>, an auditable, lightweight full-stack healthcare operating system deployed on Render cloud infrastructure (<code>https://community-healthworker-assistance.onrender.com/login</code>). The platform provides: (1) two-role Role-Based Access Control (<b>ADMIN</b> and <b>WORKER</b>) with compulsory unique ASHA Worker Field ID / Employee ID onboarding; (2) email-based six-digit OTP verification powered by Brevo HTTPS API with 600-second TTL security; (3) sub-40 ms indexed multi-parameter citizen search across name, phone, and village; (4) four-tier prioritized visit scheduling with automated patient email notifications upon appointment booking; (5) structured multi-vital clinical documentation capturing 7 physiological metrics with dynamic multi-item prescription logging; (6) dual-path hybrid AI decision assistance integrating Google Gemini LLM for cloud triage and a zero-network deterministic offline parser (4.2 ms execution); and (7) interactive Administrative Governance Panel for personnel verification, approval, role toggling, and real-time operational metric tracking.<br/><br/>"
        "Limitations of the current implementation include English-language web interface (vernacular Kannada/Hindi pending future work), absence of direct SMS gateway integration, and pending formal ABDM sandbox interoperability.", body_style
    ))
    
    story.append(Paragraph("1.3 PROBLEM STATEMENT", sec_style))
    story.append(Paragraph(
        "Frontline community health workers in India face four structural operational challenges: (1) record degradation and physical loss during field transit; (2) high record retrieval latency taking 5 to 15 minutes per household encounter (Paul et al., 2026 [7]); (3) missed longitudinal encounters due to fragmented notebooks; and (4) delayed vital signs triage leading to unmanaged emergencies.", body_style
    ))
    
    story.append(Paragraph("<b>Table 1.1: Paper-Based Field Bottlenecks and Corresponding Platform Capabilities</b>", table_caption))
    t1_data = [
        [Paragraph("<b>Operational Dimension</b>", th_style), Paragraph("<b>Physical Paper Logbooks</b>", th_style), Paragraph("<b>Community Health Worker Platform</b>", th_style)],
        [Paragraph("Record Permanence", td_bold), Paragraph("Susceptible to environmental degradation, rain, and page tearing.", td_style), Paragraph("Persistent MongoDB BSON document storage with structured audit trails.", td_style)],
        [Paragraph("Retrieval Latency", td_bold), Paragraph("Manual linear search across registers taking 5 to 15 minutes.", td_style), Paragraph("Sub-second case-insensitive regex query across name, phone, or village (<40 ms).", td_style)],
        [Paragraph("Encounter Scheduling", td_bold), Paragraph("Disconnected diary notes leading to missed antenatal/vaccine dates.", td_style), Paragraph("Four-tier prioritized appointment scheduler with automated patient email confirmation.", td_style)],
        [Paragraph("Diagnostic Records", td_bold), Paragraph("Handwritten vital entries prone to illegibility and missing alert cues.", td_style), Paragraph("Structured multi-vital capture interface with color-coded threshold alerts.", td_style)],
        [Paragraph("Prescription Safety", td_bold), Paragraph("Unformatted dosage notes lacking frequency and duration clarity.", td_style), Paragraph("Dynamic multi-item prescription builder recording drug, dose, and schedule.", td_style)],
        [Paragraph("Administrative Oversight", td_bold), Paragraph("Labor-intensive manual monthly counting across multiple ledgers.", td_style), Paragraph("Automated operational dashboard aggregating cohort and visit metrics live.", td_style)],
    ]
    t1_tab = Table(t1_data, colWidths=[100, 200, 204])
    t1_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t1_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As synthesized in Table 1.1, the platform systematically maps each manual field deficiency into a robust digital capability.", body_style))

    story.append(Paragraph("1.4 MOTIVATION", sec_style))
    story.append(Paragraph(
        "Frontline cadres expend 30% to 40% of their active duty hours copying demographic entries across redundant paper registers. Digitizing patient intake, longitudinal vital tracking, and visit scheduling reclaims substantial operational capacity for direct household counseling. Beneficiaries include Frontline Health Workers (ASHAs and ANMs), Rural and Semi-Urban Patient Cohorts, and PHC Medical Officers/Supervisors via an interactive Admin Panel.", body_style
    ))
    
    story.append(Paragraph("1.5 METHODOLOGY OVERVIEW", sec_style))
    story.append(Paragraph(
        "The engineering methodology follows an agile, incremental software development lifecycle comprising requirements specification, schema modeling, RESTful service implementation, reactive SPA presentation design, security hardening, and synthetic clinical validation.", body_style
    ))
    
    story.append(Paragraph("1.6 ORGANIZATION OF THE THESIS", sec_style))
    story.append(Paragraph(
        "This report is organized into ten comprehensive chapters detailing literature survey, gaps, methodology, objectives, architecture, implementation, experimental results, project timeline, and conclusions.", body_style
    ))
    story.append(PageBreak())

    # ================= CHAPTER 2 =================
    story.append(Paragraph("<b>CHAPTER 2: LITERATURE SURVEY</b>", chap_style))
    story.append(Paragraph("2.1 INTRODUCTION TO RELATED WORK", sec_style))
    story.append(Paragraph(
        "Mobile health (mHealth) interventions have progressed from simple one-way SMS reminders to complex clinical data-capture applications (Braun et al., 2013 [4]; Agarwal et al., 2015 [1]). Early frontline deployments demonstrated that digital intake forms significantly reduce missing values compared to paper logbooks.", body_style
    ))
    
    story.append(Paragraph("2.2 SURVEY OF EXISTING SYSTEMS", sec_style))
    story.append(Paragraph(
        "Recent empirical evaluations by Charanthimath et al. (2021) [3] in rural Karnataka and Paul et al. (2026) [7] in Assam demonstrate that frontline workers face severe cognitive fatigue during home visits. Complex desktop layouts and deep menus fail in field conditions, emphasizing the need for a unified, responsive single-page architecture with sub-second response times.", body_style
    ))
    
    story.append(Paragraph("<b>Table 2.1: Literature Review Synthesis and Existing System Comparison Matrix</b>", table_caption))
    t2_data = [
        [Paragraph("<b>Study & Year</b>", th_style), Paragraph("<b>Target Cohort</b>", th_style), Paragraph("<b>Architecture</b>", th_style), Paragraph("<b>Key Contribution</b>", th_style), Paragraph("<b>Identified Gaps</b>", th_style)],
        [Paragraph("Agarwal et al. (2015) [1]", td_bold), Paragraph("CHWs in LMICs", td_style), Paragraph("SMS & Android", td_style), Paragraph("Review on mHealth feasibility", td_style), Paragraph("High dropout rates", td_style)],
        [Paragraph("Charanthimath (2021) [3]", td_bold), Paragraph("Karnataka, India", td_style), Paragraph("Native Android", td_style), Paragraph("Maternal tracking in PHCs", td_style), Paragraph("Proprietary hardware needed", td_style)],
        [Paragraph("Braun et al. (2013) [4]", td_bold), Paragraph("Global Cadres", td_style), Paragraph("Mobile Surveys", td_style), Paragraph("Frontline mobile synthesis", td_style), Paragraph("Data entry latency high", td_style)],
        [Paragraph("Paul et al. (2026) [7]", td_bold), Paragraph("Assam, India", td_style), Paragraph("Web/Mobile", td_style), Paragraph("Adoption perception survey", td_style), Paragraph("Absent offline triage", td_style)],
        [Paragraph("CommCare (2020) [16]", td_bold), Paragraph("Field Cadres", td_style), Paragraph("XML Form Engine", td_style), Paragraph("Configurable logic builder", td_style), Paragraph("Rigid hierarchical menus", td_style)],
        [Paragraph("OpenSRP (2022) [17]", td_bold), Paragraph("Maternal Health", td_style), Paragraph("Native Client", td_style), Paragraph("Smart register for national health", td_style), Paragraph("Heavy storage footprint", td_style)],
    ]
    t2_tab = Table(t2_data, colWidths=[95, 80, 85, 125, 119])
    t2_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t2_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As summarized in Table 2.1, existing systems either demand heavy proprietary hardware or lack sub-second search and hybrid offline clinical support.", body_style))

    story.append(Paragraph("2.3 RESEARCH GAPS IDENTIFIED", sec_style))
    story.append(Paragraph(
        "Critical analysis reveals three acute research gaps: (1) lack of lightweight reactive single-page applications accessible on low-cost devices; (2) rigid segregation between physiological vital logging and dynamic prescription generation; and (3) total vulnerability of cloud-only conversational AI assistants to rural cellular connectivity dropouts.", body_style
    ))
    
    story.append(Paragraph("2.4 OBJECTIVES OF THE STUDY", sec_style))
    story.append(Paragraph(
        "The study seeks to address these gaps by developing a resilient, web-first platform with dual-path clinical intelligence.", body_style
    ))
    story.append(Paragraph("<b>Table 2.2: Hybrid AI Design Opportunity and Safety Boundary</b>", table_caption))
    t22_data = [
        [Paragraph("<b>Capability</b>", th_style), Paragraph("<b>Cloud Path (Connected)</b>", th_style), Paragraph("<b>Offline Path (Deterministic)</b>", th_style), Paragraph("<b>Safety Boundary</b>", th_style)],
        [Paragraph("Context Organization", td_bold), Paragraph("Summarizes worker query & vitals.", td_style), Paragraph("Returns concise template triage cue.", td_style), Paragraph("Minimum clinical data transmitted.", td_style)],
        [Paragraph("Danger Recognition", td_bold), Paragraph("Mandates urgent escalation tag.", td_style), Paragraph("Evaluates explicit BP, SpO2, temp thresholds.", td_style), Paragraph("Serves as triage cue, never diagnosis.", td_style)],
        [Paragraph("Uncertainty Handling", td_bold), Paragraph("States uncertainty & advises review.", td_style), Paragraph("Incomplete inputs trigger limitation note.", td_style), Paragraph("Human worker retains full authority.", td_style)],
    ]
    t22_tab = Table(t22_data, colWidths=[90, 138, 138, 138])
    t22_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t22_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 2.2 delineates the operational boundaries ensuring patient safety across both online and offline triage execution.", body_style))

    story.append(Paragraph("2.5 SUMMARY", sec_style))
    story.append(Paragraph("The literature survey establishes the urgent necessity for a lightweight, secure MERN platform combining sub-40 ms patient search with bounded, fail-safe clinical triage.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 3 =================
    story.append(Paragraph("<b>CHAPTER 3: RESEARCH GAPS OF EXISTING METHODS</b>", chap_style))
    story.append(Paragraph("3.1 STRUCTURAL AND ARCHITECTURAL DEFICIENCIES", sec_style))
    story.append(Paragraph(
        "Legacy mHealth solutions exhibit a sharp dichotomy: either heavyweight enterprise Hospital Information Systems (HIS) with deep multi-level navigation that overwhelm frontline cadres, or flat survey tools lacking longitudinal relational data linking.", body_style
    ))
    story.append(Paragraph("3.2 CLINICAL WORKFLOW AND VITALS INTEGRATION GAPS", sec_style))
    story.append(Paragraph(
        "Existing mobile register apps treat physiological vitals as passive isolated text inputs rather than active clinical drivers. Vital signs, appointment schedules, and prescriptions exist in siloed modules, forcing workers to execute redundant navigation during home visits.", body_style
    ))
    story.append(Paragraph("3.3 CONNECTIVITY, LATENCY, AND AI SAFETY BOUNDARIES", sec_style))
    story.append(Paragraph(
        "Emerging generative AI clinical chatbots (Singhal et al., 2023 [13]; Google DeepMind, 2023 [14]) offer conversational assistance but rely entirely on constant high-bandwidth internet connectivity. In rural sub-centers, network drops result in complete application freeze. Furthermore, unconstrained LLMs pose hallucination risks unless bounded by strict system prompts and deterministic offline fallbacks.", body_style
    ))
    story.append(Paragraph("3.4 COMPARATIVE GAP ANALYSIS", sec_style))
    story.append(Paragraph("<b>Table 3.1: Comparative Gap Analysis of Legacy mHealth Systems vs. Proposed Platform</b>", table_caption))
    t3_data = [
        [Paragraph("<b>Evaluation Criterion</b>", th_style), Paragraph("<b>Paper Registers</b>", th_style), Paragraph("<b>Legacy Survey mHealth</b>", th_style), Paragraph("<b>Cloud-Only AI</b>", th_style), Paragraph("<b>Proposed CHW Platform</b>", th_style)],
        [Paragraph("Patient Record Search", td_bold), Paragraph("Manual scan (5–15 min)", td_style), Paragraph("Slow flat-file filtering", td_style), Paragraph("Not supported natively", td_style), Paragraph("Indexed regex (<40 ms)", td_bold)],
        [Paragraph("Vitals & Rx Integration", td_bold), Paragraph("Unstructured handwriting", td_style), Paragraph("Separate static forms", td_style), Paragraph("Free-text chat only", td_style), Paragraph("Unified 7-vital + Rx schema", td_bold)],
        [Paragraph("Appointment Lifecycle", td_bold), Paragraph("Static diary notes", td_style), Paragraph("Basic date reminders", td_style), Paragraph("None", td_style), Paragraph("4-tier priority + 4-state FSM", td_bold)],
        [Paragraph("Offline Triage Continuity", td_bold), Paragraph("Manual worker recall", td_style), Paragraph("Static form caching", td_style), Paragraph("Fails completely offline", td_style), Paragraph("Deterministic parser (4.2 ms)", td_bold)],
        [Paragraph("Privacy & Access Control", td_bold), Paragraph("Physical theft risk", td_style), Paragraph("Basic password login", td_style), Paragraph("High PII exposure risk", td_style), Paragraph("OTP + Bcrypt + JWT + Admin Queue", td_bold)],
    ]
    t3_tab = Table(t3_data, colWidths=[90, 100, 102, 102, 110])
    t3_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t3_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As evidenced in Table 3.1, the proposed Community Health Worker Assistance Platform bridges critical gaps in search speed, clinical integration, offline continuity, and access governance.", body_style))
    story.append(Paragraph("3.5 SUMMARY", sec_style))
    story.append(Paragraph("The comparative analysis substantiates the engineering need for a unified, secure MERN platform featuring sub-40 ms search, automated notifications, and deterministic offline clinical triage.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 4 =================
    story.append(Paragraph("<b>CHAPTER 4: PROPOSED METHODOLOGY</b>", chap_style))
    story.append(Paragraph("4.1 METHODOLOGY OUTLINE", sec_style))
    story.append(Paragraph(
        "The proposed platform implements a modern three-tier client-server architecture built on the MERN stack (MongoDB, Express.js, React 18, Node.js). The methodology prioritizes sub-second field responsiveness, strict two-role access control, data privacy, and deterministic clinical continuity.", body_style
    ))
    story.append(Paragraph("4.2 TOOLS, TECHNOLOGIES, PLATFORMS USED", sec_style))
    story.append(Paragraph("<b>Table 4.1: Complete Technology Stack and System Tooling Specification</b>", table_caption))
    t41_data = [
        [Paragraph("<b>Layer / Dimension</b>", th_style), Paragraph("<b>Technology / Library</b>", th_style), Paragraph("<b>Version</b>", th_style), Paragraph("<b>Role in Architecture</b>", th_style)],
        [Paragraph("Presentation Tier", td_bold), Paragraph("React.js (Single-Page App)", td_style), Paragraph("18.2.0", td_style), Paragraph("Responsive field user interface", td_style)],
        [Paragraph("Build Tool & Bundler", td_bold), Paragraph("Vite", td_style), Paragraph("5.1.0", td_style), Paragraph("Sub-second HMR and production bundling", td_style)],
        [Paragraph("Client Routing", td_bold), Paragraph("React Router DOM", td_style), Paragraph("6.22.0", td_style), Paragraph("Protected client-side role-based routing", td_style)],
        [Paragraph("Application Tier", td_bold), Paragraph("Node.js Runtime & Express.js", td_style), Paragraph("20.x / 5.0", td_style), Paragraph("RESTful API controllers & middleware pipeline", td_style)],
        [Paragraph("Persistence Tier", td_bold), Paragraph("MongoDB Atlas Cloud", td_style), Paragraph("8.0.x", td_style), Paragraph("Scalable cloud document database", td_style)],
        [Paragraph("Object Data Modeling", td_bold), Paragraph("Mongoose ODM", td_style), Paragraph("8.2.0", td_style), Paragraph("Schema enforcement, indexes, and hooks", td_style)],
        [Paragraph("Authentication & Hash", td_bold), Paragraph("JSON Web Tokens & Bcrypt.js", td_style), Paragraph("9.0.2 / 2.4.3", td_style), Paragraph("HMAC-SHA256 session tokens & salted hashing", td_style)],
        [Paragraph("Email Dispatch Engine", td_bold), Paragraph("Brevo HTTPS REST API", td_style), Paragraph("v3", td_style), Paragraph("Transactional OTP & appointment emails", td_style)],
        [Paragraph("Cloud AI Clinical Engine", td_bold), Paragraph("Google Gemini API (gemini-pro)", td_style), Paragraph("v1beta", td_style), Paragraph("Constrained cloud-based triage cues", td_style)],
        [Paragraph("Offline Decision Engine", td_bold), Paragraph("Custom JavaScript Parser", td_style), Paragraph("v1.0.0", td_style), Paragraph("Deterministic 4.2 ms local vital triage fallback", td_style)],
    ]
    t41_tab = Table(t41_data, colWidths=[105, 140, 65, 194])
    t41_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t41_tab)
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("4.3 PROPOSED ARCHITECTURE", sec_style))
    story.append(Paragraph(
        "The system separates responsibilities into three distinct physical and logical layers: Presentation Tier, Application Tier, and Persistence Tier.", body_style
    ))
    f41 = make_flowable_image("docs/figures/image3.jpg", max_width=320, max_height=180)
    if f41:
        story.append(f41)
        story.append(Paragraph("Figure 4.1: Three-Tier RESTful Client-Server Architectural Block Diagram", fig_caption))
    story.append(Paragraph("As illustrated in Figure 4.1, client requests originate from the React SPA, authenticate through the Express middleware pipeline, and execute business logic against MongoDB Atlas.", body_style))
    story.append(PageBreak())

    story.append(Paragraph("4.4 OPERATIONAL SECURITY AND AUTHENTICATION ARCHITECTURE", sec_style))
    story.append(Paragraph(
        "The authentication workflow enforces compulsory unique <code>workerId</code> onboarding and 6-digit OTP email verification with 600-second TTL expiration.", body_style
    ))
    f42 = make_flowable_image("docs/figures/image4.jpg", max_width=320, max_height=175)
    if f42:
        story.append(f42)
        story.append(Paragraph("Figure 4.2: End-to-End Authentication and Registration Sequence Diagram", fig_caption))
    story.append(Paragraph("As depicted in Figure 4.2, newly registered users remain in an inactive state (`isApproved: false, status: 'INACTIVE'`) until verified and approved by an administrator via the Admin Governance Panel (`/admin`).", body_style))

    story.append(Paragraph("4.5 HYBRID GENAI AND OFFLINE TRIAGE METHODOLOGY", sec_style))
    story.append(Paragraph(
        "To guarantee clinical continuity regardless of connectivity, the platform implements a dual-path architecture.", body_style
    ))
    f43 = make_flowable_image("docs/figures/image5.jpg", max_width=420, max_height=165)
    if f43:
        story.append(f43)
        story.append(Paragraph("Figure 4.3: Hybrid Cloud-Offline AI Clinical-Support Flow", fig_caption))
    
    story.append(Paragraph("<b>Table 4.3: Hybrid AI Components, Inputs, Outputs, and Controls</b>", table_caption))
    t43_data = [
        [Paragraph("<b>Component</b>", th_style), Paragraph("<b>Primary Inputs</b>", th_style), Paragraph("<b>Generated Outputs</b>", th_style), Paragraph("<b>Safety & Governance Controls</b>", th_style)],
        [Paragraph("Cloud Assistant (AshaBot)", td_bold), Paragraph("Worker query, age, gender, 7 vitals", td_style), Paragraph("Tagged triage cue (`[TRIAGE: URGENT / MODERATE / ROUTINE]`)", td_style), Paragraph("Strict prompt restricting advice to escalation boundaries", td_style)],
        [Paragraph("Offline Rule Engine", td_bold), Paragraph("Systolic/diastolic BP, SpO2, temp, keywords", td_style), Paragraph("Deterministic triage cue + recommended referral action", td_style), Paragraph("Hardcoded physiological thresholds; executes in 4.2 ms", td_style)],
    ]
    t43_tab = Table(t43_data, colWidths=[100, 120, 140, 144])
    t43_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t43_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As detailed in Figure 4.3 and Table 4.3, clinical queries seamlessly fall back to the deterministic local engine upon network timeout.", body_style))

    story.append(Paragraph("4.6 WORKFLOW DIAGRAM AND CLOUD DEPLOYMENT", sec_style))
    story.append(Paragraph(
        "The application is deployed live on Render PaaS with TLS 1.3 encryption and automated database health checks.", body_style
    ))
    f44 = make_flowable_image("docs/figures/image6.png", max_width=420, max_height=145)
    if f44:
        story.append(f44)
        story.append(Paragraph("Figure 4.4: Render Cloud Production Deployment Topology", fig_caption))
    story.append(Paragraph("Figure 4.4 illustrates the production deployment topology linking client devices, Render web services, Brevo email infrastructure, Google Gemini APIs, and MongoDB Atlas.", body_style))
    story.append(Paragraph("4.7 SUMMARY", sec_style))
    story.append(Paragraph("The methodology provides an auditable, secure, and fail-safe full-stack digital health architecture tailored to frontline community environments.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 5 =================
    story.append(Paragraph("<b>CHAPTER 5: OBJECTIVES</b>", chap_style))
    story.append(Paragraph("5.1 PRIMARY OBJECTIVE", sec_style))
    story.append(Paragraph(
        "The primary objective of this project is to architect, develop, validate, and deploy a responsive web-first digital health system tailored to frontline community healthcare workers (ASHAs and ANMs) that replaces paper-based registers with an auditable, sub-second digital workflow and bounded hybrid clinical decision support.", body_style
    ))
    story.append(Paragraph("5.2 SPECIFIC ENGINEERING OBJECTIVES", sec_style))
    story.append(Paragraph(
        "1. <b>Digital Citizen Registry:</b> Implement a persistent demographic and clinical database supporting sub-40 ms multi-field regex search across name, phone, and village.<br/>"
        "2. <b>Prioritized Appointment Scheduling:</b> Develop a four-tier priority visit scheduler with automated patient email dispatch confirming date, time, and location.<br/>"
        "3. <b>Structured Multi-Vital Documentation:</b> Create an interactive clinical intake module logging 7 vital signs with color-coded threshold alerts and dynamic prescription builder.<br/>"
        "4. <b>Layered Access Governance:</b> Implement a strict two-role model (<b>ADMIN</b> and <b>WORKER</b>) with compulsory unique <code>workerId</code> onboarding, 6-digit OTP verification, and administrative approval queues.<br/>"
        "5. <b>Bounded Dual-Path Clinical Triage:</b> Integrate Google Gemini for cloud clinical guidance and a deterministic local parser for 4.2 ms zero-network offline triage.<br/>"
        "6. <b>Cloud Production Deployment:</b> Host the unified application on Render cloud infrastructure with SSL/TLS encryption.", body_style
    ))
    story.append(Paragraph("5.3 SECURITY, PRIVACY, AND RESPONSIBLE-AI CRITERIA", sec_style))
    story.append(Paragraph("<b>Table 5.1: Project Objectives and Engineering Success Criteria</b>", table_caption))
    t51_data = [
        [Paragraph("<b>Objective Area</b>", th_style), Paragraph("<b>Technical Target</b>", th_style), Paragraph("<b>Verification Metric & Method</b>", th_style)],
        [Paragraph("Patient Record Retrieval", td_bold), Paragraph("Mean search latency < 200 ms", td_style), Paragraph("Benchmark recorded <b>38.4 ms</b> via indexed regex", td_style)],
        [Paragraph("Authentication Security", td_bold), Paragraph("Salted passwords + TTL OTPs", td_style), Paragraph("10-round bcrypt + 600 s MongoDB TTL index", td_style)],
        [Paragraph("Administrative Control", td_bold), Paragraph("Zero unauthorized clinical access", td_style), Paragraph("Unapproved accounts blocked (`HTTP 403 Forbidden`)", td_style)],
        [Paragraph("Appointment Dispatch", td_bold), Paragraph("Instant email confirmation", td_style), Paragraph("Brevo HTTPS delivery with verified MessageId", td_style)],
        [Paragraph("Offline Triage Continuity", td_bold), Paragraph("Sub-10 ms local execution", td_style), Paragraph("Benchmark recorded <b>4.2 ms</b> zero-network latency", td_style)],
        [Paragraph("Cloud/Offline Concordance", td_bold), Paragraph("> 90% agreement on danger signs", td_style), Paragraph("Achieved <b>96.0% (48/50)</b> on synthetic clinical vignettes", td_style)],
    ]
    t51_tab = Table(t51_data, colWidths=[120, 140, 244])
    t51_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t51_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As validated in Table 5.1, all specific engineering targets were fully satisfied during prototype benchmarking.", body_style))
    story.append(Paragraph("5.4 SUMMARY", sec_style))
    story.append(Paragraph("The project objectives address frontline operational pain points through rigorous software engineering, security hardening, and clinical safety boundaries.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 6 =================
    story.append(Paragraph("<b>CHAPTER 6: SYSTEM DESIGN AND IMPLEMENTATION</b>", chap_style))
    story.append(Paragraph("6.1 MODULE-WISE IMPLEMENTATION DETAILS", sec_style))
    story.append(Paragraph(
        "The platform is organized into five core cohesive functional modules:<br/>"
        "• <b>6.1.1 Authentication and Administrative Governance Module:</b> Manages worker onboarding, role assignment (`ADMIN` vs. `WORKER`), compulsory unique `workerId` verification, Brevo-powered 6-digit OTP dispatch, bcrypt password hashing, and administrative approval gates.<br/>"
        "• <b>6.1.2 Patient Cohort and Multi-Parameter Search Module:</b> Provides citizen registration and indexed case-insensitive regex search across name, telephone number, and village habitations with sub-40 ms response latency.<br/>"
        "• <b>6.1.3 Priority-Driven Appointment Scheduler and Email Dispatch:</b> Facilitates visit scheduling across four priority tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `ROUTINE`). Upon booking, the controller dispatches an automated HTML confirmation email to the patient with encounter date, time, location, and assigned health worker details.<br/>"
        "• <b>6.1.4 Multi-Vital Clinical Intake and Dynamic Prescription Builder:</b> Captures 7 physiological vitals (Systolic BP, Diastolic BP, Pulse Rate, SpO2, Temperature, Blood Glucose, Respiratory Rate) with visual threshold warnings and provides a dynamic array-based prescription generator.<br/>"
        "• <b>6.1.5 Dual-Path Hybrid AI (AshaBot) and Deterministic Offline Engine:</b> Provides real-time clinical triage cues via Google Gemini when connected, falling back to an in-memory rule engine that categorizes vital thresholds in 4.2 ms during rural connectivity drops.", body_style
    ))
    
    story.append(Paragraph("6.2 DATABASE SCHEMA DESIGN AND ATTRIBUTES", sec_style))
    story.append(Paragraph(
        "The database architecture partitions entities into five collections in MongoDB Atlas.", body_style
    ))
    f61 = make_flowable_image("docs/figures/image7.jpg", max_width=320, max_height=170)
    if f61:
        story.append(f61)
        story.append(Paragraph("Figure 6.1: Entity-Relationship and Schema Association Architecture Diagram", fig_caption))
    story.append(Paragraph("Figure 6.1 illustrates the document schema relationships linking Users, Patients, Appointments, HealthRecords, and AIConversations.", body_style))
    
    story.append(Paragraph("<b>Table 6.1: User Collection Schema Attributes and Constraints</b>", table_caption))
    t61_data = [
        [Paragraph("<b>Field Name</b>", th_style), Paragraph("<b>BSON Type</b>", th_style), Paragraph("<b>Constraints & Validation</b>", th_style), Paragraph("<b>Operational Description</b>", th_style)],
        [Paragraph("_id", td_bold), Paragraph("ObjectId", td_style), Paragraph("Primary Key, Auto-generated", td_style), Paragraph("Unique user identifier", td_style)],
        [Paragraph("fullName", td_bold), Paragraph("String", td_style), Paragraph("Required, Trimmed, Max 100", td_style), Paragraph("Legal name of health worker / admin", td_style)],
        [Paragraph("email", td_bold), Paragraph("String", td_style), Paragraph("Required, Unique, Lowercase, Indexed", td_style), Paragraph("Primary login & OTP destination", td_style)],
        [Paragraph("password", td_bold), Paragraph("String", td_style), Paragraph("Required, Min 6, Bcrypt Digest", td_style), Paragraph("Salted cryptographic password hash", td_style)],
        [Paragraph("role", td_bold), Paragraph("String", td_style), Paragraph("Enum: `['ADMIN', 'WORKER']`", td_style), Paragraph("RBAC role governing endpoint access", td_style)],
        [Paragraph("workerId", td_bold), Paragraph("String", td_style), Paragraph("Required, Unique, Uppercase, Trimmed", td_style), Paragraph("Compulsory ASHA Worker Field ID / Admin ID", td_style)],
        [Paragraph("isEmailVerified", td_bold), Paragraph("Boolean", td_style), Paragraph("Default: `false`", td_style), Paragraph("Verified via 6-digit email OTP", td_style)],
        [Paragraph("isApproved", td_bold), Paragraph("Boolean", td_style), Paragraph("Default: `false`", td_style), Paragraph("Admin approval gate for platform access", td_style)],
        [Paragraph("status", td_bold), Paragraph("String", td_style), Paragraph("Enum: `['ACTIVE', 'INACTIVE', 'SUSPENDED']`", td_style), Paragraph("Operational account lifecycle state", td_style)],
    ]
    t61_tab = Table(t61_data, colWidths=[65, 55, 150, 234])
    t61_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t61_tab)
    story.append(PageBreak())

    story.append(Paragraph("6.3 STATE TRANSITION MODELING", sec_style))
    story.append(Paragraph(
        "Appointments transition through four discrete operational states: `SCHEDULED`, `COMPLETED`, `CANCELLED`, and `MISSED`.", body_style
    ))
    f62 = make_flowable_image("docs/figures/image8.jpg", max_width=420, max_height=110)
    if f62:
        story.append(f62)
        story.append(Paragraph("Figure 6.2: Appointment State Machine Transition Lifecycle Diagram", fig_caption))
    story.append(Paragraph("As shown in Figure 6.2, state transitions are strictly governed by worker actions and validated against audit logs.", body_style))

    story.append(Paragraph("6.4 ALGORITHMS AND FLOWCHART", sec_style))
    story.append(Paragraph(
        "The system executes deterministic algorithms for vital sign parsing and triage classification (detailed in Appendix A).", body_style
    ))
    story.append(Paragraph("6.5 SUMMARY", sec_style))
    story.append(Paragraph("The system design establishes a clean separation of concerns, robust persistence schemas, and reliable state machine transitions.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 7 =================
    story.append(Paragraph("<b>CHAPTER 7: TIMELINE FOR EXECUTION OF PROJECT (GANTT CHART)</b>", chap_style))
    story.append(Paragraph("7.1 PHASE-WISE DEVELOPMENT BREAKDOWN", sec_style))
    story.append(Paragraph(
        "The project was executed across an 18-week agile engineering lifecycle spanning July 2026 to November 2026, organized into eight structured milestones: T1 (Literature Review), T2 (SRS & Schemas), T3 (Backend API & Auth), T4 (Frontend SPA Presentation), T5 (Dual-Path Hybrid AI), T6 (Admin Governance & Emails), T7 (Cloud Deployment & Benchmarking), and T8 (Thesis & Viva Preparation).", body_style
    ))
    story.append(Paragraph("7.2 PROJECT EXECUTION SCHEDULE (GANTT CHART)", sec_style))
    f71 = make_flowable_image("docs/figures/image10.png", max_width=420, max_height=145)
    if f71:
        story.append(f71)
        story.append(Paragraph("Figure 7.1: Project Execution Schedule and Milestone Gantt Chart (July–November 2026)", fig_caption))
    
    f72 = make_flowable_image("docs/figures/image11.png", max_width=420, max_height=135)
    if f72:
        story.append(f72)
        story.append(Paragraph("Figure 7.2: Clinical Workflow and Vitals Escalation Decision Tree", fig_caption))
    story.append(Paragraph("As visualized in Figure 7.1 and Figure 7.2, project execution adhered strictly to the planned timeline, culminating in cloud deployment and clinical workflow validation.", body_style))

    story.append(Paragraph("7.3 WORK BREAKDOWN STRUCTURE", sec_style))
    story.append(Paragraph("<b>Table 7.1: Milestone Work Breakdown Structure and Deliverable Schedule</b>", table_caption))
    t71_data = [
        [Paragraph("<b>Milestone</b>", th_style), Paragraph("<b>Timeline</b>", th_style), Paragraph("<b>Deliverables & Artifacts</b>", th_style), Paragraph("<b>Primary Owner</b>", th_style)],
        [Paragraph("T1: Literature Survey", td_bold), Paragraph("Weeks 1–3", td_style), Paragraph("Research gap matrix, problem definition", td_style), Paragraph("Swastik Vinayak Hegde", td_style)],
        [Paragraph("T2: SRS & Schemas", td_bold), Paragraph("Weeks 3–5", td_style), Paragraph("SRS document, 5 Mongoose schema models", td_style), Paragraph("Abhinava Thunga K N", td_style)],
        [Paragraph("T3: Backend API & Auth", td_bold), Paragraph("Weeks 5–8", td_style), Paragraph("Express controllers, JWT, Brevo OTP", td_style), Paragraph("Nagaraj Shripad Bhat", td_style)],
        [Paragraph("T4: Frontend SPA", td_bold), Paragraph("Weeks 8–11", td_style), Paragraph("React 18 UI components, Axios layer", td_style), Paragraph("Swastik Vinayak Hegde", td_style)],
        [Paragraph("T5: Hybrid AI AshaBot", td_bold), Paragraph("Weeks 11–13", td_style), Paragraph("Gemini cloud integration, offline parser", td_style), Paragraph("Abhinava Thunga K N", td_style)],
        [Paragraph("T6: Admin Governance", td_bold), Paragraph("Weeks 13–15", td_style), Paragraph("Admin dashboard, appointment emails", td_style), Paragraph("Nagaraj Shripad Bhat", td_style)],
        [Paragraph("T7: Cloud Deployment", td_bold), Paragraph("Weeks 15–17", td_style), Paragraph("Render PaaS hosting, latency benchmarks", td_style), Paragraph("Swastik & Abhinava", td_style)],
        [Paragraph("T8: Thesis & Viva", td_bold), Paragraph("Weeks 17–18", td_style), Paragraph("Final report, IEEE paper, presentation", td_style), Paragraph("Team Joint Delivery", td_style)],
    ]
    t71_tab = Table(t71_data, colWidths=[90, 60, 224, 130])
    t71_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t71_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("7.4 SUMMARY", sec_style))
    story.append(Paragraph("All eight planned milestones were successfully executed within the allocated 18-week project timeframe.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 8 =================
    story.append(Paragraph("<b>CHAPTER 8: OUTCOMES</b>", chap_style))
    story.append(Paragraph("8.1 DELIVERED SOFTWARE ARTIFACTS", sec_style))
    story.append(Paragraph(
        "The project delivered a production-ready, cloud-accessible digital health platform accessible at <code>https://community-healthworker-assistance.onrender.com/login</code>.", body_style
    ))
    story.append(Paragraph("<b>Table 8.1: Delivered Software Modules and Implementation Scope</b>", table_caption))
    t81_data = [
        [Paragraph("<b>Module Name</b>", th_style), Paragraph("<b>Key Functions Delivered</b>", th_style)],
        [Paragraph("Auth & Governance", td_bold), Paragraph("6-digit OTP, bcrypt hash, compulsory workerId onboarding", td_style)],
        [Paragraph("Admin Panel", td_bold), Paragraph("Personnel verification, 1-click approvals, cohort metrics", td_style)],
        [Paragraph("Patient Directory", td_bold), Paragraph("Sub-40 ms indexed regex search across name, phone, village", td_style)],
        [Paragraph("Appointment Scheduler", td_bold), Paragraph("4-tier priorities, automated patient confirmation email", td_style)],
        [Paragraph("Clinical Records", td_bold), Paragraph("7 physiological vitals, threshold cues, multi-drug Rx builder", td_style)],
        [Paragraph("Hybrid AI Engine", td_bold), Paragraph("Google Gemini cloud chat + 4.2 ms deterministic offline triage", td_style)],
    ]
    t81_tab = Table(t81_data, colWidths=[140, 364])
    t81_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t81_tab)
    story.append(Spacer(1, 4))

    story.append(Paragraph("8.2 MEASURABLE CLINICAL WORKFLOW OUTCOMES", sec_style))
    story.append(Paragraph("<b>Table 8.2: Field Operational Metric Comparison (Paper vs. Platform)</b>", table_caption))
    t82_data = [
        [Paragraph("<b>Performance Indicator</b>", th_style), Paragraph("<b>Legacy Paper Registers</b>", th_style), Paragraph("<b>Proposed CHW Platform</b>", th_style), Paragraph("<b>Improvement</b>", th_style)],
        [Paragraph("Patient Lookup Time", td_bold), Paragraph("5 to 15 minutes", td_style), Paragraph("<b>38.4 milliseconds</b>", td_style), Paragraph("<b>> 90% reduction</b>", td_bold)],
        [Paragraph("Vital Signs Capture Time", td_bold), Paragraph("3 to 5 minutes manual notes", td_style), Paragraph("<b>26.1 milliseconds (save)</b>", td_style), Paragraph("<b>Instant & structured</b>", td_bold)],
        [Paragraph("Appointment Notification", td_bold), Paragraph("Manual word-of-mouth", td_style), Paragraph("<b>Instant HTML email</b>", td_style), Paragraph("<b>Auditable dispatch</b>", td_bold)],
        [Paragraph("Danger Sign Escalation", td_bold), Paragraph("Variable; often delayed", td_style), Paragraph("<b>4.2 ms offline / 780 ms cloud</b>", td_style), Paragraph("<b>Immediate triage tag</b>", td_bold)],
        [Paragraph("Administrative Reporting", td_bold), Paragraph("2 to 4 days monthly aggregation", td_style), Paragraph("<b>Real-time dashboard</b>", td_style), Paragraph("<b>Instant visibility</b>", td_bold)],
    ]
    t82_tab = Table(t82_data, colWidths=[120, 120, 144, 120])
    t82_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t82_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As quantified in Table 8.2, the platform delivers transformative productivity gains across frontline community operations.", body_style))
    story.append(Paragraph("8.3 SYSTEM IMPACT AND FIELD READINESS", sec_style))
    story.append(Paragraph("The platform eliminates paper registry loss, strengthens longitudinal maternal follow-up, and ensures uninterrupted clinical triage support in low-connectivity rural habitations.", body_style))
    story.append(Paragraph("8.4 SUMMARY", sec_style))
    story.append(Paragraph("Delivered software artifacts achieve high operational reliability, measurable clinical acceleration, and robust security governance.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 9 =================
    story.append(Paragraph("<b>CHAPTER 9: RESULTS AND DISCUSSIONS</b>", chap_style))
    story.append(Paragraph("9.1 EXPERIMENTAL SETUP AND ENVIRONMENT", sec_style))
    story.append(Paragraph(
        "Experimental verification evaluated functional correctness, latency, security robustness, and clinical triage concordance across simulated field scenarios.", body_style
    ))
    story.append(Paragraph("<b>Table 9.1: End-to-End System Test Cases and Functional Verification Matrix</b>", table_caption))
    t91_data = [
        [Paragraph("<b>Test ID</b>", th_style), Paragraph("<b>Module</b>", th_style), Paragraph("<b>Scenario & Stimulus</b>", th_style), Paragraph("<b>Expected Behavior</b>", th_style), Paragraph("<b>Observed Result</b>", th_style), Paragraph("<b>Status</b>", th_style)],
        [Paragraph("TC-01", td_bold), Paragraph("Auth", td_style), Paragraph("Login unapproved account", td_style), Paragraph("Access denied (`HTTP 403`)", td_style), Paragraph("Blocked with approval alert", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-02", td_bold), Paragraph("Register", td_style), Paragraph("Missing unique workerId", td_style), Paragraph("Validation error thrown", td_style), Paragraph("Registration rejected", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-03", td_bold), Paragraph("OTP", td_style), Paragraph("Invalid 6-digit code", td_style), Paragraph("Token generation blocked", td_style), Paragraph("Invalid OTP error returned", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-04", td_bold), Paragraph("Search", td_style), Paragraph("Regex query across fields", td_style), Paragraph("Sub-100 ms match response", td_style), Paragraph("Returned in <b>38.4 ms</b>", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-05", td_bold), Paragraph("Appt", td_style), Paragraph("Book visit with patient email", td_style), Paragraph("Appointment saved + email sent", td_style), Paragraph("Delivered via Brevo", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-06", td_bold), Paragraph("Vitals", td_style), Paragraph("Elevated BP (185/125)", td_style), Paragraph("Trigger red alert threshold", td_style), Paragraph("Danger warning displayed", td_style), Paragraph("<b>PASS</b>", td_bold)],
        [Paragraph("TC-07", td_bold), Paragraph("Offline", td_style), Paragraph("Send vitals offline", td_style), Paragraph("Execute local deterministic rule", td_style), Paragraph("`[TRIAGE: URGENT]` in <b>4.2 ms</b>", td_style), Paragraph("<b>PASS</b>", td_bold)],
    ]
    t91_tab = Table(t91_data, colWidths=[40, 50, 115, 125, 124, 50])
    t91_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t91_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As recorded in Table 9.1, all functional test scenarios achieved a 100% pass rate.", body_style))

    story.append(Paragraph("9.2 PERFORMANCE METRICS USED", sec_style))
    f91 = make_flowable_image("docs/figures/image9.png", max_width=420, max_height=145)
    if f91:
        story.append(f91)
        story.append(Paragraph("Figure 9.1: System Operation Latency Benchmark and Synthetic Vignette Concordance", fig_caption))
    
    story.append(Paragraph("<b>Table 9.2: Latency and Response-Time Benchmarks</b>", table_caption))
    t92_data = [
        [Paragraph("<b>Operation</b>", th_style), Paragraph("<b>Measured Mean Latency</b>", th_style), Paragraph("<b>95th Percentile Latency</b>", th_style), Paragraph("<b>Target SLA</b>", th_style), Paragraph("<b>Compliance</b>", th_style)],
        [Paragraph("User Sign-In & JWT Issue", td_bold), Paragraph("<b>74.2 ms</b>", td_style), Paragraph("110.5 ms", td_style), Paragraph("< 200 ms", td_style), Paragraph("Compliant", td_style)],
        [Paragraph("Multi-Field Patient Search", td_bold), Paragraph("<b>38.4 ms</b>", td_style), Paragraph("52.1 ms", td_style), Paragraph("< 100 ms", td_style), Paragraph("Highly Compliant", td_style)],
        [Paragraph("Health Record Save", td_bold), Paragraph("<b>26.1 ms</b>", td_style), Paragraph("41.8 ms", td_style), Paragraph("< 100 ms", td_style), Paragraph("Highly Compliant", td_style)],
        [Paragraph("Offline Deterministic Triage", td_bold), Paragraph("<b>4.2 ms</b>", td_style), Paragraph("6.8 ms", td_style), Paragraph("< 15 ms", td_style), Paragraph("Ultra-Fast", td_style)],
        [Paragraph("Cloud AI Clinical Consultation", td_bold), Paragraph("<b>780.5 ms</b>", td_style), Paragraph("1120.0 ms", td_style), Paragraph("< 2000 ms", td_style), Paragraph("Compliant", td_style)],
    ]
    t92_tab = Table(t92_data, colWidths=[120, 95, 95, 95, 99])
    t92_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t92_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("Figure 9.1 and Table 9.2 confirm that all core operations operate well within field performance targets.", body_style))

    story.append(Paragraph("9.3 COMPARATIVE BENCHMARK RESULTS", sec_style))
    story.append(Paragraph("<b>Table 9.3: Synthetic Clinical Vignette Concordance Analysis</b>", table_caption))
    t93_data = [
        [Paragraph("<b>Clinical Category</b>", th_style), Paragraph("<b>Number of Vignettes</b>", th_style), Paragraph("<b>Cloud Mode Triage</b>", th_style), Paragraph("<b>Offline Engine Triage</b>", th_style), Paragraph("<b>Concordance</b>", th_style)],
        [Paragraph("Hypertensive Crisis (BP >= 180/120)", td_bold), Paragraph("12", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("<b>100% (12/12)</b>", td_bold)],
        [Paragraph("Hypoxemic Distress (SpO2 < 92%)", td_bold), Paragraph("10", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("<b>100% (10/10)</b>", td_bold)],
        [Paragraph("Severe Pyrexia (Temp >= 103°F)", td_bold), Paragraph("8", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("`[TRIAGE: URGENT]`", td_style), Paragraph("<b>100% (8/8)</b>", td_bold)],
        [Paragraph("Moderate Vitals Elevation", td_bold), Paragraph("10", td_style), Paragraph("`[TRIAGE: MODERATE]`", td_style), Paragraph("`[TRIAGE: MODERATE]`", td_style), Paragraph("<b>90.0% (9/10)</b>", td_bold)],
        [Paragraph("Normal Physiological Range", td_bold), Paragraph("10", td_style), Paragraph("`[TRIAGE: ROUTINE]`", td_style), Paragraph("`[TRIAGE: ROUTINE]`", td_style), Paragraph("<b>90.0% (9/10)</b>", td_bold)],
        [Paragraph("<b>Total Synthetic Cohort</b>", td_bold), Paragraph("<b>50</b>", td_bold), Paragraph("—", td_style), Paragraph("—", td_style), Paragraph("<b>96.0% (48/50)</b>", td_bold)],
    ]
    t93_tab = Table(t93_data, colWidths=[140, 70, 100, 100, 94])
    t93_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t93_tab)
    story.append(Spacer(1, 4))
    story.append(Paragraph("As detailed in Table 9.3, the offline rule engine achieved 96.0% concordance with cloud AI risk ratings, demonstrating reliable fail-safe triage.", body_style))
    story.append(Paragraph("9.4 ANALYSIS AND INTERPRETATION OF RESULTS", sec_style))
    story.append(Paragraph("The sub-50 ms search latency and 4.2 ms offline triage execution provide immediate utility in low-resource environments. The automated Brevo email confirmation feature establishes auditable encounter tracking.", body_style))
    story.append(Paragraph("9.5 DISCUSSION ON OUTCOMES", sec_style))
    story.append(Paragraph("Results demonstrate that lightweight web applications combined with deterministic edge parsers can deliver enterprise-grade healthcare functionality without heavyweight native applications.", body_style))
    story.append(Paragraph("9.6 SUMMARY", sec_style))
    story.append(Paragraph("Empirical benchmarking confirms high responsiveness, 100% functional reliability, robust security controls, and high clinical triage concordance.", body_style))
    story.append(PageBreak())

    # ================= CHAPTER 10 =================
    story.append(Paragraph("<b>CHAPTER 10: CONCLUSION AND FUTURE WORK</b>", chap_style))
    story.append(Paragraph("10.1 SUMMARY OF CONTRIBUTIONS", sec_style))
    story.append(Paragraph(
        "The Community Health Worker Assistance Platform delivers an auditable, lightweight full-stack healthcare operating system deployed on Render cloud infrastructure. Key engineering contributions include: (1) replacement of physical paper logbooks with an indexed MongoDB document store achieving sub-40 ms patient retrieval; (2) implementation of a strict two-role governance hierarchy (<b>ADMIN</b> and <b>WORKER</b>) with compulsory unique <code>workerId</code> onboarding, 6-digit OTP verification, and administrative approval gates; (3) automated encounter confirmation emails dispatched via Brevo to patient email addresses with encounter date, time, and location; (4) structured multi-vital clinical recording for 7 physiological signs paired with a dynamic prescription builder; and (5) dual-path clinical decision support providing Google Gemini cloud triage and a 4.2 ms deterministic offline parser achieving 96% concordance.", body_style
    ))
    story.append(Paragraph("10.2 KEY FINDINGS", sec_style))
    story.append(Paragraph(
        "Prototype evaluation confirms that responsive Single-Page Applications combined with deterministic local fallback algorithms can effectively resolve the twin bottlenecks of connectivity loss and data fragmentation in frontline health delivery.", body_style
    ))
    story.append(Paragraph("10.3 LIMITATIONS OF THE STUDY", sec_style))
    story.append(Paragraph(
        "1. The web user interface is currently available only in English; regional vernacular localization (Kannada/Hindi) is pending.<br/>"
        "2. Notifications currently depend on email dispatch; direct cellular SMS gateway integration is not yet active.<br/>"
        "3. Formal sandbox integration with the Ayushman Bharat Digital Mission (ABDM) ABHA infrastructure remains to be finalized.", body_style
    ))
    story.append(Paragraph("10.4 SUGGESTIONS FOR FUTURE RESEARCH", sec_style))
    story.append(Paragraph(
        "1. <b>Service Worker Offline Cache:</b> Implement Service Worker background sync to enable offline patient registration and record creation with automatic cloud synchronization upon reconnection.<br/>"
        "2. <b>Vernacular Localization:</b> Integrate multi-language UI translation supporting regional Indian languages.<br/>"
        "3. <b>SMS Gateway Integration:</b> Connect national SMS gateways (e.g. CDAC / Gov SMS) for offline citizen appointment reminders.<br/>"
        "4. <b>ABDM Interoperability:</b> Integrate ABHA milestone endpoints to enable national longitudinal health record exchange.", body_style
    ))
    story.append(Paragraph("10.5 SUMMARY", sec_style))
    story.append(Paragraph("The project demonstrates that modern web standards and hybrid AI architectures can effectively empower frontline health personnel, elevate care coordination, and bridge the digital health divide.", body_style))
    story.append(PageBreak())

    # ================= REFERENCES =================
    story.append(Paragraph("<b>REFERENCES</b>", chap_style))
    refs = [
        "[1] S. Agarwal, H. B. Perry, L. A. Long, and A. B. Labrique, 'Evidence on feasibility and effective use of mHealth strategies by frontline health workers in developing countries: Systematic review,' Tropical Medicine & International Health, vol. 20, no. 8, pp. 1003–1014, Aug. 2015.",
        "[2] S. Kumar, R. Garg, H. A. Siddiqui, and R. Roy, 'Health services rendered through Accredited Social Health Activists to rural Uttar Pradesh, India,' International Journal of Community Medicine and Public Health, vol. 4, no. 7, pp. 2500–2506, Jul. 2017.",
        "[3] U. Charanthimath et al., 'Community health worker evaluation of implementing an mHealth application to support maternal health care in rural India,' Frontiers in Global Women's Health, vol. 2, Art. 645690, Apr. 2021.",
        "[4] R. Braun, C. Catalani, J. Wimbush, and D. Israelski, 'Community health workers and mobile technology: A systematic review,' PLOS ONE, vol. 8, no. 6, Art. e65772, Jun. 2013.",
        "[5] R. T. Fielding, 'Architectural styles and the design of network-based software architectures,' Ph.D. dissertation, University of California, Irvine, 2000.",
        "[6] M. Wang et al., 'Health workers adoption of digital health technology in low- and middle-income countries: A systematic review and meta-analysis,' Bulletin of the World Health Organization, vol. 103, no. 2, pp. 126–135, Feb. 2025.",
        "[7] S. Paul, P. Saha, M. D. Bharali, A. C. Baishya, and J. Ojah, 'Frontline health workers perceptions of digital health platforms in Assam,' Cureus, vol. 18, no. 7, Art. e112153, Jul. 2026.",
        "[8] World Health Organization (WHO), WHO Guideline: Recommendations on Digital Interventions for Health System Strengthening. Geneva: World Health Organization, 2019.",
        "[9] World Health Organization (WHO), Global Strategy on Digital Health 2020–2025. Geneva: World Health Organization, 2021.",
        "[10] HL7 International, HL7 FHIR Release 4: Fast Healthcare Interoperability Resources. Ann Arbor, MI: Health Level Seven International, 2019.",
        "[11] National Health Authority (NHA), Ayushman Bharat Digital Mission (ABDM): Strategy Paper. New Delhi: Ministry of Health and Family Welfare, Government of India, 2021.",
        "[12] Ministry of Law and Justice, Government of India, The Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023). New Delhi: The Gazette of India, 2023.",
        "[13] K. Singhal et al., 'Large language models encode clinical knowledge,' Nature, vol. 620, pp. 172–180, Aug. 2023.",
        "[14] Google DeepMind, 'Gemini: A family of highly capable multimodal models,' arXiv preprint arXiv:2312.11805, Dec. 2023.",
        "[15] M. Chary et al., 'Artificial intelligence in emergency medicine: A systematic review,' Annals of Emergency Medicine, vol. 74, no. 5, pp. 647–658, 2019.",
        "[16] Dimagi, CommCare: Evidence-Based Mobile Platform for Frontline Workers. Cambridge, MA: Dimagi Inc., 2020.",
        "[17] OpenSRP, Open Smart Register Platform for Maternal and Child Health. WHO Technical Brief, Geneva: World Health Organization, 2022.",
        "[18] N. Provos and D. Mazières, 'A future-adaptable password scheme,' in Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference, Monterey, CA, Jun. 1999, pp. 81–91.",
        "[19] M. Jones, J. Bradley, and N. Sakimura, 'JSON Web Token (JWT),' Internet Engineering Task Force (IETF), RFC 7519, May 2015.",
        "[20] Y. Sheffer, D. Hardt, and M. Jones, 'JSON Web Token Best Current Practices,' Internet Engineering Task Force (IETF), BCP 225, RFC 8725, Feb. 2020.",
        "[21] OWASP Foundation, 'OWASP Top 10: 2025 Web Application Security Risks,' 2025. [Online]. Available: https://owasp.org",
        "[22] National Institute of Standards and Technology (NIST), 'Digital identity guidelines: Authentication and lifecycle management,' U.S. Department of Commerce, NIST Special Publication 800-63B-4, 2025.",
        "[23] Meta Open Source, 'React 18 Documentation: Concurrent Features and Hooks,' 2026. [Online]. Available: https://react.dev",
        "[24] OpenJS Foundation, 'Express.js 5.x RESTful Routing Documentation,' 2026. [Online]. Available: https://expressjs.com",
        "[25] MongoDB, Inc., 'MongoDB Manual: Indexing and TTL Collections,' 2026. [Online]. Available: https://mongodb.com",
        "[26] Automattic / Mongoose ODM, 'Mongoose 8.x Documentation,' 2026. [Online]. Available: https://mongoosejs.com",
        "[27] Brevo / Sendinblue, 'Brevo Transactional Email REST API v3 Documentation,' 2026. [Online]. Available: https://brevo.com"
    ]
    ref_style = ParagraphStyle(
        'RefPara', fontName='Times-Roman', fontSize=9, leading=13,
        leftIndent=15, firstLineIndent=-15, spaceAfter=4, textColor=colors.black
    )
    for r in refs:
        story.append(Paragraph(r, ref_style))
    story.append(PageBreak())

    # ================= APPENDIX-A: PSEUDOCODE =================
    story.append(Paragraph("<b>APPENDIX-A: PSEUDOCODE</b>", chap_style))
    story.append(Paragraph("A.1 Patient Management Route Handler (routes/patientRoutes.js)", sec_style))
    p1 = (
        "import express from 'express';\n"
        "import { createPatient, getPatients, getPatientById, updatePatient, deletePatient, searchPatients } from '../controllers/patientController.js';\n"
        "import { protect } from '../middleware/authMiddleware.js';\n"
        "import { authorize } from '../middleware/roleMiddleware.js';\n\n"
        "const router = express.Router();\n"
        "router.use(protect);\n"
        "router.get('/search', searchPatients);\n"
        "router.route('/')\n"
        "  .get(getPatients)\n"
        "  .post(authorize('WORKER', 'ADMIN'), createPatient);\n"
        "router.route('/:id')\n"
        "  .get(getPatientById)\n"
        "  .put(authorize('WORKER', 'ADMIN'), updatePatient)\n"
        "  .delete(authorize('WORKER', 'ADMIN'), deletePatient);\n"
        "export default router;"
    )
    story.append(Preformatted(p1, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("A.2 JWT Authentication Middleware (middleware/authMiddleware.js)", sec_style))
    p2 = (
        "export const protect = async (req, res, next) => {\n"
        "  let token;\n"
        "  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {\n"
        "    try {\n"
        "      token = req.headers.authorization.split(' ')[1];\n"
        "      const decoded = jwt.verify(token, process.env.JWT_SECRET);\n"
        "      req.user = await User.findById(decoded.id).select('-password');\n"
        "      if (!req.user || !req.user.isApproved || req.user.status !== 'ACTIVE') {\n"
        "        return res.status(403).json({ success: false, message: 'Account is pending administrative approval' });\n"
        "      }\n"
        "      return next();\n"
        "    } catch (err) {\n"
        "      return res.status(401).json({ success: false, message: 'Invalid or expired token' });\n"
        "    }\n"
        "  }\n"
        "  return res.status(401).json({ success: false, message: 'Not authorized, no token' });\n"
        "};"
    )
    story.append(Preformatted(p2, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("A.3 Deterministic Offline Triage Classifier (services/offlineTriage.js)", sec_style))
    p3 = (
        "export function classifyOffline(queryText, vitals = {}) {\n"
        "  const bp = vitals.bloodPressure ? parseBP(vitals.bloodPressure) : parseBloodPressure(queryText);\n"
        "  const spo2 = vitals.spO2 ?? parseSpO2(queryText);\n"
        "  const temp = vitals.temperature ?? parseTemperature(queryText);\n"
        "  const danger = hasDangerKeyword(queryText);\n"
        "  if (danger || (bp && (bp.systolic >= 180 || bp.diastolic >= 120)) || (spo2 && spo2 < 92) || (temp && temp >= 103.0)) {\n"
        "    return { mode: 'OFFLINE', ruleVersion: 'v1.0.0', tag: '[TRIAGE: URGENT]', action: 'Escalate to PHC Medical Officer.' };\n"
        "  }\n"
        "  if ((bp && (bp.systolic >= 140 || bp.diastolic >= 90)) || (spo2 && spo2 < 95) || (temp && temp >= 100.4)) {\n"
        "    return { mode: 'OFFLINE', ruleVersion: 'v1.0.0', tag: '[TRIAGE: MODERATE]', action: 'Review vitals and schedule priority visit.' };\n"
        "  }\n"
        "  return { mode: 'OFFLINE', ruleVersion: 'v1.0.0', tag: '[TRIAGE: ROUTINE]', action: 'Continue routine community follow-up.' };\n"
        "}"
    )
    story.append(Preformatted(p3, code_style))
    story.append(PageBreak())

    # ================= APPENDIX-B: SCREENSHOTS =================
    story.append(Paragraph("<b>APPENDIX-B: SCREENSHOTS</b>", chap_style))
    story.append(Paragraph("B.1 Worker and Administrator Sign-In Portal", sec_style))
    story.append(Paragraph("Live authentication portal deployed at <code>https://community-healthworker-assistance.onrender.com/login</code> supporting role selection (<b>WORKER</b> vs. <b>ADMIN</b>), compulsory unique ASHA Worker Field ID / Employee ID onboarding, and six-digit email OTP verification.", body_style))
    fb1 = make_flowable_image("docs/figures/image12.png", max_width=440, max_height=180)
    if fb1:
        story.append(fb1)
        story.append(Paragraph("Figure B.1: Worker and Administrator Sign-In Portal", fig_caption))
    story.append(Spacer(1, 4))

    story.append(Paragraph("B.2 Dedicated Admin Governance Dashboard (/admin)", sec_style))
    story.append(Paragraph("Administrative control console enabling active administrators to review pending worker registrations, approve accounts with one click, toggle roles, and monitor system metrics.", body_style))
    fb2 = make_flowable_image("docs/figures/image12.png", max_width=440, max_height=180)
    if fb2:
        story.append(fb2)
        story.append(Paragraph("Figure B.2: Dedicated Admin Governance Dashboard (/admin)", fig_caption))
    story.append(PageBreak())

    story.append(Paragraph("B.3 Operational Field Analytics Dashboard", sec_style))
    story.append(Paragraph("Interactive real-time operational dashboard providing aggregate metrics across total registered citizens, active cohorts, scheduled visits, and documented health encounters.", body_style))
    fb3 = make_flowable_image("docs/figures/image13.png", max_width=440, max_height=180)
    if fb3:
        story.append(fb3)
        story.append(Paragraph("Figure B.3: Operational Field Analytics Dashboard", fig_caption))
    story.append(Spacer(1, 4))

    story.append(Paragraph("B.4 Citizen Registry and Multi-Field Search View", sec_style))
    story.append(Paragraph("Indexed demographic directory supporting sub-40 ms case-insensitive regex filtering across citizen names, phone numbers, and villages.", body_style))
    fb4 = make_flowable_image("docs/figures/image14.png", max_width=440, max_height=180)
    if fb4:
        story.append(fb4)
        story.append(Paragraph("Figure B.4: Citizen Registry and Multi-Field Search View", fig_caption))
    story.append(PageBreak())

    story.append(Paragraph("B.5 Priority-Driven Appointment Management View with Email Dispatch", sec_style))
    story.append(Paragraph("Encounter scheduling view supporting four-tier prioritization and automatic transactional email dispatch to patient email addresses upon creation.", body_style))
    fb5 = make_flowable_image("docs/figures/image15.png", max_width=440, max_height=180)
    if fb5:
        story.append(fb5)
        story.append(Paragraph("Figure B.5: Priority-Driven Appointment Management View with Email Dispatch", fig_caption))
    story.append(Spacer(1, 4))

    story.append(Paragraph("B.6 Multi-Vital Clinical Documentation and Health Records View", sec_style))
    story.append(Paragraph("Structured clinical documentation interface capturing 7 physiological metrics with dynamic threshold warnings and multi-item prescription logging.", body_style))
    fb6 = make_flowable_image("docs/figures/image16.png", max_width=440, max_height=180)
    if fb6:
        story.append(fb6)
        story.append(Paragraph("Figure B.6: Multi-Vital Clinical Documentation and Health Records View", fig_caption))
    story.append(PageBreak())

    story.append(Paragraph("B.7 AshaBot Frontline Clinical Decision Support Interface", sec_style))
    story.append(Paragraph("Assistant conversation panel providing dual-path triage with visible `[CLOUD]` / `[OFFLINE]` mode tags, escalation flags, and human-in-the-loop review prompts.", body_style))
    fb7 = make_flowable_image("docs/figures/image17.png", max_width=440, max_height=180)
    if fb7:
        story.append(fb7)
        story.append(Paragraph("Figure B.7: AshaBot Frontline Clinical Decision Support Interface", fig_caption))
    story.append(PageBreak())

    # ================= APPENDIX-C: ENCLOSURES =================
    story.append(Paragraph("<b>APPENDIX-C: ENCLOSURES</b>", chap_style))
    story.append(Paragraph("1. IEEE Conference Acceptance Proof", sec_style))
    story.append(Paragraph(
        "Official acceptance letter from the <b>International Conference on AI and Data Science for Personalized Medicine (ICAIDS-PM-26)</b> "
        "organized by the Institute for Scientific and Engineering Research (ISER) held at Kuala Lumpur, Malaysia.<br/>"
        "• <b>Paper ID:</b> ISER-10-30-00107995<br/>"
        "• <b>Paper Title:</b> Community Health Worker Assistance Platform: A Secure and Hybrid GenAI-Enabled MERN Architecture for Field Health Management<br/>"
        "• <b>Authors:</b> Nagaraj Shripad Bhat<br/>"
        "• <b>Co-Authors:</b> Swastik Vinayak Hegde, Abhinava Thunga K N", body_style
    ))
    enc1 = make_flowable_image("docs/figures/image18.jpeg", max_width=390, max_height=420)
    if enc1:
        story.append(enc1)
        story.append(Paragraph("Figure C.1: IEEE Conference Acceptance Proof (ICAIDS-PM-26, Kuala Lumpur, Malaysia)", fig_caption))
    story.append(PageBreak())

    story.append(Paragraph("2. Similarity Index / Plagiarism Check Report", sec_style))
    story.append(Paragraph(
        "Institutional Plagiarism Check Summary via Paperpal Draft: <b>Overall Similarity Index verified at 6%</b>, comfortably complying with Presidency University's academic integrity standard threshold of <15%.", body_style
    ))
    enc2 = make_flowable_image("docs/figures/image19.jpeg", max_width=440, max_height=210)
    if enc2:
        story.append(enc2)
        story.append(Paragraph("Figure C.2: Paperpal Online Plagiarism Check Report (Verified 6% Similarity)", fig_caption))
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. Sustainable Development Goals (SDGs) Mapping", sec_style))
    story.append(Paragraph("Table C.1 maps project capabilities to United Nations Sustainable Development Goals (SDGs).", body_style))
    story.append(Paragraph("<b>Table C.1: Mapping of Project Capabilities to UN Sustainable Development Goals (SDGs)</b>", table_caption))
    sdg_data = [
        [Paragraph("<b>SDG Goal</b>", th_style), Paragraph("<b>Relevant UN Target</b>", th_style), Paragraph("<b>Platform Alignment & Measurable Contribution</b>", th_style)],
        [
            Paragraph("<b>SDG 3: Good Health and Well-Being</b>", td_bold),
            Paragraph("Targets 3.1, 3.2, 3.8", td_style),
            Paragraph("Digitizes longitudinal ANC/PNC tracking, immunization schedules, and multi-vital screening for rural ASHAs and ANMs.", td_style)
        ],
        [
            Paragraph("<b>SDG 9: Industry, Innovation, and Infrastructure</b>", td_bold),
            Paragraph("Target 9.c", td_style),
            Paragraph("Provides a lightweight three-tier MERN web platform on Render cloud paired with a 4.2 ms zero-network offline triage parser.", td_style)
        ],
        [
            Paragraph("<b>SDG 10: Reduced Inequalities</b>", td_bold),
            Paragraph("Target 10.2", td_style),
            Paragraph("Bridges the rural-urban clinical continuity gap with portable, auditable digital health records.", td_style)
        ],
    ]
    t_sdg = Table(sdg_data, colWidths=[120, 110, 274])
    t_sdg.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sdg)

    doc.build(story, canvasmaker=UniversityNumberedCanvas)
    print("SUCCESS: University Project Report PDF generated at:", pdf_path)

if __name__ == "__main__":
    build_pdf()
