import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Building2,
  Home,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  User as UserIcon,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, AuditLog } from '../types';
// import { motion, AnimatePresence } from 'framer-motion';

interface AuditLogsProps {
  building: Building | null;
}

export default function AuditLogs({ building }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    entityType: 'all',
    actionType: 'all',
    searchTerm: ''
  });

  const fetchLogs = async () => {
    if (!building) return;
    setLoading(true);

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:performed_by (
          email
        )
      `)
      .eq('building_id', building.id)
      .order('created_at', { ascending: false });

    if (filters.entityType !== 'all') {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.actionType !== 'all') {
      query = query.eq('action_type', filters.actionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [building, filters.entityType, filters.actionType]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'building': return <Building2 size={16} />;
      case 'apartment': return <Home size={16} />;
      case 'payment': return <CreditCard size={16} />;
      default: return <History size={16} />;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'create': return <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100"><Plus size={12} /> Create</span>;
      case 'update': return <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-indigo-100"><Edit2 size={12} /> Update</span>;
      case 'delete': return <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-rose-100"><Trash2 size={12} /> Delete</span>;
      default: return null;
    }
  };

  const renderDiff = (oldData: any, newData: any) => {
    if (!oldData && !newData) return <p className="text-slate-400 italic">No data available</p>;

    const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]))
      .filter(key => !['id', 'created_at', 'updated_at', 'owner_id', 'building_id'].includes(key));
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Changes Overview</h4>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-slate-500">Field</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-500">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allKeys.map(key => {
                    const oldVal = oldData?.[key];
                    const newVal = newData?.[key];
                    const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                    return (
                      <tr key={key} className={isChanged ? 'bg-indigo-50/30' : ''}>
                        <td className="px-4 py-2 font-bold text-slate-400 capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {oldVal !== undefined && (
                              <span className={`text-slate-500 ${isChanged ? 'line-through opacity-50' : ''}`}>
                                {String(oldVal)}
                              </span>
                            )}
                            {isChanged && newVal !== undefined && (
                              <>
                                <ArrowRight size={12} className="text-slate-300" />
                                <span className="text-indigo-600 font-bold">{String(newVal)}</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Payload</h4>
            <div className="bg-slate-900 text-indigo-300 p-5 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed shadow-inner max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
              <pre>{JSON.stringify(newData || oldData, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Date', 'User', 'Entity', 'Action', 'Entity ID'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.profiles?.email || log.performed_by,
      log.entity_type,
      log.action_type,
      log.entity_id
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${building?.building_name || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const search = filters.searchTerm.toLowerCase();
    const email = (log.profiles?.email || '').toLowerCase();
    const entity = log.entity_type.toLowerCase();
    const action = log.action_type.toLowerCase();
    return email.includes(search) || entity.includes(search) || action.includes(search);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Logs</h2>
          <p className="text-slate-500 font-medium">Complete history of actions for {building?.building_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} />
            Export CSV
          </button>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full md:w-72 transition-all shadow-sm"
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-400">
              <Filter size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Type</span>
              <select 
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                value={filters.entityType}
                onChange={(e) => setFilters({...filters, entityType: e.target.value})}
              >
                <option value="all">All Entities</option>
                <option value="building">Buildings</option>
                <option value="apartment">Apartments</option>
                <option value="payment">Payments</option>
              </select>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</span>
              <select 
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                value={filters.actionType}
                onChange={(e) => setFilters({...filters, actionType: e.target.value})}
              >
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="w-12"></th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Loading Logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <History size={48} />
                      <span className="text-sm font-bold uppercase tracking-wider">No activity found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-slate-50/50 transition-all cursor-pointer group ${expandedRow === log.id ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="pl-4">
                        <div className={`p-1 rounded-md transition-colors ${expandedRow === log.id ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                          {expandedRow === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <UserIcon size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{log.profiles?.email?.split('@')[0] || 'System'}</span>
                            <span className="text-[10px] font-medium text-slate-400">{log.profiles?.email || 'automated@sandik.io'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-xl text-slate-500 border border-slate-200">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          <span className="text-sm font-black text-slate-700 capitalize tracking-tight">{log.entity_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {getActionBadge(log.action_type)}
                      </td>
                    </tr>
                    <div>
                      {expandedRow === log.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-none">
                            <div 
                              className="overflow-hidden bg-slate-50/50"
                            >
                              <div className="p-8 border-t border-slate-100">
                                {renderDiff(log.old_data, log.new_data)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
