/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { QRCode } from 'react-qr-code'; // Fixed to match your Student Dashboard import style
import { Download, Layers, ShieldCheck, RefreshCw, ArrowLeft, LogOut } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refs for tracking node elements for download generation
  const frontRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const backRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('card_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setRequests(data);
    } catch (err) {
      console.error('Error syncing backend request arrays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleQueueRefresh = () => {
    setLoading(true);
    fetchRequests();
  };

  const downloadFace = async (id: string, face: 'front' | 'back', name: string) => {
    const targetNode = face === 'front' ? frontRefs.current[id] : backRefs.current[id];
    if (!targetNode) return;

    try {
      const dataUrl = await toPng(targetNode, { 
        cacheBust: true, 
        pixelRatio: 3,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: targetNode.offsetWidth + 'px',
          height: targetNode.offsetHeight + 'px'
        }
      });
      const link = document.createElement('a');
      link.download = `${(name || 'badge').replace(/\s+/g, '_')}_${face}_design.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image file asset layout:', err);
    }
  };

  // Synchronized dynamic typography equation from your student view
  const getDynamicFontSize = (text: string, baseCqw: number, threshold: number) => {
    if (!text || text.length <= threshold) return `${baseCqw}cqw`;
    const reductionFactor = threshold / text.length;
    const computedSize = Math.max(baseCqw * reductionFactor, baseCqw * 0.25); 
    return `${computedSize.toFixed(2)}cqw`;
  };

  const formatPhilippinePhone = (num: string) => {
    if (!num) return '';
    return num.trim().replace(/^09/, '');
  };

  const handleAdminLogout = async () => {
    const confirmExit = window.confirm("Terminate secure Administrator control session?");
    if (!confirmExit) return;
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      
      {/* Top Admin Controls Header Panel */}
      <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/student')}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
            title="Return to Student View"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2 text-amber-400">
            <ShieldCheck /> Admin Control Center
          </h1>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={handleQueueRefresh} 
            className="p-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition text-xs flex items-center gap-2 font-bold cursor-pointer uppercase tracking-wider"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Queue
          </button>
          <button 
            onClick={handleAdminLogout}
            className="p-2.5 bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 rounded-lg transition text-xs flex items-center gap-2 font-bold cursor-pointer uppercase tracking-wider"
          >
            <LogOut size={14} /> Close Session
          </button>
        </div>
      </div>

      {/* --- ADDED SAFETY SNIPPET STARTS HERE --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center my-24 gap-3 font-mono">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 tracking-widest uppercase">Syncing database vectors...</p>
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-2xl max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">No student layouts found in registry matrix.</p>
        </div>
      ) : (
        <div className="space-y-12 max-w-7xl mx-auto">
          {requests.map((req) => (
            <div key={req.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              
              {/* Header Meta Metrics */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">{req.full_name || 'NEW REGISTRANT'}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">ID: {req.student_id || 'PENDING ASSIGNMENT'} | Program: {req.course || 'NOT ASSIGNED'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadFace(req.id, 'front', req.full_name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-lg transition cursor-pointer uppercase tracking-wider"
                  >
                    <Download size={14} /> Export Front Aspect
                  </button>
                  <button 
                    onClick={() => downloadFace(req.id, 'back', req.full_name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black rounded-lg transition cursor-pointer uppercase tracking-wider border border-neutral-700"
                  >
                    <Download size={14} /> Export Back Aspect
                  </button>
                </div>
              </div>

              {/* Side-by-Side Dual-Face Viewports */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center justify-center w-full max-w-6xl mx-auto">
                
                {/* FRONT PREVIEW NODE */}
                <div className="w-full flex flex-col items-center gap-2 @container">
                  <span className="text-[10px] tracking-widest text-neutral-500 font-bold uppercase">FRONT ASPECT VIEWPORT</span>
                  <div 
                    ref={el => { frontRefs.current[req.id] = el; }}
                    className="w-full aspect-[1.586/1] rounded-2xl border-[4px] p-[4cqw] flex flex-col justify-between overflow-hidden relative @container select-none shadow-2xl"
                    style={{ fontFamily: "'Orbitron', sans-serif", backgroundColor: req.card_bg_color || '#0d0e12', borderColor: req.card_template_color || '#38bdf8' }}
                  >
                    {/* Synchronized Circuit Background Grid & Vector Accents */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${req.card_template_color || '#38bdf8'} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                      <div className="absolute top-[1.5cqw] right-[1.5cqw] w-[22cqw] h-[22cqw] border-t-[3px] border-r-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                      <div className="absolute bottom-[1.5cqw] left-[1.5cqw] w-[18cqw] h-[18cqw] border-b-[3px] border-l-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                      <div className="absolute top-1/2 left-[28%] w-[45%] h-[2px] border-b-[2px] border-dashed animate-pulse" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                    </div>

                    {/* Top Content Title Ribbon Header */}
                    <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw] z-10" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="flex items-center gap-[2cqw]">
                        <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: req.card_text_color || '#ffffff' }}>IDENTIFICATION BADGE</div>
                        <div className="px-[1.5cqw] py-[0.4cqw] text-[1.1cqw] font-black rounded bg-neutral-900 border-[2px] uppercase tracking-widest text-amber-400" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                          SYS_SEC // AUTH
                        </div>
                      </div>
                      <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: req.card_text_color || '#ffffff' }}>HEX_ID // 6F9A24EE</div>
                    </div>

                    {/* Core Infographic Segment Array Split */}
                    <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible z-10">
                      
                      {/* Left Block: QR Graphics and Emblem Footer Frame */}
                      <div className="col-span-4 flex flex-col items-center justify-center gap-[2cqw] border-r-[3px] pr-[2.5cqw]" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                        <div className="w-full aspect-square bg-white p-[5%] rounded-xl border-[3px] shadow-2xl flex items-center justify-center" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                          <QRCode value={String(req.account_link || 'https://bicol-u.edu.ph').trim()} style={{ height: "100%", maxWidth: "100%", width: "100%" }} fgColor="#0d0e12" bgColor="#FFFFFF" />
                        </div>
                        
                        <div className="w-full flex items-center justify-center gap-[1.5cqw] bg-neutral-900 p-[1.5cqw] rounded-lg border-[2px]" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                          <div className="w-[4cqw] h-[4cqw] rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-[2.2cqw] text-neutral-900 shadow-md">T</div>
                          <div className="text-left leading-none">
                            <div className="text-[1.2cqw] font-black tracking-wider text-amber-400">TECHSYSTEMS</div>
                            <div className="text-[0.8cqw] font-black tracking-widest text-white mt-1">ASSOCIATION</div>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Dynamic Identity Typography Trace Lines */}
                      <div className="col-span-8 flex flex-col justify-between space-y-[2cqw] pl-[1cqw] pr-[1cqw] overflow-visible">
                        <div className="w-full overflow-visible">
                          <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: req.card_text_color || '#ffffff' }}>Full Name // Owner</span>
                          <span className="block font-black uppercase tracking-wide whitespace-nowrap overflow-visible leading-none" style={{ color: req.card_template_color || '#38bdf8', fontSize: getDynamicFontSize(req.full_name || 'JUAN DELA CRUZ', 4.2, 14) }}>
                            {req.full_name || 'JUAN DELA CRUZ'}
                          </span>
                        </div>
                        
                        <div className="w-full overflow-visible">
                          <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: req.card_text_color || '#ffffff' }}>Course / Assignment Location</span>
                          <span className="block font-black uppercase tracking-tight whitespace-nowrap overflow-visible leading-none" style={{ color: req.card_text_color || '#ffffff', fontSize: getDynamicFontSize(req.course || 'BS COURSE/PROGRAM', 3.2, 16) }}>
                            {req.course || 'BS COURSE/PROGRAM'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-[2cqw] pt-[1.5cqw] border-t-[2px] border-dashed overflow-visible" style={{ borderColor: req.card_template_color ? req.card_template_color : '#38bdf8' }}>
                          <div className="overflow-visible space-y-[1.5cqw]">
                            <div className="overflow-visible">
                              <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: req.card_text_color || '#ffffff' }}>Student ID</span>
                              <span className="block font-mono font-black tracking-widest whitespace-nowrap overflow-visible leading-none" style={{ color: req.card_template_color || '#38bdf8', fontSize: getDynamicFontSize(req.student_id || '0000-00-000000', 2.8, 14) }}>
                                {req.student_id || '0000-00-000000'}
                              </span>
                            </div>
                            <div className="overflow-visible">
                              <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: req.card_text_color || '#ffffff' }}>Contact Number</span>
                              <span className="block font-mono font-black tracking-widest whitespace-nowrap overflow-visible leading-none text-[2.4cqw]" style={{ color: req.card_template_color || '#38bdf8' }}>
                                {req.phone_number ? `+63${formatPhilippinePhone(req.phone_number)}` : '+63948623020'}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-visible flex flex-col justify-start">
                            <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: req.card_text_color || '#ffffff' }}>USERNAME</span>
                            <span className="block font-black tracking-wider uppercase whitespace-nowrap overflow-visible leading-none" style={{ color: req.card_text_color || '#ffffff', fontSize: getDynamicFontSize(req.username || 'USERNAME', 2.8, 10) }}>
                              {req.username || 'USERNAME'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Ground Frame Border Info Panel */}
                    <div className="w-full flex justify-between items-center border-t-[3px] pt-[1.5cqw] mt-[1cqw] z-10" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="text-[1.3cqw] tracking-[0.2em] font-black uppercase font-mono" style={{ color: req.card_text_color || '#ffffff' }}>Issued by: TECHSYSTEMS ASSOCIATION</div>
                      <div className="text-[1.2cqw] tracking-[0.25em] font-black uppercase font-mono" style={{ color: req.card_template_color || '#38bdf8' }}>HARDWARE NODE STATUS // ACTIVE</div>
                    </div>
                  </div>
                </div>

                {/* BACK PREVIEW NODE */}
                <div className="w-full flex flex-col items-center gap-2 @container">
                  <span className="text-[10px] tracking-widest text-neutral-500 font-bold uppercase">BACK ASPECT VIEWPORT</span>
                  <div 
                    ref={el => { backRefs.current[req.id] = el; }}
                    className="w-full aspect-[1.586/1] rounded-2xl border-[4px] p-[5cqw] flex flex-col items-center justify-center text-center overflow-hidden relative @container select-none shadow-2xl"
                    style={{ fontFamily: "'Orbitron', sans-serif", backgroundColor: req.card_bg_color || '#0d0e12', borderColor: req.card_template_color || '#38bdf8' }}
                  >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
                        {Array.from({ length: 32 }).map((_, i) => (
                          <div key={i} className="border-[2px] aspect-square rounded-xs" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                        ))}
                      </div>
                    </div>

                    <div className="z-10 space-y-4 bg-neutral-950/90 p-[4cqw] rounded-2xl border-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="w-[14cqw] h-[14cqw] mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 flex items-center justify-center font-black text-[7cqw] text-neutral-900 border-[3px] shadow-2xl">T</div>
                      <div>
                        <div className="text-[5.5cqw] font-black tracking-[0.2em] uppercase leading-none" style={{ color: req.card_template_color || '#38bdf8' }}>COMPUTER STUDIES</div>
                        <div className="text-[2.6cqw] font-black tracking-[0.5em] uppercase text-white mt-3">DEPARTMENT</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}
      {/* --- ADDED SAFETY SNIPPET ENDS HERE --- */}

    </div>
  );
}