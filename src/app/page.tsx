"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "~/trpc/react";

type ProcessResult = {
  kind: "image" | "audio";
  data: {
    content?: string;
    transcription?: string;
    audioResponse?: string;
    intentParameters?: Object;
  };
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);


  const processMutation = api.orchestrator.process.useMutation({
    onSuccess: (data) => {
      console.log("Processing successful:", data);
      setResult(data);

      if (data.kind === "audio" && data.data.audioResponse) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Processing error:", error);
      alert(`Error processing file: ${error.message}`);
    },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [result]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('audio/') || file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0 && droppedFiles[0]) {
      setFile(droppedFiles[0]);
      setResult(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    console.log("Submitting file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    setIsProcessing(true);
    try {
      await processMutation.mutateAsync({
        file: {
          name: file.name,
          type: file.type,
          data: base64,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 max-w-4xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-center">
          Receptro.ai Assessment
        </h1>

        <div
          className={`relative w-full max-w-lg border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragOver
            ? 'border-blue-400 bg-blue-400/10'
            : file
              ? 'border-gray-500 bg-gray-500/10 hover:border-gray-400 hover:bg-gray-400/10'
              : 'border-gray-400 hover:border-gray-300 hover:bg-white/5'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            accept="audio/*,image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <svg className={`w-12 h-12 ${file ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className={`text-lg font-medium ${file ? 'text-gray-300' : ''}`}>
                {file ? 'Drop another file to replace' : 'Drop an audio or image file here'}
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="w-full max-w-lg bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Selected File:</h3>
            <div className="flex items-center justify-between bg-white/5 rounded p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-300">{file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={removeFile}
                className="ml-2 text-red-400 hover:text-red-300 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!file || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Submit File'}
        </button>

        {result && (
          <div className="w-full max-w-3xl mt-8">
            {result.kind === "image" && result.data.content && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                  🖼️ Document Analysis
                </h2>
                {(() => {
                  try {
                    const extractedData = JSON.parse(result.data.content);
                    const fields = Object.entries(extractedData);

                    if (fields.length === 0) {
                      return (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <p className="text-yellow-300 text-center">No fields were extracted from this document.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {fields.map(([key, value], index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
                            >
                              <div className="flex flex-col space-y-2">
                                <label className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                </label>
                                <div className="text-white bg-black/20 rounded px-3 py-2 font-mono text-sm">
                                  {String(value) || '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <details className="bg-gray-500/10 rounded-lg border border-gray-500/30">
                          <summary className="cursor-pointer p-4 text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                            📄 <span>View Raw JSON Data</span>

                          </summary>
                          <div className="px-4 pb-4">
                            <div className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto border border-gray-700/50">
                              <pre className="text-sm font-mono leading-relaxed">
                                <code
                                  dangerouslySetInnerHTML={{
                                    __html: JSON.stringify(extractedData, null, 2)
                                      .replace(/("([^"\\]|\\.)*":\s*)/g, '<span style="color: #7dd3fc;">$1</span>')
                                      .replace(/("([^"\\]|\\.)*"(?=\s*[,}\]]))/g, '<span style="color: #86efac;">$1</span>')
                                      .replace(/\b(true|false)\b/g, '<span style="color: #fbbf24;">$1</span>')
                                      .replace(/\b\d+(\.\d+)?\b/g, '<span style="color: #c084fc;">$1</span>')
                                      .replace(/\bnull\b/g, '<span style="color: #ef4444;">null</span>')
                                      .replace(/([{}[\]])/g, '<span style="color: #d1d5db;">$1</span>')
                                      .replace(/,/g, '<span style="color: #d1d5db;">,</span>')
                                  }}
                                />
                              </pre>
                            </div>
                            <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));

                                }}
                                className="text-blue-400 hover:text-blue-300 cursor-pointer underline"
                              >
                                📋 Copy JSON
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  } catch (error) {
                    return (
                      <div className="space-y-4">
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                          <p className="text-orange-300 text-center mb-2">⚠️ Could not parse as structured data</p>
                          <p className="text-sm text-gray-300 text-center">Displaying raw response:</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-gray-300 leading-relaxed">{result.data.content}</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {result.kind === "audio" && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-center">🎵 Audio Processing Results</h2>

                {result.data.audioResponse && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      🔊 AI Generated Response
                    </h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayPause}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${isPlaying
                          ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                          : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30'
                          }`}
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="text-sm text-gray-300 mb-1">
                          {isPlaying ? 'Now Playing...' : 'Click to play AI response'}
                        </div>
                        <div className={`h-2 bg-white/10 rounded-full overflow-hidden ${isPlaying ? 'animate-pulse' : ''}`}>
                          <div className={`h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                            style={{ width: isPlaying ? '100%' : '0%' }} />
                        </div>
                      </div>
                    </div>
                    <audio
                      ref={audioRef}
                      src={result.data.audioResponse}
                      className="hidden"
                    />
                  </div>
                )}

                {result.data.transcription && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      📝 Transcription
                    </h3>
                    <p className="text-gray-300 leading-relaxed italic">"{result.data.transcription}"</p>
                  </div>
                )}

                {result.data.intentParameters && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      🎯 AI Analysis & Response
                    </h3>

                    <div className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">💬 Generated Response</h4>
                      <p className="text-gray-300 leading-relaxed italic">
                        "{(result.data.intentParameters as { response: string }).response}"
                      </p>
                    </div>

                    <details className="bg-gray-500/10 rounded-lg border border-gray-500/30">
                      <summary className="cursor-pointer p-4 text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                        🧠 <span>View Intent and Parameters</span>

                      </summary>
                      <div className="px-4 pb-4">
                        <div className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto border border-gray-700/50">
                          <pre className="text-sm font-mono leading-relaxed">
                            <code
                              dangerouslySetInnerHTML={{
                                __html: JSON.stringify(result.data.intentParameters, null, 2)
                                  .replace(/("([^"\\]|\\.)*":\s*)/g, '<span style="color: #7dd3fc;">$1</span>')
                                  .replace(/("([^"\\]|\\.)*"(?=\s*[,}\]]))/g, '<span style="color: #86efac;">$1</span>')
                                  .replace(/\b(true|false)\b/g, '<span style="color: #fbbf24;">$1</span>')
                                  .replace(/\b\d+(\.\d+)?\b/g, '<span style="color: #c084fc;">$1</span>')
                                  .replace(/\bnull\b/g, '<span style="color: #ef4444;">null</span>')
                                  .replace(/([{}[\]])/g, '<span style="color: #d1d5db;">$1</span>')
                                  .replace(/,/g, '<span style="color: #d1d5db;">,</span>')
                              }}
                            />
                          </pre>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(result.data.intentParameters, null, 2));
                            }}
                            className="text-purple-400 hover:text-purple-300 cursor-pointer underline"
                          >
                            📋 Copy Analysis
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
