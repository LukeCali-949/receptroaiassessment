import { openai } from "../openai";



export async function generateAudioResponse(response: string): Promise<string> {
    const mp3 = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "coral",
        input: response,
        instructions: "Speak in a cheerful and positive tone.",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    console.log(base64Audio);

    return `data:audio/mpeg;base64,${base64Audio}`;
}


