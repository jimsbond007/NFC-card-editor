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
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap';
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

  // Dynamic Scale Generator: Decreases cqw value as character lengths increase
  const getDynamicFontSize = (text: string, baseCqw: number, threshold: number) => {
    if (!text || text.length <= threshold) return `${baseCqw}cqw`;
    const reductionFactor = threshold / text.length;
    const computedSize = Math.max(baseCqw * reductionFactor, baseCqw * 0.52); 
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
                <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-tech-orange outline-none font-medium" placeholder="2024-01-077733"/>
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

        {/* Right Preview Side Panel - Maximized and Enlarged to support high quality print previews */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center min-h-[520px]">
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">
              HIGH-RESOLUTION PRINT WORKSPACE (CR80 RATIO)
            </span>
            <button
              type="button"
              onClick={() => setIsShowingBack(!isShowingBack)}
              className="flex items-center gap-2 px-4 py-2 bg-tech-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-md"
            >
              <RefreshCw size={16} className={isShowingBack ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
              Flip Card Viewport {isShowingBack ? '(Front)' : '(Back)'}
            </button>
          </div>

          {/* Container Queries Active Parent: Scaled Up horizontally using max-w-xl */}
          <div 
            className="w-full max-w-xl aspect-[1.586/1] relative select-none @container"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {!isShowingBack ? (
              /* FRONT HIGH VISIBILITY SCIFI CARD DESIGN */
              <div 
                className="w-full h-full rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300 border-3 p-[5cqw] flex flex-col justify-between"
                style={{ backgroundColor: bgColor, borderColor: templateColor }}
              >
                {/* ================= EXTRA VISIBLE TECHY DESIGN OBJECTS ================= */}
                {/* Abstract Background Tech Circuit Lines Trace */}
                <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
                  <div className="absolute top-[20%] left-[-5%] w-[40%] h-[2px] rotate-[35deg]" style={{ backgroundColor: templateColor }} />
                  <div className="absolute top-[35%] left-[23%] w-[20%] h-[2px] -rotate-[45deg]" style={{ backgroundColor: templateColor }} />
                  <div className="absolute bottom-[25%] right-[-5%] w-[50%] h-[2px] rotate-[25deg]" style={{ backgroundColor: templateColor }} />
                  <div className="absolute top-[10%] right-[30%] w-[15%] h-[15%] rounded-full border-2 border-dashed" style={{ borderColor: templateColor }} />
                </div>

                {/* Ultra-Bold Frame Tech Accents (Top Corner Brackets) */}
                <div className="absolute top-0 left-0 w-[8cqw] h-[8cqw] border-l-4 border-t-4" style={{ borderColor: templateColor }} />
                <div className="absolute top-0 right-0 w-[8cqw] h-[8cqw] border-r-4 border-t-4" style={{ borderColor: templateColor }} />
                <div className="absolute bottom-0 left-0 w-[8cqw] h-[8cqw] border-l-4 border-b-4" style={{ borderColor: templateColor }} />
                <div className="absolute bottom-0 right-0 w-[8cqw] h-[8cqw] border-r-4 border-b-4" style={{ borderColor: templateColor }} />

                {/* Geometric Running Grid Tracks (Top / Bottom Runway) */}
                <div className="absolute top-0 left-[12cqw] right-[12cqw] h-[2.5cqw] border-b-2 flex justify-between" style={{ borderColor: templateColor }}>
                  <div className="w-[15%] h-full border-r-2" style={{ borderColor: templateColor }} />
                  <div className="w-[30%] h-[60%] border-l-2 border-b-2" style={{ borderColor: templateColor }} />
                  <div className="w-[15%] h-full border-l-2" style={{ borderColor: templateColor }} />
                </div>
                
                <div className="absolute bottom-0 left-[12cqw] right-[24cqw] h-[2.5cqw] border-t-2 flex justify-start items-end" style={{ borderColor: templateColor }}>
                  <div className="w-[25%] h-[60%] border-r-2 border-t-2" style={{ borderColor: templateColor }} />
                  <div className="ml-[4cqw] mb-[0.5cqw] text-[1cqw] tracking-widest opacity-60" style={{ color: templateColor }}>SYS_LNK // ACTIVE</div>
                </div>

                {/* Cyber HUD Plus Overlays (+) */}
                <div className="absolute top-[30%] left-[4cqw] text-[3cqw] font-light opacity-60 leading-none" style={{ color: templateColor }}>+</div>
                <div className="absolute bottom-[30%] right-[24cqw] text-[3cqw] font-light opacity-60 leading-none" style={{ color: templateColor }}>+</div>

                {/* ROW 1: HEADER SECTION */}
                <div className="flex justify-between items-start z-10 w-full">
                  <div className="space-y-1">
                    <div className="text-[2.2cqw] font-black uppercase tracking-[0.25em]" style={{ color: textColor }}>Identification</div>
                    <div className="text-[1.3cqw] font-bold tracking-[0.3em]" style={{ color: templateColor }}>SECURE NODE SYSTEM</div>
                  </div>
                  
                  {/* High Visibility TechSystems Corporate Crest */}
                  <div className="flex items-center gap-[2cqw] bg-neutral-900/90 px-[3cqw] py-[1.2cqw] rounded-xl border-2" style={{ borderColor: templateColor }}>
                    <div className="w-[5.5cqw] h-[5.5cqw] rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 flex items-center justify-center font-black text-[3cqw] text-neutral-900 shadow-md">
                      T
                    </div>
                    <div className="text-right">
                      <div className="text-[1.8cqw] font-black tracking-wider text-amber-400 leading-none">TECHSYSTEMS</div>
                      <div className="text-[1.1cqw] font-black tracking-[0.25em] text-white mt-1 leading-none">ASSOCIATION</div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: CORE LARGE TYPOGRAPHY COMPONENT SLOTS */}
                <div className="grid grid-cols-12 gap-1 items-center my-auto z-10 w-full pt-[2cqw]">
                  
                  {/* Left Box: Username Container Frame */}
                  <div className="col-span-4 flex flex-col items-center justify-center pr-[1cqw]">
                    <div className="text-[1.4cqw] font-bold uppercase tracking-widest opacity-70 mb-1 w-full text-center" style={{ color: textColor }}>Username</div>
                    <div 
                      className="w-full border-3 py-[2.5cqw] px-[1cqw] rounded-xl text-center font-black tracking-widest uppercase truncate shadow-lg"
                      style={{ 
                        borderColor: templateColor, 
                        color: templateColor, 
                        backgroundColor: `${templateColor}18`,
                        fontSize: getDynamicFontSize(username || 'USERNAME', 3.2, 8) 
                      }}
                    >
                      {username || 'USERNAME'}
                    </div>
                  </div>

                  {/* Center Box: Core Large Student Identity Parameters */}
                  <div className="col-span-6 flex flex-col pl-[3cqw] space-y-[1.5cqw] border-l-3" style={{ borderColor: templateColor }}>
                    <div>
                      <span className="block text-[1.3cqw] font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: textColor }}>Full Name</span>
                      <span 
                        className="block font-black uppercase tracking-wide truncate leading-none" 
                        style={{ color: templateColor, fontSize: getDynamicFontSize(fullName || 'JUAN DELA CRUZ', 3.6, 16) }}
                      >
                        {fullName || 'JUAN DELA CRUZ'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="block text-[1.3cqw] font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: textColor }}>Course/Program</span>
                      <span 
                        className="block font-black uppercase tracking-tight truncate leading-none" 
                        style={{ color: templateColor, fontSize: getDynamicFontSize(course || 'BS COURSE/PROGRAM', 2.8, 22) }}
                      >
                        {course || 'BS COURSE/PROGRAM'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[1.3cqw] font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: textColor }}>Student ID</span>
                      <span 
                        className="block font-mono font-black tracking-widest leading-none" 
                        style={{ color: templateColor, fontSize: getDynamicFontSize(studentId || '2024-01-077733', 3.0, 14) }}
                      >
                        {studentId || '2024-01-077733'}
                      </span>
                    </div>
                  </div>

                  {/* Right Box: Highly Visible Rotated Contact Strip (Without 09 Prefix) */}
                  <div className="col-span-2 flex justify-center items-center h-full relative">
                    <div className="absolute flex flex-col items-center rotate-90 transform origin-center whitespace-nowrap translate-x-[1cqw]">
                      <span className="text-[1.1cqw] font-bold tracking-[0.2em] uppercase opacity-50 mb-0.5" style={{ color: textColor }}>CONTACT TEL</span>
                      <span 
                        className="font-mono font-black tracking-[0.25em]" 
                        style={{ color: textColor, fontSize: getDynamicFontSize(formatPhilippinePhone(phone) || '948623020', 2.4, 9) }}
                      >
                        {formatPhilippinePhone(phone) || '948623020'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ROW 3: FOOTER ACCENTS & SCAN NODE */}
                <div className="w-full flex justify-between items-end border-t-2 pt-[2cqw]" style={{ borderColor: templateColor }}>
                  <div className="space-y-1">
                    <div className="text-[1.3cqw] tracking-[0.25em] font-black uppercase font-mono" style={{ color: templateColor }}>
                      NFC SECURITY PROTOCOL HARDWARE
                    </div>
                    <div className="text-[1cqw] tracking-widest font-medium opacity-40 uppercase font-mono" style={{ color: textColor }}>
                      HEX ID CODE // 6F9A24EE7B10
                    </div>
                  </div>
                  
                  {/* High Visibility Thick QR Display Wrapper */}
                  <div className="w-[19%] aspect-square bg-white p-[1.5%] rounded-xl shadow-2xl border-2 flex items-center justify-center transform hover:scale-105 transition-all duration-200" style={{ borderColor: templateColor }}>
                    <QRCode 
                      value={accountLink || 'https://bicol-u.edu.ph'} 
                      style={{ height: "100%", maxWidth: "100%", width: "100%" }}
                      fgColor="#0d0e12"
                      bgColor="#FFFFFF"
                    />
                  </div>
                </div>

              </div>
            ) : (
              /* BACK HIGH VISIBILITY SCIFI CARD DESIGN */
              <div 
                className="w-full h-full rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300 border-3 p-[5cqw] flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: bgColor, borderColor: templateColor }}
              >
                {/* Tech Matrix Graphic Shapes on the Back Panel (Highly Visible Grid Blocks) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none grid grid-cols-8 gap-3 p-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border-2 aspect-square rounded-xs" style={{ borderColor: templateColor }} />
                  ))}
                </div>

                {/* Geometric Abstract Center Circles */}
                <div className="absolute w-[45cqw] h-[45cqw] rounded-full border-2 border-dashed animate-spin opacity-10" style={{ borderColor: templateColor, animationDuration: '40s' }} />
                <div className="absolute w-[35cqw] h-[35cqw] rounded-full border-4 border-double opacity-20" style={{ borderColor: templateColor }} />

                <div className="z-10 space-y-4">
                  <div className="w-[12cqw] h-[12cqw] mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 flex items-center justify-center font-black text-[6cqw] text-neutral-900 border-2 shadow-2xl animate-pulse" style={{ borderColor: templateColor }}>
                    T
                  </div>
                  <div>
                    <div className="text-[5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: templateColor }}>
                      TechSystems
                    </div>
                    <div className="text-[2.2cqw] font-black tracking-[0.5em] uppercase opacity-80 mt-2" style={{ color: textColor }}>
                      Association
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-[11px] text-neutral-400 mt-6 text-center italic">
            Component coordinates fully maximized for print execution layouts.
          </p>
        </div>

      </div>
    </div>
  );
}