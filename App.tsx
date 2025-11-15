import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Header } from './components/Header';
import { LogoInput } from './components/LogoInput';
import { LogoDisplay } from './components/LogoDisplay';
import { Spinner } from './components/Spinner';
import { VideoPlayer } from './components/VideoPlayer';
import {
  generate3DLogo,
  editImageWithNano,
  animateImageWithVeo,
} from './services/geminiService';
import { InputMode, ImageFile, AppMode, ChatMessage } from './types';
import { UploadIcon, SparklesIcon, SendIcon, UserIcon, BotIcon, DownloadIcon } from './components/Icon';


const App: React.FC = () => {
  // Global state
  const [mode, setMode] = useState<AppMode>(AppMode.LOGO);

  // State for 3D Logo Generator
  const [logoInputMode, setLogoInputMode] = useState<InputMode>(InputMode.IMAGE);
  const [logoTextInput, setLogoTextInput] = useState<string>('Fusion');
  const [logoImageFile, setLogoImageFile] = useState<ImageFile | null>(null);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  
  // State for Image Editor
  const [imageToEdit, setImageToEdit] = useState<ImageFile | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('Make the background dramatic and cinematic');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State for Video Animator
  const [imageToAnimate, setImageToAnimate] = useState<ImageFile | null>(null);
  const [animationPrompt, setAnimationPrompt] = useState<string>('A gentle breeze makes the leaves sway, cinematic lighting.');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationStatus, setAnimationStatus] = useState<string>('');
  const [animationError, setAnimationError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // State for Chatbot
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! How can I help you today?' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  
  // Refs
  const chatSession = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const imageEditorInputRef = useRef<HTMLInputElement>(null);
  const videoAnimatorInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  
  useEffect(() => {
    // Scroll to bottom of chat history when it updates
    if (mode === AppMode.CHAT && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, mode]);

  useEffect(() => {
    // Initialize chat session
    if (mode === AppMode.CHAT && !chatSession.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      chatSession.current = ai.chats.create({
          model: 'gemini-2.5-flash',
      });
    }
  }, [mode]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (mode === AppMode.ANIMATE) {
        setHasApiKey(await window.aistudio.hasSelectedApiKey());
      }
    };
    checkApiKey();
  }, [mode]);


  // --- Helper Functions ---
  
  const handleFileUpload = (file: File, setter: React.Dispatch<React.SetStateAction<ImageFile | null>>) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setter({
        file: file,
        base64: base64String,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  };
  
  // --- API Call Handlers ---

  const handleGenerateLogo = useCallback(async () => {
    setIsGeneratingLogo(true);
    setLogoError(null);
    setGeneratedLogo(null);

    let prompt = '';
    let imagePayload: { mimeType: string; data: string } | undefined = undefined;

    if (logoInputMode === InputMode.IMAGE && logoImageFile) {
      prompt = `Generate a photorealistic, sleek, and modern 3D version of the attached logo. The output should be a high-resolution image of the 3D logo on a clean, dark, neutral background with professional studio lighting and subtle shadows to give it depth. The design should feel premium and dynamic.`;
      imagePayload = {
        mimeType: logoImageFile.file.type,
        data: logoImageFile.base64,
      };
    } else if (logoInputMode === InputMode.TEXT && logoTextInput.trim()) {
      prompt = `Generate a photorealistic, sleek, and modern 3D logo based on the text "${logoTextInput}". The design should be creative and abstract, suitable for a tech company. The output should be a high-resolution image of the 3D logo on a clean, dark, neutral background with professional studio lighting and subtle shadows to give it depth. The design should feel premium and dynamic.`;
    } else {
      setLogoError('Please provide an image or text to generate a logo.');
      setIsGeneratingLogo(false);
      return;
    }

    try {
      const logoData = await generate3DLogo(prompt, imagePayload);
      setGeneratedLogo(`data:image/png;base64,${logoData}`);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsGeneratingLogo(false);
    }
  }, [logoInputMode, logoImageFile, logoTextInput]);
  
  const handleEditImage = useCallback(async () => {
    if (!imageToEdit || !editPrompt.trim()) {
        setEditError("Please upload an image and provide an edit prompt.");
        return;
    }
    setIsEditing(true);
    setEditError(null);
    setEditedImage(null);

    try {
        const imageData = await editImageWithNano(editPrompt, {
            mimeType: imageToEdit.file.type,
            data: imageToEdit.base64,
        });
        setEditedImage(`data:image/png;base64,${imageData}`);
    } catch (err) {
        setEditError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error(err);
    } finally {
        setIsEditing(false);
    }
  }, [imageToEdit, editPrompt]);
  
  const handleAnimateImage = useCallback(async () => {
    if (!imageToAnimate) {
      setAnimationError("Please upload an image to animate.");
      return;
    }
    setIsAnimating(true);
    setAnimationError(null);
    setGeneratedVideo(null);
    setAnimationStatus("Initializing animation...");

    try {
        const videoUri = await animateImageWithVeo(
            animationPrompt,
            {
                mimeType: imageToAnimate.file.type,
                data: imageToAnimate.base64,
            },
            aspectRatio,
            (status) => setAnimationStatus(status)
        );
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        setGeneratedVideo(URL.createObjectURL(videoBlob));
        setAnimationStatus("Video generated successfully!");

    } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred.');
        console.error(error);
        setAnimationError(error.message);
        if (error.message.includes("Requested entity was not found")) {
            setAnimationError("API Key is invalid. Please select a valid key.");
            setHasApiKey(false);
        }
    } finally {
        setIsAnimating(false);
    }
}, [imageToAnimate, animationPrompt, aspectRatio]);


 const handleSelectApiKey = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(await window.aistudio.hasSelectedApiKey());
  };

 const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || !chatSession.current) return;
    
    const userMessage: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsReplying(true);

    try {
      const response = await chatSession.current.sendMessage({ message: chatInput });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsReplying(false);
    }
 }, [chatInput]);

  // --- Render Functions for each mode ---

  const renderLogoGenerator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
      <LogoInput
        inputMode={logoInputMode}
        setInputMode={setLogoInputMode}
        textInput={logoTextInput}
        setTextInput={setLogoTextInput}
        handleImageUpload={(file) => handleFileUpload(file, setLogoImageFile)}
        imagePreview={logoImageFile?.previewUrl || null}
        isLoading={isGeneratingLogo}
        handleGenerate={handleGenerateLogo}
      />
      <LogoDisplay
        isLoading={isGeneratingLogo}
        generatedLogo={generatedLogo}
        error={logoError}
      />
    </div>
  );
  
  const renderImageEditor = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Input Column */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 backdrop-blur-md">
                <h2 className="text-xl font-semibold text-gray-200">Edit Your Image</h2>
                <p className="text-sm text-gray-400 mt-1">Upload an image and describe your edits.</p>
                <div className="mt-6">
                    <input type="file" ref={imageEditorInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], setImageToEdit)} className="hidden" accept="image/png, image/jpeg, image/webp" />
                    <label onClick={() => imageEditorInputRef.current?.click()} onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFileUpload(e.dataTransfer.files[0], setImageToEdit); }} onDragOver={(e) => e.preventDefault()} className="flex justify-center w-full h-48 px-4 transition bg-gray-900/50 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500">
                        {imageToEdit ? <img src={imageToEdit.previewUrl} alt="To edit" className="object-contain h-full py-2" /> : <span className="flex items-center space-x-2"><UploadIcon className="w-6 h-6 text-gray-400" /><span className="font-medium text-gray-400">Drop an image, or <span className="text-indigo-400 underline">browse</span></span></span>}
                    </label>
                </div>
                <div className="mt-6">
                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Edit Prompt</label>
                    <textarea id="edit-prompt" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., 'Add a retro filter', 'Remove the person in the background'" rows={3} className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
                </div>
                <button onClick={handleEditImage} disabled={isEditing || !imageToEdit} className="mt-6 w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                    {isEditing ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Editing...</> : <><SparklesIcon className="w-5 h-5 mr-2" />Apply Edits</>}
                </button>
            </div>
            {/* Output Column */}
            <div className="relative bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 aspect-square flex items-center justify-center group">
                {isEditing && <Spinner />}
                {!isEditing && editError && <div className="text-center text-red-400"><h3 className="font-semibold">Error</h3><p>{editError}</p></div>}
                {!isEditing && !editError && editedImage && <img src={editedImage} alt="Edited result" className="max-w-full max-h-full object-contain animate-fade-in" />}
                {!isEditing && !editError && !editedImage && <div className="text-gray-500 text-center">Your edited image will appear here.</div>}
                {!isEditing && editedImage && (
                    <a
                      href={editedImage}
                      download="edited-image.png"
                      aria-label="Download Edited Image"
                      className="absolute top-4 right-4 bg-gray-800/50 text-gray-300 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-600 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </a>
                )}
            </div>
        </div>
    );
  };
  
  const renderVideoAnimator = () => {
    if (hasApiKey === null) {
      return <div className="flex items-center justify-center h-64"><Spinner /></div>
    }

    if (hasApiKey === false) {
      return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-8 text-center max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">API Key Required for Video Generation</h2>
            <p className="text-gray-400 mb-4">The Veo model requires a dedicated API key. Please select your key to proceed. For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">billing documentation</a>.</p>
            <button onClick={handleSelectApiKey} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                Select API Key
            </button>
             {animationError && <p className="text-red-400 mt-4">{animationError}</p>}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Input Column */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 backdrop-blur-md">
                <h2 className="text-xl font-semibold text-gray-200">Animate Your Image</h2>
                <p className="text-sm text-gray-400 mt-1">Bring your photos to life with a prompt.</p>
                 <div className="mt-6">
                    <input type="file" ref={videoAnimatorInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], setImageToAnimate)} className="hidden" accept="image/png, image/jpeg, image/webp" />
                    <label onClick={() => videoAnimatorInputRef.current?.click()} onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFileUpload(e.dataTransfer.files[0], setImageToAnimate); }} onDragOver={(e) => e.preventDefault()} className="flex justify-center w-full h-48 px-4 transition bg-gray-900/50 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500">
                        {imageToAnimate ? <img src={imageToAnimate.previewUrl} alt="To animate" className="object-contain h-full py-2" /> : <span className="flex items-center space-x-2"><UploadIcon className="w-6 h-6 text-gray-400" /><span className="font-medium text-gray-400">Drop an image, or <span className="text-indigo-400 underline">browse</span></span></span>}
                    </label>
                </div>
                 <div className="mt-6">
                    <label htmlFor="anim-prompt" className="block text-sm font-medium text-gray-300 mb-2">Animation Prompt</label>
                    <textarea id="anim-prompt" value={animationPrompt} onChange={(e) => setAnimationPrompt(e.target.value)} placeholder="e.g., 'The car drives off into the sunset'" rows={3} className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
                </div>
                 <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 rounded-lg">
                        <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Landscape (16:9)</button>
                        <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Portrait (9:16)</button>
                    </div>
                </div>
                <button onClick={handleAnimateImage} disabled={isAnimating || !imageToAnimate} className="mt-6 w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                    {isAnimating ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Animating...</> : <><SparklesIcon className="w-5 h-5 mr-2" />Animate Image</>}
                </button>
            </div>
            {/* Output Column */}
            <div className={`relative bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} flex items-center justify-center group`}>
                 {isAnimating && <div className="text-center"><Spinner /><p className="mt-4 text-gray-400">{animationStatus}</p></div>}
                {!isAnimating && animationError && <div className="text-center text-red-400"><h3 className="font-semibold">Error</h3><p>{animationError}</p></div>}
                {!isAnimating && !animationError && generatedVideo && <VideoPlayer src={generatedVideo} />}
                {!isAnimating && !animationError && !generatedVideo && <div className="text-gray-500 text-center">Your animated video will appear here.</div>}
                {!isAnimating && generatedVideo && (
                    <a
                    href={generatedVideo}
                    download="animated-video.mp4"
                    aria-label="Download Animated Video"
                    className="absolute top-4 right-4 bg-gray-800/50 text-gray-300 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-600 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    >
                    <DownloadIcon className="w-5 h-5" />
                    </a>
                )}
            </div>
        </div>
    );
  };
  
  const renderChatbot = () => (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg flex-grow flex flex-col p-4">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                         {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-white" /></div>}
                    </div>
                ))}
                {isReplying && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-white" /></div>
                        <div className="max-w-md p-3 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-0"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-300"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 relative">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isReplying && handleSendMessage()}
                    placeholder="Ask me anything..."
                    disabled={isReplying}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleSendMessage} disabled={isReplying || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-full text-white disabled:bg-indigo-800 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors">
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);


  const renderContent = () => {
    switch (mode) {
      case AppMode.LOGO:
        return renderLogoGenerator();
      case AppMode.EDIT:
        return renderImageEditor();
      case AppMode.ANIMATE:
          return renderVideoAnimator();
      case AppMode.CHAT:
          return renderChatbot();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
      <Header activeMode={mode} onModeChange={setMode} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;