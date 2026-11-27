import os
import re
from PIL import Image as PILImage
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class UniversityNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(UniversityNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(UniversityNumberedCanvas, self).showPage()
        super(UniversityNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (starts page 2+)
        self.drawString(45, 755, "Presidency University — Community Health Worker Assistance Platform")
        self.drawRightString(567, 755, "Final Project Report (2026–27)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(45, 749, 567, 749)
        
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(567, 32, page_text)
        self.drawString(45, 32, "Department of Information Science & Engineering, Presidency University")
        self.line(45, 42, 567, 42)
        self.restoreState()

def make_flowable_image(img_path, max_width=480, max_height=240):
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
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    teal = colors.HexColor("#0F766E")
    teal_dark = colors.HexColor("#115E59")
    slate_dark = colors.HexColor("#0F172A")
    slate_text = colors.HexColor("#334155")
    card_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#CBD5E1")

    # Typography styles
    univ_header = ParagraphStyle('UnivHeader', fontName='Helvetica-Bold', fontSize=13, leading=17, alignment=1, textColor=slate_dark)
    univ_sub = ParagraphStyle('UnivSub', fontName='Helvetica', fontSize=8, leading=11.5, alignment=1, textColor=colors.HexColor("#475569"))
    
    rep_title = ParagraphStyle('RepTitle', fontName='Helvetica-Bold', fontSize=17, leading=21, alignment=1, textColor=teal, spaceBefore=12, spaceAfter=6)
    rep_sub = ParagraphStyle('RepSub', fontName='Helvetica-Bold', fontSize=10.5, leading=14, alignment=1, textColor=slate_dark, spaceAfter=12)
    
    h1 = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=11.5, leading=15, textColor=teal, spaceBefore=12, spaceAfter=5, keepWithNext=True)
    h2 = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=slate_dark, spaceBefore=9, spaceAfter=3, keepWithNext=True)
    h3 = ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=8.5, leading=12, textColor=teal_dark, spaceBefore=6, spaceAfter=2, keepWithNext=True)
    
    body = ParagraphStyle('Body', fontName='Helvetica', fontSize=8, leading=11.5, textColor=slate_text, spaceAfter=4)
    body_bold = ParagraphStyle('BodyBold', fontName='Helvetica-Bold', fontSize=8, leading=11.5, textColor=slate_dark, spaceAfter=4)
    center_text = ParagraphStyle('CenterText', fontName='Helvetica', fontSize=8, leading=11.5, alignment=1, textColor=slate_text)
    center_bold = ParagraphStyle('CenterBold', fontName='Helvetica-Bold', fontSize=8.5, leading=12, alignment=1, textColor=slate_dark)
    caption_style = ParagraphStyle('Caption', fontName='Helvetica-Oblique', fontSize=7.5, leading=10.5, alignment=1, textColor=colors.HexColor("#475569"), spaceBefore=3, spaceAfter=8)
    
    th_style = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.white)
    td_style = ParagraphStyle('TD', fontName='Helvetica', fontSize=7, leading=9, textColor=slate_text)
    td_bold = ParagraphStyle('TDBold', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=slate_dark)

    code_style = ParagraphStyle('Code', fontName='Courier', fontSize=6.5, leading=8.5, textColor=colors.HexColor("#1E293B"))

    story = []

    # ================= COVER PAGE =================
    banner_img = make_flowable_image("docs/figures/image1.png", max_width=420, max_height=80)
    if banner_img:
        story.append(banner_img)
        story.append(Spacer(1, 8))
    else:
        story.append(Spacer(1, 10))
        story.append(Paragraph("PRESIDENCY UNIVERSITY", univ_header))
        story.append(Paragraph("Private University Estd. in Karnataka State by Act No. 41 of 2013<br/>Itgalpura, Rajankunte, Yelahanka, Bengaluru – 560064", univ_sub))
    
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", ParagraphStyle('SchoolH', fontName='Helvetica-Bold', fontSize=9, leading=13, alignment=1, textColor=slate_dark, spaceBefore=4)))
    story.append(HRFlowable(width="100%", thickness=1.5, color=teal, spaceBefore=8, spaceAfter=12))
    
    story.append(Paragraph("COMMUNITY HEALTH WORKER ASSISTANCE PLATFORM", rep_title))
    story.append(Paragraph("A PROJECT REPORT", rep_sub))
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the award of the degree of<br/><b>BACHELOR OF TECHNOLOGY IN INFORMATION SCIENCE AND ENGINEERING</b>", ParagraphStyle('Degree', fontName='Helvetica', fontSize=8.5, leading=13, alignment=1, textColor=slate_text, spaceAfter=15)))
    
    sub_table = [
        [Paragraph("<b>Submitted by:</b>", td_bold), Paragraph("<b>Under the guidance of:</b>", td_bold)],
        [
            Paragraph("<b>SWASTIK VINAYAK HEGDE</b> — 20231ISE0153<br/><b>ABHINAVA THUNGA K N</b> — 20231ISE0163<br/><b>NAGARAJ SHRIPAD BHAT</b> — 20231ISE0166", td_style),
            Paragraph("<b>Mr. HRITIK KUMAR</b><br/>Assistant Professor, Department of ISE<br/>Presidency School of Computer Science & Engg.<br/>Presidency University, Bengaluru", td_style)
        ]
    ]
    t_sub = Table(sub_table, colWidths=[260, 262])
    t_sub.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sub)
    story.append(Spacer(1, 24))
    story.append(Paragraph("<b>DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING</b><br/>PRESIDENCY UNIVERSITY, BENGALURU<br/><b>DECEMBER 2026</b>", ParagraphStyle('FootC', fontName='Helvetica', fontSize=9, leading=14, alignment=1, textColor=slate_dark)))
    story.append(PageBreak())

    # ================= CERTIFICATES =================
    if banner_img:
        story.append(make_flowable_image("docs/figures/image1.png", max_width=380, max_height=70))
        story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("PRESIDENCY UNIVERSITY", univ_header))
        story.append(Paragraph("Private University Estd. in Karnataka State by Act No. 41 of 2013<br/>Itgalpura, Rajankunte, Yelahanka, Bengaluru – 560064", univ_sub))
    story.append(HRFlowable(width="100%", thickness=1, color=teal, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph("<b>PRESIDENCY SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</b>", ParagraphStyle('CertSchool', fontName='Helvetica-Bold', fontSize=9.5, leading=13, alignment=1, textColor=slate_dark)))
    story.append(Paragraph("<b>BONAFIDE CERTIFICATE</b>", ParagraphStyle('CertTitle', fontName='Helvetica-Bold', fontSize=11, leading=15, alignment=1, textColor=teal, spaceBefore=3, spaceAfter=10)))
    
    story.append(Paragraph(
        "Certified that this report titled <b>“Community Health Worker Assistance Platform”</b> is a bonafide work carried out by "
        "<b>Mr. Swastik Vinayak Hegde (20231ISE0153)</b>, <b>Mr. Abhinava Thunga K N (20231ISE0163)</b>, and <b>Mr. Nagaraj Shripad Bhat (20231ISE0166)</b>, "
        "who have successfully carried out the project work and submitted the report for partial fulfillment of the requirements for the award of the degree of "
        "<b>BACHELOR OF TECHNOLOGY in INFORMATION SCIENCE AND ENGINEERING</b> during the academic year 2026–27.", body
    ))
    story.append(Spacer(1, 25))
    
    sigs = [
        [Paragraph("<b>Mr. Hritik Kumar</b>", center_bold), Paragraph("<b>Ms. Sumita Guddin</b>", center_bold), Paragraph("<b>Dr. Gopal K Shyam</b>", center_bold)],
        [Paragraph("Project Guide, PSCS<br/>Presidency University", center_text), Paragraph("Program Project Coordinator, PSCS<br/>Presidency University", center_text), Paragraph("Head of the Department, PSCS<br/>Presidency University", center_text)]
    ]
    t_sigs = Table(sigs, colWidths=[174, 174, 174])
    t_sigs.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
    story.append(t_sigs)
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=6, spaceAfter=10))

    story.append(Paragraph("<b>CERTIFICATE OF VIVA-VOCE-EXAMINATION</b>", ParagraphStyle('VivaH', fontName='Helvetica-Bold', fontSize=10.5, leading=14, alignment=1, textColor=teal, spaceAfter=8)))
    story.append(Paragraph(
        "This is to certify that <b>Mr. Swastik Vinayak Hegde (20231ISE0153)</b>, <b>Mr. Abhinava Thunga K N (20231ISE0163)</b>, and <b>Mr. Nagaraj Shripad Bhat (20231ISE0166)</b> "
        "have been subjected to the Viva-voce Examination on <b>03-12-2026</b> at Presidency University, Bengaluru.", body
    ))
    story.append(Spacer(1, 15))
    viva_table = [
        [Paragraph("<b>Examiner-1:</b>", td_bold), Paragraph("<b>Examiner-2:</b>", td_bold)],
        [Paragraph("Name: ____________________________<br/>Designation: _____________________<br/>University/College: ______________", td_style),
         Paragraph("Name: ____________________________<br/>Designation: _____________________<br/>University/College: ______________", td_style)]
    ]
    t_viva = Table(viva_table, colWidths=[260, 262])
    t_viva.setStyle(TableStyle([('BOX', (0,0), (-1,-1), 1, border_color), ('INNERGRID', (0,0), (-1,-1), 0.5, border_color), ('PADDING', (0,0), (-1,-1), 7)]))
    story.append(t_viva)
    story.append(PageBreak())

    # ================= DECLARATION & ACKNOWLEDGEMENT =================
    story.append(Paragraph("DECLARATION", h1))
    story.append(Paragraph(
        "We, the students of final year B.Tech in <b>INFORMATION SCIENCE AND ENGINEERING</b>, at Presidency University, Bengaluru, named "
        "<b>SWASTIK VINAYAK HEGDE (20231ISE0153)</b>, <b>ABHINAVA THUNGA K N (20231ISE0163)</b>, and <b>NAGARAJ SHRIPAD BHAT (20231ISE0166)</b>, "
        "hereby declare that the project work titled <b>“COMMUNITY HEALTH WORKER ASSISTANCE PLATFORM”</b> has been independently carried out by us "
        "and submitted in partial fulfillment for the award of the degree of B.Tech in Information Science and Engineering during the academic year 2026–27. "
        "Further, the matter embodied in the project has not been submitted previously by anybody for the award of any Degree or Diploma to any other institution.", body
    ))
    story.append(Spacer(1, 10))
    decl_table = [
        [Paragraph("<b>Swastik Vinayak Hegde</b>", td_bold), Paragraph("20231ISE0153", td_style)],
        [Paragraph("<b>Abhinava Thunga K N</b>", td_bold), Paragraph("20231ISE0163", td_style)],
        [Paragraph("<b>Nagaraj Shripad Bhat</b>", td_bold), Paragraph("20231ISE0166", td_style)],
        [Paragraph("<b>Place:</b> Bengaluru", td_style), Paragraph("<b>Date:</b> December 2026", td_style)]
    ]
    t_decl = Table(decl_table, colWidths=[260, 262])
    story.append(t_decl)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=4, spaceAfter=10))

    story.append(Paragraph("ACKNOWLEDGEMENT", h1))
    story.append(Paragraph(
        "For completing this project work, we have received the support and the guidance from many people whom we would like to mention with deep sense of gratitude and indebtedness. "
        "We extend our gratitude to our beloved <b>Chancellor</b>, <b>Vice Chancellor</b>, <b>Pro-Vice Chancellor</b>, and <b>Registrar</b> for their support and encouragement in completion of the project.<br/><br/>"
        "We express our cordial thanks to <b>Dr. Duraipandian N</b>, Dean PSCS, Presidency School of Computer Science and Engineering and the Management of Presidency University for providing the required facilities and intellectually stimulating environment that aided in the completion of our project work.<br/><br/>"
        "We are also thankful to <b>Dr. Gopal K Shyam</b>, Professor, Head of the Department, Presidency School of Computer Science and Engineering, Presidency University, for his mentorship and encouragement.<br/><br/>"
        "We would like to sincerely thank our internal guide <b>Mr. Hritik Kumar</b>, Assistant Professor, Presidency School of Computer Science and Engineering, Presidency University, for his moral support, motivation, timely guidance, and encouragement provided to us during the period of our project work.<br/><br/>"
        "We are grateful to <b>Mr. Muthuraju V</b>, School Project Coordinator, and <b>Ms. Sumita Guddin</b>, Program Project Coordinator, Presidency School of Computer Science and Engineering, for facilitating problem statements, coordinating reviews, monitoring progress, and providing their valuable support and guidance.<br/><br/>"
        "We are also grateful to the Teaching and Non-Teaching staff of Presidency School of Computer Science and Engineering and also staff from other departments who have extended their valuable help and cooperation.", body
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>SWASTIK VINAYAK HEGDE &nbsp;&nbsp;|&nbsp;&nbsp; ABHINAVA THUNGA K N &nbsp;&nbsp;|&nbsp;&nbsp; NAGARAJ SHRIPAD BHAT</b>", center_bold))
    story.append(PageBreak())

    # ================= ABSTRACT =================
    story.append(Paragraph("ABSTRACT", h1))
    story.append(Paragraph(
        "Frontline community healthcare workers, predominantly Accredited Social Health Activists (ASHAs) and Auxiliary Nurse Midwives (ANMs) operating within primary-health ecosystems in India, coordinate maternal care, immunization, chronic-disease follow-up, and household visits under significant time and connectivity constraints. Paper registers and fragmented notebooks make patient retrieval slow, weaken longitudinal follow-up, and delay the recognition of danger signs. This project presents the <b>Community Health Worker (CHW) Assistance Platform</b>, a responsive web-first digital health system designed around field workflows and deployed as a cloud-accessible web application (<code>https://community-healthworker-assistance.onrender.com/login</code>). The platform uses a three-tier MERN architecture consisting of a React 18 single-page application, an Express and Node.js service tier, and MongoDB persistence through Mongoose.<br/><br/>"
        "The system features a strict two-role governance model (<b>ADMIN</b> and <b>WORKER</b>), compulsory unique ASHA Worker Field ID / Employee ID onboarding, email-based six-digit OTP verification, and an interactive Admin Governance Panel where administrators verify, approve, or suspend health personnel accounts. In addition, the platform integrates a hybrid clinical-support layer: when connectivity is available, a constrained cloud assistant, referred to as <b>AshaBot</b> (powered by Google Gemini), receives the worker's clinical query and minimum necessary patient context and returns a tagged, uncertainty-aware clinical triage cue. When cloud connectivity is unavailable, a deterministic local rule engine parses supported vital signs and danger-sign keywords, producing an urgent, moderate, or routine escalation cue in 4.2 ms without network dependence.<br/><br/>"
        "Prototype measurements recorded mean latencies of 74.2 ms for worker login, 38.4 ms for multi-field patient search, 26.1 ms for health-record creation, 4.2 ms for offline triage, and 780.5 ms for cloud consultation; the local engine agreed with cloud risk categorizations in 48 of 50 synthetic vignettes (96.0%). These results demonstrate engineering feasibility, high responsiveness, and strict fail-safe continuity for community healthcare delivery.", body
    ))
    story.append(PageBreak())

    # ================= TABLE OF CONTENTS =================
    story.append(Paragraph("TABLE OF CONTENTS", h1))
    toc_data = [
        [Paragraph("<b>CHAPTER NO</b>", th_style), Paragraph("<b>TITLE</b>", th_style), Paragraph("<b>PAGE NO</b>", th_style)],
        [Paragraph("", td_bold), Paragraph("<b>ABSTRACT</b>", td_bold), Paragraph("v", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>TABLE OF CONTENTS</b>", td_bold), Paragraph("vi", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>LIST OF FIGURES</b>", td_bold), Paragraph("ix", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>LIST OF TABLES</b>", td_bold), Paragraph("x", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>ABBREVIATIONS</b>", td_bold), Paragraph("xi", td_style)],
        [Paragraph("<b>1.</b>", td_bold), Paragraph("<b>INTRODUCTION</b><br/>&nbsp;&nbsp;1.1 Background and Domain Context<br/>&nbsp;&nbsp;1.2 Problem Statement and Clinical Bottlenecks<br/>&nbsp;&nbsp;1.3 Project Motivation and Target Beneficiaries<br/>&nbsp;&nbsp;1.4 Scope and Delimitations of the Work<br/>&nbsp;&nbsp;1.5 Organization of the Report", td_style), Paragraph("1<br/>1<br/>1<br/>2<br/>3<br/>4", td_style)],
        [Paragraph("<b>2.</b>", td_bold), Paragraph("<b>LITERATURE SURVEY</b><br/>&nbsp;&nbsp;2.1 Evolution of Frontline mHealth Interventions<br/>&nbsp;&nbsp;2.2 Critical Appraisal of Contemporary Works<br/>&nbsp;&nbsp;2.3 International Guidelines and Digital Health Standards<br/>&nbsp;&nbsp;2.4 National Healthcare Informatics Frameworks (ABDM & DPDP Act)<br/>&nbsp;&nbsp;2.5 AI-Assisted Clinical Support: Design Opportunity<br/>&nbsp;&nbsp;2.6 Summary of Literature Review", td_style), Paragraph("6<br/>6<br/>6<br/>7<br/>9<br/>10<br/>11", td_style)],
        [Paragraph("<b>3.</b>", td_bold), Paragraph("<b>RESEARCH GAPS OF EXISTING METHODS</b><br/>&nbsp;&nbsp;3.1 Introduction<br/>&nbsp;&nbsp;3.2 Structural and Architectural Deficiencies<br/>&nbsp;&nbsp;3.3 Clinical Workflow and Vitals Integration Gaps<br/>&nbsp;&nbsp;3.4 Connectivity, Latency, and AI Safety Boundaries<br/>&nbsp;&nbsp;3.5 Comparative Gap Analysis", td_style), Paragraph("13<br/>13<br/>13<br/>14<br/>15<br/>16", td_style)],
        [Paragraph("<b>4.</b>", td_bold), Paragraph("<b>PROPOSED METHODOLOGY</b><br/>&nbsp;&nbsp;4.1 Introduction<br/>&nbsp;&nbsp;4.2 Software Requirements Specification (SRS)<br/>&nbsp;&nbsp;4.3 System Engineering Environment and Tooling<br/>&nbsp;&nbsp;4.4 High-Level Three-Tier Architecture<br/>&nbsp;&nbsp;4.5 Operational Security and Authentication Architecture<br/>&nbsp;&nbsp;4.6 Hybrid GenAI and Offline Triage Methodology<br/>&nbsp;&nbsp;4.7 Cloud Deployment Architecture on Render", td_style), Paragraph("17<br/>17<br/>17<br/>19<br/>20<br/>22<br/>24<br/>25", td_style)],
        [Paragraph("<b>5.</b>", td_bold), Paragraph("<b>OBJECTIVES</b><br/>&nbsp;&nbsp;5.1 Primary Objective<br/>&nbsp;&nbsp;5.2 Specific Engineering Objectives<br/>&nbsp;&nbsp;5.3 Security, Privacy, and Responsible-AI Criteria", td_style), Paragraph("27<br/>27<br/>27<br/>28", td_style)],
        [Paragraph("<b>6.</b>", td_bold), Paragraph("<b>SYSTEM ARCHITECTURE AND DESIGN</b><br/>&nbsp;&nbsp;6.1 Introduction<br/>&nbsp;&nbsp;6.2 Entity Relationship Design and Persistence Modeling<br/>&nbsp;&nbsp;6.3 Database Schema Detailed Specifications<br/>&nbsp;&nbsp;6.4 State Transition Modeling for Clinical Encounters", td_style), Paragraph("30<br/>30<br/>30<br/>31<br/>34", td_style)],
        [Paragraph("<b>7.</b>", td_bold), Paragraph("<b>SYSTEM IMPLEMENTATION</b><br/>&nbsp;&nbsp;7.1 Development Environment and Tooling<br/>&nbsp;&nbsp;7.2 Frontend Presentation Tier Engineering<br/>&nbsp;&nbsp;7.3 Backend API Execution Architecture<br/>&nbsp;&nbsp;7.4 Complete REST API Interface Specification", td_style), Paragraph("36<br/>36<br/>36<br/>37<br/>39", td_style)],
        [Paragraph("<b>8.</b>", td_bold), Paragraph("<b>RESULTS AND DISCUSSIONS</b><br/>&nbsp;&nbsp;8.1 Demonstration Runbook and Functional Test Scenarios<br/>&nbsp;&nbsp;8.2 Performance and Latency Benchmarking<br/>&nbsp;&nbsp;8.3 Security Vulnerability Audit and Mitigation Hardening<br/>&nbsp;&nbsp;8.4 AI Evaluation and Responsible-Use Verification", td_style), Paragraph("41<br/>41<br/>42<br/>43<br/>44", td_style)],
        [Paragraph("<b>9.</b>", td_bold), Paragraph("<b>PROJECT TIMELINE AND OUTCOMES</b><br/>&nbsp;&nbsp;9.1 Phase-Wise Development Breakdown<br/>&nbsp;&nbsp;9.2 Project Execution Gantt Chart<br/>&nbsp;&nbsp;9.3 Delivered Software Artifacts and Workflow Outcomes", td_style), Paragraph("46<br/>46<br/>47<br/>48", td_style)],
        [Paragraph("<b>10.</b>", td_bold), Paragraph("<b>CONCLUSION AND FUTURE WORK</b><br/>&nbsp;&nbsp;10.1 Conclusion & Summary of Contributions<br/>&nbsp;&nbsp;10.2 Technical Limitations of the Current Prototype<br/>&nbsp;&nbsp;10.3 Roadmap for Future Development & AI Governance", td_style), Paragraph("50<br/>50<br/>51<br/>51", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>REFERENCES (IEEE STANDARD BIBLIOGRAPHY)</b>", td_bold), Paragraph("52", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-A: PSEUDOCODE</b>", td_bold), Paragraph("54", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-B: SCREENSHOTS</b>", td_bold), Paragraph("55", td_style)],
        [Paragraph("", td_bold), Paragraph("<b>APPENDIX-C: ENCLOSURES</b>", td_bold), Paragraph("56", td_style)],
    ]
    t_toc = Table(toc_data, colWidths=[65, 400, 57])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # ================= LIST OF FIGURES & TABLES =================
    story.append(Paragraph("LIST OF FIGURES", h1))
    fig_data = [
        [Paragraph("<b>Sl. No.</b>", th_style), Paragraph("<b>Figure Name</b>", th_style), Paragraph("<b>Caption</b>", th_style), Paragraph("<b>Page No.</b>", th_style)],
        [Paragraph("1", td_style), Paragraph("Figure 4.1", td_bold), Paragraph("Three-Tier RESTful Client-Server Architectural Block Diagram", td_style), Paragraph("21", td_style)],
        [Paragraph("2", td_style), Paragraph("Figure 4.2", td_bold), Paragraph("End-to-End Authentication and Registration Sequence Diagram", td_style), Paragraph("23", td_style)],
        [Paragraph("3", td_style), Paragraph("Figure 4.3", td_bold), Paragraph("Hybrid Cloud-Offline AI Clinical-Support Flow", td_style), Paragraph("24", td_style)],
        [Paragraph("4", td_style), Paragraph("Figure 4.4", td_bold), Paragraph("Render Cloud Production Deployment Topology", td_style), Paragraph("26", td_style)],
        [Paragraph("5", td_style), Paragraph("Figure 6.1", td_bold), Paragraph("Entity-Relationship and Schema Association Architecture Diagram", td_style), Paragraph("30", td_style)],
        [Paragraph("6", td_style), Paragraph("Figure 6.2", td_bold), Paragraph("Appointment State Machine Transition Lifecycle Diagram", td_style), Paragraph("35", td_style)],
        [Paragraph("7", td_style), Paragraph("Figure 8.1", td_bold), Paragraph("System Operation Latency Benchmark and Synthetic Vignette Concordance", td_style), Paragraph("42", td_style)],
        [Paragraph("8", td_style), Paragraph("Figure 9.1", td_bold), Paragraph("Project Execution Schedule and Milestone Gantt Chart (July–November 2026)", td_style), Paragraph("47", td_style)],
        [Paragraph("9", td_style), Paragraph("Figure 9.2", td_bold), Paragraph("Clinical Workflow and Vitals Escalation Decision Tree", td_style), Paragraph("49", td_style)],
        [Paragraph("10", td_style), Paragraph("Figure B.1", td_bold), Paragraph("Worker and Administrator Sign-In Portal", td_style), Paragraph("55", td_style)],
        [Paragraph("11", td_style), Paragraph("Figure B.3", td_bold), Paragraph("Operational Field Analytics Dashboard", td_style), Paragraph("55", td_style)],
        [Paragraph("12", td_style), Paragraph("Figure B.4", td_bold), Paragraph("Citizen Registry and Multi-Field Search View", td_style), Paragraph("55", td_style)],
        [Paragraph("13", td_style), Paragraph("Figure B.5", td_bold), Paragraph("Priority-Driven Appointment Management View", td_style), Paragraph("56", td_style)],
        [Paragraph("14", td_style), Paragraph("Figure B.6", td_bold), Paragraph("Multi-Vital Clinical Documentation and Health Records View", td_style), Paragraph("56", td_style)],
        [Paragraph("15", td_style), Paragraph("Figure B.7", td_bold), Paragraph("AshaBot Frontline Clinical Decision Support Interface", td_style), Paragraph("56", td_style)],
        [Paragraph("16", td_style), Paragraph("Figure C.1", td_bold), Paragraph("IEEE Conference Acceptance Proof (ICAIDS-PM-26, Kuala Lumpur, Malaysia)", td_style), Paragraph("57", td_style)],
        [Paragraph("17", td_style), Paragraph("Figure C.2", td_bold), Paragraph("Paperpal Online Plagiarism Check Report (Verified 6% Similarity)", td_style), Paragraph("58", td_style)],
    ]
    t_fig = Table(fig_data, colWidths=[35, 65, 362, 60])
    t_fig.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_fig)
    story.append(Spacer(1, 10))

    story.append(Paragraph("LIST OF TABLES", h1))
    tab_data = [
        [Paragraph("<b>Sl. No.</b>", th_style), Paragraph("<b>Table Name</b>", th_style), Paragraph("<b>Caption</b>", th_style), Paragraph("<b>Page No.</b>", th_style)],
        [Paragraph("1", td_style), Paragraph("Table 1.1", td_bold), Paragraph("Paper-Based Field Bottlenecks and Corresponding Platform Capabilities", td_style), Paragraph("3", td_style)],
        [Paragraph("2", td_style), Paragraph("Table 2.1", td_bold), Paragraph("Literature Review Synthesis and Existing System Comparison Matrix", td_style), Paragraph("8", td_style)],
        [Paragraph("3", td_style), Paragraph("Table 2.2", td_bold), Paragraph("Hybrid AI Design Opportunity and Safety Boundary", td_style), Paragraph("12", td_style)],
        [Paragraph("4", td_style), Paragraph("Table 3.1", td_bold), Paragraph("Comparative Gap Analysis of Legacy mHealth Systems vs. Proposed Platform", td_style), Paragraph("16", td_style)],
        [Paragraph("5", td_style), Paragraph("Table 4.1", td_bold), Paragraph("Complete Technology Stack and System Tooling Specification", td_style), Paragraph("19", td_style)],
        [Paragraph("6", td_style), Paragraph("Table 4.2", td_bold), Paragraph("Hardware, Cloud Hosting, and Software Runtime Environment Specifications", td_style), Paragraph("20", td_style)],
        [Paragraph("7", td_style), Paragraph("Table 4.3", td_bold), Paragraph("Hybrid AI Components, Inputs, Outputs, and Controls", td_style), Paragraph("25", td_style)],
        [Paragraph("8", td_style), Paragraph("Table 5.1", td_bold), Paragraph("Project Objectives and Engineering Success Criteria", td_style), Paragraph("29", td_style)],
        [Paragraph("9", td_style), Paragraph("Table 6.1", td_bold), Paragraph("User Collection Schema Attributes and Constraints", td_style), Paragraph("31", td_style)],
        [Paragraph("10", td_style), Paragraph("Table 6.2", td_bold), Paragraph("Patient Collection Schema Attributes and Constraints", td_style), Paragraph("32", td_style)],
        [Paragraph("11", td_style), Paragraph("Table 6.3", td_bold), Paragraph("Appointment Collection Schema Attributes and Constraints", td_style), Paragraph("32", td_style)],
        [Paragraph("12", td_style), Paragraph("Table 6.4", td_bold), Paragraph("Health Record Collection Schema and Embedded Subdocuments", td_style), Paragraph("33", td_style)],
        [Paragraph("13", td_style), Paragraph("Table 6.5", td_bold), Paragraph("AI Conversation Schema and Retention Controls", td_style), Paragraph("34", td_style)],
        [Paragraph("14", td_style), Paragraph("Table 7.1", td_bold), Paragraph("Comprehensive RESTful API Route Specifications (Core & Admin Governance)", td_style), Paragraph("39", td_style)],
        [Paragraph("15", td_style), Paragraph("Table 7.2", td_bold), Paragraph("AI-Assisted Workflow Endpoints and Fallback Behavior", td_style), Paragraph("40", td_style)],
        [Paragraph("16", td_style), Paragraph("Table 8.1", td_bold), Paragraph("End-to-End System Test Cases and Functional Verification Matrix", td_style), Paragraph("41", td_style)],
        [Paragraph("17", td_style), Paragraph("Table 8.2", td_bold), Paragraph("Comprehensive Security Assessment and Vulnerability Hardening Matrix", td_style), Paragraph("43", td_style)],
        [Paragraph("18", td_style), Paragraph("Table 8.3", td_bold), Paragraph("AI Evaluation Summary and Interpretation", td_style), Paragraph("44", td_style)],
        [Paragraph("19", td_style), Paragraph("Table 9.1", td_bold), Paragraph("Milestone Work Breakdown Structure and Deliverable Schedule", td_style), Paragraph("46", td_style)],
        [Paragraph("20", td_style), Paragraph("Table C.1", td_bold), Paragraph("Mapping of Project Capabilities to UN Sustainable Development Goals (SDGs)", td_style), Paragraph("59", td_style)],
    ]
    t_tab = Table(tab_data, colWidths=[35, 65, 362, 60])
    t_tab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_tab)
    story.append(PageBreak())

    # ================= ABBREVIATIONS =================
    story.append(Paragraph("ABBREVIATIONS", h1))
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
        [Paragraph("NHA", td_bold), Paragraph("National Health Authority", td_style), Paragraph("NIST", td_bold), Paragraph("National Institute of Standards & Tech", td_style)],
        [Paragraph("NRHM", td_bold), Paragraph("National Rural Health Mission", td_style), Paragraph("ODM", td_bold), Paragraph("Object Data Mapper", td_style)],
        [Paragraph("OTP", td_bold), Paragraph("One-Time Password", td_style), Paragraph("OWASP", td_bold), Paragraph("Open Worldwide App Security Project", td_style)],
        [Paragraph("PHC", td_bold), Paragraph("Primary Health Center", td_style), Paragraph("PNC", td_bold), Paragraph("Postnatal Care", td_style)],
        [Paragraph("PWA", td_bold), Paragraph("Progressive Web Application", td_style), Paragraph("RBAC", td_bold), Paragraph("Role-Based Access Control", td_style)],
        [Paragraph("ReDoS", td_bold), Paragraph("Regular Expression Denial of Service", td_style), Paragraph("REST", td_bold), Paragraph("Representational State Transfer", td_style)],
        [Paragraph("SMTP", td_bold), Paragraph("Simple Mail Transfer Protocol", td_style), Paragraph("SPA", td_bold), Paragraph("Single-Page Application", td_style)],
        [Paragraph("SpO2", td_bold), Paragraph("Peripheral Capillary Oxygen Saturation", td_style), Paragraph("SRS", td_bold), Paragraph("Software Requirements Specification", td_style)],
        [Paragraph("TLS", td_bold), Paragraph("Transport Layer Security", td_style), Paragraph("TTL", td_bold), Paragraph("Time-To-Live", td_style)],
        [Paragraph("WHO", td_bold), Paragraph("World Health Organization", td_style), Paragraph("XSS", td_bold), Paragraph("Cross-Site Scripting", td_style)],
    ]
    t_abbr = Table(abbr_data, colWidths=[55, 206, 55, 206])
    t_abbr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_abbr)
    story.append(PageBreak())

    # ================= CHAPTER 1 =================
    story.append(Paragraph("CHAPTER 1: INTRODUCTION", h1))
    story.append(Paragraph("1.1 Background and Domain Context", h2))
    story.append(Paragraph(
        "Community health workers (CHWs) constitute the cornerstone of universal healthcare access in developing economies, operating at the direct boundary between marginalized citizen populations and institutional health facilities (Agarwal et al., 2015). Within India's National Rural Health Mission (NRHM) and National Health Mission (NHM), this frontline workforce is predominantly embodied by Accredited Social Health Activists (ASHAs). Working with Auxiliary Nurse Midwives (ANMs) and Primary Health Center (PHC) medical officers, ASHAs deliver vital maternal, child, and preventive health services across rural habitations.", body
    ))
    story.append(Paragraph("1.2 Problem Statement and Clinical Bottlenecks", h2))
    story.append(Paragraph(
        "Despite their criticality, community health workers historically document family registries, maternal vitals, and diagnostic notes in physical paper registers. This introduces four structural bottlenecks: (1) physical loss and moisture degradation of records; (2) fragmented antenatal and immunization tracking; (3) delayed vital signs triage during emergencies; and (4) complete lack of centralized clinical visibility across PHCs.", body
    ))
    
    t1_data = [
        [Paragraph("<b>Operational Dimension</b>", th_style), Paragraph("<b>Physical Paper Logbooks</b>", th_style), Paragraph("<b>Community Health Worker Platform</b>", th_style)],
        [Paragraph("Record Permanence", td_bold), Paragraph("Susceptible to environmental degradation, rain, and page tearing.", td_style), Paragraph("Persistent MongoDB BSON document storage with structured audit trails.", td_style)],
        [Paragraph("Retrieval Latency", td_bold), Paragraph("Manual linear search across registers taking 5 to 15 minutes.", td_style), Paragraph("Sub-second case-insensitive regex query across name, phone, or village (<40 ms).", td_style)],
        [Paragraph("Encounter Scheduling", td_bold), Paragraph("Disconnected diary notes leading to missed antenatal/vaccine dates.", td_style), Paragraph("Four-tier prioritized appointment scheduler with explicit state transitions.", td_style)],
        [Paragraph("Diagnostic Records", td_bold), Paragraph("Handwritten vital entries prone to illegibility and missing alert cues.", td_style), Paragraph("Structured multi-vital capture interface with color-coded threshold alerts.", td_style)],
        [Paragraph("Prescription Safety", td_bold), Paragraph("Unformatted dosage notes lacking frequency and duration clarity.", td_style), Paragraph("Dynamic multi-item prescription builder recording drug, dose, and schedule.", td_style)],
        [Paragraph("Administrative Oversight", td_bold), Paragraph("Labor-intensive manual monthly counting across multiple ledgers.", td_style), Paragraph("Automated operational dashboard aggregating cohort and visit metrics live.", td_style)],
    ]
    t1_table = Table(t1_data, colWidths=[100, 200, 222])
    t1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Table 1.1: Paper-Based Field Bottlenecks and Corresponding Platform Capabilities</b>", h3))
    story.append(t1_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("1.3 Project Motivation and Target Beneficiaries", h2))
    story.append(Paragraph(
        "Frontline cadres expend 30% to 40% of their active duty hours copying demographic entries across paper registers. Digitizing patient intake, longitudinal vital tracking, and visit scheduling reclaims substantial operational capacity for direct household counseling. Beneficiaries include Frontline Health Workers (ASHAs and ANMs), Rural and Semi-Urban Patient Cohorts, and PHC Medical Officers/Supervisors via an interactive Admin Panel.", body
    ))
    story.append(Paragraph("1.4 Scope and Delimitations of the Work", h2))
    story.append(Paragraph(
        "The platform is deployed live on Render cloud infrastructure (<code>https://community-healthworker-assistance.onrender.com/login</code>) supporting responsive web execution across smartphones, tablets, and desktops. Key functional modules include OTP onboarding with compulsory unique <code>workerId</code>, strict two-role RBAC (<code>ADMIN</code> and <code>WORKER</code>), administrator governance queues, multi-parameter search, priority visit scheduling, multi-vital logging, and hybrid cloud/offline clinical decision support.", body
    ))
    story.append(Paragraph("1.5 Organization of the Report", h2))
    story.append(Paragraph("This report is structured into 10 chapters detailing literature survey, gaps, methodology, objectives, architecture, implementation, experimental results, project timeline, and conclusions.", body))
    story.append(PageBreak())

    # ================= CHAPTER 2 =================
    story.append(Paragraph("CHAPTER 2: LITERATURE SURVEY", h1))
    story.append(Paragraph(
        "Mobile health (mHealth) interventions have progressed from simple one-way SMS reminders to complex clinical data-capture applications (Braun et al., 2013; Agarwal et al., 2015). Recent empirical evaluations by Charanthimath et al. (2021) in rural Karnataka and Paul et al. (2026) in Assam demonstrate that frontline workers face severe cognitive fatigue during home visits. Complex desktop layouts and deep menus fail in field conditions, emphasizing the need for a unified, responsive single-page architecture with sub-second response times.<br/><br/>"
        "At the policy and standardization levels, the World Health Organization (WHO, 2019, 2021) guidelines and HL7 FHIR Release 4 mandate structured, interoperable clinical observation boundaries. In India, the Ayushman Bharat Digital Mission (ABDM; NHA, 2021) and the Digital Personal Data Protection (DPDP) Act, 2023 mandate strict role segregation, cryptographic authentication, and PII minimization before external AI consultation.", body
    ))
    story.append(Spacer(1, 6))
    
    t2_data = [
        [Paragraph("<b>Capability</b>", th_style), Paragraph("<b>Cloud Path (Connected)</b>", th_style), Paragraph("<b>Offline Path (Deterministic)</b>", th_style), Paragraph("<b>Safety Boundary</b>", th_style)],
        [Paragraph("Context Organization", td_bold), Paragraph("Summarizes worker query & pseudonymized vitals.", td_style), Paragraph("Returns concise template triage cue when offline.", td_style), Paragraph("Only minimum necessary clinical data transmitted.", td_style)],
        [Paragraph("Danger Recognition", td_bold), Paragraph("System prompt mandates urgent escalation tag.", td_style), Paragraph("Evaluates explicit BP, SpO2, and temp thresholds.", td_style), Paragraph("Serves strictly as escalation cue, never diagnosis.", td_style)],
        [Paragraph("Uncertainty Handling", td_bold), Paragraph("Response states uncertainty & advises review.", td_style), Paragraph("Incomplete inputs trigger limitation notice.", td_style), Paragraph("Human worker retains full decision authority.", td_style)],
    ]
    t2_table = Table(t2_data, colWidths=[90, 140, 140, 152])
    t2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(Paragraph("<b>Table 2.2: Hybrid AI Design Opportunity and Safety Boundary</b>", h3))
    story.append(t2_table)
    story.append(PageBreak())

    # ================= CHAPTER 3 =================
    story.append(Paragraph("CHAPTER 3: RESEARCH GAPS OF EXISTING METHODS", h1))
    story.append(Paragraph(
        "A critical analysis of existing mHealth tools reveals three primary engineering deficiencies: (1) structural dichotomy between heavyweight enterprise HIS and rigid flat survey forms; (2) absence of lightweight reactive SPAs with sub-second patient search; and (3) complete failure of cloud-only AI assistants during rural connectivity outages. Table 3.1 synthesizes these gaps against the proposed platform capabilities.", body
    ))
    story.append(Spacer(1, 6))
    
    t3_data = [
        [Paragraph("<b>Evaluation Criterion</b>", th_style), Paragraph("<b>Paper Registers</b>", th_style), Paragraph("<b>Legacy Survey mHealth</b>", th_style), Paragraph("<b>Cloud-Only AI</b>", th_style), Paragraph("<b>Proposed CHW Platform</b>", th_style)],
        [Paragraph("Patient Record Search", td_bold), Paragraph("Manual scan (5–15 min)", td_style), Paragraph("Slow flat-file filtering", td_style), Paragraph("Not supported natively", td_style), Paragraph("Indexed regex (<40 ms)", td_bold)],
        [Paragraph("Vitals & Rx Integration", td_bold), Paragraph("Unstructured handwriting", td_style), Paragraph("Separate static forms", td_style), Paragraph("Free-text chat only", td_style), Paragraph("Unified 7-vital + Rx schema", td_bold)],
        [Paragraph("Appointment Lifecycle", td_bold), Paragraph("Static diary notes", td_style), Paragraph("Basic date reminders", td_style), Paragraph("None", td_style), Paragraph("4-tier priority + 4-state FSM", td_bold)],
        [Paragraph("Offline Triage Continuity", td_bold), Paragraph("Manual worker recall", td_style), Paragraph("Static form caching", td_style), Paragraph("Fails completely offline", td_style), Paragraph("Deterministic parser (4.2 ms)", td_bold)],
        [Paragraph("Privacy & Access Control", td_bold), Paragraph("Physical theft risk", td_style), Paragraph("Basic password login", td_style), Paragraph("High PII exposure risk", td_style), Paragraph("OTP + Bcrypt + JWT + Admin Queue", td_bold)],
    ]
    t3_table = Table(t3_data, colWidths=[92, 100, 105, 105, 120])
    t3_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(Paragraph("<b>Table 3.1: Comparative Gap Analysis of Legacy Systems vs. Proposed Platform</b>", h3))
    story.append(t3_table)
    story.append(PageBreak())

    # ================= CHAPTER 4 =================
    story.append(Paragraph("CHAPTER 4: PROPOSED METHODOLOGY", h1))
    story.append(Paragraph("4.1 Requirements & System Architecture", h2))
    story.append(Paragraph(
        "The platform implements a three-tier client-server architecture: (1) Presentation Tier in React 18 with Vite and React Router v6; (2) Application Tier in Node.js and Express 5; and (3) Persistence Tier in MongoDB Atlas with Mongoose 8. Crucially, the platform enforces a strict two-role model (<code>ADMIN</code> and <code>WORKER</code>) and mandates a unique <code>workerId</code> during registration.", body
    ))
    
    # Figure 4.1
    fig4_1 = make_flowable_image("docs/figures/image3.jpg", max_width=360, max_height=200)
    if fig4_1:
        story.append(Spacer(1, 4))
        story.append(fig4_1)
        story.append(Paragraph("<b>Figure 4.1: Three-Tier RESTful Client-Server Architectural Block Diagram</b>", caption_style))
    
    story.append(Paragraph("4.2 Operational Security, OTP & Admin Governance", h2))
    story.append(Paragraph(
        "Security is established via a multi-tiered pipeline: 6-digit email OTPs expire via a 600-second MongoDB TTL index, passwords are encrypted with 10-round salted Bcrypt digests, and session authorization uses HMAC-SHA256 JWTs. All newly registered accounts initialize in an inactive state (<code>isApproved: false, status: 'INACTIVE'</code>). The initial Administrator is approved in MongoDB Atlas; once active, administrators manage pending registrations, role toggles, and account statuses via the interactive <code>/admin</code> panel.", body
    ))
    
    # Figure 4.2
    fig4_2 = make_flowable_image("docs/figures/image4.jpg", max_width=360, max_height=200)
    if fig4_2:
        story.append(Spacer(1, 4))
        story.append(fig4_2)
        story.append(Paragraph("<b>Figure 4.2: End-to-End Authentication and Registration Sequence Diagram</b>", caption_style))
    
    story.append(PageBreak())
    
    story.append(Paragraph("4.3 Hybrid GenAI & Offline Decision Engine", h2))
    story.append(Paragraph(
        "Clinical consultations route through <code>POST /api/ai/chat</code>. The server validates JWT claims, strips direct patient PII, and calls Google Gemini LLM with candidate model progression. If connectivity is lost or times out, the local rule engine immediately evaluates systolic/diastolic blood pressure, SpO2, temperature, and danger keywords, returning an explicit triage tag in 4.2 ms.", body
    ))
    
    # Figure 4.3
    fig4_3 = make_flowable_image("docs/figures/image5.jpg", max_width=440, max_height=180)
    if fig4_3:
        story.append(Spacer(1, 4))
        story.append(fig4_3)
        story.append(Paragraph("<b>Figure 4.3: Hybrid Cloud-Offline AI Clinical-Support Flow</b>", caption_style))

    story.append(Paragraph("4.4 Cloud Deployment Architecture on Render", h2))
    story.append(Paragraph(
        "The unified application is deployed on Render PaaS (<code>https://community-healthworker-assistance.onrender.com/login</code>) with TLS 1.3 encryption, automatic base URL resolution (<code>/api</code> in production), pre-flight database readiness checks, and single-page routing fallbacks.", body
    ))
    
    # Figure 4.4
    fig4_4 = make_flowable_image("docs/figures/image6.png", max_width=440, max_height=160)
    if fig4_4:
        story.append(Spacer(1, 4))
        story.append(fig4_4)
        story.append(Paragraph("<b>Figure 4.4: Render Cloud Production Deployment Topology</b>", caption_style))

    story.append(PageBreak())

    # ================= CHAPTER 5 & 6 =================
    story.append(Paragraph("CHAPTER 5: OBJECTIVES & SUCCESS CRITERIA", h1))
    story.append(Paragraph(
        "The primary objective is to deliver a resilient, web-first digital health system tailored to frontline health workers (ASHAs and ANMs). Specific objectives include: (1) auditable digital patient registry; (2) sub-200 ms multi-parameter search; (3) priority-driven visit scheduler; (4) multi-vital logging with dynamic prescription builder; (5) layered cryptographic security with two-role governance; (6) bounded hybrid AI decision support; and (7) cloud deployment on Render.", body
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("CHAPTER 6: SYSTEM ARCHITECTURE & DATABASE DESIGN", h1))
    story.append(Paragraph(
        "The MongoDB database architecture partitions entities into five collections: User, Patient, Appointment, HealthRecord, and AIConversation. Figure 6.1 illustrates the entity associations.", body
    ))
    
    # Figure 6.1
    fig6_1 = make_flowable_image("docs/figures/image7.jpg", max_width=350, max_height=180)
    if fig6_1:
        story.append(Spacer(1, 4))
        story.append(fig6_1)
        story.append(Paragraph("<b>Figure 6.1: Entity-Relationship and Schema Association Architecture Diagram</b>", caption_style))
    
    story.append(Spacer(1, 4))
    
    t6_data = [
        [Paragraph("<b>Field Name</b>", th_style), Paragraph("<b>BSON Type</b>", th_style), Paragraph("<b>Constraints & Validation</b>", th_style), Paragraph("<b>Operational Description</b>", th_style)],
        [Paragraph("_id", td_bold), Paragraph("ObjectId", td_style), Paragraph("Primary Key, Auto-generated", td_style), Paragraph("Unique user account identifier.", td_style)],
        [Paragraph("fullName", td_bold), Paragraph("String", td_style), Paragraph("Required, Trimmed, Max 100", td_style), Paragraph("Official legal name of worker/admin.", td_style)],
        [Paragraph("email", td_bold), Paragraph("String", td_style), Paragraph("Required, Unique, Lowercase, Indexed", td_style), Paragraph("Primary login & OTP destination.", td_style)],
        [Paragraph("password", td_bold), Paragraph("String", td_style), Paragraph("Required, Min 6, Bcrypt Digest", td_style), Paragraph("Salted cryptographic password hash.", td_style)],
        [Paragraph("role", td_bold), Paragraph("String", td_style), Paragraph("Enum: ['ADMIN', 'WORKER']", td_style), Paragraph("RBAC role governing endpoints.", td_style)],
        [Paragraph("workerId", td_bold), Paragraph("String", td_style), Paragraph("Required, Unique, Uppercase, Trimmed", td_style), Paragraph("Compulsory ASHA Field ID / Admin ID.", td_style)],
        [Paragraph("isEmailVerified", td_bold), Paragraph("Boolean", td_style), Paragraph("Default: false", td_style), Paragraph("Flips true upon 6-digit OTP verification.", td_style)],
        [Paragraph("isApproved", td_bold), Paragraph("Boolean", td_style), Paragraph("Default: false", td_style), Paragraph("Admin approval gate for clinical access.", td_style)],
        [Paragraph("status", td_bold), Paragraph("String", td_style), Paragraph("Enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED']", td_style), Paragraph("Account operational lifecycle state.", td_style)],
    ]
    t6_table = Table(t6_data, colWidths=[70, 60, 160, 232])
    t6_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(Paragraph("<b>Table 6.1: User Collection Schema Attributes and Constraints</b>", h3))
    story.append(t6_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("6.4 State Transition Modeling for Clinical Encounters", h2))
    story.append(Paragraph(
        "Appointments follow a formal finite state machine (SCHEDULED -> COMPLETED, or CANCELLED, or MISSED) with explicit timestamps and assigned worker attribution. Figure 6.2 models these lifecycle transitions.", body
    ))
    
    # Figure 6.2
    fig6_2 = make_flowable_image("docs/figures/image8.jpg", max_width=440, max_height=120)
    if fig6_2:
        story.append(Spacer(1, 4))
        story.append(fig6_2)
        story.append(Paragraph("<b>Figure 6.2: Appointment State Machine Transition Lifecycle Diagram</b>", caption_style))

    story.append(PageBreak())

    # ================= CHAPTER 7 =================
    story.append(Paragraph("CHAPTER 7: SYSTEM IMPLEMENTATION", h1))
    story.append(Paragraph(
        "Implementation details cover client-side React 18 components, protected routing, centralized Axios interceptors, Express 5 REST controllers, and Admin Panel endpoints. Table 7.1 summarizes the complete REST API interface specification.", body
    ))
    story.append(Spacer(1, 4))
    
    t7_data = [
        [Paragraph("<b>Method</b>", th_style), Paragraph("<b>Route URL Path</b>", th_style), Paragraph("<b>Access Gate</b>", th_style), Paragraph("<b>Operational Scope & Controller Method</b>", th_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/auth/send-otp", td_style), Paragraph("Public", td_style), Paragraph("Generates & emails 6-digit TTL OTP (sendOtp).", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/auth/verify-otp", td_style), Paragraph("Public", td_style), Paragraph("Validates OTP code; returns verification token.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/auth/register", td_style), Paragraph("Public", td_style), Paragraph("Creates account with compulsory workerId & role.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/auth/login", td_style), Paragraph("Public", td_style), Paragraph("Verifies credentials & approval; issues JWT token.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/admin/stats", td_style), Paragraph("Protected (ADMIN)", td_style), Paragraph("Returns system-wide cohort, worker, and visit metrics.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/admin/users", td_style), Paragraph("Protected (ADMIN)", td_style), Paragraph("Lists all users with search by name, email, workerId.", td_style)],
        [Paragraph("PUT", td_bold), Paragraph("/api/admin/users/:id/approve", td_style), Paragraph("Protected (ADMIN)", td_style), Paragraph("Approves worker (isApproved: true, status: ACTIVE).", td_style)],
        [Paragraph("PUT", td_bold), Paragraph("/api/admin/users/:id/role", td_style), Paragraph("Protected (ADMIN)", td_style), Paragraph("Toggles user role between WORKER and ADMIN.", td_style)],
        [Paragraph("PUT", td_bold), Paragraph("/api/admin/users/:id/status", td_style), Paragraph("Protected (ADMIN)", td_style), Paragraph("Toggles account state between ACTIVE and SUSPENDED.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/patients/search", td_style), Paragraph("Protected", td_style), Paragraph("Sub-second regex query across name, phone, village.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/appointments", td_style), Paragraph("Protected", td_style), Paragraph("Schedules encounter & auto-dispatches email confirmation.", td_style)],
        [Paragraph("DELETE", td_bold), Paragraph("/api/patients/:id", td_style), Paragraph("Protected", td_style), Paragraph("Cascading delete of patient, appointments, and vitals.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/health-records", td_style), Paragraph("Protected", td_style), Paragraph("Logs 7 physiological vitals & itemized drug array.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/ai/chat", td_style), Paragraph("Protected", td_style), Paragraph("Dual-path: Google Gemini LLM / offline rule parser.", td_style)],
    ]
    t7_table = Table(t7_data, colWidths=[45, 140, 95, 242])
    t7_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(Paragraph("<b>Table 7.1: Comprehensive RESTful API Route Specifications (Core & Admin)</b>", h3))
    story.append(t7_table)
    story.append(PageBreak())

    # ================= CHAPTER 8 & 9 =================
    story.append(Paragraph("CHAPTER 8: RESULTS AND DISCUSSIONS", h1))
    story.append(Paragraph(
        "Functional verification verified 100% pass rates across test scenarios including route protection, compulsory worker ID onboarding, admin approval queues, regex patient search (38.4 ms), multi-vital logging (26.1 ms), and offline triage execution (4.2 ms). In cross-mode validation across 50 synthetic clinical vignettes, the deterministic offline rule engine achieved 96.0% concordance (48/50) with cloud risk tags, establishing reliable clinical fallback.<br/><br/>"
        "Security hardening addressed OWASP Top-10 vulnerabilities: rate-limiting OTP guesses, bcrypt salted digests, stateless JWT RBAC, sanitization of regex searches, and automated pre-flight database connection detection.", body
    ))
    
    # Figure 8.1
    fig8_1 = make_flowable_image("docs/figures/image9.png", max_width=440, max_height=165)
    if fig8_1:
        story.append(Spacer(1, 4))
        story.append(fig8_1)
        story.append(Paragraph("<b>Figure 8.1: System Operation Latency Benchmark and Synthetic Vignette Concordance</b>", caption_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("CHAPTER 9: PROJECT TIMELINE AND OUTCOMES", h1))
    story.append(Paragraph(
        "The project was executed across an 18-week agile engineering schedule from July 2026 to November 2026 across eight distinct milestones: T1 (Literature Survey), T2 (SRS & Schemas), T3 (Backend API & Auth), T4 (Frontend React SPA), T5 (Hybrid AI AshaBot), T6 (Admin Governance Panel), T7 (Cloud Deployment & Vignettes), and T8 (Thesis & Viva Preparation).", body
    ))
    
    # Figure 9.1
    fig9_1 = make_flowable_image("docs/figures/image10.png", max_width=440, max_height=160)
    if fig9_1:
        story.append(Spacer(1, 4))
        story.append(fig9_1)
        story.append(Paragraph("<b>Figure 9.1: Project Execution Schedule and Milestone Gantt Chart (July–November 2026)</b>", caption_style))

    # Figure 9.2
    fig9_2 = make_flowable_image("docs/figures/image11.png", max_width=440, max_height=150)
    if fig9_2:
        story.append(Spacer(1, 4))
        story.append(fig9_2)
        story.append(Paragraph("<b>Figure 9.2: Clinical Workflow and Vitals Escalation Decision Tree</b>", caption_style))

    story.append(PageBreak())

    # ================= CHAPTER 10 & REFERENCES =================
    story.append(Paragraph("CHAPTER 10: CONCLUSION AND FUTURE WORK", h1))
    story.append(Paragraph(
        "The Community Health Worker Assistance Platform delivers an auditable, lightweight full-stack healthcare operating system deployed on Render cloud infrastructure that eliminates manual paper logbooks. Future enhancements will include offline-first Service Worker sync, regional vernacular localization (Kannada/Hindi), automated SMS appointment alerts, and formal ABDM ABHA sandbox interoperability.", body
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("REFERENCES (IEEE STANDARD BIBLIOGRAPHY)", h1))
    refs = [
        "[1] S. Agarwal, H. B. Perry, L. A. Long, and A. B. Labrique, 'Evidence on feasibility and effective use of mHealth strategies by frontline health workers in developing countries: Systematic review,' Tropical Medicine & International Health, vol. 20, no. 8, pp. 1003–1014, Aug. 2015.",
        "[2] S. Kumar, R. Garg, H. A. Siddiqui, and R. Roy, 'Health services rendered through Accredited Social Health Activists to rural Uttar Pradesh, India,' Int. J. Community Med. Public Health, vol. 4, no. 7, pp. 2500–2506, Jul. 2017.",
        "[3] U. Charanthimath et al., 'Community health worker evaluation of implementing an mHealth application to support maternal health care in rural India,' Frontiers in Global Women's Health, vol. 2, Art. 645690, Apr. 2021.",
        "[4] R. Braun, C. Catalani, J. Wimbush, and D. Israelski, 'Community health workers and mobile technology: A systematic review,' PLOS ONE, vol. 8, no. 6, Art. e65772, Jun. 2013.",
        "[5] R. T. Fielding, 'Architectural styles and the design of network-based software architectures,' Ph.D. dissertation, Univ. of California, Irvine, 2000.",
        "[6] M. Wang et al., 'Health workers adoption of digital health technology in low- and middle-income countries: A systematic review and meta-analysis,' Bull. World Health Organ., vol. 103, no. 2, pp. 126–135, Feb. 2025.",
        "[7] S. Paul, P. Saha, M. D. Bharali, A. C. Baishya, and J. Ojah, 'Frontline health workers perceptions of digital health platforms in Assam,' Cureus, vol. 18, no. 7, Art. e112153, Jul. 2026.",
        "[8] World Health Organization (WHO), WHO Guideline: Recommendations on Digital Interventions for Health System Strengthening. Geneva: WHO, 2019.",
        "[9] World Health Organization (WHO), Global Strategy on Digital Health 2020–2025. Geneva: WHO, 2021.",
        "[10] HL7 International, HL7 FHIR Release 4: Fast Healthcare Interoperability Resources. Ann Arbor, MI, 2019.",
        "[11] National Health Authority (NHA), Ayushman Bharat Digital Mission (ABDM): Strategy Paper. New Delhi: MoHFW, 2021.",
        "[12] Ministry of Law and Justice, Government of India, The Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023). New Delhi, 2023.",
        "[13] K. Singhal et al., 'Large language models encode clinical knowledge,' Nature, vol. 620, pp. 172–180, Aug. 2023.",
        "[14] Google DeepMind, 'Gemini: A family of highly capable multimodal models,' arXiv:2312.11805, Dec. 2023.",
        "[15] M. Chary et al., 'Artificial intelligence in emergency medicine: A systematic review,' Ann. Emerg. Med., vol. 74, no. 5, pp. 647–658, 2019.",
        "[16] Dimagi, CommCare: Evidence-Based Mobile Platform for Frontline Workers. Cambridge, MA, 2020.",
        "[17] OpenSRP, Open Smart Register Platform for Maternal and Child Health. WHO Brief, 2022.",
        "[18] N. Provos and D. Mazières, 'A future-adaptable password scheme,' in Proc. USENIX ATC, Jun. 1999, pp. 81–91.",
        "[19] M. Jones, J. Bradley, and N. Sakimura, 'JSON Web Token (JWT),' IETF, RFC 7519, May 2015.",
        "[20] Y. Sheffer, D. Hardt, and M. Jones, 'JSON Web Token Best Current Practices,' IETF, RFC 8725, Feb. 2020.",
        "[21] OWASP Foundation, 'OWASP Top 10: 2025 Web Application Security Risks,' 2025. [Online]. Available: https://owasp.org",
        "[22] NIST, 'Digital identity guidelines,' U.S. Dept. Commerce, NIST SP 800-63B-4, 2025.",
        "[23] Meta Open Source, 'React 18 Documentation,' 2026. [Online]. Available: https://react.dev",
        "[24] OpenJS Foundation, 'Express.js 5.x Documentation,' 2026. [Online]. Available: https://expressjs.com",
        "[25] MongoDB, Inc., 'MongoDB Manual & TTL Index Reference,' 2026. [Online]. Available: https://mongodb.com",
        "[26] Automattic / Mongoose ODM, 'Mongoose 8.x Documentation,' 2026. [Online]. Available: https://mongoosejs.com",
        "[27] Nodemailer, 'Nodemailer SMTP Documentation,' 2026. [Online]. Available: https://nodemailer.com"
    ]
    for r in refs:
        story.append(Paragraph(r, ParagraphStyle('RefStyle', fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=slate_text, leftIndent=12, firstLineIndent=-12, spaceAfter=2)))
    story.append(PageBreak())

    # ================= APPENDICES =================
    story.append(Paragraph("APPENDIX-A: PSEUDOCODE", h1))
    story.append(Paragraph("<b>A.1 Patient Management Route Handler (routes/patientRoutes.js)</b>", h2))
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
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>A.2 JWT Authentication Middleware (middleware/authMiddleware.js)</b>", h2))
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
        "};"
    )
    story.append(Preformatted(p2, code_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>A.3 Deterministic Offline Triage Classifier (services/offlineTriage.js)</b>", h2))
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
    story.append(Paragraph("APPENDIX-B: SCREENSHOTS", h1))
    
    # Figure B.1
    story.append(Paragraph("<b>Figure B.1: Worker and Administrator Sign-In Portal</b>", h2))
    story.append(Paragraph("Live authentication portal at <code>https://community-healthworker-assistance.onrender.com/login</code> with role selection (WORKER vs. ADMIN), compulsory ASHA Worker Field ID / Employee ID, and 6-digit email OTP.", body))
    fb1 = make_flowable_image("docs/figures/image12.png", max_width=440, max_height=180)
    if fb1:
        story.append(fb1)
        story.append(Paragraph("<i>Figure B.1: Worker and Administrator Sign-In Portal</i>", caption_style))
    story.append(Spacer(1, 6))

    # Figure B.3
    story.append(Paragraph("<b>Figure B.3: Operational Field Analytics Dashboard</b>", h2))
    story.append(Paragraph("Real-time operational dashboard aggregating total registered citizens, active cohorts, scheduled visits, and recorded vital logs.", body))
    fb3 = make_flowable_image("docs/figures/image13.png", max_width=440, max_height=180)
    if fb3:
        story.append(fb3)
        story.append(Paragraph("<i>Figure B.3: Operational Field Analytics Dashboard</i>", caption_style))
    story.append(PageBreak())

    # Figure B.4
    story.append(Paragraph("<b>Figure B.4: Citizen Registry and Multi-Field Search View</b>", h2))
    story.append(Paragraph("Indexed citizen directory supporting sub-40 ms regex queries across names, phone numbers, and villages.", body))
    fb4 = make_flowable_image("docs/figures/image14.png", max_width=440, max_height=180)
    if fb4:
        story.append(fb4)
        story.append(Paragraph("<i>Figure B.4: Citizen Registry and Multi-Field Search View</i>", caption_style))
    story.append(Spacer(1, 6))

    # Figure B.5
    story.append(Paragraph("<b>Figure B.5: Priority-Driven Appointment Management View</b>", h2))
    story.append(Paragraph("Four-tier prioritized appointment management interface with automated patient email notifications upon scheduling.", body))
    fb5 = make_flowable_image("docs/figures/image15.png", max_width=440, max_height=180)
    if fb5:
        story.append(fb5)
        story.append(Paragraph("<i>Figure B.5: Priority-Driven Appointment Management View</i>", caption_style))
    story.append(PageBreak())

    # Figure B.6
    story.append(Paragraph("<b>Figure B.6: Multi-Vital Clinical Documentation and Health Records View</b>", h2))
    story.append(Paragraph("Structured physiological intake form capturing 7 vital signs with color-coded threshold alerts and dynamic prescription builder.", body))
    fb6 = make_flowable_image("docs/figures/image16.png", max_width=440, max_height=180)
    if fb6:
        story.append(fb6)
        story.append(Paragraph("<i>Figure B.6: Multi-Vital Clinical Documentation and Health Records View</i>", caption_style))
    story.append(Spacer(1, 6))

    # Figure B.7
    story.append(Paragraph("<b>Figure B.7: AshaBot Frontline Clinical Decision Support Interface</b>", h2))
    story.append(Paragraph("Assistant conversation panel displaying explicit CLOUD / OFFLINE mode badges, triage tags, and human-review boundaries.", body))
    fb7 = make_flowable_image("docs/figures/image17.png", max_width=440, max_height=180)
    if fb7:
        story.append(fb7)
        story.append(Paragraph("<i>Figure B.7: AshaBot Frontline Clinical Decision Support Interface</i>", caption_style))
    story.append(PageBreak())

    # ================= APPENDIX-C: ENCLOSURES =================
    story.append(Paragraph("APPENDIX-C: ENCLOSURES", h1))
    
    # Enclosure 1
    story.append(Paragraph("<b>1. IEEE Conference Acceptance Proof</b>", h2))
    story.append(Paragraph(
        "Official acceptance letter from the <b>International Conference on AI and Data Science for Personalized Medicine (ICAIDS-PM-26)</b> "
        "organized by the Institute for Scientific and Engineering Research (ISER) held at Kuala Lumpur, Malaysia.<br/>"
        "• <b>Paper ID:</b> ISER-10-30-00107995<br/>"
        "• <b>Paper Title:</b> Community Health Worker Assistance Platform: A Secure and Hybrid GenAI-Enabled MERN Architecture for Field Health Management<br/>"
        "• <b>Authors:</b> Nagaraj Shripad Bhat<br/>"
        "• <b>Co-Authors:</b> Swastik Vinayak Hegde, Abhinava Thunga K N", body
    ))
    story.append(Spacer(1, 4))
    enc1 = make_flowable_image("docs/figures/image18.jpeg", max_width=400, max_height=450)
    if enc1:
        story.append(enc1)
        story.append(Paragraph("<i>Figure C.1: IEEE Conference Acceptance Proof (ICAIDS-PM-26, Kuala Lumpur, Malaysia)</i>", caption_style))
    story.append(PageBreak())

    # Enclosure 2
    story.append(Paragraph("<b>2. Similarity Index / Plagiarism Check Report</b>", h2))
    story.append(Paragraph(
        "Institutional Plagiarism Check Summary via Paperpal Draft: <b>Overall Similarity Index verified at 6%</b>, comfortably complying with Presidency University's academic integrity standard threshold of &lt;15%.", body
    ))
    story.append(Spacer(1, 4))
    enc2 = make_flowable_image("docs/figures/image19.jpeg", max_width=450, max_height=240)
    if enc2:
        story.append(enc2)
        story.append(Paragraph("<i>Figure C.2: Paperpal Online Plagiarism Check Report (Verified 6% Similarity)</i>", caption_style))
    story.append(Spacer(1, 10))

    # Enclosure 3
    story.append(Paragraph("<b>3. Sustainable Development Goals (SDGs) Mapping</b>", h2))
    story.append(Paragraph("Table C.1 maps project capabilities to United Nations Sustainable Development Goals (SDGs).", body))
    story.append(Spacer(1, 4))
    
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
    t_sdg = Table(sdg_data, colWidths=[130, 110, 282])
    t_sdg.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(Paragraph("<b>Table C.1: Mapping of Project Capabilities to UN Sustainable Development Goals (SDGs)</b>", h3))
    story.append(t_sdg)

    doc.build(story, canvasmaker=UniversityNumberedCanvas)
    print("SUCCESS: University Project Report PDF generated at:", pdf_path)

if __name__ == "__main__":
    build_pdf()
