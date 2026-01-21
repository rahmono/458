import React from 'react';
import { Phone, ExternalLink, RefreshCw } from 'lucide-react';

interface ConnectPhoneModalProps {
  isOpen: boolean;
  botUsername: string;
  onCheckAgain: () => void;
  t: (key: string) => string;
}

const ConnectPhoneModal: React.FC<ConnectPhoneModalProps> = ({ isOpen, botUsername, onCheckAgain, t }) => {
  if (!isOpen) return null;

  const handleOpenBot = () => {
     // Use Telegram WebApp openTelegramLink if available, otherwise fallback
     const url = `https://t.me/${botUsername}?start=phone`;
     if (window.Telegram?.WebApp) {
         window.Telegram.WebApp.openTelegramLink(url);
         window.Telegram.WebApp.close(); // Close the Mini App immediately
     } else {
         window.open(url, '_blank');
     }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Phone size={32} />
         </div>
         
         <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('connect_phone_title')}</h2>
         <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            {t('connect_phone_desc')}
         </p>

         <div className="space-y-3">
             <button 
                onClick={handleOpenBot}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
             >
                <ExternalLink size={18} />
                {t('open_bot_btn')}
             </button>

             <button 
                onClick={onCheckAgain}
                className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
             >
                <RefreshCw size={18} />
                {t('check_again_btn')}
             </button>
         </div>
      </div>
    </div>
  );
};

export default ConnectPhoneModal;