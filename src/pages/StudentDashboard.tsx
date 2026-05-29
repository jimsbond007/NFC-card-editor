/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, Save, RefreshCw } from 'lucide-react';
import { QRCode } from 'react-qr-code'; 
import { HexColorPicker } from 'react-colorful';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  // Form States
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [username, setUsername] = useState('');
  const [accountLink, setAccountLink] = useState('https://bicol-u.edu.ph');
  const [phone, setPhone] = useState('');
  
  // Customizer Design Colors
  const [bgColor, setBgColor] = useState('#0d0e12');        
  const [templateColor, setTemplateColor] = useState('#38bdf8'); 
  const [textColor, setTextColor] = useState('#ffffff');     
  
  const [isShowingBack, setIsShowingBack] = useState(false);

  // Load Orbitron Typography to match the brand identity
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          if (isMounted) navigate('/');
          return;
        }
        if (isMounted) {
          setUserEmail(session.user?.email || '');
          setUserId(session.user?.id || '');
          setCheckingAuth(false);
        }
      } catch (err) {
        if (isMounted) navigate('/');
      }
    };
    getUser();
    return () => { isMounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        student_id: studentId,
        course: course,
      });

      if (profileError) throw profileError;

      const { error: cardError } = await supabase.from('card_requests').insert({
        user_id: userId,
        username: username,
        account_link: accountLink,
        phone_number: phone.replace(/^09/, ''),
        card_bg_color: bgColor,
        // Optional: If your schema supports text and template accents saving, append them here:
        // card_template_color: templateColor,
        // card_text_color: textColor
      });

      if (cardError) throw cardError;

      setMessage('Success! Your customization choice has been recorded.');
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhilippinePhone = (num: string) => {
    return num.trim().replace(/^09/, '');
  };

  // Optimized Dynamic Scale Generator
  const getDynamicFontSize = (text: string, baseCqw: number, threshold: number) => {
    if (!text || text.length <= threshold) return `${baseCqw}cqw`;
    const reductionFactor = threshold / text.length;
    const computedSize = Math.max(baseCqw * reductionFactor, baseCqw * 0.25); 
    return `${computedSize.toFixed(2)}cqw`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-tech-orange" size={28} />
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading Workspace Layout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 flex flex-col gap-6">
      {/* Top Navbar Header */}
      <div className="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md p-4 flex justify-between items-center border-l-4 border-tech-orange">
        <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <User className="text-tech-orange" /> Student NFC Workspace
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-neutral-500 bg-neutral-200 px-3 py-1 rounded-md">{userEmail}</span>
          <button onClick={handleLogout} className="bg-neutral-900 text-white p-2 rounded-full hover:bg-neutral-800 transition">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Input Configuration Pane */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-neutral-800">Card Configuration</h2>
          
          {message && (
            <div className={`p-3 mb-4 rounded-lg text-sm font-semibold ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="JUAN DELA CRUZ"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student ID</label>
                <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="0000-00-000000"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course/Program</label>
              <input required type="text" value={course} onChange={e => setCourse(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="BS COURSE/PROGRAM"/>
            </div>

            <hr className="border-neutral-200" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="USERNAME"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="###########"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target NFC Destination Link</label>
              <input required type="url" value={accountLink} onChange={e => setAccountLink(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="https://instagram.com/USERNAME"/>
            </div>

            {/* Three Color Customization Triggers */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 truncate">Background</label>
                <HexColorPicker color={bgColor} onChange={setBgColor} style={{ width: '100%', height: '90px' }} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 truncate">Circuit Line</label>
                <HexColorPicker color={templateColor} onChange={setTemplateColor} style={{ width: '100%', height: '90px' }} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 truncate">Texts Color</label>
                <HexColorPicker color={textColor} onChange={setTextColor} style={{ width: '100%', height: '90px' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 bg-neutral-900 text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition flex justify-center items-center gap-2">
              <Save size={18} /> {loading ? 'Saving Layout...' : 'Submit Design Profile'}
            </button>
          </form>
        </div>

        {/* Right Preview Side Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center min-h-[520px]">
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">
              CARD DESIGN OVERVIEW
            </span>
            <button
              type="button"
              onClick={() => setIsShowingBack(!isShowingBack)}
              className="flex items-center gap-2 px-4 py-2 bg-tech-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-md z-30"
            >
              <RefreshCw size={16} className={isShowingBack ? 'rotate-180 transition-transform duration-500' : 'transition-transform duration-500'} />
              Flip Card {isShowingBack ? '(Front)' : '(Back)'}
            </button>
          </div>

          {/* 3D PERSPECTIVE VIEWPORT FRAME */}
          <div 
            className="w-full max-w-xl aspect-[1.586/1] relative select-none [perspective:1000px] @container"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {/* CORE ROTATION MATRIX COMPONENT */}
            <div 
              className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${
                isShowingBack ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              
              {/* FRONT CARD FACE */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl border-[4px] p-[4cqw] flex flex-col justify-between [backface-visibility:hidden] overflow-hidden"
                style={{ backgroundColor: bgColor, borderColor: templateColor }}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${templateColor} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                  <div className="absolute top-[1.5cqw] right-[1.5cqw] w-[22cqw] h-[22cqw] border-t-[3px] border-r-[3px]" style={{ borderColor: templateColor }} />
                  <div className="absolute bottom-[1.5cqw] left-[1.5cqw] w-[18cqw] h-[18cqw] border-b-[3px] border-l-[3px]" style={{ borderColor: templateColor }} />
                  <div className="absolute top-1/2 left-[28%] w-[45%] h-[2px] border-b-[2px] border-dashed animate-pulse" style={{ borderColor: templateColor }} />
                  <div className="absolute top-[28%] right-[4cqw] text-[3cqw] font-black leading-none" style={{ color: templateColor }}>+</div>
                  <div className="absolute bottom-[28%] left-[28%] text-[3cqw] font-black leading-none" style={{ color: templateColor }}>+</div>
                  <div className="absolute top-[15%] left-[-2cqw] w-[5cqw] h-[8cqw] border-r-[2px] border-t-[2px] rotate-12 opacity-40" style={{ borderColor: templateColor }} />
                  <div className="absolute bottom-[10%] right-[-1cqw] w-[8cqw] h-[3cqw] border-l-[2px] border-b-[2px] -rotate-12 opacity-30" style={{ borderColor: templateColor }} />
                </div>

                {/* HEADER ROW */}
                <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw] z-10" style={{ borderColor: templateColor }}>
                  <div className="flex items-center gap-[2cqw]">
                    <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: textColor }}>IDENTIFICATION BADGE</div>
                    <div className="px-[1.5cqw] py-[0.4cqw] text-[1.1cqw] font-black rounded bg-neutral-900 border-[2px] uppercase tracking-widest text-amber-400" style={{ borderColor: templateColor }}>
                      SYS_SEC // AUTH
                    </div>
                  </div>
                  <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: textColor }}>
                    HEX_ID // 6F9A24EE
                  </div>
                </div>

                {/* CARD BODY GRID INFORMATION */}
                <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible z-10">
                  <div className="col-span-4 flex flex-col items-center justify-center gap-[2cqw] border-r-[3px] pr-[2.5cqw]" style={{ borderColor: templateColor }}>
                    <div className="w-full aspect-square bg-white p-[5%] rounded-xl border-[3px] shadow-2xl flex items-center justify-center" style={{ borderColor: templateColor }}>
                      <QRCode 
                        value={accountLink || 'https://bicol-u.edu.ph'} 
                        style={{ height: "100%", maxWidth: "100%", width: "100%" }}
                        fgColor="#0d0e12"
                        bgColor="#FFFFFF"
                      />
                    </div>
                    <div className="w-full flex items-center justify-center gap-[1.5cqw] bg-neutral-900 p-[1.5cqw] rounded-lg border-[2px]" style={{ borderColor: templateColor }}>
                      <div className="w-[4cqw] h-[4cqw] rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-[2.2cqw] text-neutral-900 shadow-md">
                        T
                      </div>
                      <div className="text-left leading-none">
                        <div className="text-[1.2cqw] font-black tracking-wider text-amber-400">TECHSYSTEMS</div>
                        <div className="text-[0.8cqw] font-black tracking-widest text-white mt-1">ASSOCIATION</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 flex flex-col justify-between space-y-[2cqw] pl-[1cqw] pr-[1cqw] overflow-visible">
                    <div className="w-full overflow-visible">
                      <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: textColor }}>
                        Full Name // Owner
                      </span>
                      <span className="block font-black uppercase tracking-wide whitespace-nowrap overflow-visible leading-none" style={{ color: templateColor, fontSize: getDynamicFontSize(fullName || 'JUAN DELA CRUZ', 4.2, 14) }}>
                        {fullName || 'JUAN DELA CRUZ'}
                      </span>
                    </div>
                    
                    <div className="w-full overflow-visible">
                      <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: textColor }}>
                        Course / Assignment Location
                      </span>
                      <span className="block font-black uppercase tracking-tight whitespace-nowrap overflow-visible leading-none" style={{ color: textColor, fontSize: getDynamicFontSize(course || 'BS COURSE/PROGRAM', 3.2, 16) }}>
                        {course || 'BS COURSE/PROGRAM'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-[2cqw] pt-[1.5cqw] border-t-[2px] border-dashed overflow-visible" style={{ borderColor: templateColor }}>
                      <div className="overflow-visible space-y-[1.5cqw]">
                        <div className="overflow-visible">
                          <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: textColor }}>Student ID</span>
                          <span className="block font-mono font-black tracking-widest whitespace-nowrap overflow-visible leading-none" style={{ color: templateColor, fontSize: getDynamicFontSize(studentId || '0000-00-000000', 2.8, 14) }}>
                            {studentId || '0000-00-000000'}
                          </span>
                        </div>
                        <div className="overflow-visible">
                          <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: textColor }}>Contact Number</span>
                          <span className="block font-mono font-black tracking-widest whitespace-nowrap overflow-visible leading-none text-[2.4cqw]" style={{ color: templateColor }}>
                            +63{formatPhilippinePhone(phone) || '948623020'}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-visible flex flex-col justify-start">
                        <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: textColor }}>USERNAME</span>
                        <span className="block font-black tracking-wider uppercase whitespace-nowrap overflow-visible leading-none" style={{ color: textColor, fontSize: getDynamicFontSize(username || 'USERNAME', 2.8, 10) }}>
                          @{username || 'USERNAME'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER SYSTEM LINE */}
                <div className="w-full flex justify-between items-center border-t-[3px] pt-[1.5cqw] mt-[1cqw] z-10" style={{ borderColor: templateColor }}>
                  <div className="text-[1.3cqw] tracking-[0.2em] font-black uppercase font-mono" style={{ color: textColor }}>
                    Issued by: TECHSYSTEMS ASSOCIATION
                  </div>
                  <div className="text-[1.2cqw] tracking-[0.25em] font-black uppercase font-mono" style={{ color: templateColor }}>
                    HARDWARE NODE STATUS // ACTIVE
                  </div>
                </div>
              </div>

              {/* BACK CARD FACE */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl border-[4px] p-[5cqw] flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden"
                style={{ backgroundColor: bgColor, borderColor: templateColor }}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="border-[2px] aspect-square rounded-xs" style={{ borderColor: templateColor }} />
                    ))}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46cqw] h-[46cqw] rounded-full border-[3px] border-dashed animate-spin" style={{ borderColor: templateColor, animationDuration: '25s' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36cqw] h-[36cqw] rounded-full border-[4px] border-double" style={{ borderColor: templateColor }} />
                  <div className="absolute top-[2cqw] left-[2cqw] w-[5cqw] h-[5cqw] border-t-[4px] border-l-[4px]" style={{ borderColor: templateColor }} />
                  <div className="absolute top-[2cqw] right-[2cqw] w-[5cqw] h-[5cqw] border-t-[4px] border-r-[4px]" style={{ borderColor: templateColor }} />
                  <div className="absolute bottom-[2cqw] left-[2cqw] w-[5cqw] h-[5cqw] border-b-[4px] border-l-[4px]" style={{ borderColor: templateColor }} />
                  <div className="absolute bottom-[2cqw] right-[2cqw] w-[5cqw] h-[5cqw] border-b-[4px] border-r-[4px]" style={{ borderColor: templateColor }} />
                </div>

                <div className="z-10 space-y-4 bg-neutral-950/90 p-[4cqw] rounded-2xl border-[3px]" style={{ borderColor: templateColor }}>
                  <div className="w-[14cqw] h-[14cqw] mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 flex items-center justify-center font-black text-[7cqw] text-neutral-900 border-[3px] shadow-2xl">
                    T
                  </div>
                  <div>
                    <div className="text-[5.5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: templateColor }}>
                      COMPUTER STUDIES
                    </div>
                    <div className="text-[2.6cqw] font-black tracking-[0.5em] uppercase text-white mt-3">
                      DEPARTMENT
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <p className="text-[11px] text-neutral-400 mt-6 text-center italic">
            MAKE SURE THAT ALL OF THE INFORMATION YOU PROVIDE IS FACTUAL
          </p>
        </div>

      </div>
    </div>
  );
}