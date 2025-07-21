import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import z from "zod";
import { extractContentFromImage } from "~/server/lib/image/extractFromImage";
import { transcribeAudio } from "~/server/lib/audio/transcribe";
import { getIntentParameters } from "~/server/lib/audio/getIntentParameters";
import { generateAudioResponse } from "~/server/lib/audio/generateAudioResponse";


const FileData = z.object({
    name: z.string(),
    type: z.string(),
    data: z.string(),
});

export const orchestratorRouter = createTRPCRouter({
    process: publicProcedure
        .input(z.object({ file: FileData }))
        .mutation(async ({ input, ctx }) => {
            const { name, type, data } = input.file;

            // Reconstruct a Buffer from base64
            const buffer = Buffer.from(data, "base64");

            // Create a File object from the buffer
            const file = new File([buffer], name, { type });

            if (type.startsWith("image/")) {
                const content = await extractContentFromImage(file);
                return { kind: "image" as const, data: { content } };
            }

            if (type.startsWith("audio/")) {
                const transcription = await transcribeAudio(file);
                const intentParameters = await getIntentParameters(transcription);

                const audioResponse = await generateAudioResponse((intentParameters as { response: string }).response);
                return { kind: "audio" as const, data: { transcription, audioResponse, intentParameters } };
            }

            throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported file type" });
        }),
});
