import { GoogleGenAI } from "@google/genai";

/**
 * System prompt designed specifically for Community Health Workers (CHWs, ASHAs, ANMs)
 */
const CHW_SYSTEM_INSTRUCTION = `
You are the "AshaBot / CHW AI Health Assistant", an intelligent clinical decision-support co-pilot for frontline Community Health Workers (CHWs, ASHAs, ANMs, and rural primary care volunteers).

YOUR PURPOSE:
Assist frontline workers in assessing symptoms, interpreting patient vital signs, triaging medical conditions, checking national immunization schedules, providing first aid and home-care counseling, and identifying danger signs ("Red Flags") requiring immediate referral to a Primary Health Centre (PHC) or District Hospital.

CORE CLINICAL GUIDELINES:
1. ALWAYS start your answer with one of the following exact triage tags on its own line:
   - [TRIAGE: URGENT] - For severe danger signs, preeclampsia, shock, SpO2 < 92%, BP >= 160/110, severe dehydration, chest indrawing in children, snakebite, unconsciousness, severe bleeding.
   - [TRIAGE: MODERATE] - For conditions needing clinical doctor evaluation within 24-48 hours, mild-to-moderate infections, BP stage 1/2, persistent fever, missed vaccines.
   - [TRIAGE: ROUTINE] - For routine maternal counseling, normal vitals check, breastfeeding guidance, sanitation, nutrition, standard preventive advice.

2. STRUCTURE YOUR RESPONSE INTO CLEAR, ACCESSIBLE SECTIONS:
   - **Triage & Urgency Summary**: One clear sentence stating the risk level.
   - **Immediate Actions for Health Worker**: Actionable, step-by-step instructions (e.g., ORS dosage, left-lateral position, airway check).
   - **Critical Warning Signs (Red Flags)**: Bullet points of symptoms that mean rush to hospital immediately.
   - **Referral & Medication Guidance**: Specific guidance on safe primary care interventions vs when NOT to administer drugs without a doctor.
   - **Community / Family Counseling Advice**: Simple, culturally-sensitive advice the worker can explain to the family in local language.

3. PATIENT CONTEXT:
   When patient age, gender, medical history, or vital signs are provided in the prompt, ALWAYS tailor your calculation (e.g., pediatric dosing by weight, pregnancy precautions, blood pressure severity by age).

4. TONE & CLARITY:
   Professional, empathetic, structured, and easy to read quickly on mobile screens in the field. Avoid confusing medical jargon without explaining it.
`;

/**
 * Offline Clinical Rule Engine
 * Guarantees 100% availability even without an active Gemini API key or when offline.
 */
function generateOfflineClinicalResponse(query, patientContext = null) {
  const q = query.toLowerCase();
  const vitals = patientContext?.vitals || {};
  let triageLevel = "ROUTINE";
  let triageTag = "[TRIAGE: ROUTINE]";

  // --- Parse vital signs if present ---
  const bpMatch = query.match(/(\d{2,3})\s*[\/|\-]\s*(\d{2,3})/) || (vitals.bloodPressure ? vitals.bloodPressure.match(/(\d{2,3})\s*[\/|\-]\s*(\d{2,3})/) : null);
  const sys = bpMatch ? parseInt(bpMatch[1], 10) : null;
  const dia = bpMatch ? parseInt(bpMatch[2], 10) : null;
  const spo2 = vitals.spO2 || (query.match(/spo2\D*(\d{2,3})/i) ? parseInt(query.match(/spo2\D*(\d{2,3})/i)[1], 10) : null);
  const temp = vitals.temperature || (query.match(/(?:temp|fever)\D*(\d{2,3}(?:\.\d)?)/i) ? parseFloat(query.match(/(?:temp|fever)\D*(\d{2,3}(?:\.\d)?)/i)[1]) : null);
  const glucose = vitals.bloodGlucose || (query.match(/(?:glucose|sugar)\D*(\d{2,3})/i) ? parseInt(query.match(/(?:glucose|sugar)\D*(\d{2,3})/i)[1], 10) : null);

  const isPregnant = (patientContext?.gender === "FEMALE" && patientContext?.age >= 14 && patientContext?.age <= 49) ||
    q.includes("pregnant") || q.includes("pregnancy") || q.includes("trimester") || q.includes("anc") || q.includes("antenatal");

  // Determine Triage
  const hasSevereRedFlags =
    (sys && sys >= 160) || (dia && dia >= 110) ||
    (spo2 && spo2 < 92) ||
    (temp && temp >= 104) ||
    (glucose && (glucose > 300 || glucose < 60)) ||
    q.includes("snake") || q.includes("unconscious") || q.includes("convulsion") || q.includes("seizure") ||
    q.includes("chest indrawing") || q.includes("severe bleeding") || q.includes("preeclampsia") ||
    (isPregnant && (sys && sys >= 140 || dia && dia >= 90 || q.includes("headache") || q.includes("swelling") || q.includes("blur")));

  const hasModerateFlags =
    (sys && sys >= 130) || (dia && dia >= 85) ||
    (spo2 && spo2 >= 92 && spo2 <= 94) ||
    (temp && temp >= 100.4) ||
    (glucose && glucose >= 180) ||
    q.includes("fever") || q.includes("cough") || q.includes("vomiting") || q.includes("diarrhea") ||
    q.includes("missed") || q.includes("vaccine") || q.includes("immunization");

  if (hasSevereRedFlags) {
    triageLevel = "URGENT";
    triageTag = "[TRIAGE: URGENT]";
  } else if (hasModerateFlags) {
    triageLevel = "MODERATE";
    triageTag = "[TRIAGE: MODERATE]";
  }

  // Domain content generation
  let content = `${triageTag}\n\n`;

  // Context summary prefix if patient is attached
  let patientHeader = "";
  if (patientContext?.fullName) {
    patientHeader = `> **Patient Profile**: ${patientContext.fullName} (${patientContext.age} yrs, ${patientContext.gender || "N/A"})${patientContext.bloodGroup ? ` | Blood: ${patientContext.bloodGroup}` : ""}${patientContext.allergies ? ` | Allergies: ${patientContext.allergies}` : ""}\n\n`;
    content += patientHeader;
  }

  // 1. Maternal / Pregnancy / Preeclampsia
  if (isPregnant || q.includes("maternal") || q.includes("delivery") || q.includes("anc") || q.includes("preeclampsia")) {
    if (sys && sys >= 140 || dia && dia >= 90 || q.includes("preeclampsia") || q.includes("swelling") || q.includes("blur") || q.includes("bleeding")) {
      content += `### 🚨 Urgent Assessment: Suspected Gestational Hypertension / Preeclampsia Danger Signs
**Triage & Urgency**: 🔴 IMMEDIATE EMERGENCY REFERRAL TO FRU / DISTRICT HOSPITAL

**Immediate Actions for Health Worker**:
1. **Positioning**: Place the pregnant mother in the **Left Lateral Position** (lying on her left side) to maximize placental blood flow.
2. **Do Not Agitate**: Keep the environment quiet and dimly lit to prevent triggering seizures (eclampsia).
3. **Emergency Transfer**: Call 108 / local ambulance immediately. Escort the mother to the nearest First Referral Unit (FRU) or Hospital with emergency obstetric services.
4. **Vitals Recording**: Re-check BP every 15 minutes and note down readings in her MCP (Mother-Child Protection) card.

**Critical Red Flags to Watch**:
* Severe persistent headache not relieved by rest.
* Blurring of vision, seeing spots, or sudden blindness.
* Epigastric (upper right abdomen) sharp pain or persistent vomiting.
* Sudden swelling of face, eyelids, and hands.
* Vaginal bleeding or absent/sluggish fetal movements.

**Community Counseling**:
* Explain calmly to the spouse and family that urgent hospital doctor review is required to safeguard both mother and baby.
* Ensure hospital bag and MCP card are packed immediately.`;
      return { response: content, triageLevel: "URGENT" };
    }

    content += `### 🤰 Routine Antenatal Care (ANC) & Maternal Health Guidance
**Triage & Urgency**: 🟢 ROUTINE / PREVENTIVE COMMUNITY CARE

**Core Health Worker Protocols**:
1. **ANC Visits**: Ensure all 4 mandatory ANC checkups are completed (1st: within 12 weeks; 2nd: 14-26 weeks; 3rd: 28-34 weeks; 4th: 36 weeks to delivery).
2. **Supplementation**:
   * **Iron & Folic Acid (IFA)**: 1 tablet daily starting from the 2nd trimester (after 14 weeks) for at least 180 days.
   * **Calcium Tablets**: 2 tablets daily (500mg each), taken separately from IFA to avoid absorption interference.
3. **Immunization**: Administer Tetanus-Diphtheria (Td 1 and Td 2 four weeks apart, or Td Booster if previously vaccinated within 3 years).
4. **Weight & Vitals Check**: Monitor for steady weight gain (~10-12 kg throughout pregnancy) and ensure BP stays below 120/80 mmHg.

**Counseling for the Mother**:
* Adequate nutrition: Add greens, pulses, milk, eggs, and local seasonal fruits.
* Avoid heavy manual lifting; take at least 2 hours of rest in the afternoon and 8 hours at night.`;
    return { response: content, triageLevel: "ROUTINE" };
  }

  // 2. Child Diarrhea & Dehydration
  if (q.includes("diarrhea") || q.includes("loose motion") || q.includes("dehydration") || q.includes("vomiting")) {
    const isSevere = q.includes("lethargic") || q.includes("sunken") || q.includes("cannot drink") || q.includes("skin pinch");
    content += `### 💧 Pediatric Diarrhea & Dehydration Management (WHO Protocol)
**Triage & Urgency**: ${isSevere ? "🔴 URGENT HOSPITAL TRANSFER" : "🟡 MODERATE - MONITOR CAREFULLY"}

**Immediate Actions for Health Worker**:
1. **Assess Dehydration Level**:
   * *No Dehydration*: Alert, normal eyes, drinks normally, skin pinch retracts instantly.
   * *Some Dehydration*: Restless/irritable, sunken eyes, drinks eagerly, skin pinch goes back slowly.
   * *Severe Dehydration*: Lethargic/unconscious, skin pinch takes > 2 seconds to flatten, unable to drink.
2. **Oral Rehydration Therapy (ORS)**:
   * Dissolve 1 full sachet of WHO-formula ORS in exactly 1 Liter of clean drinking water.
   * Give small, frequent sips using a clean cup and spoon (never force feeds).
   * Continue feeding ORS after every loose stool (approx. 50-100 mL for children < 2 years, 100-200 mL for children 2-10 years).
3. **Zinc Supplementation**:
   * Administer Zinc dispersible tablets for **14 consecutive days** (10 mg/day for infants under 6 months; 20 mg/day for children 6 months to 5 years).
   * Zinc shortens episode duration and prevents recurrence for months.
4. **Continue Nutrition**: Never withhold breastmilk or regular home-cooked soft food (khichdi, curd, banana).

**When to Refer Immediately (Red Flags)**:
* Blood in stool (dysentery).
* Inability to drink fluids or vomiting everything.
* High fever or extreme listlessness/lethargy.`;
    return { response: content, triageLevel: isSevere ? "URGENT" : "MODERATE" };
  }

  // 3. Child Immunization
  if (q.includes("vaccin") || q.includes("immuniz") || q.includes("schedule") || q.includes("missed") || q.includes("bcg") || q.includes("pentavalent") || q.includes("mr")) {
    content += `### 💉 National Universal Immunization Schedule & Catch-up Guide
**Triage & Urgency**: 🟢 ROUTINE CARE / CATCH-UP IMMUNIZATION

**Standard Frontline Schedule**:
* **At Birth**: BCG (intradermal), OPV-0 (oral), Hepatitis B birth dose (within 24 hrs).
* **6 Weeks**: Pentavalent-1 (DTP+HepB+Hib), OPV-1, Rotavirus-1, fIPV-1, PCV-1.
* **10 Weeks**: Pentavalent-2, OPV-2, Rotavirus-2.
* **14 Weeks**: Pentavalent-3, OPV-3, Rotavirus-3, fIPV-2, PCV-2.
* **9-12 Months**: Measles-Rubella (MR-1), JE-1 (in endemic districts), PCV Booster, Vitamin A (1 lakh IU).
* **16-24 Months**: MR-2, DPT Booster-1, OPV Booster, Vitamin A (2 lakh IU).
* **5-6 Years**: DPT Booster-2.
* **10 & 16 Years**: Td (Tetanus-Diphtheria).

**Rules for Missed / Delayed Doses**:
1. **Never Restart the Schedule**: If a child missed a dose, continue from where they left off. Count previously given doses.
2. **Minimum Intervals**: Maintain at least a 4-week gap between multi-dose killed/subunit vaccines (e.g., Pentavalent).
3. **Mild Illness**: Mild cold, cough, or slight fever is **NOT** a contraindication for vaccination. Do not turn the mother away.

**Post-Vaccination Guidance for Parents**:
* Explain that mild fever, tenderness, and slight swelling at the injection site is expected.
* Advise cold compresses for local swelling (do not massage). Give Paracetamol syrup only if fever develops.`;
    return { response: content, triageLevel: "ROUTINE" };
  }

  // 4. Vital Signs Evaluation (Blood Pressure, SpO2, Blood Sugar, Temperature)
  if (sys || dia || spo2 || temp || glucose) {
    let alertBullets = [];
    if (sys && sys >= 160 || dia && dia >= 110) {
      alertBullets.push(`* **Severe Hypertension (Crisis)**: BP ${sys}/${dia} mmHg is critically high. Risk of stroke, cardiovascular damage, or eclampsia. Immediate doctor referral.`);
    } else if (sys && sys >= 140 || dia && dia >= 90) {
      alertBullets.push(`* **Stage 2 Hypertension**: BP ${sys}/${dia} mmHg. Advise dietary sodium reduction, rest, and doctor consultation for pharmacological evaluation.`);
    } else if (sys && sys < 90) {
      alertBullets.push(`* **Hypotension**: BP ${sys}/${dia} mmHg indicates potential circulatory collapse, shock, or severe dehydration.`);
    }

    if (spo2 && spo2 < 92) {
      alertBullets.push(`* **Hypoxemia Alert**: SpO2 of ${spo2}% is below safe threshold (< 92%). Provide supplemental oxygen if available and transfer immediately with elevated head.`);
    } else if (spo2 && spo2 >= 92 && spo2 <= 94) {
      alertBullets.push(`* **Borderline Oxygenation**: SpO2 ${spo2}%. Monitor respiratory rate, look for chest indrawing or nasal flaring.`);
    }

    if (temp && temp >= 102) {
      alertBullets.push(`* **High Grade Fever**: ${temp}°F. Risk of febrile seizures in infants/toddlers. Perform tepid sponging with normal room temperature water (never cold/ice water).`);
    }

    if (glucose && glucose > 200) {
      alertBullets.push(`* **Hyperglycemia**: Random Blood Sugar ${glucose} mg/dL is elevated. Screen for symptoms of polyuria, polydipsia, and refer to medical officer.`);
    } else if (glucose && glucose < 70) {
      alertBullets.push(`* **Hypoglycemia**: Blood Sugar ${glucose} mg/dL is dangerously low! Administer 15-20g of fast-acting oral glucose (sugar water, fruit juice) immediately if conscious.`);
    }

    content += `### 🩺 Comprehensive Vital Signs Assessment Report
**Triage & Urgency**: ${triageLevel === "URGENT" ? "🔴 IMMEDIATE REFERRAL REQUIRED" : triageLevel === "MODERATE" ? "🟡 MODERATE CAUTION - MEDICAL REVIEW" : "🟢 NORMAL PARAMETERS"}

**Clinical Interpretation**:
${alertBullets.length > 0 ? alertBullets.join("\n") : "* All measured vital parameters fall within acceptable baseline primary care thresholds."}

**Action Plan for Health Worker**:
1. Confirm reading by re-taking vitals after the patient has rested seated for 5 minutes.
2. Ensure cuff is at heart level and correctly sized for the patient's arm.
3. Record measurements with exact timestamp in the patient's health record.
4. If triage is **URGENT**, do not discharge patient. Arrange transport to the nearest PHC/hospital immediately.`;
    return { response: content, triageLevel };
  }

  // 5. Snake Bite / Acute Trauma / Emergency First Aid
  if (q.includes("snake") || q.includes("bite") || q.includes("burn") || q.includes("poison") || q.includes("choking")) {
    content += `### 🐍 Emergency First Aid Protocol: Snakebite Management
**Triage & Urgency**: 🔴 IMMEDIATE LIFE-SAVING EMERGENCY REFERRAL

**Crucial "DOs" (Immediate First Aid)**:
1. **Immobilize the Limb**: Keep the bitten limb completely still using a splint or sling (just like a fractured bone). Movement accelerates venom spread through lymphatics.
2. **Keep Calm & Reassure**: Panic increases heart rate and speeds venom circulation.
3. **Remove Constrictions**: Quickly take off rings, bangles, tight clothing, or shoes from the affected limb before swelling starts.
4. **Immediate Transport**: Rush patient to the nearest hospital equipped with **Anti-Snake Venom (ASV)** and respiratory support.

**Crucial "DON'Ts" (Hazardous Folk Practices)**:
* ❌ **DO NOT apply a tight tourniquet** (can cause gangrene and limb loss).
* ❌ **DO NOT cut the wound or suck venom** with mouth or suction devices.
* ❌ **DO NOT apply herbal pastes, ice, or electric shocks**.
* ❌ **DO NOT waste time visiting traditional healers**. Time to ASV is critical!`;
    return { response: content, triageLevel: "URGENT" };
  }

  // 6. Child Malnutrition / SAM / Growth Monitoring
  if (q.includes("malnutrition") || q.includes("sam") || q.includes("muac") || q.includes("growth") || q.includes("nutrition") || q.includes("underweight")) {
    content += `### 🧒 Child Growth Monitoring & Severe Acute Malnutrition (SAM)
**Triage & Urgency**: 🟡 COMMUNITY MONITORING / NRC REFERRAL IF SAM

**Assessment Steps for CHW**:
1. **MUAC Tape (Mid-Upper Arm Circumference)** (for children 6 to 59 months):
   * 🔴 **Red (< 11.5 cm)**: Severe Acute Malnutrition (SAM) -> Immediate referral to Nutrition Rehabilitation Centre (NRC).
   * 🟡 **Yellow (11.5 - 12.5 cm)**: Moderate Acute Malnutrition (MAM) -> Targeted supplemental nutrition & counseling.
   * 🟢 **Green (> 12.5 cm)**: Normal nutritional status.
2. **Bilateral Pitting Edema**: Check both feet with gentle thumb pressure for 3 seconds. Pitting indicates kwashiorkor (SAM).
3. **Appetite Test**: If child has SAM with complications or fails appetite test, refer to NRC immediately.

**Nutritional Counseling for Caregivers**:
* For under 6 months: **Exclusive Breastfeeding** on demand (no water, honey, or animal milk).
* 6 to 24 months: Continue breastfeeding alongside diverse, energy-dense complementary foods (thick porridge, mashed dal, banana, boiled egg, locally prepared energy foods).`;
    return { response: content, triageLevel: "MODERATE" };
  }

  // 7. General Healthcare Worker Assistant Fallback
  content += `### 📋 Frontline Healthcare Worker Guidance & Consultation
**Triage & Urgency**: ${triageTag}

**Clinical Analysis**:
Thank you for consulting the CHW Clinical Assistant. Frontline health workers are the first line of defense in community healthcare.

**General Field Protocols**:
1. **Detailed History**: Inquire about duration of symptoms, past medical history, medication history, and any known allergies.
2. **Check Danger Signs ("Red Flags")**:
   * Altered consciousness, lethargy, or confusion.
   * Breathing difficulty, stridor, or chest indrawing.
   * Persistent vomiting, inability to retain oral fluids.
   * High fever unresponsive to standard home measures.
3. **Standard Safe Care**:
   * For fever in adults: Paracetamol 500mg every 6 hours as needed. Ensure adequate hydration.
   * For pediatric fever: Calculate syrup Paracetamol accurately based on child's weight (10-15 mg/kg per dose).
   * Encourage hand hygiene, boiling drinking water, and sanitation.

**Referral Directive**:
If the patient's condition does not improve within 24 hours or if any warning signs develop, arrange prompt transport to the Primary Health Centre (PHC) for a formal physician evaluation.`;

  return { response: content, triageLevel };
}

/**
 * Main AI Chat Service Function
 * 
 * 🔑 WHERE TO PUT YOUR API KEY:
 * Option 1 (Recommended): In backend/.env file:
 *    GEMINI_API_KEY=AIzaSyYourActualKeyHere
 * 
 * Option 2 (Direct in code): In the apiKey fallback below:
 *    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "YOUR_ACTUAL_KEY_HERE";
 */
export async function generateAiChatResponse({ message, conversationHistory = [], patientContext = null }) {
  // Put API key in backend/.env or replace the empty string below:
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

  // If Gemini API Key is present, attempt generative AI response
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build structured context
      let contextPrompt = "";
      if (patientContext) {
        contextPrompt += `\n[PATIENT CONTEXT]\n`;
        contextPrompt += `Name: ${patientContext.fullName || "N/A"}\n`;
        contextPrompt += `Age: ${patientContext.age || "N/A"} years | Gender: ${patientContext.gender || "N/A"}\n`;
        if (patientContext.bloodGroup) contextPrompt += `Blood Group: ${patientContext.bloodGroup}\n`;
        if (patientContext.allergies) contextPrompt += `Allergies: ${patientContext.allergies}\n`;
        if (patientContext.existingConditions) contextPrompt += `Chronic Conditions: ${patientContext.existingConditions}\n`;
        if (patientContext.vitals) {
          contextPrompt += `Latest Vitals: BP=${patientContext.vitals.bloodPressure || "N/A"}, HeartRate=${patientContext.vitals.heartRate || "N/A"} bpm, Temp=${patientContext.vitals.temperature || "N/A"}°F, SpO2=${patientContext.vitals.spO2 || "N/A"}%, BloodGlucose=${patientContext.vitals.bloodGlucose || "N/A"} mg/dL\n`;
        }
        contextPrompt += `[END PATIENT CONTEXT]\n\n`;
      }

      // Include short past history if provided
      const recentHistory = conversationHistory.slice(-4).map((msg) => `${msg.role === "user" ? "Health Worker" : "Assistant"}: ${msg.content}`).join("\n");
      const fullPrompt = `${CHW_SYSTEM_INSTRUCTION}\n\n${contextPrompt}${recentHistory ? `Recent Dialogue:\n${recentHistory}\n\n` : ""}Current Health Worker Query:\n${message}`;

      let response;
      let usedModel = "gemini-flash-lite-latest";

      // Try active models supported by the API key
      const modelsToTry = [
        "gemini-3.8-flash",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-2.5-flash-lite",
      ];

      let lastError = null;
      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
          });
          if (response && response.text) {
            usedModel = modelName;
            break;
          }
        } catch (mErr) {
          lastError = mErr;
          console.warn(`Model ${modelName} call failed, trying next candidate:`, mErr.message);
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("No Gemini models responded successfully");
      }

      const responseText = response.text || "";

      // Determine triage level from response tags
      let triageLevel = "ROUTINE";
      if (responseText.includes("[TRIAGE: URGENT]")) {
        triageLevel = "URGENT";
      } else if (responseText.includes("[TRIAGE: MODERATE]")) {
        triageLevel = "MODERATE";
      } else if (responseText.includes("[TRIAGE: ROUTINE]")) {
        triageLevel = "ROUTINE";
      } else {
        // Fallback detection
        const lower = responseText.toLowerCase();
        if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("immediate referral")) {
          triageLevel = "URGENT";
        } else if (lower.includes("moderate") || lower.includes("monitor") || lower.includes("follow-up")) {
          triageLevel = "MODERATE";
        }
      }

      return {
        response: responseText,
        triageLevel,
        model: "gemini-2.5-flash",
        isOfflineEngine: false,
      };
    } catch (apiErr) {
      console.warn("Gemini API call failed or timed out, falling back to offline clinical rule engine:", apiErr.message);
      // Fall through to offline engine
    }
  }

  // Built-in intelligent offline clinical engine
  const offlineResult = generateOfflineClinicalResponse(message, patientContext);
  return {
    response: offlineResult.response,
    triageLevel: offlineResult.triageLevel,
    model: "chw-clinical-rules-engine",
    isOfflineEngine: true,
  };
}
