import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header
        self.drawString(54, 750, "Community Health Worker Assistance Platform — System Documentation")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)
        
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Confidential — B.Tech Final Year Capstone Project")
        self.line(54, 46, 558, 46)
        self.restoreState()

def generate_pdf():
    pdf_path = "CHW_Platform_System_Documentation.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0F766E")
    dark_slate = colors.HexColor("#0F172A")
    body_color = colors.HexColor("#334155")
    
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=dark_slate,
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        spaceAfter=20
    )

    badge_style = ParagraphStyle(
        'CoverBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=primary_color,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark_slate,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=body_color,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=body_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=dark_slate
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 100))
    story.append(Paragraph("B.TECH FINAL YEAR ENGINEERING CAPSTONE PROJECT", badge_style))
    story.append(Paragraph("Community Health Worker (CHW)<br/>Assistance Platform", title_style))
    story.append(Paragraph("Comprehensive Project Blueprint: Complete Architecture, Tech Stack, Schemas, & Point-to-Point Operational Specifications", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=primary_color, spaceBefore=0, spaceAfter=25))

    meta_data = [
        [Paragraph("Project Domain:", table_cell_bold), Paragraph("Healthcare Informatics & Community Health Operations", table_cell_style)],
        [Paragraph("Target Users:", table_cell_bold), Paragraph("Community Health Workers (ASHA / ANM / PHC Auxiliary Nurses)", table_cell_style)],
        [Paragraph("Architecture:", table_cell_bold), Paragraph("3-Tier RESTful Client-Server (React SPA + Express API + MongoDB)", table_cell_style)],
        [Paragraph("Authentication:", table_cell_bold), Paragraph("JWT Bearer Tokens + Email OTP Verification + Bcrypt Password Hashing", table_cell_style)],
        [Paragraph("Core Modules:", table_cell_bold), Paragraph("Patient Management, Appointment Scheduler, Health Records & Vitals, Security", table_cell_style)],
        [Paragraph("Deployment Status:", table_cell_bold), Paragraph("Full Working Implementation (Verified End-to-End)", table_cell_style)],
    ]
    t_meta = Table(meta_data, colWidths=[110, 394])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(PageBreak())

    # ================= 1. EXECUTIVE SUMMARY =================
    story.append(Paragraph("1. Executive Summary & Clinical Problem Statement", h1_style))
    story.append(Paragraph(
        "Frontline community healthcare workers (such as ASHA workers and Auxiliary Nurse Midwives in rural and semi-urban communities) "
        "serve as the vital bridge between remote citizens and primary healthcare centers. Historically, health workers manage patient cohorts "
        "using physical paper logbooks. This approach presents critical bottlenecks: physical loss of maternal tracking records, missed infant immunization cycles, "
        "delayed vital triage for hypertensive and diabetic patients, and absence of unified clinical registries.",
        body_style
    ))
    story.append(Paragraph(
        "The <b>Community Health Worker Assistance Platform</b> bridges this digital gap by providing a reliable, web-first platform designed "
        "to streamline household registrations, schedule immunization and antenatal visits, monitor multi-parameter patient vitals, "
        "and maintain a permanent digital health record.",
        body_style
    ))

    # ================= 2. COMPLETE TECH STACK =================
    story.append(Paragraph("2. Complete Technology Stack & Tooling", h1_style))
    story.append(Paragraph("The platform is engineered using modern, industry-standard web technologies characterized by high performance, asynchronous I/O, and maintainability:", body_style))

    tech_table_data = [
        [Paragraph("Technology Layer", table_header_style), Paragraph("Component / Library", table_header_style), Paragraph("Specific Role & Engineering Purpose", table_header_style)],
        [Paragraph("Frontend Core", table_cell_bold), Paragraph("React.js 18 (SPA)", table_cell_style), Paragraph("Component-driven reactive user interface, state hooks, and virtual DOM rendering.", table_cell_style)],
        [Paragraph("Bundler & Runtime", table_cell_bold), Paragraph("Vite 8.x", table_cell_style), Paragraph("Native ES module dev server, sub-second HMR, and tree-shaken production bundles.", table_cell_style)],
        [Paragraph("Client Routing", table_cell_bold), Paragraph("React Router DOM v6", table_cell_style), Paragraph("Declarative client-side routing, protected route guards, and nested route history.", table_cell_style)],
        [Paragraph("API Client", table_cell_bold), Paragraph("Axios with Interceptors", table_cell_style), Paragraph("Promise-based HTTP client; automatically attaches JWT Bearer token to request headers.", table_cell_style)],
        [Paragraph("Styling System", table_cell_bold), Paragraph("Modular Vanilla CSS3", table_cell_style), Paragraph("Custom healthcare color tokens, glassmorphism, responsive grids, and micro-animations.", table_cell_style)],
        [Paragraph("Server Runtime", table_cell_bold), Paragraph("Node.js (ES Modules)", table_cell_style), Paragraph("Non-blocking, event-driven JavaScript engine running Express backend.", table_cell_style)],
        [Paragraph("Web Framework", table_cell_bold), Paragraph("Express.js 4.x", table_cell_style), Paragraph("RESTful endpoint routing, CORS configuration, JSON body parsing, and route handlers.", table_cell_style)],
        [Paragraph("Database & ODM", table_cell_bold), Paragraph("MongoDB & Mongoose", table_cell_style), Paragraph("Schema-enforced NoSQL document persistence, subdocument nesting, and relational population.", table_cell_style)],
        [Paragraph("Authentication", table_cell_bold), Paragraph("JSON Web Token (JWT)", table_cell_style), Paragraph("Stateless cryptographic bearer token authentication for secure session verification.", table_cell_style)],
        [Paragraph("Password Security", table_cell_bold), Paragraph("Bcrypt.js (10 Rounds)", table_cell_style), Paragraph("One-way cryptographic salt hashing of user passwords before saving to database.", table_cell_style)],
        [Paragraph("OTP Email Delivery", table_cell_bold), Paragraph("Nodemailer (SMTP)", table_cell_style), Paragraph("Automated delivery of 6-digit one-time passwords for worker account verification.", table_cell_style)],
    ]
    t_tech = Table(tech_table_data, colWidths=[90, 115, 299])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, primary_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_tech)
    story.append(PageBreak())

    # ================= 3. SYSTEM ARCHITECTURE & SCHEMAS =================
    story.append(Paragraph("3. System Architecture & Database Schema Design", h1_style))
    story.append(Paragraph("The system is partitioned into 5 normalized Mongoose data models linked via MongoDB ObjectIds:", body_style))

    story.append(Paragraph("3.1 User Model (Health Workers & Administrators)", h2_style))
    story.append(Paragraph("• <b>fullName</b>: String (trimmed, required) — Worker's official name.<br/>"
                           "• <b>email</b>: String (lowercase, unique, indexed) — Primary login identifier.<br/>"
                           "• <b>password</b>: String (minlength 6, bcrypt hashed via pre('save') middleware).<br/>"
                           "• <b>phone</b>: String — Primary contact phone number.<br/>"
                           "• <b>role</b>: Enum ['SUPER_ADMIN', 'ADMIN', 'WORKER'] — Governs authorization gates.<br/>"
                           "• <b>isEmailVerified</b>: Boolean — Set to true upon valid OTP submission.<br/>"
                           "• <b>isApproved</b>: Boolean — Set to true for immediate account usage.", bullet_style))

    story.append(Paragraph("3.2 Patient Model (Community Citizens)", h2_style))
    story.append(Paragraph("• <b>fullName</b>, <b>age</b> (0-120), <b>gender</b> (Enum: ['MALE', 'FEMALE', 'OTHER']), <b>phone</b> (required).<br/>"
                           "• <b>Demographics & Address</b>: address, village, district, state, pincode.<br/>"
                           "• <b>Emergency Contact</b>: emergencyContactName, emergencyContactPhone.<br/>"
                           "• <b>Medical Background</b>: bloodGroup (A+, A-, B+, B-, AB+, AB-, O+, O-), allergies, existingConditions.<br/>"
                           "• <b>Audit Trail</b>: registeredBy (ObjectId ref: 'User'), status ('ACTIVE', 'INACTIVE').", bullet_style))

    story.append(Paragraph("3.3 Appointment Model (Visits & Clinical Follow-ups)", h2_style))
    story.append(Paragraph("• <b>patient</b>: ObjectId (Ref: 'Patient', required) — Associated patient.<br/>"
                           "• <b>worker</b>: ObjectId (Ref: 'User', required) — Assigned health worker.<br/>"
                           "• <b>appointmentDate</b> (Date), <b>timeSlot</b> (String, e.g., '10:00 AM').<br/>"
                           "• <b>purpose</b>: String (e.g., 'Antenatal Care Checkup', 'Child Immunization', 'BP Monitoring').<br/>"
                           "• <b>priority</b>: Enum ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] — Clinical triage priority.<br/>"
                           "• <b>status</b>: Enum ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED'].<br/>"
                           "• <b>location</b>: String (CHC, Village Anganwadi, Patient Home, Sub-Center), <b>notes</b>, <b>followUpDate</b>.", bullet_style))

    story.append(Paragraph("3.4 Health Record Model (Vitals & Clinical Encounters)", h2_style))
    story.append(Paragraph("• <b>patient</b>: ObjectId (Ref: 'Patient'), <b>recordedBy</b>: ObjectId (Ref: 'User').<br/>"
                           "• <b>recordType</b>: Enum ['GENERAL_CHECKUP', 'VITALS', 'ANTENATAL_CARE', 'IMMUNIZATION', 'DIAGNOSIS', 'PRESCRIPTION', 'LAB_TEST'].<br/>"
                           "• <b>vitals Schema</b>: bloodPressure (mmHg), heartRate (bpm), temperature (°F), spO2 (%), bloodGlucose (mg/dL), weight (kg), height (cm).<br/>"
                           "• <b>Clinical Assessment</b>: symptoms (String), diagnosis (String), treatmentPlan (String).<br/>"
                           "• <b>medications Subdocuments</b>: Array of objects { name, dosage, frequency, duration }.", bullet_style))

    # ================= 4. ALL OPERATIONS & POINT-TO-POINT WORKFLOW =================
    story.append(Paragraph("4. Point-to-Point Operational Workflows", h1_style))
    story.append(Paragraph("Below is the exact execution flow of every primary operation implemented in the platform:", body_style))

    workflows = [
        ("Operation 1: Health Worker Registration & Email OTP Verification",
         "1. Health Worker fills registration form at /register (Full Name, Email, Phone, Password).\n"
         "2. Frontend calls POST /api/auth/send-otp. Backend generates a 6-digit OTP stored in MongoDB with 10-min TTL.\n"
         "3. Nodemailer sends verification email to user. Worker is redirected to /verify-otp.\n"
         "4. Worker submits OTP -> POST /api/auth/verify-otp creates user account with bcrypt-hashed password and auto-approved status."),
        
        ("Operation 2: User Login & JWT Session Management",
         "1. Worker submits Email & Password at /login.\n"
         "2. POST /api/auth/login validates credentials via user.comparePassword(password) with bcrypt.\n"
         "3. On success, server generates signed JWT token with userId and role.\n"
         "4. Frontend stores token and user in localStorage. App routes are unblocked via ProtectedRoute.\n"
         "5. Axios HTTP interceptor attaches 'Authorization: Bearer <token>' to all future outgoing requests."),

        ("Operation 3: Dashboard Analytics & Metric Aggregation",
         "1. Dashboard loads and executes concurrent Promise.allSettled requests to /patients, /appointments, and /health-records.\n"
         "2. Calculates: Total Patients, Active status, Gender distribution (Male vs Female), Scheduled appointments, and Vital logs.\n"
         "3. Interactive cards route directly to respective module pages with one click."),

        ("Operation 4: Patient Registration, Real-time Search, and Editing",
         "1. Worker clicks '+ Register Patient' -> Modal collects complete demographics, contact, emergency info, and medical history.\n"
         "2. Submits POST /api/patients -> validated and saved to MongoDB with registeredBy audit link.\n"
         "3. Instant multi-field search (/api/patients/search?q=) matches name, phone, village, or district using regex.\n"
         "4. Worker can click 'Edit' in detail modal to update fields in-place via PUT /api/patients/:id.\n"
         "5. Deep links: From patient details, worker can directly click 'Schedule Visit' or 'Add Health Record'."),

        ("Operation 5: Appointment Scheduling, Prioritization & Lifecycle",
         "1. Worker clicks '+ Schedule New Appointment' at /appointments.\n"
         "2. Chooses patient, date, slot, priority (Urgent/High/Medium/Low), location, and purpose (quick tags: ANC, Immunization, BP & Sugar).\n"
         "3. Submits POST /api/appointments -> saved with populated patient details.\n"
         "4. Live filter tabs enable viewing All, Scheduled, Completed, or Cancelled appointments.\n"
         "5. Single-click '✓ Complete' instantly triggers PUT /api/appointments/:id updating status in DB."),

        ("Operation 6: Clinical Health Record & Multi-Vital Documentation",
         "1. Worker opens /health-records and clicks '+ Create New Health Record'.\n"
         "2. Selects patient and logs vitals: Blood Pressure, Pulse, Temp, SpO2, Blood Sugar, Weight.\n"
         "3. Enters Clinical Symptoms, Diagnosis, and Treatment Plan.\n"
         "4. Dynamic Prescription Builder: Worker clicks '+ Add Medicine' to prescribe drugs with dosage, frequency, and duration.\n"
         "5. Submits POST /api/health-records -> stored and displayed with color-coded vital pills and full detail modal."),

        ("Operation 7: Account Security & Change Password",
         "1. From any page header, worker clicks '🔑 Password' button.\n"
         "2. Modal opens with Current Password, New Password, and Confirm Password (with eye visibility toggles).\n"
         "3. Frontend validates minimum 6 characters and password matching.\n"
         "4. Submits PUT /api/users/change-password -> Backend validates current password hash with bcrypt and securely re-hashes new password.")
    ]

    for title, desc in workflows:
        story.append(Paragraph(title, h2_style))
        for line in desc.split("\n"):
            story.append(Paragraph(f"• {line}", bullet_style))

    # ================= 5. REST API SPECIFICATIONS =================
    story.append(PageBreak())
    story.append(Paragraph("5. Complete REST API Specifications", h1_style))
    story.append(Paragraph("The platform exposes a comprehensive, RESTful API surface secured by JWT middleware:", body_style))

    api_table_data = [
        [Paragraph("Method", table_header_style), Paragraph("Endpoint URL", table_header_style), Paragraph("Access Gate", table_header_style), Paragraph("Description & Payload", table_header_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/send-otp", table_cell_style), Paragraph("Public", table_cell_style), Paragraph("Dispatches 6-digit OTP to provided email.", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/verify-otp", table_cell_style), Paragraph("Public", table_cell_style), Paragraph("Verifies OTP code and registers verified user.", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/login", table_cell_style), Paragraph("Public", table_cell_style), Paragraph("Authenticates credentials; issues signed JWT.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/users/me", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Returns current authenticated user profile.", table_cell_style)],
        [Paragraph("PUT", table_cell_bold), Paragraph("/api/users/change-password", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Validates old password and hashes new password.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/patients", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Fetches all registered community patients.", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/patients", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Registers a new patient record in MongoDB.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/patients/search?q=", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Searches by Name, Phone, Village, District.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/patients/:id", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Retrieves single patient demographic record.", table_cell_style)],
        [Paragraph("PUT", table_cell_bold), Paragraph("/api/patients/:id", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Updates existing patient information.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/appointments", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Lists appointments; supports status & date filters.", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/appointments", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Schedules new patient appointment or visit.", table_cell_style)],
        [Paragraph("PUT", table_cell_bold), Paragraph("/api/appointments/:id", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Updates appointment status (e.g. COMPLETED).", table_cell_style)],
        [Paragraph("DELETE", table_cell_bold), Paragraph("/api/appointments/:id", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Cancels or removes scheduled appointment.", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/health-records", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Lists clinical records; filters by patient or type.", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/health-records", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Saves patient vitals, diagnosis, and medications.", table_cell_style)],
        [Paragraph("DELETE", table_cell_bold), Paragraph("/api/health-records/:id", table_cell_style), Paragraph("Protected", table_cell_style), Paragraph("Deletes a specific health record.", table_cell_style)],
    ]

    t_api = Table(api_table_data, colWidths=[55, 145, 75, 229])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, primary_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_api)

    # ================= 6. LIVE DEMO RUNBOOK =================
    story.append(Paragraph("6. Step-by-Step Live Demonstration Runbook", h1_style))
    story.append(Paragraph("Follow this sequential checklist during evaluation and viva presentations:", body_style))

    runbook_steps = [
        "1. Open http://localhost:5173 -> Redirects automatically to /login.",
        "2. Click 'Create an Account' -> Enter details, receive OTP email, verify OTP, and login.",
        "3. Review Dashboard: Observe logged-in health worker credentials, active patient counts, and module cards.",
        "4. Navigate to Patient Management: Register a test community patient; search via name and phone number; edit patient record.",
        "5. From Patient Details modal: Click 'Schedule Visit' -> Schedules an Antenatal Care or Checkup appointment.",
        "6. Navigate to Appointments page: Filter by status, mark visit as '✓ Complete'.",
        "7. Navigate to Health Records: Log Blood Pressure (120/80), Heart Rate (72), and SpO2 (98%); prescribe Paracetamol; save record.",
        "8. Test Account Security: Click '🔑 Password' in header; change password and verify instant update.",
        "9. Click Logout -> Protected routes immediately lock down session and redirect to /login."
    ]
    for step in runbook_steps:
        story.append(Paragraph(step, bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated at {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
