import { ShieldAlert, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-neutral-900 p-6 text-tech-white">
      <div className="max-w-6xl mx-auto bg-tech-black rounded-xl shadow-2xl p-6 flex justify-between items-center border border-tech-pink">
        <h1 className="text-2xl font-bold text-tech-white flex items-center gap-2">
          <ShieldAlert className="text-tech-pink" /> Techsystems Admin Dashboard
        </h1>
        <button className="bg-tech-pink text-tech-black p-2 rounded-full hover:bg-pink-400 transition">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}