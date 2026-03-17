import React from 'react';
import { Bell, Info, AlertCircle, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      title: 'Payment Received',
      message: 'Your payment for March 2026 has been successfully processed.',
      time: '2 hours ago',
      type: 'success',
      icon: CheckCircle2
    },
    {
      id: 2,
      title: 'Building Maintenance',
      message: 'Elevator maintenance is scheduled for tomorrow between 10:00 AM and 12:00 PM.',
      time: '1 day ago',
      type: 'info',
      icon: Info
    },
    {
      id: 3,
      title: 'Monthly Meeting',
      message: 'The monthly building assembly will take place this Friday at 7:00 PM in the lobby.',
      time: '3 days ago',
      type: 'calendar',
      icon: Calendar
    },
    {
      id: 4,
      title: 'Late Payment Alert',
      message: 'Your payment for February 2026 is still pending. Please settle it as soon as possible.',
      time: '1 week ago',
      type: 'error',
      icon: AlertCircle
    }
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 text-emerald-600';
      case 'error': return 'bg-rose-50 text-rose-600';
      case 'info': return 'bg-blue-50 text-blue-600';
      case 'calendar': return 'bg-amber-50 text-amber-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 font-medium">Stay updated with your building's latest news.</p>
        </div>
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="flex gap-6">
              <div className={`p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform ${getIconColor(notif.type)}`}>
                <notif.icon size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900">{notif.title}</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notif.time}</span>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                <div className="pt-4 flex items-center gap-2 text-indigo-600 text-xs font-bold group-hover:gap-3 transition-all">
                  View Details <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-12 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold text-sm">You've reached the end of your notifications.</p>
      </div>
    </div>
  );
}
