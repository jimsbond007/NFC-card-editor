/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QRCode } from 'react-qr-code';
import { Download, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refs for tracking node elements for download generation
  const frontRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const backRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('card_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const downloadFace = async (id: string, face: 'front' | 'back', name: string) => {
    const targetNode = face === 'front' ? frontRefs.current[id] : backRefs.current[id];
    if (!targetNode) return;

    try {
      const dataUrl = await toPng(targetNode, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_${face}_design.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image file asset layout:', err);
    }
  };

  const getDynamicFontSize = (text: string, baseCqw: number, threshold: number) => {
    if (!text || text.length <= threshold) return `${baseCqw}cqw`;
    return `${(baseCqw * (threshold / text.length)).toFixed(2)}cqw`;
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
        <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2 text-amber-400">
          <ShieldCheck /> Techsystems Admin Control Center
        </h1>
        <button onClick={fetchRequests} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition text-sm flex items-center gap-2 font-bold cursor-pointer">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Request Queue
        </button>
      </div>

      {loading ? (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-500 my-12">Loading submission vectors...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-500 my-12">No pending student layouts found.</p>
      ) : (
        <div className="space-y-12">
          {requests.map((req) => (
            <div key={req.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              
              {/* Header Meta Metrics */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">{req.full_name || 'Anonymous Node'}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">ID: {req.student_id} | Program: {req.course}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadFace(req.id, 'front', req.full_name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-lg transition cursor-pointer uppercase tracking-wider"
                  >
                    <Download size={14} /> Download Front Image
                  </button>
                  <button 
                    onClick={() => downloadFace(req.id, 'back', req.full_name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black rounded-lg transition cursor-pointer uppercase tracking-wider border border-neutral-700"
                  >
                    <Download size={14} /> Download Back Image
                  </button>
                </div>
              </div>

              {/* Side-by-Side Dual-Face Viewports */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center justify-center w-full max-w-6xl mx-auto">
                
                {/* FRONT PREVIEW NODE */}
                <div className="w-full flex flex-col items-center gap-2">
                  <span className="text-[10px] tracking-widest text-neutral-500 font-bold uppercase">FRONT ASPECT VIEWPORT</span>
                  <div 
                    ref={el => { frontRefs.current[req.id] = el; }}
                    className="w-full aspect-[1.586/1] rounded-2xl border-[4px] p-[4cqw] flex flex-col justify-between overflow-hidden relative @container"
                    style={{ fontFamily: "'Orbitron', sans-serif", backgroundColor: req.card_bg_color || '#0d0e12', borderColor: req.card_template_color || '#38bdf8' }}
                  >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(${req.card_template_color || '#38bdf8'} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                    </div>

                    <div className="w-full flex justify-between items-center border-b-[3px] pb-[1.5cqw] z-10" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="text-[2cqw] font-black uppercase tracking-[0.25em]" style={{ color: req.card_text_color || '#ffffff' }}>IDENTIFICATION BADGE</div>
                      <div className="text-[1.2cqw] font-mono font-black tracking-widest" style={{ color: req.card_text_color || '#ffffff' }}>HEX_ID // 6F9A24EE</div>
                    </div>

                    <div className="w-full grid grid-cols-12 gap-[3cqw] items-stretch my-auto z-10">
                      <div className="col-span-4 flex flex-col items-center justify-center gap-[2cqw] border-r-[3px] pr-[2.5cqw]" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                        <div className="w-full aspect-square bg-white p-[5%] rounded-xl flex items-center justify-center">
                          <QRCode value={req.account_link || 'https://bicol-u.edu.ph'} style={{ height: "100%", maxWidth: "100%", width: "100%" }} fgColor="#0d0e12" bgColor="#FFFFFF" />
                        </div>
                      </div>

                      <div className="col-span-8 flex flex-col justify-between space-y-[2cqw] pl-[1cqw]">
                        <div>
                          <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: req.card_text_color || '#ffffff' }}>Full Name</span>
                          <span className="block font-black uppercase tracking-wide whitespace-nowrap leading-none" style={{ color: req.card_template_color || '#38bdf8', fontSize: getDynamicFontSize(req.full_name || '', 4.2, 14) }}>
                            {req.full_name || 'JUAN DELA CRUZ'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[1.3cqw] font-black uppercase tracking-[0.25em] mb-1" style={{ color: req.card_text_color || '#ffffff' }}>Course</span>
                          <span className="block font-black uppercase tracking-tight whitespace-nowrap leading-none" style={{ color: req.card_text_color || '#ffffff', fontSize: getDynamicFontSize(req.course || '', 3.2, 16) }}>
                            {req.course || 'BS COURSE'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-[2cqw] pt-[1.5cqw] border-t-[2px] border-dashed" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                          <div>
                            <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em]" style={{ color: req.card_text_color || '#ffffff' }}>Student ID</span>
                            <span className="block font-mono font-black text-[2.4cqw]" style={{ color: req.card_template_color || '#38bdf8' }}>{req.student_id}</span>
                          </div>
                          <div>
                            <span className="block text-[1.2cqw] font-black uppercase tracking-[0.2em]" style={{ color: req.card_text_color || '#ffffff' }}>Username</span>
                            <span className="block font-black text-[2.4cqw] uppercase" style={{ color: req.card_text_color || '#ffffff' }}>@{req.username || 'USER'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex justify-between items-center border-t-[3px] pt-[1.5cqw] z-10" style={{ borderColor: req.card_template_color || '#38bdf8' }}>
                      <div className="text-[1.3cqw] font-black uppercase font-mono" style={{ color: req.card_text_color || '#ffffff' }}>TECHSYSTEMS ASSOCIATION</div>
                      <div className="text-[1.2cqw] font-black uppercase font-mono" style={{ color: req.card_template_color || '#38bdf8' }}>NODE // ACTIVE</div>
                    </div>
                  </div>
                </div>

                {/* BACK PREVIEW NODE */}
                <div className="w-full flex flex-col items-center gap-2">
                  <span className="text-[10px] tracking-widest text-neutral-500 font-bold uppercase">BACK ASPECT VIEWPORT</span>
                  <div 
                    ref={el => { backRefs.current[req.id] = el; }}
                    className="w-full aspect-[1.586/1] rounded-2xl border-[4px] p-[5cqw] flex flex-col items-center justify-center text-center overflow-hidden relative @container"
                    style={{ fontFamily: "'Orbitron', sans-serif", backgroundColor: req.card_bg_color || '#0d0e12', borderColor: req.card_template_color || '#38bdf8' }}
                  >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <div className="absolute inset-0 grid grid-cols-8 gap-3 p-6 opacity-[0.15]">
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
    </div>
  );
}