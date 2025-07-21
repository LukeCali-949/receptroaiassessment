import { openai } from "../openai";

export async function extractContentFromImage(file: File): Promise<string> {

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Extract all clearly labeled fields from this image of a printed card or document and return them as a JSON object with key-value pairs. Respond in JSON" },
                    {
                        type: "image_url",
                        image_url: {
                            url: dataUrl,
                            detail: "high"
                        },
                    },
                ],
            },
        ],
        response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content ?? "No response generated";
}
