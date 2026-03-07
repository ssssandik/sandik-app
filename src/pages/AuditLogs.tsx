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
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, AuditLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
      case 'create': return <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase flex items-center gap-1"><Plus size={10} /> Create</span>;
      case 'update': return <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold uppercase flex items-center gap-1"><Edit2 size={10} /> Update</span>;
      case 'delete': return <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold uppercase flex items-center gap-1"><Trash2 size={10} /> Delete</span>;
      default: return null;
    }
  };

  const renderDiff = (oldData: any, newData: any) => {
    if (!oldData && !newData) return <p className="text-slate-400 italic">No data available</p>;

    const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-2">
          <p className="font-bold text-slate-400 uppercase tracking-widest mb-2">Old Data</p>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto">
            {oldData ? (
              <pre>{JSON.stringify(oldData, null, 2)}</pre>
            ) : (
              <p className="italic text-slate-500">None (Creation)</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-bold text-slate-400 uppercase tracking-widest mb-2">New Data</p>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto">
            {newData ? (
              <pre>{JSON.stringify(newData, null, 2)}</pre>
            ) : (
              <p className="italic text-slate-500">None (Deletion)</p>
            )}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-slate-500">Track all changes in {building?.building_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64"
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select 
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
              value={filters.entityType}
              onChange={(e) => setFilters({...filters, entityType: e.target.value})}
            >
              <option value="all">All Entities</option>
              <option value="building">Buildings</option>
              <option value="apartment">Apartments</option>
              <option value="payment">Payments</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="w-10"></th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-slate-50' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="pl-4">
                        {expandedRow === log.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <UserIcon size={14} className="text-slate-400" />
                          <span className="text-sm">{log.profiles?.email || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          <span className="text-sm font-semibold capitalize">{log.entity_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(log.action_type)}
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === log.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-none">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50/80"
                            >
                              <div className="p-8 border-t border-slate-100">
                                {renderDiff(log.old_data, log.new_data)}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
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
