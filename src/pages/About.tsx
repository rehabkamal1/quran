import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Heart, 
  Coffee, 
  CreditCard, 
  Share2, 
  Mail, 
  MessageCircle, 
  Check, 
  Copy, 
  Sparkles,
  Info,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

export const About: React.FC = () => {
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const instaPayHandle = "فودافون كاش"; 
  const vodafoneCashNumber = "01094312087"; 

  const handleCopyInsta = () => {
    navigator.clipboard.writeText(`${vodafoneCashNumber}`);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'منصة هداية - القرآن الكريم والأذكار',
      text: 'اقرأ القرآن الكريم والأذكار واعرف مواقيت الصلاة عبر منصة هداية',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <Card className="p-8 text-center relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <img 
            src="/logo.png" 
            alt="Hidayah Logo" 
            className="w-20 h-20 object-contain drop-shadow-xl rounded-2xl p-2 bg-white dark:bg-card-dark border border-black/5 dark:border-white/10" 
          />
          <div>
            <h1 className="text-3xl font-bold font-quran text-primary dark:text-primary-light">
              منصة هداية
            </h1>
            <p className="text-sm text-text-muted mt-1 font-sans">
              تطبيق إسلامي متكامل (قرآن كريم - أذكار - أدعية - مواقيت الصلاة - تسابيح)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs">
            <Sparkles size={14} />
            <span>صدقة جارية عن جميع المسلمين والمسلمات</span>
          </div>
        </motion.div>
      </Card>

      {/* Developer Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="text-primary" size={22} />
          <h2 className="text-xl font-bold text-text-main dark:text-text-darkMain">عن المطور</h2>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shrink-0 shadow-inner">
              رحاب
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-2xl font-bold text-primary dark:text-primary-light">
                  م. رحاب كمال (Rehab Kamal)
                </h3>
                <p className="text-sm text-text-muted font-sans font-semibold mt-0.5">
                  مهندسة برمجيات ومطورة الويب (Software Engineer)
                </p>
              </div>

              <p className="text-sm text-text-main dark:text-text-darkMain leading-relaxed font-sans">
                تم تطوير وتصميم منصة «هداية» بفضل الله وتوفيقه لتكون دليلاً وتطبيقاً خفيفاً وسهلاً لكل مسلم، يُسهّل قراءة القرآن الكريم والاستماع للأذكار اليومية ومتابعة مواقيت الصلاة بتجربة حديثة وبدون أي إعلانات مزعجة. نسأل الله أن يتقبل هذا العمل خالصاً لوجهه الكريم.
              </p>

              {/* Social & Contact Links */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a 
                  href="https://github.com/rehabkamal1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/10 text-sm font-semibold transition-colors"
                >
                  <Globe size={16} className="text-primary" />
                  <span>GitHub</span>
                </a>

                <a 
                  href="rehabkamalabdelhamed@gmail.com" 
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/10 text-sm font-semibold transition-colors"
                >
                  <Mail size={16} className="text-primary" />
                  <span>البريد الإلكتروني</span>
                </a>

                <a 
                  href="https://wa.me/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/10 text-sm font-semibold transition-colors text-emerald-600 dark:text-emerald-400"
                >
                  <MessageCircle size={16} />
                  <span>تواصل واتساب</span>
                </a>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Support & Donations Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="text-rose-500 fill-rose-500/20" size={22} />
          <h2 className="text-xl font-bold text-text-main dark:text-text-darkMain">ساهم في استمرار وتطوير المنصة (صدقة جارية)</h2>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          <p className="text-sm text-text-muted leading-relaxed font-sans">
            مساهمتك ودعمك يساعدنا في تغطية تكاليف الاستضافة والسيرفرات وتطوير ميزات جديدة مثل الاستماع الصوتي عالي الجودة وإرسال التنبيهات وإبقاء المنصة مجانية وبدون إعلانات.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Coffee size={22} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-300">Buy Me a Coffee</h4>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">ادعمنا بكوب قهوة عبر المزية</p>
              </div>
            </a>

            {/* PayPal */}
            <a
              href="https://paypal.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <CreditCard size={22} />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">PayPal</h4>
                <p className="text-xs text-blue-700/80 dark:text-blue-400/80">الدعم السريع عبر بايبال</p>
              </div>
            </a>

            {/* Patreon / Ko-Fi */}
            <a
              href="https://ko-fi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Heart size={22} />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 dark:text-rose-300">Ko-fi / Patreon</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/80">دعم شهري أو مرة واحدة</p>
              </div>
            </a>

            {/* InstaPay / Vodafone Cash */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">InstaPay / فودافون كاش</h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">{instaPayHandle} | {vodafoneCashNumber}</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInsta}
                className="shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              >
                {copiedInsta ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Share Section */}
      <Card className="p-6 text-center space-y-4 bg-primary/5 border-primary/20">
        <h3 className="font-bold text-lg text-primary dark:text-primary-light">الدال على الخير كفاعله</h3>
        <p className="text-sm text-text-muted">
          انشر تطبيق هداية بين أهلك وأصدقائك ليكون لك أجر كل من قرأ حرفاً أو ذكر الله.
        </p>

        <Button 
          variant="primary" 
          onClick={handleShareApp}
          className="mx-auto flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg"
        >
          <Share2 size={18} />
          <span>{copiedAppUrl ? "تم نسخ رابط المنصة!" : "مشاركة المنصة الآن"}</span>
        </Button>
      </Card>

    </div>
  );
};
