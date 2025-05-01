
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { image } = req.body;

    const prompt = `Analyze this product for greenwashing.

You are an expert in environmental claims and sustainable product verification. Carefully examine the image and evaluate:

1. Does the product make specific, measurable environmental claims or just vague statements?
2. Are there legitimate environmental certifications visible?
3. Does the product use misleading imagery or terminology?
4. Are there signs of hidden trade-offs or irrelevant environmental claims?
5. Is the product exaggerating a minor environmental benefit?

Start with a 1-2 sentence summary.
Then give 3-5 bullet-pointed observations.
End with a brief conclusion under 300 words.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    const analysis = completion.choices[0].message.content;

    // Basic score estimation (this can be smarter later)
    const isGreenwashing = analysis.toLowerCase().includes("greenwashing");
    const confidence = 80;

    // Extract 3-5 lines for insights
    const insights = analysis
      .split('\n')
      .filter(line => line.trim().length > 20)
      .slice(0, 5);

    res.status(200).json({
      isGreenwashing,
      confidence,
      insights,
      analysis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze image', detail: err.message });
  }
}

