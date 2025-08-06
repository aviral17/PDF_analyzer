import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const [askStatus, setAskStatus] = useState("");

  const handleUpload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploadStatus(`✅ ${response.data.message}`);
      setIsUploaded(true);
      setAskStatus("");
    } catch (error) {
      setUploadStatus("❌ Upload failed. Please try again.");
      setIsUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!question.trim() || !isUploaded) return;

    setIsAsking(true);
    setAskStatus("");
    try {
      const response = await axios.get("http://localhost:8000/ask", {
        params: { question },
      });
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      setAnswer(response.data.answer || "No answer found");
      setAskStatus("✅ Answer generated successfully");
    } catch (error: any) {
      setAnswer("");
      setAskStatus(`❌ ${error.message || "Failed to get answer"}`);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
          ChatPDF - Ask Any Document
        </h1>

        {/* File Upload Section */}
        <div className="mb-8">
          <label className="block text-lg font-medium mb-2">
            Upload PDF Document
          </label>
          <div className="flex gap-3">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setIsUploaded(false);
                setUploadStatus("");
                setAnswer("");
              }}
              className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {uploadStatus && (
            <p
              className={`mt-2 text-sm ${
                uploadStatus.startsWith("✅")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Question Section */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            Ask About the PDF
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Summarize this document in 3 points"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={!isUploaded}
            />
            <button
              onClick={handleAsk}
              disabled={isAsking || !isUploaded}
              className={`px-6 py-2 rounded-full text-white ${
                isUploaded
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isAsking ? "Thinking..." : "Ask"}
            </button>
          </div>
          {!isUploaded && (
            <p className="mt-2 text-sm text-red-500">
              Please upload a PDF first before asking questions
            </p>
          )}
          {askStatus && (
            <p
              className={`mt-2 text-sm ${
                askStatus.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {askStatus}
            </p>
          )}
        </div>

        {/* Answer Display */}
        {answer && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Document Answer:</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Built with React, FastAPI, and DeepSeek AI
      </footer>
    </div>
  );
}

export default App;
