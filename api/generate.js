export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { hobbies, advice, expertise } = req.body;
  if (!hobbies || !advice || !expertise) return res.status(400).json({ error: "Fehlende Angaben" });

  const prompt = `Generiere 3 Business-Ideen als JSON. Antworte NUR mit dem JSON-Array, kein Text davor/danach.

Person: Hobbys="${hobbies}" | Rat="${advice}" | Expertise="${expertise}"

REGELN:
- Identifiziere die 1-2 stärksten Kernkompetenzen und schlage klare Nischen vor
- Die Zielgruppe ergibt sich aus dem Thema, NICHT aus persönlichen Merkmalen der Person
- Sofort startbar, keine Weiterbildung oder Zertifizierung nötig
- Freelancing, Dienstleistung, Online-Service oder Fachberatung bevorzugen
- Kein Persönlichkeits-Coaching ohne nachgewiesene Ausbildung

Format:
[{"title":"Kurzer Titel","tagline":"Ein Satz","category":"Freelancing/Dienstleistung/Beratung/Online-Business","description":"2 Sätze warum das passt und sofort startbar ist.","how_to_monetize":"z.B. Projektbasis 80€/h oder Paket 500€","first_steps":"Schritt 1, Schritt 2","monetization_potential":"💰💰 Mittel","target_audience":["Gruppe1","Gruppe2"]}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "API Fehler");

    const text = data.content.map((i) => i.text || "").join("");
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Kein JSON in Antwort");

    const ideas = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ideas });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
