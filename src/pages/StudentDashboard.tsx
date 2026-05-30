/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, Save, RefreshCw, Shield, Upload, Trash, ZoomIn, RotateCw } from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { HexColorPicker } from 'react-colorful';
import { useAuth } from '../context/AuthContext';



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
  
  // Background Image State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [bgImageZoom, setBgImageZoom] = useState(100);
  const [bgImageOpacity, setBgImageOpacity] = useState(100);
  const [bgImageRotation, setBgImageRotation] = useState(0);
  const [bgImagePosition, setBgImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Modal State
  const [showBgImageModal, setShowBgImageModal] = useState(false);
  const [tempBgImage, setTempBgImage] = useState<string | null>(null);
  const [tempBgImageZoom, setTempBgImageZoom] = useState(100);
  const [tempBgImageOpacity, setTempBgImageOpacity] = useState(100);
  const [tempBgImageRotation, setTempBgImageRotation] = useState(0);
  const [tempBgImagePosition, setTempBgImagePosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalIsShowingBack, setModalIsShowingBack] = useState(false);
  
  const [isShowingBack, setIsShowingBack] = useState(false);

  // Design Slots State
  const [designSlots, setDesignSlots] = useState<any[]>([null, null, null]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load design slots from localStorage
    const savedSlots = localStorage.getItem('designSlots');
    if (savedSlots) {
      try {
        setDesignSlots(JSON.parse(savedSlots));
      } catch (err) {
        console.error('Error loading design slots:', err);
      }
    }
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
          
          if (cardData.phone_number) {
            const rawPhone = cardData.phone_number.trim();
            setPhone(rawPhone.startsWith('09') ? rawPhone : '09' + rawPhone);
          }
          
          if (cardData.card_bg_color) setBgColor(cardData.card_bg_color);
          if (cardData.card_template_color) setTemplateColor(cardData.card_template_color);
          if (cardData.card_text_color) setTextColor(cardData.card_text_color);
          
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
        background_image: backgroundImage,
        bg_image_zoom: bgImageZoom,
        bg_image_opacity: bgImageOpacity,
        bg_image_rotation: bgImageRotation,
        bg_image_position_x: bgImagePosition.x,
        bg_image_position_y: bgImagePosition.y,
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

  // Background Image Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setTempBgImage(imageData);
        setTempBgImageZoom(100);
        setTempBgImageOpacity(100);
        setTempBgImageRotation(0);
        setTempBgImagePosition({ x: 0, y: 0 });
        setShowBgImageModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalBgImageMouseDown = (e: React.MouseEvent) => {
    setIsDraggingBg(true);
    setDragStart({ x: e.clientX - tempBgImagePosition.x, y: e.clientY - tempBgImagePosition.y });
  };

  const handleModalBgImageMouseMove = (e: React.MouseEvent) => {
    if (isDraggingBg) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setTempBgImagePosition({ x: newX, y: newY });
    }
  };

  const handleModalBgImageMouseUp = () => {
    setIsDraggingBg(false);
  };

  const handleSaveBackgroundImage = () => {
    setBackgroundImage(tempBgImage);
    setBgImageZoom(tempBgImageZoom);
    setBgImageOpacity(tempBgImageOpacity);
    setBgImageRotation(tempBgImageRotation);
    setBgImagePosition(tempBgImagePosition);
    setShowBgImageModal(false);
  };

  const handleCancelBackgroundImage = () => {
    setTempBgImage(null);
    setTempBgImageZoom(100);
    setTempBgImageOpacity(100);
    setTempBgImageRotation(0);
    setTempBgImagePosition({ x: 0, y: 0 });
    setShowBgImageModal(false);
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    setBgImageZoom(100);
    setBgImageOpacity(100);
    setBgImageRotation(0);
    setBgImagePosition({ x: 0, y: 0 });
  };

  // Design Slots Functions
  const saveDesignToSlot = (slotIndex: number) => {
    const currentDesign = {
      fullName,
      studentId,
      course,
      username,
      accountLink,
      phone,
      bgColor,
      templateColor,
      textColor,
      backgroundImage,
      bgImageZoom,
      bgImageOpacity,
      bgImageRotation,
      bgImagePosition,
      timestamp: new Date().toISOString(),
    };

    const updatedSlots = [...designSlots];
    updatedSlots[slotIndex] = currentDesign;
    setDesignSlots(updatedSlots);
    localStorage.setItem('designSlots', JSON.stringify(updatedSlots));
    setMessage(`Design saved to Slot ${slotIndex + 1}!`);
  };

  const loadDesignFromSlot = (slotIndex: number) => {
    const savedDesign = designSlots[slotIndex];
    if (savedDesign) {
      setFullName(savedDesign.fullName);
      setStudentId(savedDesign.studentId);
      setCourse(savedDesign.course);
      setUsername(savedDesign.username);
      setAccountLink(savedDesign.accountLink);
      setPhone(savedDesign.phone);
      setBgColor(savedDesign.bgColor);
      setTemplateColor(savedDesign.templateColor);
      setTextColor(savedDesign.textColor);
      setBackgroundImage(savedDesign.backgroundImage);
      setBgImageZoom(savedDesign.bgImageZoom);
      setBgImageOpacity(savedDesign.bgImageOpacity);
      setBgImageRotation(savedDesign.bgImageRotation);
      setBgImagePosition(savedDesign.bgImagePosition);
      setMessage(`Design loaded from Slot ${slotIndex + 1}!`);
    } else {
      setMessage('No design saved in this slot.');
    }
  };

  const deleteDesignFromSlot = (slotIndex: number) => {
    const updatedSlots = [...designSlots];
    updatedSlots[slotIndex] = null;
    setDesignSlots(updatedSlots);
    localStorage.setItem('designSlots', JSON.stringify(updatedSlots));
    setMessage(`Design in Slot ${slotIndex + 1} deleted!`);
  };

  // Scroll lock effect
  useEffect(() => {
    if (showBgImageModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBgImageModal]);

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

            {/* Background Image Upload */}
            <div className="pt-4 border-t border-neutral-200">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Background Image</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="bgImageUpload"
                />
                <label
                  htmlFor="bgImageUpload"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer transition text-sm font-semibold text-neutral-700"
                >
                  <Upload size={16} /> Upload Background Image
                </label>
                {backgroundImage && (
                  <button
                    type="button"
                    onClick={handleRemoveBackgroundImage}
                    className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-semibold text-sm cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {backgroundImage && (
                <p className="text-xs text-green-600 mt-2 font-semibold">✓ Background image uploaded</p>
              )}
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
                {/* Background Image Layer */}
                {backgroundImage && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={backgroundImage}
                      alt="Background"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${bgImagePosition.x}px, ${bgImagePosition.y}px) scale(${bgImageZoom / 100}) rotate(${bgImageRotation}deg)`,
                        opacity: bgImageOpacity / 100,
                        transformOrigin: 'center',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}
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
                </div>

                <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible z-10">
                  <div className="col-span-4 flex flex-col items-center justify-center gap-[2cqw] border-r-[3px] pr-[2.5cqw]" style={{ borderColor: templateColor }}>
                    <div className="w-full aspect-square bg-white p-[5%] rounded-xl border-[3px] shadow-2xl flex items-center justify-center" style={{ borderColor: templateColor }}>
                      <QRCode value={accountLink || 'https://bicol-u.edu.ph'} style={{ height: "100%", maxWidth: "100%", width: "100%" }} fgColor="#0d0e12" bgColor="#FFFFFF" />
                    </div>
                    <div className="w-full flex items-center justify-start bg-neutral-900 p-[1.5cqw] pl-[2.5cqw] pr-[4cqw] rounded-lg border-[2px]" style={{ borderColor: templateColor }}>
  <img src="/tsa.svg" alt="TSA Logo" className="w-[4.5cqw] h-[4.5cqw] object-contain shrink-0 mr-[2cqw]" />
  <div className="text-left leading-none flex-1">
    <div className="text-[1.4cqw] font-black tracking-wider text-amber-400">TECHSYSTEMS</div>
    <div className="text-[0.9cqw] font-black tracking-widest text-white mt-0.5">ASSOCIATION</div>
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
                          {username || 'USERNAME'}
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
                {/* Background Image Layer */}
                {backgroundImage && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={backgroundImage}
                      alt="Background"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${bgImagePosition.x}px, ${bgImagePosition.y}px) scale(${bgImageZoom / 100}) rotate(${bgImageRotation}deg)`,
                        opacity: bgImageOpacity / 100,
                        transformOrigin: 'center',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="border-[2px] aspect-square rounded-xs" style={{ borderColor: templateColor }} />
                    ))}
                  </div>
                </div>

                <div className="z-10 space-y-4 bg-neutral-950/90 p-[4cqw] rounded-2xl border-[3px]" style={{ borderColor: templateColor }}>
                  <div
                    className="w-[14cqw] h-[14cqw] mx-auto drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                    style={{
                      backgroundColor: templateColor,
                      WebkitMaskImage: 'url(/nfc.svg)',
                      maskImage: 'url(/nfc.svg)',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                    }}
                  />
                  <div>
                    <div className="text-[5.5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: templateColor }}>BICOL UNIVERSITY</div>
                    <div className="text-[2.6cqw] font-black tracking-[0.5em] uppercase text-white mt-3">POLANGUI</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <p className="text-[11px] text-neutral-400 mt-6 text-center italic">MAKE SURE THAT ALL OF THE INFORMATION YOU PROVIDE ARE TRUE AND CORRECT</p>

          {/* Design Save Slots Section */}
          <div className="w-full mt-8 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Save size={16} className="text-orange-600" /> Design Save Slots
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {designSlots.map((slot, index) => (
                <div
                  key={index}
                  className="bg-neutral-50 border-2 border-neutral-300 rounded-xl p-4 hover:border-orange-400 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Slot {index + 1}
                    </span>
                    {slot && (
                      <span className="text-[10px] text-neutral-400">
                        {new Date(slot.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {slot ? (
                    <div className="space-y-2">
                      <div className="flex gap-1 mb-2">
                        <div
                          className="w-6 h-6 rounded border border-neutral-300"
                          style={{ backgroundColor: slot.bgColor }}
                          title="Background Color"
                        />
                        <div
                          className="w-6 h-6 rounded border border-neutral-300"
                          style={{ backgroundColor: slot.templateColor }}
                          title="Template Color"
                        />
                        <div
                          className="w-6 h-6 rounded border border-neutral-300"
                          style={{ backgroundColor: slot.textColor }}
                          title="Text Color"
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-neutral-700 truncate">
                        {slot.fullName || 'No Name'}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => loadDesignFromSlot(index)}
                          className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition cursor-pointer uppercase tracking-wider"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDesignFromSlot(index)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-neutral-400 italic">Empty slot</p>
                      <button
                        type="button"
                        onClick={() => saveDesignToSlot(index)}
                        className="w-full px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-bold rounded-lg transition cursor-pointer uppercase tracking-wider"
                      >
                        Save Current Design
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Background Image Adjustment Modal */}
      {showBgImageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Adjust Background Image</h3>
              <button
                type="button"
                onClick={() => setModalIsShowingBack(!modalIsShowingBack)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition cursor-pointer uppercase tracking-wider border border-neutral-600"
              >
                {modalIsShowingBack ? 'Show Front' : 'Show Back'}
              </button>
            </div>
            
            {/* Preview Area */}
            <div 
              className="w-full aspect-[1.586/1] rounded-xl overflow-hidden border-2 border-neutral-700 mb-4 relative cursor-move bg-neutral-950 @container"
              onMouseDown={handleModalBgImageMouseDown}
              onMouseMove={handleModalBgImageMouseMove}
              onMouseUp={handleModalBgImageMouseUp}
              onMouseLeave={handleModalBgImageMouseUp}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {/* Background Image Layer */}
              {tempBgImage && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={tempBgImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${tempBgImagePosition.x}px, ${tempBgImagePosition.y}px) scale(${tempBgImageZoom / 100}) rotate(${tempBgImageRotation}deg)`,
                      opacity: tempBgImageOpacity / 100,
                      transformOrigin: 'center',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}

              {/* Front Face */}
              {modalIsShowingBack ? null : (
                <div className="absolute inset-0 z-10 p-[4cqw] flex flex-col justify-between pointer-events-none">
                  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${templateColor} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                    <div className="absolute top-[1.5cqw] right-[1.5cqw] w-[22cqw] h-[22cqw] border-t-[3px] border-r-[3px]" style={{ borderColor: templateColor }} />
                    <div className="absolute bottom-[1.5cqw] left-[1.5cqw] w-[18cqw] h-[18cqw] border-b-[3px] border-l-[3px]" style={{ borderColor: templateColor }} />
                    <div className="absolute top-1/2 left-[28%] w-[45%] h-[2px] border-b-[2px] border-dashed animate-pulse" style={{ borderColor: templateColor }} />
                  </div>

                  <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw]" style={{ borderColor: templateColor }}>
                    <div className="flex items-center gap-[2cqw]">
                      <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: textColor }}>IDENTIFICATION BADGE</div>
                      <div className="px-[1.5cqw] py-[0.4cqw] text-[1.1cqw] font-black rounded bg-neutral-900 border-[2px] uppercase tracking-widest text-amber-400" style={{ borderColor: templateColor }}>SYS_SEC // AUTH</div>
                    </div>
                    <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: textColor }}>HEX_ID // 6F9A24EE</div>
                  </div>

                  <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible">
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
                        <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: textColor }}>Course / Program</span>
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
                            {username || 'USERNAME'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center border-t-[3px] pt-[1.5cqw] mt-[1cqw]" style={{ borderColor: templateColor }}>
                    <div className="text-[1.3cqw] tracking-[0.2em] font-black uppercase font-mono" style={{ color: textColor }}>Issued by: TECHSYSTEMS ASSOCIATION</div>
                    <div className="text-[1.2cqw] tracking-[0.25em] font-black uppercase font-mono" style={{ color: templateColor }}>HARDWARE NODE STATUS // ACTIVE</div>
                  </div>
                </div>
              )}

              {/* Back Face */}
              {modalIsShowingBack ? (
                <div className="absolute inset-0 z-10 p-[5cqw] flex flex-col items-center justify-center text-center pointer-events-none">
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
                      <div className="text-[5.5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: templateColor }}>BICOL UNIVERSITY</div>
                      <div className="text-[2.6cqw] font-black tracking-[0.5em] uppercase text-white mt-3">POLANGUI</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded z-20">
                Drag to adjust position
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Zoom Control */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1">
                  <ZoomIn size={12} /> Zoom ({tempBgImageZoom}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={tempBgImageZoom}
                  onChange={(e) => setTempBgImageZoom(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Opacity Control */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">
                  Opacity ({tempBgImageOpacity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tempBgImageOpacity}
                  onChange={(e) => setTempBgImageOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Rotation Control */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1">
                  <RotateCw size={12} /> Rotation ({tempBgImageRotation}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={tempBgImageRotation}
                  onChange={(e) => setTempBgImageRotation(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelBackgroundImage}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition cursor-pointer uppercase tracking-wider text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBackgroundImage}
                className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition cursor-pointer uppercase tracking-wider text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}