## HOW TO RUN
You can run this next.js project locally by entering the "npm install" command in the terminal to install this projects dependencies and
then "npm run dev" to run the development server and try it locally, you will also need to create a .env file and provide your own
OPENAI_API_KEY. You can then use the already included sample.wav or doc.png file or upload your own and press the submit file button.


## Describing my overall design, key decisions, and any assumptions
Its important to have consistent type checking across the whole stack of an application, so I decided to to create a TypeScript Next.js Project
frontend with a trpc backend, to maintain consistent typing across the application, which especially important in an application like this,
where data is being sent to and from the backend in a structured format. 

A key decision I made was checking the type of the file on the backend instead of the frontend, and incorporating an orchestrator route that
 takes the file data in the request from the client and then checks for the file type there, in which case depending on the type of the file, that file
would be passed to either the associated image or audio functions (as seen in the /audio and /image folders in the /lib folder) and thats
where the transcription, interpretation, synthesis, and ocr is done and then returned to the client/frontend for display for the user. Intially,
I did the file check on the client side and had two different routers for the image and audio but I realized not only is this not safe, as you can
never trust data completely from the client (as it can't be trusted) but also a much smoother flow and better architecture is having an 
orchestrator router that does the type check and then calls specifc functions based off that type. It is good to be modular when possible.

For the audio, I split the processes of transcribing the audio file, getting the intent, parameters,and generating response text and converting that response
into audio with emotion (via the OpenAI tts api), into three separate functions and put them under the /audio folder and then since there was only one process
for the image (extracting structured fields from the document) I put that into a singular function under the /image folder. This allows for greater clarity
and separation of concerns. 

One of the assumptions I made was regarding how to present the generated content(such as the audio reply and structured data) on the frontend. I intially considered using a simple object dump for display, but I decided to build a more intuitive and polished UI to make the data easier to navigate and understand.

How this application passes file data to and from the frontend and backend:
When the user drops or selects a file on the frontend, I read it as an array buffer and convert it into a base64 string so it can be sent safely to the backend using tRPC. On the server side, I take that base64 string and turn it back into a buffer and then recreate a proper File object using the original name and type. That lets me treat it like a real file again and pass it to my audio or image processing functions. 

When generating the audio response, I turn the generated audio data into a base64 string that be easily sent to the client and used as a source in an <audio> element.


## HOW TO SWAP IN DIFFERENT TRANSCRIPTION, INTERPRETATION, SYNTHESIS, OR OCR ENGINE
I used the openai api for all these processes, so I made a openai.ts file so I could reuse the object without declaring it every time I used it,
but if one wanted to use a different provider, they would have to replace all openai references with another provider that has all these same
capabilities, there are many out there, Antrophic, Gemini (Google), etc, but just have to replace openai references with the specific provider (along
with any specifics that may vary from provider to provider, shouldn't be that different though). Could have used vercel ai sdk as well as it 
provides a means to interchange different providers easily but I chose a more straightforward approach just using the openai api



