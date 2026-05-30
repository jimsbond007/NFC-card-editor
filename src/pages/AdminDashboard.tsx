/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { QRCode } from 'react-qr-code'; 
import { Download, Layers, ShieldCheck, RefreshCw, ArrowLeft, LogOut, Trash2, AlertTriangle, X } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Deletion Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState('');
  const [targetDeleteName, setTargetDeleteName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const triggerDeleteModal = (id: string, studentName: string) => {
    setTargetDeleteId(id);
    setTargetDeleteName(studentName);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setTargetDeleteId('');
    setTargetDeleteName('');
  };

  const confirmDeleteRequest = async () => {
    if (!targetDeleteId) return;
    setIsDeleting(true);

    // Give the animation an extra brief moment to cycle visibly
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const { error } = await supabase
        .from('card_requests')
        .delete()
        .eq('id', targetDeleteId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== targetDeleteId));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Failed to clear target request vector:', err);
      alert(`Error deleting record: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans relative">
      
      {/* Global CSS Style tag injection for realistic lid rotation */}
      <style>{`
        @keyframes trash-lid-chomp {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-20deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-5px) rotate(-10deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-trash-lid {
          animation: trash-lid-chomp 0.5s ease-in-out infinite;
        }
      `}</style>

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
                  
                  <button 
                    onClick={() => triggerDeleteModal(req.id, req.full_name)}
                    className="p-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900 text-red-400 rounded-lg transition cursor-pointer"
                    title="Delete Request File"
                  >
                    <Trash2 size={15} />
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
                    {/* Background Image Layer */}
                    {req.background_image && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={req.background_image}
                          alt="Background"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `translate(${req.bg_image_position_x || 0}px, ${req.bg_image_position_y || 0}px) scale(${(req.bg_image_zoom || 100) / 100}) rotate(${req.bg_image_rotation || 0}deg)`,
                            opacity: (req.bg_image_opacity || 100) / 100,
                            transformOrigin: 'center',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${req.card_template_color || '#38bdf8'} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                      <div className="absolute top-[1.5cqw] right-[1.5cqw] w-[22cqw] h-[22cqw] border-t-[3px] border-r-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                      <div className="absolute bottom-[1.5cqw] left-[1.5cqw] w-[18cqw] h-[18cqw] border-b-[3px] border-l-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                      <div className="absolute top-1/2 left-[28%] w-[45%] h-[2px] border-b-[2px] border-dashed animate-pulse" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                    </div>

                    <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw] z-10" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="flex items-center gap-[2cqw]">
                        <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: req.card_text_color || '#ffffff' }}>IDENTIFICATION BADGE</div>
                        <div className="px-[1.5cqw] py-[0.4cqw] text-[1.1cqw] font-black rounded bg-neutral-900 border-[2px] uppercase tracking-widest text-amber-400" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                          SYS_SEC // AUTH
                        </div>
                      </div>
                      <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: req.card_text_color || '#ffffff' }}>HEX_ID // 6F9A24EE</div>
                    </div>

                    <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto overflow-visible z-10">
                      
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
                    {/* Background Image Layer */}
                    {req.background_image && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={req.background_image}
                          alt="Background"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `translate(${req.bg_image_position_x || 0}px, ${req.bg_image_position_y || 0}px) scale(${(req.bg_image_zoom || 100) / 100}) rotate(${req.bg_image_rotation || 0}deg)`,
                            opacity: (req.bg_image_opacity || 100) / 100,
                            transformOrigin: 'center',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
                        {Array.from({ length: 32 }).map((_, i) => (
                          <div key={i} className="border-[2px] aspect-square rounded-xs" style={{ borderColor: req.card_template_color || '#38bdf8' }} />
                        ))}
                      </div>
                    </div>

                    <div className="z-10 space-y-4 bg-neutral-950/90 p-[4cqw] rounded-2xl border-[3px]" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div
                        className="w-[14cqw] h-[14cqw] mx-auto drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                        style={{
                          backgroundColor: req.card_template_color || '#38bdf8',
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

      {/* CUSTOM ANIMATED MODAL BACKDROP CONTAINER */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          
          <div className="bg-neutral-950 border-2 border-red-900/60 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden font-sans transform scale-100 transition-transform duration-300">
            
            <button 
              disabled={isDeleting}
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white rounded-lg transition disabled:opacity-30 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* ACTION-TRIGGERED ANIMATED TRASH BIN NODES */}
            <div className="flex flex-col items-center justify-center mt-3 mb-4">
              <div className="w-16 h-16 bg-red-950/40 border border-red-900/40 rounded-full flex flex-col items-center justify-center relative overflow-visible shadow-inner">
                
                {/* Trash Lid Component: Triggers 'animate-trash-lid' styling dynamic when state shifts to true */}
                <svg 
                  className={`w-7 h-2 text-red-500 fill-current origin-bottom-right mb-[2px] transition-transform duration-300 ${isDeleting ? 'animate-trash-lid' : 'group-hover:rotate-6'}`} 
                  viewBox="0 0 28 8"
                >
                  <path d="M2 6h24v2H2zM9 2h10v2H9z" />
                </svg>
                
                {/* Trash Base Container */}
                <svg 
                  className="w-6 h-7 text-red-500 fill-current" 
                  viewBox="0 0 24 28"
                >
                  <path d="M4 4h16l-2 22H6L4 4zm4 4v14h2V8H8zm4 0v14h2V8h-2zm4 0v14h2V8h-2z" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base font-black text-white tracking-wider uppercase flex items-center justify-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Confirm Data Removal
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                You are performing an un-doable action. This will wipe out <span className="text-red-400 font-bold uppercase">{targetDeleteName || 'this student'}</span>'s card configuration layout metrics from the queue database.
              </p>
            </div>

            {/* Confirmation Controls Tray */}
            <div className="grid grid-cols-2 gap-3 mt-6 border-t border-neutral-900 pt-4">
              <button
                disabled={isDeleting}
                onClick={closeDeleteModal}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold rounded-lg transition cursor-pointer uppercase tracking-wider disabled:opacity-40"
              >
                Abort Action
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDeleteRequest}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition shadow-md shadow-red-950/50 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Shredding...
                  </>
                ) : (
                  'Purge Record'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}