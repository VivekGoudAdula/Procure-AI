/**
 * Admin Dashboard - ProcureAI Audit Trail System
 * 
 * HACKATHON STORY:
 * ProcureAI maintains complete procurement auditability.
 * Every procurement event, AI recommendation, escrow activity,
 * communication event, and supplier interaction is stored in an
 * immutable audit history.
 * 
 * This admin dashboard provides:
 * - Platform oversight and compliance monitoring
 * - Real-time audit trail visualization
 * - Module-based activity filtering
 * - Enterprise-grade security and transparency
 * 
 * This supports transparency, enterprise compliance, supplier
 * accountability, and future regulatory requirements.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import {
  Users,
  Building2,
  FileText,
  Lock,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  LogOut,
  TrendingUp,
  Database,
  CheckSquare,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface AdminStats {
  total_users: number;
  total_suppliers: number;
  total_procurement_transactions: number;
  total_escrows: number;
  total_settlements: number;
  total_audit_logs: number;
  recent_activity: number;
  module_counts: {
    authentication: number;
    procurement: number;
    escrow: number;
    ai: number;
    ratings: number;
    chat: number;
  };
  payment_stats?: {
    total_escrows_created: number;
    total_escrows_released: number;
    total_escrows_verified: number;
    total_escrows_in_progress: number;
    total_payment_amount: number;
    failed_transactions: number;
  };
  supplier_stats?: {
    total_suppliers_selected: number;
    unique_suppliers_count: number;
    total_procurement_value: number;
  };
}

interface AuditLog {
  _id: string;
  user_id: string;
  user_email: string;
  action: string;
  module: string;
  entity_type?: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

const Admin = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/stats`),
        axios.get(`${API_BASE_URL}/api/admin/audit-logs?limit=50`)
      ]);
      
      setStats(statsRes.data);
      setAuditLogs(logsRes.data.logs);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getActionIcon = (action: string) => {
    const actionIcons: Record<string, React.ReactNode> = {
      'LOGIN': <Users className="w-4 h-4" />,
      'REGISTRATION': <Users className="w-4 h-4" />,
      'SUPPLIER_SELECTED': <Building2 className="w-4 h-4" />,
      'ESCROW_CREATED': <Lock className="w-4 h-4" />,
      'ESCROW_VERIFIED': <CheckCircle className="w-4 h-4" />,
      'ESCROW_RELEASED': <CheckSquare className="w-4 h-4" />,
      'SUPPLIER_INTELLIGENCE_GENERATED': <Activity className="w-4 h-4" />,
      'SUPPLIER_RATED': <TrendingUp className="w-4 h-4" />,
      'MESSAGE_SENT': <Activity className="w-4 h-4" />,
      'PAYMENT_FAILED': <AlertCircle className="w-4 h-4" />,
      'PAYMENT_PROCESSED': <DollarSign className="w-4 h-4" />,
    };
    return actionIcons[action] || <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'LOGIN': 'bg-blue-100 text-blue-700',
      'REGISTRATION': 'bg-green-100 text-green-700',
      'SUPPLIER_SELECTED': 'bg-purple-100 text-purple-700',
      'ESCROW_CREATED': 'bg-yellow-100 text-yellow-700',
      'ESCROW_VERIFIED': 'bg-orange-100 text-orange-700',
      'ESCROW_RELEASED': 'bg-green-100 text-green-700',
      'SUPPLIER_INTELLIGENCE_GENERATED': 'bg-pink-100 text-pink-700',
      'SUPPLIER_RATED': 'bg-indigo-100 text-indigo-700',
      'MESSAGE_SENT': 'bg-cyan-100 text-cyan-700',
      'PAYMENT_FAILED': 'bg-red-100 text-red-700',
      'PAYMENT_PROCESSED': 'bg-emerald-100 text-emerald-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filterModule !== 'all' && log.module.toLowerCase() !== filterModule) return false;
    if (filterTime === 'today') {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }
    if (filterTime === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const logDate = new Date(log.timestamp);
      return logDate >= sevenDaysAgo;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">{stats?.total_users || 0}</div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Procurement Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">{stats?.total_procurement_transactions || 0}</div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Escrows In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">{stats?.payment_stats?.total_escrows_in_progress || 0}</div>
                <Lock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">{stats?.payment_stats?.total_escrows_released || 0}</div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Payment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">${stats?.payment_stats?.total_payment_amount?.toFixed(2) || '0.00'}</div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Platform audit trail with complete event tracking</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Modules</option>
                  <option value="authentication">Authentication</option>
                  <option value="procurement">Procurement</option>
                  <option value="escrow">Escrow</option>
                  <option value="ai">AI</option>
                  <option value="ratings">Ratings</option>
                  <option value="chat">Chat</option>
                </select>
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                </select>
                <Button variant="outline" size="sm" onClick={fetchAdminData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium">{log.user_email}</span>
                      </p>
                      {log.entity_id && (
                        <p className="text-xs text-slate-500">
                          Entity: {log.entity_type} - {log.entity_id}
                        </p>
                      )}
                      {log.details && (
                        log.details.supplier_name ||
                        log.details.product ||
                        log.details.final_price ||
                        log.details.amount ||
                        log.details.supplier_id ||
                        log.details.app_id ||
                        log.details.settlement_tx_id ||
                        log.details.quantity
                      ) && (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">Details:</p>
                          <div className="text-xs text-slate-600 space-y-1">
                            {log.details.supplier_name && (
                              <p>Supplier: {log.details.supplier_name}</p>
                            )}
                            {log.details.product && (
                              <p>Product: {log.details.product}</p>
                            )}
                            {log.details.final_price && (
                              <p>Final Price: ${log.details.final_price}</p>
                            )}
                            {log.details.amount && (
                              <p>Amount: ${log.details.amount}</p>
                            )}
                            {log.details.supplier_id && (
                              <p>Supplier ID: {log.details.supplier_id}</p>
                            )}
                            {log.details.app_id && (
                              <p>App ID: {log.details.app_id}</p>
                            )}
                            {log.details.settlement_tx_id && (
                              <p>Settlement TX: {log.details.settlement_tx_id}</p>
                            )}
                            {log.details.quantity && (
                              <p>Quantity: {log.details.quantity}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
