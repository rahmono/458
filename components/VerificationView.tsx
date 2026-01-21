import React, { useState } from 'react';
import { Upload, Store as StoreIcon, MessageSquare, ShieldCheck, Info, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface VerificationViewProps {
  onSubmit: (documentType: string, imageBase64: string, customStoreName: string) => Promise<void>;
  initialStoreName: string;
  t: (key: string, params?: Record<string, string>) => string;
  onBack: () => void;
  currentStatus: string;
}

const VerificationView: React.FC<VerificationViewProps> = ({ onSubmit, initialStoreName, t, onBack, currentStatus }) => {
  const [docType, setDocType] = useState<'patent' | 'certificate'>('patent');
  const [storeName, setStoreName] = useState(initialStoreName);
  const [image, setImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  
  // States for submission process
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // --- IMAGE COMPRESSION HELPER ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                // Resize logic
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024; // Limit width to 1024px
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      setErrorMessage('');
      setStatus('IDLE');

      try {
          // Compress on client side before setting state
          const compressedBase64 = await compressImage(file);
          setImage(compressedBase64);
      } catch (err) {
          console.error("Compression error:", err);
          setErrorMessage("Хатогӣ ҳангоми коркарди расм.");
      } finally {
          setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!storeName || !image) return;
    
    setStatus('LOADING');
    setErrorMessage('');
    
    try {
        await onSubmit(docType, image, storeName);
        // Simulate a small delay for better UX
        setTimeout(() => {
            setStatus('SUCCESS');
        }, 800);
    } catch (e: any) {
        console.error(e);
        setStatus('ERROR');
        setErrorMessage(e.message || t('request_error'));
    }
  };

  const smsPreviewText = t('sms_template').replace('{name}', storeName || '...');

  // --- PENDING STATUS VIEW (BLOCK NEW REQUESTS) ---
  if (currentStatus === 'PENDING') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-300">
             <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Clock size={40} />
             </div>
             <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('request_pending_title')}</h2>
             <p className="text-zinc-500 mb-8 max-w-xs mx-auto leading-relaxed">
                {t('request_pending_desc')}
             </p>
             <button 
               onClick={onBack}
               className="px-8 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium active:scale-95 transition-all"
             >
                {t('back')}
             </button>
        </div>
      );
  }

  // --- SUCCESS VIEW ---
  if (status === 'SUCCESS') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-300">
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 size={40} />
             </div>
             <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('request_sent_success')}</h2>
             <p className="text-zinc-500 mb-8 max-w-xs mx-auto leading-relaxed">
                {t('request_sent_desc')}
             </p>
             <button 
               onClick={onBack}
               className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-medium active:scale-95 transition-all shadow-lg shadow-zinc-900/10"
             >
                OK
             </button>
        </div>
     );
  }

  // --- FORM VIEW ---
  return (
    <div className="animate-in slide-in-from-right duration-300 pb-20">
        
      {/* Scrollable Content */}
      <div className="p-4 space-y-6">
          
          {/* Doc Type Selection */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">{t('activity_type')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDocType('patent')}
                className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    docType === 'patent' 
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {t('patent')}
              </button>
              <button 
                onClick={() => setDocType('certificate')}
                className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    docType === 'certificate' 
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {t('certificate')}
              </button>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">{t('upload_doc')}</label>
            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                image ? 'border-zinc-300 bg-zinc-50' : 'border-blue-300 bg-blue-50/50 hover:bg-blue-50'
            }`}>
                {isCompressing ? (
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <p className="text-xs font-medium">Коркарди расм...</p>
                    </div>
                ) : image ? (
                    <img src={image} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-blue-500">
                        <Upload size={32} className="mb-2" />
                        <p className="text-sm font-semibold">{t('choose_photo')}</p>
                    </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Store Name Input & Hint */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">{t('store_name_official')}</label>
             
             {/* Hint Box */}
             <div className="flex gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-xl text-xs mb-4 border border-yellow-100">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                    {t('store_name_hint')}
                </p>
             </div>

             <div className="relative">
                 <StoreIcon className="absolute left-3 top-3.5 text-zinc-400" size={18} />
                 <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:border-zinc-900 focus:bg-white outline-none transition-all shadow-sm"
                    placeholder="Номи мағоза..."
                 />
             </div>
          </div>

          {/* SMS Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
             <div className="flex items-center gap-2 mb-3 text-blue-700">
                <MessageSquare size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('sms_preview')}</span>
             </div>
             <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative">
                {/* Speech Bubble Arrow */}
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-blue-100 transform rotate-45"></div>
                <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                   {smsPreviewText}
                </p>
             </div>
          </div>

          {/* Error Message */}
          {status === 'ERROR' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in shake">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{errorMessage || t('request_error')}</span>
              </div>
          )}

      </div>

      {/* Sticky Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-zinc-200 max-w-md mx-auto">
           <button
            onClick={handleSubmit}
            disabled={!storeName || !image || status === 'LOADING' || isCompressing}
            className={`w-full py-4 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
              !storeName || !image || status === 'LOADING' || isCompressing
                ? 'bg-zinc-300 cursor-not-allowed shadow-none' 
                : 'bg-zinc-900 hover:bg-zinc-800 shadow-zinc-900/20'
            }`}
          >
            {status === 'LOADING' || isCompressing ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    {t('sending')}
                </>
            ) : (
                <>
                  <ShieldCheck size={20} />
                  {t('send_request')}
                </>
            )}
          </button>
      </div>

    </div>
  );
};

export default VerificationView;