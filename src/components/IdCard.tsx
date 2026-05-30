/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import QRCode from 'react-qr-code';

interface IdCardProps {
  data: {
    full_name: string;
    student_id: string;
    course: string;
    username: string;
    phone_number: string;
    account_link: string;
    card_bg_color?: string;
    card_template_color?: string;
    card_text_color?: string;
  };
  side: 'front' | 'back';
}

export const IdCard = React.forwardRef<HTMLDivElement, IdCardProps>(({ data, side }, ref) => {
  const bgColor = data.card_bg_color || '#0d0e12';
  const templateColor = data.card_template_color || '#38bdf8';
  const textColor = data.card_text_color || '#ffffff';

  return (
    <div
      ref={ref}
      style={{ backgroundColor: bgColor, borderColor: templateColor, color: textColor }}
      className="relative w-[500px] h-[315px] rounded-2xl border-2 p-6 overflow-hidden select-none shadow-2xl tracking-wider font-mono shrink-0"
    >
      {side === 'front' ? (
        <div className="w-full h-full flex flex-col justify-between relative">
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: templateColor }}>
            <span className="text-xs uppercase opacity-80 font-bold">Identification Badge</span>
            <span className="text-[9px] px-2 py-0.5 rounded border text-[7px]" style={{ borderColor: templateColor, color: templateColor }}>
              SYS_SEC // AUTH
            </span>
          </div>

          <div className="flex gap-4 items-center my-auto">
            <div className="p-2 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <QRCode value={data.account_link || 'https://google.com'} size={110} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div>
                <p className="text-[8px] uppercase opacity-60 m-0">Full Name // Owner</p>
                <h3 className="text-lg font-black uppercase truncate m-0" style={{ color: templateColor }}>
                  {data.full_name || 'Juan De La Cruz'}
                </h3>
              </div>
              <div>
                <p className="text-[8px] uppercase opacity-60 m-0">Course / Program</p>
                <p className="text-xs uppercase font-bold truncate m-0 text-white">
                  {data.course || 'BS Information Technology'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-dashed border-gray-700">
                <div>
                  <p className="text-[7px] uppercase opacity-50 m-0">Student ID</p>
                  <p className="text-[10px] font-bold m-0" style={{ color: templateColor }}>{data.student_id || '0000-00-00000'}</p>
                </div>
                <div>
                  <p className="text-[7px] uppercase opacity-50 m-0">Username</p>
                  <p className="text-[10px] font-bold text-white uppercase m-0 truncate">{data.username || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[7px] opacity-60 pt-1 border-t" style={{ borderColor: templateColor }}>
            <span>ISSUED BY: TECHSYSTEMS ASSOCIATION</span>
            <span style={{ color: templateColor }}>NODE // ACTIVE</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center relative">
          <div className="absolute inset-0 opacity-10 grid grid-cols-8 grid-rows-4 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="border border-gray-500" />
            ))}
          </div>
          
          <div 
            className="relative z-10 border-2 rounded-2xl px-6 py-4 text-center max-w-[85%]"
            style={{ borderColor: templateColor, backgroundColor: bgColor }}
          >
            <div
              className="w-14 h-14 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]"
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
            <h2 className="text-xl font-black uppercase tracking-widest text-white m-0">
              Computer Studies
            </h2>
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold mt-1 opacity-80" style={{ color: templateColor }}>
              Department
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

IdCard.displayName = 'IdCard';
export default IdCard;