import OpenAI from "openai";
import { openai } from "../openai";


export async function transcribeAudio(
    file: File
) {

    const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "gpt-4o-transcribe",
    });

    return transcription.text;
}
