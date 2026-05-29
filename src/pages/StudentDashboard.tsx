/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, Save, RefreshCw, Shield } from 'lucide-react';
import { QRCode } from 'react-qr-code'; 
import { HexColorPicker } from 'react-colorful';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Safe Authentication Initialization Block
  useEffect(() => {
    let isMounted = true;
    
    const initializeWorkspace = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          if (isMounted) {
            setCheckingAuth(false);
            navigate('/', { replace: true });
          }
          return;
        }

        if (isMounted) {
          setUserEmail(user.email || '');
          setUserId(user.id);
        }

        // Fetch basic profile row parameters to see if user is Admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name, student_id, course')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted && profileData) {
          if (profileData.role && profileData.role.toLowerCase().includes('admin')) {
            setIsAdmin(true);
          }
          if (profileData.full_name && profileData.full_name !== 'NEW STUDENT') {
            setFullName(profileData.full_name);
          }
          if (profileData.student_id) setStudentId(profileData.student_id);
          if (profileData.course) setCourse(profileData.course);
        }

        // Pre-hydrate last request design choices if they exist
        const { data: cardData } = await supabase
          .from('card_requests')
          .select('username, account_link, phone_number, card_bg_color, card_template_color, card_text_color, full_name, student_id, course')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted && cardData) {
          if (cardData.username) setUsername(cardData.username);
          if (cardData.account_link) setAccountLink(cardData.account_link);
          
          // Fix: Ensure we only add '09' if it doesn't already exist in the database string
          if (cardData.phone_number) {
            const rawPhone = cardData.phone_number.trim();
            setPhone(rawPhone.startsWith('09') ? rawPhone : '09' + rawPhone);
          }
          
          if (cardData.card_bg_color) setBgColor(cardData.card_bg_color);
          if (cardData.card_template_color) setTemplateColor(cardData.card_template_color);
          if (cardData.card_text_color) setTextColor(cardData.card_text_color);
          
          // Rehydrate form text changes if profile data was sparse
          if (cardData.full_name) setFullName(cardData.full_name);
          if (cardData.student_id) setStudentId(cardData.student_id);
          if (cardData.course) setCourse(cardData.course);
        }

      } catch (err) {
        console.error("Workspace caught refresh exception context:", err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };

    initializeWorkspace();
    return () => { isMounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setCheckingAuth(true);
      await supabase.auth.signOut();
      
      setUserId('');
      setUserEmail('');
      setIsAdmin(false);
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout execution fault:", err);
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Safe normalization of Philippine mobile strings
    const cleanPhone = phone.trim().replace(/^09/, '');

    try {
      // 1. Submit design card request profile payload data
      const { error: cardError } = await supabase.from('card_requests').insert({
        user_id: userId,
        full_name: fullName.trim().toUpperCase(),
        student_id: studentId.trim(),
        course: course.trim().toUpperCase(),
        username: username.trim(),
        account_link: accountLink.trim(),
        phone_number: cleanPhone,
        card_bg_color: bgColor,
        card_template_color: templateColor,
        card_text_color: textColor,
        status: 'pending' 
      });

      if (cardError) throw cardError;

      // 2. Sync values down into profiles table so verification states align
      await supabase.from('profiles').update({
        full_name: fullName.trim().toUpperCase(),
        student_id: studentId.trim(),
        course: course.trim().toUpperCase()
      }).eq('id', userId);

      setMessage('Success! Your NFC card design request has been submitted to the Admin Dashboard.');
    } catch (error: any) {
      setMessage('Submission error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhilippinePhone = (num: string) => {
    return num.trim().replace(/^09/, '');
  };

  const getDynamicFontSize = (text: string, baseCqw: number, threshold: number) => {
    if (!text || text.length <= threshold) return `${baseCqw}cqw`;
    const reductionFactor = threshold / text.length;
    const computedSize = Math.max(baseCqw * reductionFactor, baseCqw * 0.25); 
    return `${computedSize.toFixed(2)}cqw`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-orange-600" size={28} />
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading Workspace Layout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 flex flex-col gap-6 font-sans">
      
      {/* Top Navbar Header */}
      <div className="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md p-4 flex justify-between items-center border-l-4 border-orange-600">
        <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <User className="text-orange-600" /> Student NFC Workspace
        </h1>
        <div className="flex items-center gap-4">
          
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-xs shadow transition uppercase font-mono tracking-wider animate-pulse border border-amber-600/20 cursor-pointer"
            >
              <Shield size={14} /> Open Admin Portal
            </button>
          )}

          <span className="text-xs font-semibold text-neutral-500 bg-neutral-200 px-3 py-1 rounded-md">{userEmail}</span>
          <button onClick={handleLogout} className="bg-neutral-900 text-white p-2 rounded-full hover:bg-neutral-800 transition cursor-pointer">
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
            <div className={`p-3 mb-4 rounded-lg text-sm font-semibold ${message.includes('Error') || message.includes('failed') || message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800 uppercase" placeholder="JUAN DELA CRUZ"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student ID</label>
                <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800" placeholder="0000-00-000000"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course/Program</label>
              <input required type="text" value={course} onChange={e => setCourse(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800 uppercase" placeholder="BS COURSE/PROGRAM"/>
            </div>

            <hr className="border-neutral-200" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800" placeholder="USERNAME"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800" placeholder="###########"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target NFC Destination Link</label>
              <input required type="url" value={accountLink} onChange={e => setAccountLink(e.target.value)} className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800" placeholder="https://instagram.com/USERNAME"/>
            </div>

            {/* Color Customizers */}
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

            <button type="submit" disabled={loading} className="w-full mt-4 bg-neutral-900 text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition flex justify-center items-center gap-2 cursor-pointer">
              <Save size={18} /> {loading ? 'Submitting to Admin...' : 'Submit Design to Admin'}
            </button>
          </form>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center min-h-[520px]">
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">
              CARD DESIGN OVERVIEW
            </span>
            <button
              type="button"
              onClick={() => setIsShowingBack(!isShowingBack)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition shadow-md z-30 font-sans cursor-pointer"
            >
              <RefreshCw size={16} className={isShowingBack ? 'rotate-180 transition-transform duration-500' : 'transition-transform duration-500'} />
              Flip Card {isShowingBack ? '(Front)' : '(Back)'}
            </button>
          </div>

          <div 
            className="w-full max-w-xl aspect-[1.586/1] relative select-none [perspective:1000px] @container"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${isShowingBack ? '[transform:rotateY(180deg)]' : ''}`}>
              
              {/* FRONT FACE */}
              <div className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl border-[4px] p-[4cqw] flex flex-col justify-between [backface-visibility:hidden] overflow-hidden" style={{ backgroundColor: bgColor, borderColor: templateColor }}>
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${templateColor} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                  <div className="absolute top-[1.5cqw] right-[1.5cqw] w-[22cqw] h-[22cqw] border-t-[3px] border-r-[3px]" style={{ borderColor: templateColor }} />
                  <div className="absolute bottom-[1.5cqw] left-[1.5cqw] w-[18cqw] h-[18cqw] border-b-[3px] border-l-[3px]" style={{ borderColor: templateColor }} />
                  <div className="absolute top-1/2 left-[28%] w-[45%] h-[2px] border-b-[2px] border-dashed animate-pulse" style={{ borderColor: templateColor }} />
                </div>

                <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw] z-10" style={{ borderColor: templateColor }}>
                  <div className="flex items-center gap-[2cqw]">
                    <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: textColor }}>IDENTIFICATION BADGE</div>
                    <div className="px-[1.5cqw] py-[0.4cqw] text-[1.1cqw] font-black rounded bg-neutral-900 border-[2px] uppercase tracking-widest text-amber-400" style={{ borderColor: templateColor }}>SYS_SEC // AUTH</div>
                  </div>
                  <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: textColor }}>HEX_ID // 6F9A24EE</div>
                </div>

                <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible z-10">
                  <div className="col-span-4 flex flex-col items-center justify-center gap-[2cqw] border-r-[3px] pr-[2.5cqw]" style={{ borderColor: templateColor }}>
                    <div className="w-full aspect-square bg-white p-[5%] rounded-xl border-[3px] shadow-2xl flex items-center justify-center" style={{ borderColor: templateColor }}>
                      <QRCode value={accountLink || 'https://bicol-u.edu.ph'} style={{ height: "100%", maxWidth: "100%", width: "100%" }} fgColor="#0d0e12" bgColor="#FFFFFF" />
                    </div>
                    <div className="w-full flex items-center justify-center gap-[1.5cqw] bg-neutral-900 p-[1.5cqw] rounded-lg border-[2px]" style={{ borderColor: templateColor }}>
                      <div className="w-[4cqw] h-[4cqw] rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-[2.2cqw] text-neutral-900 shadow-md">T</div>
                      <div className="text-left leading-none">
                        <div className="text-[1.2cqw] font-black tracking-wider text-amber-400">TECHSYSTEMS</div>
                        <div className="text-[0.8cqw] font-black tracking-widest text-white mt-1">ASSOCIATION</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 flex flex-col justify-between space-y-[2cqw] pl-[1cqw] pr-[1cqw] overflow-visible">
                    <div className="w-full overflow-visible">
                      <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: textColor }}>Full Name // Owner</span>
                      <span className="block font-black uppercase tracking-wide whitespace-nowrap overflow-visible leading-none" style={{ color: templateColor, fontSize: getDynamicFontSize(fullName || 'JUAN DELA CRUZ', 4.2, 14) }}>
                        {fullName || 'JUAN DELA CRUZ'}
                      </span>
                    </div>
                    
                    <div className="w-full overflow-visible">
                      <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: textColor }}>Course / Assignment Location</span>
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

                <div className="w-full flex justify-between items-center border-t-[3px] pt-[1.5cqw] mt-[1cqw] z-10" style={{ borderColor: templateColor }}>
                  <div className="text-[1.3cqw] tracking-[0.2em] font-black uppercase font-mono" style={{ color: textColor }}>Issued by: TECHSYSTEMS ASSOCIATION</div>
                  <div className="text-[1.2cqw] tracking-[0.25em] font-black uppercase font-mono" style={{ color: templateColor }}>HARDWARE NODE STATUS // ACTIVE</div>
                </div>
              </div>

              {/* BACK FACE */}
              <div className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl border-[4px] p-[5cqw] flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden" style={{ backgroundColor: bgColor, borderColor: templateColor }}>
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="border-[2px] aspect-square rounded-xs" style={{ borderColor: templateColor }} />
                    ))}
                  </div>
                </div>

                <div className="z-10 space-y-4 bg-neutral-950/90 p-[4cqw] rounded-2xl border-[3px]" style={{ borderColor: templateColor }}>
                  <div className="w-[14cqw] h-[14cqw] mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 flex items-center justify-center font-black text-[7cqw] text-neutral-900 border-[3px] shadow-2xl">T</div>
                  <div>
                    <div className="text-[5.5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: templateColor }}>COMPUTER STUDIES</div>
                    <div className="text-[2.6cqw] font-black tracking-[0.5em] uppercase text-white mt-3">DEPARTMENT</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <p className="text-[11px] text-neutral-400 mt-6 text-center italic">MAKE SURE THAT ALL OF THE INFORMATION YOU PROVIDE IS FACTUAL</p>
        </div>

      </div>
    </div>
  );
}