
import React, { useRef } from 'react';
import { InputMode } from '../types';
import { UploadIcon, TextIcon, SparklesIcon } from './Icon';

interface LogoInputProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  textInput: string;
  setTextInput: (text: string) => void;
  handleImageUpload: (file: File) => void;
  imagePreview: string | null;
  isLoading: boolean;
  handleGenerate: () => void;
}

export const LogoInput: React.FC<LogoInputProps> = ({
  inputMode,
  setInputMode,
  textInput,
  setTextInput,
  handleImageUpload,
  imagePreview,
  isLoading,
  handleGenerate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 backdrop-blur-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200">Create Your Logo</h2>
        <p className="text-sm text-gray-400 mt-1">Choose an input method to get started.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-900 rounded-lg">
        <button
          onClick={() => setInputMode(InputMode.IMAGE)}
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-200 ${
            inputMode === InputMode.IMAGE
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <UploadIcon className="w-5 h-5 mr-2" /> Upload Image
        </button>
        <button
          onClick={() => setInputMode(InputMode.TEXT)}
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-200 ${
            inputMode === InputMode.TEXT
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <TextIcon className="w-5 h-5 mr-2" /> Use Text
        </button>
      </div>

      <div>
        {inputMode === InputMode.IMAGE ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            <label
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex justify-center w-full h-48 px-4 transition bg-gray-900/50 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Logo preview" className="object-contain h-full py-2" />
              ) : (
                <span className="flex items-center space-x-2">
                  <UploadIcon className="w-6 h-6 text-gray-400" />
                  <span className="font-medium text-gray-400">
                    Drop files to Attach, or <span className="text-indigo-400 underline">browse</span>
                  </span>
                </span>
              )}
            </label>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, or WEBP. Max 10MB.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-2">
              Logo Text
            </label>
            <input
              id="text-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., 'Aperture', 'Nexus', 'Nova'"
              className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
             <p className="text-xs text-gray-500 mt-2">Enter a word or short phrase for your logo concept.</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transform hover:scale-105 active:scale-100"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate 3D Logo
            </>
          )}
        </button>
      </div>
    </div>
  );
};
