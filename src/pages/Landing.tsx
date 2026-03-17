import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  CheckCircle2, 
  ArrowLeft, 
  Menu, 
  X,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Smartphone,
  Globe
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();

  const features = [
    {
      title: "إدارة الشقق",
      description: "نظم معلومات جميع الشقق والملاك في مكان واحد وبكل سهولة.",
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "تتبع المدفوعات الشهرية",
      description: "راقب المساهمات الشهرية وتعرف على من دفع ومن تأخر في الحين.",
      icon: CreditCard,
      color: "bg-emerald-500"
    },
    {
      title: "دعوة السكان عبر الكود",
      description: "أرسل كود دعوة للسكان لينضموا تلقائياً إلى عمارة السنديك.",
      icon: Users,
      color: "bg-indigo-500"
    },
    {
      title: "لوحة تحكم للسنديك",
      description: "إحصائيات دقيقة وتقارير مالية مفصلة لإدارة شفافة واحترافية.",
      icon: LayoutDashboard,
      color: "bg-amber-500"
    }
  ];

  const steps = [
    {
      title: "السنديك ينشئ العمارة",
      description: "بضع نقرات لتحديد اسم العمارة، العنوان، والمساهمة الشهرية.",
      number: "01"
    },
    {
      title: "يضيف الشقق ويولد الكود",
      description: "إضافة أرقام الشقق وتوليد كود دعوة فريد لكل عمارة.",
      number: "02"
    },
    {
      title: "السكان يسجلون بالكود",
      description: "يدخل السكان الكود للانضمام إلى العمارة والاطلاع على وضعيتهم.",
      number: "03"
    },
    {
      title: "الجميع يتابع المدفوعات",
      description: "شفافية تامة في تتبع المداخيل والمصاريف بين السنديك والسكان.",
      number: "04"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">S</div>
              <span className="text-2xl font-black tracking-tight text-slate-900">Sandik</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">المميزات</a>
              <a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">كيف يعمل</a>
              <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">الأسعار</a>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">تسجيل الدخول</Link>
            <Link to="/signup" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
              ابدأ الآن
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div>
        {isMenuOpen && (
          <div 
            className="fixed inset-x-0 top-20 z-40 bg-white border-b border-slate-100 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-6">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-900">المميزات</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-900">كيف يعمل</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-900">الأسعار</a>
              <hr className="border-slate-100" />
              <Link to="/login" className="text-lg font-bold text-slate-900">تسجيل الدخول</Link>
              <Link to="/signup" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-center shadow-lg shadow-blue-200">
                ابدأ الآن
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-6"
            >
              <Zap size={14} />
              <span>المنصة رقم 1 لإدارة السنديك في المغرب</span>
            </div>
            <h1 
              className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]"
            >
              إدارة العمارات أصبحت <span className="text-blue-600">أسهل</span>
            </h1>
            <p 
              className="text-xl text-slate-500 font-medium leading-relaxed"
            >
              منصة رقمية تساعد السنديك وسكان العمارة على إدارة الشقق والمدفوعات والتواصل بسهولة وشفافية تامة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Syndic Card */}
            <div 
              className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center group hover:border-blue-500 transition-colors"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Building2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">أنا سنديك</h3>
              <p className="text-slate-500 font-medium mb-10">أنشئ عمارة، أضف الشقق، وتتبع المدفوعات الشهرية بكل احترافية.</p>
              <Link to="/create-building" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]">
                إنشاء عمارة
                <ChevronLeft size={20} />
              </Link>
            </div>

            {/* Resident Card */}
            <div 
              className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 flex flex-col items-center text-center group hover:border-blue-500 transition-colors"
            >
              <div className="w-20 h-20 bg-white text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Users size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">أنا صاحب شقة</h3>
              <p className="text-slate-500 font-medium mb-8">أدخل كود الدعوة للانضمام إلى عمارتك ومتابعة وضعية مدفوعاتك.</p>
              
              <div className="w-full space-y-4">
                <input 
                  type="text" 
                  placeholder="كود الدعوة (مثال: ABC-123)" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-center font-bold text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
                <button 
                  onClick={() => navigate(`/join-building?code=${inviteCode}`)}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  الانضمام إلى العمارة
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-lg text-slate-500 font-medium">صممنا Sandik ليكون بسيطاً وقوياً في نفس الوقت، ليوفر لك تجربة إدارة لا مثيل لها.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className={`w-14 h-14 ${feature.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">كيف يعمل Sandik؟</h2>
              <div className="space-y-12">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-4 bg-blue-600/5 rounded-[60px] blur-3xl" />
              <div className="relative bg-white p-4 rounded-[40px] border border-slate-200 shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/dashboard/1200/800" 
                  alt="Sandik Dashboard" 
                  className="rounded-[32px] shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-32 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">تحكم كامل في مداخيل العمارة</h2>
            <p className="text-lg text-slate-400 font-medium">لوحة تحكم ذكية تعطيك نظرة شاملة على الوضع المالي لعماركتك في ثوانٍ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              { label: "عدد الشقق", value: "24", icon: Building2, color: "text-blue-400" },
              { label: "الشقق التي دفعت", value: "18", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "الشقق المتأخرة", value: "06", icon: X, color: "text-rose-400" },
              { label: "إجمالي الأموال", value: "4,800 MAD", icon: CreditCard, color: "text-amber-400" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-[32px] border border-white/10">
                <div className={`mb-4 ${stat.color}`}>
                  <stat.icon size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-10 bg-blue-600/20 rounded-full blur-[100px]" />
            <div className="relative bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">S</div>
                  <div>
                    <h4 className="font-bold text-lg">إقامة الأمل</h4>
                    <p className="text-xs text-slate-400">الدار البيضاء، المعاريف</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { apt: "شقة 01", owner: "أحمد بناني", status: "تم الدفع", color: "text-emerald-400", bg: "bg-emerald-400/10" },
                  { apt: "شقة 02", owner: "ليلى العلمي", status: "متأخر", color: "text-amber-400", bg: "bg-amber-400/10" },
                  { apt: "شقة 03", owner: "كريم تازي", status: "تم الدفع", color: "text-emerald-400", bg: "bg-emerald-400/10" },
                  { apt: "شقة 04", owner: "فاطمة زهراء", status: "لم يدفع", color: "text-rose-400", bg: "bg-rose-400/10" }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-sm">{row.apt}</div>
                      <span className="font-bold">{row.owner}</span>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.bg} ${row.color}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-[60px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <Building2 size={200} />
          </div>
          <div className="absolute bottom-0 left-0 p-10 opacity-10 -rotate-12">
            <Smartphone size={200} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">ابدأ إدارة عمارتك اليوم</h2>
            <p className="text-xl text-blue-100 font-medium mb-12 max-w-2xl mx-auto">انضم إلى مئات السناديك الذين اختاروا Sandik لتسهيل حياتهم وحياة جيرانهم.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create-building" className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-95">
                إنشاء حساب مجاني
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-blue-700 text-white rounded-2xl font-black text-lg hover:bg-blue-800 transition-all active:scale-95">
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">S</div>
                <span className="text-2xl font-black tracking-tight text-slate-900">Sandik</span>
              </Link>
              <p className="text-slate-500 font-medium leading-relaxed">المنصة المتكاملة لإدارة العمارات والملكيات المشتركة في المغرب. شفافية، سهولة، واحترافية.</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                  <Globe size={20} />
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                  <Smartphone size={20} />
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-sm">روابط سريعة</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">عن المنصة</a></li>
                <li><a href="#features" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">المميزات</a></li>
                <li><a href="#how-it-works" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">كيف يعمل</a></li>
                <li><a href="#pricing" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">الأسعار</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-sm">الدعم</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">الأسئلة الشائعة</a></li>
                <li><a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">سياسة الخصوصية</a></li>
                <li><a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors">شروط الاستخدام</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-sm">تواصل معنا</h4>
              <ul className="space-y-4">
                <li className="text-slate-500 font-bold">contact@sandik.ma</li>
                <li className="text-slate-500 font-bold">+212 5XX XX XX XX</li>
                <li className="text-slate-500 font-bold">الدار البيضاء، المغرب</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 font-bold text-sm">© 2026 Sandik. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
              <span>صنع بكل ❤️ في المغرب</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
