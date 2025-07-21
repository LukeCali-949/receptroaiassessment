import { openai } from "../openai";

export async function getIntentParameters(transcription: string): Promise<Object> {
    const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            {
                role: "system",
                content: "Extract intent and parameters from the user's command. Respond in JSON as a single object. The object must always have a 'response' property whose value is a string that naturally responds to the transcription text. You may include other properties as needed."
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: transcription,
                    },
                ],
            },
        ],
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return "No response generated";


    console.log("This was the intent and parameters: ", content);

    try {
        const obj = JSON.parse(content);
        return obj;
    } catch (e) {
        return "Failed to parse response JSON";
    }
}
