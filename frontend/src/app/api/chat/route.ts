import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { 
  STO_TOMAS_MUNICIPAL_INFO, 
  PERMITTING_PROCESS_STAGES, 
  OFFICIAL_16_FORMS_GUIDE, 
  ZONING_RULES_SUMMARY, 
  findKnowledgeBaseMatches,
  getTopContextForRAG,
  extractEntities,
  calculateEstimatedFees
} from "../../../data/stoTomasKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], userApplications = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // 1. Run Local NLP / Entity Extraction first
    const entities = extractEntities(trimmedMessage);

    // If user explicitly asks for a fee calculation or has specific floor area, calculate it directly
    if (entities.floorArea && entities.floorArea > 0) {
      const calcResult = calculateEstimatedFees(entities.floorArea, entities.buildingType, entities.storeys);
      return NextResponse.json({
        reply: calcResult.breakdownSummary + `\n\n👉 [Mag-apply para sa Locational Clearance](/applicant/apply?type=locational_clearance)`,
        source: "local_ml_calculator",
        entities
      });
    }

    // Check for configured API keys
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENAI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Retrieve Top Ground-Truth Domain Facts via RAG
    const ragContext = getTopContextForRAG(trimmedMessage, 3);

    // Build live applicant context
    const applicationsSummary = userApplications && userApplications.length > 0
      ? userApplications.map((app: any, idx: number) => 
          `App #${idx + 1}: ID="${app.id}", Type="${app.permitType || 'Locational Clearance'}", Project="${app.projectName || 'Project'}", Status="${app.status || 'Pending'}", Address="${app.projectAddress || 'Sto. Tomas'}", DateSubmitted="${app.dateSubmitted || 'Recent'}"`
        ).join("\n")
      : "The applicant currently has no active applications or is inquiring as a guest.";

    const systemPrompt = `You are "Mang Tomas", the courteous, highly experienced, and intelligent AI Virtual Permitting Officer for the Municipality of Sto. Tomas, Pampanga (eTAYO portal).

MUNICIPALITY CONTEXT:
- Municipality: Sto. Tomas, Province of Pampanga (Postal Code: 2020)
- 7 Barangays: Poblacion, San Matias, Moras De La Paz, San Vicente, Santo Rosario, San Bartolome, Sapa
- Offices: Office of the Municipal Engineer / Building Official (OBO), Municipal Planning and Development Coordinator (MPDC / Zoning)
- Official Contact: obo@stotomaspampanga.gov.ph | (045) 436-1234
- Portal: eTAYO Unified Permitting System

PERMITTING PROCESS SEQUENCE (CRITICAL RULES):
1. Phase 1 (Zoning): The applicant MUST obtain an approved Locational Clearance (Zoning Approval) from MPDC first. Prerequisite: TCT (Land Title), Tax Declaration, Real Property Tax Clearance (Amilyar), Lot Plan with Vicinity Map, Barangay Clearance.
2. Phase 2 (Building & Ancillaries): Once Locational Clearance is approved, the applicant submits the Unified Application Form for Building Permit (NBC Form 1) along with Ancillary Forms (Architectural A-01, Structural S-01, Electrical E-01, Plumbing P-01, Mechanical M-01, Electronics EL-01) and BFP Fire Safety Evaluation Clearance (FSEC). Requires 5 sets of signed/sealed blueprints by licensed professionals.
3. Phase 3 (Completion & Occupancy): Upon construction completion, submits Certificate of Completion, CFEI (Final Electrical Inspection for PELCO 2), and secures the Certificate of Occupancy before moving in.

ZONING & SETBACK RULES IN STO. TOMAS:
- Residential R-1: Front setback: 4.5m, Rear: 2.0m, Sides: 2.0m. Max height: 3 storeys / 10m.
- Residential R-2: Front setback: 3.0m, Rear: 2.0m, Sides: 2.0m.
- Commercial (MacArthur Highway, San Matias): Front setback: 5.0m, Rear/Sides: 2.0m.
- Firewalls: Require adjacent property owner written consent in R-1. In R-2, allowed on one side with 2-hour fire-rated CHB and 1.0m parapet wall.

APPLICANT'S CURRENT LIVE APPLICATIONS CONTEXT:
${applicationsSummary}

RETRIEVED MUNICIPAL GROUND-TRUTH FACTS (RAG):
${ragContext}

YOUR PERSONALITY & GUIDELINES:
1. Speak in a warm, polite, and encouraging tone in Taglish, Filipino, or English (match the language of the user). Greet courteously (e.g. "Mabuhay!", "Magandang araw po!").
2. Be 100% helpful, actionable, and structured. Use bold headings and bullet points for readability.
3. If the user asks about their own applications or permits, quote their actual Application ID and status from the live context above.
4. If applicable, recommend the user to go to [Mag-apply](/applicant/apply) or [Track Applications](/applicant/track).
5. Never hallucinate rules outside the National Building Code (PD 1096) and Sto. Tomas guidelines.`;

    // 2. Attempt Google Gemini Models with RAG Context
    if (geminiKey) {
      const geminiModels = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-flash-latest"
      ];

      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Opo, naiintindihan ko po. Ako si Mang Tomas, ang inyong virtual permitting officer para sa Sto. Tomas, Pampanga. Handa na po akong magbigay ng 100% maaasahan at tumpak na tulong!" }] }
      ];

      const recentHistory = history.slice(-6);
      recentHistory.forEach((h: { role: string; text: string }) => {
        contents.push({
          role: h.role === "bot" ? "model" : "user",
          parts: [{ text: h.text }]
        });
      });

      contents.push({
        role: "user",
        parts: [{ text: trimmedMessage }]
      });

      for (const model of geminiModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 900,
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
                source: "gemini",
                model
              });
            }
          }
        } catch (mErr) {
          console.warn(`Gemini ${model} attempt failed, trying next:`, mErr);
        }
      }
    }

    // 3. Attempt OpenAI if key is available
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
            temperature: 0.35,
            max_tokens: 900
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
        console.warn("OpenAI API call failed, falling back to local ML engine:", openAiErr);
      }
    }

    // 4. Seamless Local Machine Learning & NLP Knowledge Base Fallback
    // Guaranteed instant, high-precision, 100% helpful responses even without any external API keys!
    const localReply = findKnowledgeBaseMatches(trimmedMessage, userApplications);
    return NextResponse.json({
      reply: localReply,
      source: "local_ml"
    });

  } catch (error) {
    console.error("Error in /api/chat route:", error);
    return NextResponse.json({
      reply: "Mabuhay! Ako po si Mang Tomas. Paumanhin po, nagkaroon ng mabilisang glitch sa koneksyon. Maaari po kayong magtanong muli o i-check ang aming **Requirements Checklist** at **Permit Status** sa sidebar menu!",
      source: "error_fallback"
    }, { status: 200 });
  }
}
