import React, { useState } from 'react';
import { X, Check, Upload, Store as StoreIcon, MessageSquare, ShieldCheck, BadgeCheck } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documentType: string, imageBase64: string, customStoreName: string) => void;
  initialStoreName: string;
  t: (key: string, params?: Record<string, string>) => string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, onSubmit, initialStoreName, t }) => {
  const [docType, setDocType] = useState<'patent' | 'certificate'>('patent');
  const [storeName, setStoreName] = useState(initialStoreName);
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!storeName || !image) return;
    setSubmitting(true);
    await onSubmit(docType, image, storeName);
    setSubmitting(false);
    setSubmitted(true);
  };

  const smsPreviewText = t('sms_template').replace('{name}', storeName || '...');

  if (submitted) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('request_sent_success')}</h3>
                <button 
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium"
                >
                    OK
                </button>
            </div>
        </div>
     );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100 animate-in slide-in-from-bottom duration-300 sm:duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <BadgeCheck size={20} className="text-blue-500" />
            {t('verification_title')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          
          {/* Doc Type */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('activity_type')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDocType('patent')}
                className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${docType === 'patent' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
              >
                {t('patent')}
              </button>
              <button 
                onClick={() => setDocType('certificate')}
                className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${docType === 'certificate' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
              >
                {t('certificate')}
              </button>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('upload_doc')}</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-zinc-400 transition-all bg-zinc-50/50">
                {image ? (
                    <img src={image} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-500 font-medium">{t('choose_photo')}</p>
                    </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Store Name Input */}
          <div>
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('store_name_official')}</label>
             <div className="relative">
                 <StoreIcon className="absolute left-3 top-3.5 text-zinc-400" size={18} />
                 <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:border-zinc-900 outline-none transition-colors"
                    placeholder="Номи мағоза..."
                 />
             </div>
          </div>

          {/* SMS Preview */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
             <div className="flex items-center gap-2 mb-2 text-blue-700">
                <MessageSquare size={16} />
                <span className="text-xs font-bold uppercase">{t('sms_preview')}</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-sm text-zinc-800 leading-relaxed">
                   {smsPreviewText}
                </p>
             </div>
          </div>

        </div>

        <div className="p-4 bg-white border-t border-zinc-100 sticky bottom-0">
           <button
            onClick={handleSubmit}
            disabled={!storeName || !image || submitting}
            className={`w-full py-4 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              !storeName || !image || submitting ? 'bg-zinc-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
            {submitting ? '...' : (
                <>
                  <ShieldCheck size={18} />
                  {t('send_request')}
                </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VerificationModal;