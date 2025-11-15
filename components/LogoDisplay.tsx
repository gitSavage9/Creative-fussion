import React from 'react';
import { Spinner } from './Spinner';
import { CubeIcon, DownloadIcon } from './Icon';

interface LogoDisplayProps {
  isLoading: boolean;
  generatedLogo: string | null;
  error: string | null;
}

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center text-center text-gray-500">
        <CubeIcon className="w-16 h-16 mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-400">Your 3D Logo will appear here</h3>
        <p className="text-sm">Provide an image or text and click "Generate" to see the magic happen.</p>
    </div>
);


export const LogoDisplay: React.FC<LogoDisplayProps> = ({ isLoading, generatedLogo, error }) => {
  return (
    <div className="relative bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 aspect-square flex items-center justify-center backdrop-blur-md group">
      <div className="w-full h-full flex items-center justify-center">
        {isLoading && <Spinner />}
        {!isLoading && error && (
          <div className="text-center text-red-400 p-4">
            <h3 className="font-semibold mb-2">Generation Failed</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && generatedLogo && (
          <img
            src={generatedLogo}
            alt="Generated 3D Logo"
            className="max-w-full max-h-full object-contain animate-fade-in"
          />
        )}
        {!isLoading && !error && !generatedLogo && <Placeholder />}
      </div>

      {!isLoading && generatedLogo && (
        <a
          href={generatedLogo}
          download="3d-logo.png"
          aria-label="Download Logo as PNG"
          className="absolute top-4 right-4 bg-gray-800/50 text-gray-300 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-600 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          <DownloadIcon className="w-5 h-5" />
        </a>
      )}
    </div>
  );
};