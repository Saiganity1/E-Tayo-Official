import { NextRequest, NextResponse } from "next/server";
import { 
  STO_TOMAS_MUNICIPAL_INFO, 
  PERMITTING_PROCESS_STAGES, 
  OFFICIAL_16_FORMS_GUIDE, 
  ZONING_RULES_SUMMARY, 
  findKnowledgeBaseMatches 
} from "../../../data/stoTomasKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], userApplications = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // Check for configured API keys
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENAI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Build the system prompt with Sto. Tomas Knowledge and live user context
    const applicationsSummary = userApplications && userApplications.length > 0
      ? userApplications.map((app: any, idx: number) => 
          `App #${idx + 1}: ID="${app.id}", Type="${app.permitType || 'Locational Clearance'}", Project="${app.projectName || 'Project'}", Status="${app.status || 'Pending'}", Address="${app.projectAddress || 'Sto. Tomas'}", DateSubmitted="${app.dateSubmitted || 'Recent'}"`
        ).join("\n")
      : "The applicant currently has no active applications or is inquiring as a guest.";

    const systemPrompt = `You are "Mang Tomas", the courteous, highly experienced, and helpful AI Virtual Permitting Officer for the Municipality of Sto. Tomas, Pampanga (e-Tayo portal).

MUNICIPALITY CONTEXT:
- Municipality: Sto. Tomas, Province of Pampanga (Postal Code: 2020)
- Offices: Office of the Municipal Engineer / Building Official (OBO), Municipal Planning and Development Coordinator (MPDC / Zoning)
- Official Contact: obo@stotomaspampanga.gov.ph | (045) 436-1234
- Portal: e-Tayo Permitting System

PERMITTING PROCESS SEQUENCE (CRITICAL RULES):
1. Phase 1 (Zoning): The applicant MUST obtain an approved Locational Clearance (Zoning Approval) from MPDC first. Prerequisite: TCT (Land Title), Tax Declaration, Real Property Tax Clearance (Amilyar), Lot Plan with Vicinity Map.
2. Phase 2 (Building & Ancillaries): Once Locational Clearance is approved, the applicant submits the Unified Application Form for Building Permit (NBC Form 1) along with Ancillary Forms (Architectural A-01, Structural S-01, Electrical E-01, Plumbing P-01, Mechanical M-01, Electronics EL-01) and BFP Fire Safety Evaluation (FSEC). Requires 5 sets of signed/sealed blueprints by licensed professionals (Architect, Civil Engineer, PEE, Master Plumber).
3. Phase 3 (Completion & Occupancy): Upon construction completion, submits Certificate of Completion, CFEI (Final Electrical Inspection), and secures the Certificate of Occupancy before moving in.

ZONING & SETBACK RULES IN STO. TOMAS:
- Residential R-1: Front setback: 4.5m, Rear: 2.0m, Sides: 2.0m. Max height: 3 storeys / 10m.
- Residential R-2: Front setback: 3.0m, Rear: 2.0m, Sides: 2.0m.
- Commercial: Front setback: 5.0m, Rear/Sides: 2.0m.
- Firewalls: Require adjacent property owner written consent in R-1. In R-2, allowed on one side with 2-hour fire-rated CHB and 1.0m parapet wall.

APPLICANT'S CURRENT LIVE APPLICATIONS CONTEXT:
${applicationsSummary}

YOUR PERSONALITY & GUIDELINES:
1. Speak in a warm, polite, and encouraging tone in Taglish, Filipino, or English (whichever language the user addresses you in). You may greet with "Mabuhay!" or "Magandang araw po!".
2. If the user asks about their own applications or permits, refer directly to the live applications context above, quoting their actual Application ID and status.
3. Be precise with requirements and official form codes (e.g. NBC Form 1, NBC Form A-01).
4. Keep responses structured, concise, and easy to read using bold text and bullet points. Never hallucinate rules outside the National Building Code (PD 1096) and Sto. Tomas guidelines.`;

    // 1. Attempt Google Gemini 1.5 Flash if key is available
    if (geminiKey) {
      try {
        const contents = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Opo, naiintindihan ko po. Ako si Mang Tomas, ang inyong virtual permitting assistant para sa Sto. Tomas, Pampanga. Handa na po akong tumulong!" }] }
        ];

        // Append recent conversation history (up to last 6 messages)
        const recentHistory = history.slice(-6);
        recentHistory.forEach((h: { role: string; text: string }) => {
          contents.push({
            role: h.role === "bot" ? "model" : "user",
            parts: [{ text: h.text }]
          });
        });

        // Append latest user message
        contents.push({
          role: "user",
          parts: [{ text: trimmedMessage }]
        });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 800,
              }
            })
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return NextResponse.json({
              reply: replyText.trim(),
              source: "gemini"
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, attempting fallback:", geminiErr);
      }
    }

    // 2. Attempt OpenAI if key is available
    if (openaiKey) {
      try {
        const messages = [
          { role: "system", content: systemPrompt },
          ...history.slice(-6).map((h: { role: string; text: string }) => ({
            role: h.role === "bot" ? "assistant" : "user",
            content: h.text
          })),
          { role: "user", content: trimmedMessage }
        ];

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.4,
            max_tokens: 800
          })
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText && replyText.trim()) {
            return NextResponse.json({
              reply: replyText.trim(),
              source: "openai"
            });
          }
        }
      } catch (openAiErr) {
        console.warn("OpenAI API call failed, attempting fallback:", openAiErr);
      }
    }

    // 3. Seamless Local Knowledge Base Fallback
    // Provides rich, context-aware answers even without an external API key!
    const localReply = findKnowledgeBaseMatches(trimmedMessage, userApplications);
    return NextResponse.json({
      reply: localReply,
      source: "local_knowledge"
    });

  } catch (error) {
    console.error("Error in /api/chat route:", error);
    return NextResponse.json({
      reply: "Paumanhin po, nagkaroon ng pansamantalang aberya sa sistema. Maaari po kayong sumubok muli o bisitahin ang Municipal Engineer's Office.",
      source: "error_fallback"
    }, { status: 200 });
  }
}
