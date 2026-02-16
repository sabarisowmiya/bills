import React, { useRef, useState } from 'react';
import { Upload, Camera, Loader2, FileText, X } from 'lucide-react';
import { extractBillData } from '../services/geminiService';
import { Bill } from '../types';

interface BillUploadProps {
  onExtractionComplete: (data: Partial<Bill>) => void;
  onManualEntry: () => void;
}

export const BillUpload: React.FC<BillUploadProps> = ({ onExtractionComplete, onManualEntry }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);

    // Process
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      // Remove header from base64 string if present (Gemini expects raw base64 usually, but SDK handles helper)
      // The helper "inlineData" in SDK needs base64 string without prefix data:image/...;base64,
      const base64Data = base64.split(',')[1];

      const extractedData = await extractBillData(base64Data);
      onExtractionComplete(extractedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to extract data. Please try again or enter manually.");
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const reset = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif font-bold text-slate-800">Upload Bill</h2>
        <p className="text-gray-500">Take a photo or upload a scan. AI will do the rest.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-500 transition-colors relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-indigo-600 font-medium animate-pulse">Analyzing bill with AI...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="max-h-96 mx-auto rounded-lg shadow-md" />
            <button
              onClick={reset}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg text-red-500 hover:bg-red-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="py-12 space-y-6">
            <div className="flex justify-center space-x-4 text-gray-400">
              <Camera className="w-16 h-16" />
              <FileText className="w-16 h-16" />
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-slate-850 text-white rounded-full font-medium shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Select Image
              </button>
            </div>
            <p className="text-sm text-gray-400">Supports JPG, PNG</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center border border-red-200">
          {error}
        </div>
      )}

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative bg-gray-50 px-4 text-gray-500 text-sm font-medium">OR</div>
      </div>

      <div className="text-center">
        <button
          onClick={onManualEntry}
          className="text-indigo-600 font-medium hover:text-indigo-800 underline decoration-2 underline-offset-4"
        >
          Enter bill details manually
        </button>
      </div>
    </div>
  );
};