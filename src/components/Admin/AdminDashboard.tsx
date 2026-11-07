import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  Navigation,
  Sliders,
  Wallet,
  Map,
  FileText,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  UserCheck,
  Check,
  X,
  RefreshCw,
  MapPin,
  Edit3,
  UserPlus,
  FolderPlus,
  Headphones,
  MessageSquare,
  CheckCircle2,
  PhoneCall,
  FileCheck,
  Tag,
} from 'lucide-react';
import {
  CityZone,
  Client,
  Complaint,
  Driver,
  NegotiationSettings,
  Trip,
  WalletTransaction,
  SupportDepartment,
  SupportOfficer,
} from '../../types';
import { meshwarStore } from '../../services/storage';

interface AdminDashboardProps {
  apiKey: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ apiKey }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'drivers' | 'clients' | 'trips' | 'negotiation' | 'wallet' | 'zones' | 'complaints'
  >('overview');

  const [drivers, setDrivers] = useState<Driver[]>(meshwarStore.getDrivers());
  const [clients, setClients] = useState<Client[]>(meshwarStore.getClients());
  const [trips, setTrips] = useState<Trip[]>(meshwarStore.getTrips());
  const [settings, setSettings] = useState<NegotiationSettings>(meshwarStore.getSettings());
  const [zones, setZones] = useState<CityZone[]>(meshwarStore.getZones());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(meshwarStore.getTransactions());
  const [complaints, setComplaints] = useState<Complaint[]>(meshwarStore.getComplaints());
  const [departments, setDepartments] = useState<SupportDepartment[]>(meshwarStore.getDepartments());
  const [officers, setOfficers] = useState<SupportOfficer[]>(meshwarStore.getSupportOfficers());

  // Search & Filters
  const [driverSearch, setDriverSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedDriverForDoc, setSelectedDriverForDoc] = useState<Driver | null>(null);

  // Complaints Department & Officer State (تعيين قسم الشكاوى وتعيين المسؤولين)
  const [complaintsSubTab, setComplaintsSubTab] = useState<'list' | 'officers' | 'departments'>('list');
  const [complaintFilterDept, setComplaintFilterDept] = useState<string>('all');
  const [complaintFilterStatus, setComplaintFilterStatus] = useState<string>('all');

  // Modal 1: Assign Complaint to Officer & Department
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Modal 2: Add Support Officer
  const [showAddOfficerModal, setShowAddOfficerModal] = useState<boolean>(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRole, setNewOfficerRole] = useState('مشرف متابعة شكاوى');
  const [newOfficerDeptId, setNewOfficerDeptId] = useState('dept_safety');
  const [newOfficerPhone, setNewOfficerPhone] = useState('010');
  const [newOfficerEmail, setNewOfficerEmail] = useState('');

  // Modal 3: Add Follow-up Log / Action
  const [loggingComplaint, setLoggingComplaint] = useState<Complaint | null>(null);
  const [logOfficerName, setLogOfficerName] = useState('');
  const [logAction, setLogAction] = useState('تواصل هاتفي مع الشاكي');
  const [logNote, setLogNote] = useState('');
  const [logNewStatus, setLogNewStatus] = useState<Complaint['status']>('in_review');

  // Modal 4: Add Support Department
  const [showAddDeptModal, setShowAddDeptModal] = useState<boolean>(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptSla, setNewDeptSla] = useState<number>(4);

  // Client Profile Edit Modal (تعيين اسم وصورة المستخدم من قبل الإدارة)
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientAvatar, setEditClientAvatar] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');

  // Sync state
  useEffect(() => {
    const unsub = meshwarStore.subscribe(() => {
      setDrivers(meshwarStore.getDrivers());
      setClients(meshwarStore.getClients());
      setTrips(meshwarStore.getTrips());
      setSettings(meshwarStore.getSettings());
      setZones(meshwarStore.getZones());
      setTransactions(meshwarStore.getTransactions());
      setComplaints(meshwarStore.getComplaints());
      setDepartments(meshwarStore.getDepartments());
      setOfficers(meshwarStore.getSupportOfficers());
    });
    return unsub;
  }, []);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalDrivers = drivers.length;
    const onlineDrivers = drivers.filter((d) => d.isOnline).length;
    const pendingDrivers = drivers.filter((d) => d.status === 'pending_verification').length;
    const totalClients = clients.length;
    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === 'completed').length;
    const cancelledTrips = trips.filter((t) => t.status === 'cancelled').length;
    const negotiatingTrips = trips.filter((t) => t.status === 'negotiating').length;

    const totalRevenue = trips
      .filter((t) => t.status === 'completed' && t.agreedPrice)
      .reduce((sum, t) => sum + (t.agreedPrice || 0), 0);

    const platformCommission = trips
      .filter((t) => t.status === 'completed' && t.platformCommission)
      .reduce((sum, t) => sum + (t.platformCommission || 0), 0);

    return {
      totalDrivers,
      onlineDrivers,
      pendingDrivers,
      totalClients,
      totalTrips,
      completedTrips,
      cancelledTrips,
      negotiatingTrips,
      totalRevenue,
      platformCommission,
    };
  }, [drivers, clients, trips]);

  // Export report as CSV helper
  const handleExportCSV = (type: 'trips' | 'drivers' | 'financial') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'trips') {
      csvContent += 'TripID,Client,Driver,Status,Price_EGP,Commission_EGP,Distance_Km,Date\n';
      trips.forEach((t) => {
        csvContent += `${t.id},${t.clientName},${t.driverName || 'N/A'},${t.status},${t.agreedPrice || t.clientInitialPrice},${t.platformCommission},${t.distanceKm},${t.createdAt}\n`;
      });
    } else if (type === 'financial') {
      csvContent += 'TxID,User,Type,Amount_EGP,Method,Status,Date\n';
      transactions.forEach((tx) => {
        csvContent += `${tx.id},${tx.userName},${tx.type},${tx.amount},${tx.method || 'cash'},${tx.status},${tx.createdAt}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meshwar_report_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
            مـ
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              لوحة التحكم المركزية – مشوار Meshwar
            </h1>
            <p className="text-[11px] text-slate-400">
              إدارة منظومة النقل الذكي المصري • جمهورية مصر العربية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>السيرفر متصل: النظام يعمل بكفاءة 100%</span>
          </div>
          <button
            onClick={() => meshwarStore.resetToDefaults()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition"
            title="إعادة تعيين البيانات التجريبية"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">إعادة ضبط البيانات</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar Tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/95 border-l border-slate-800 flex flex-col p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'لوحة المعلومات الرئيسية', icon: LayoutDashboard },
            { id: 'trips', label: 'إدارة وتتبع الرحلات', icon: Navigation, count: metrics.negotiatingTrips },
            { id: 'drivers', label: 'إدارة السائقين والمستندات', icon: Car, count: metrics.pendingDrivers },
            { id: 'clients', label: 'إدارة العملاء والركاب', icon: Users },
            { id: 'negotiation', label: 'محرك ونظام التفاوض', icon: Sliders },
            { id: 'wallet', label: 'شحن رصيد العمولات', icon: Wallet },
            { id: 'zones', label: 'المدن والمحافظات والتسعير', icon: Map },
            { id: 'complaints', label: 'الشكاوى والدعم الفني', icon: AlertTriangle, count: complaints.filter(c => c.status === 'open').length },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      active ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 mt-auto">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>حساب مدير النظام (Admin)</span>
              </div>
              <div>الصلاحيات: تحكم كامل بالمنصة والتسعيرة والعمولات.</div>
            </div>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
                  <div className="text-xs text-slate-400">إجمالي السائقين</div>
                  <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
                    <span>{metrics.totalDrivers}</span>
                    <Car className="w-5 h-5 text-emerald-400 opacity-60" />
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {metrics.onlineDrivers} متصل الآن للعمل
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
                  <div className="text-xs text-slate-400">إجمالي العملاء</div>
                  <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
                    <span>{metrics.totalClients}</span>
                    <Users className="w-5 h-5 text-teal-400 opacity-60" />
                  </div>
                  <div className="text-[10px] text-slate-400">نشطين في مختلف المحافظات</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
                  <div className="text-xs text-slate-400">إجمالي إيرادات الرحلات</div>
                  <div className="text-2xl font-black text-amber-400 font-mono flex items-center justify-between">
                    <span>{metrics.totalRevenue} ج.م</span>
                    <DollarSign className="w-5 h-5 text-amber-400 opacity-60" />
                  </div>
                  <div className="text-[10px] text-slate-400">من الرحلات المكتملة</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
                  <div className="text-xs text-slate-400">عمولة منصة مشوار (12.5%)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono flex items-center justify-between">
                    <span>{metrics.platformCommission} ج.م</span>
                    <TrendingUp className="w-5 h-5 text-emerald-400 opacity-60" />
                  </div>
                  <div className="text-[10px] text-emerald-400">أرباح المنصة الصافية</div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">رحلات مكتملة</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{metrics.completedTrips}</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500/40" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">رحلات ملغاة</div>
                    <div className="text-lg font-bold text-rose-400 font-mono">{metrics.cancelledTrips}</div>
                  </div>
                  <XCircle className="w-5 h-5 text-rose-500/40" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">سائقون قيد الفحص</div>
                    <div className="text-lg font-bold text-amber-400 font-mono">{metrics.pendingDrivers}</div>
                  </div>
                  <FileText className="w-5 h-5 text-amber-500/40" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">طلبات تفاوض نشطة</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{metrics.negotiatingTrips}</div>
                  </div>
                  <Activity className="w-5 h-5 text-emerald-500/40 animate-pulse" />
                </div>
              </div>

              {/* Quick Actions & Export Banner */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">تصدير التقارير الرسمية</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تنزيل كشوفات الحسابات والرحلات وسجلات السائقين بصيغة Excel / CSV.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportCSV('trips')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>تقرير الرحلات</span>
                  </button>
                  <button
                    onClick={() => handleExportCSV('financial')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>التقرير المالي</span>
                  </button>
                </div>
              </div>

              {/* Recent Trips Table */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">آخر الرحلات المسجلة في النظام</h3>
                  <button
                    onClick={() => setActiveTab('trips')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    عرض كل الرحلات
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">رقم الرحلة</th>
                        <th className="p-3">العميل</th>
                        <th className="p-3">الكابتن</th>
                        <th className="p-3">من - إلى</th>
                        <th className="p-3">السعر المتفق عليه</th>
                        <th className="p-3">العمولة</th>
                        <th className="p-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {trips.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-slate-300">#{t.id.slice(-6)}</td>
                          <td className="p-3 text-slate-200">{t.clientName}</td>
                          <td className="p-3 text-slate-200">{t.driverName || 'قيد التفاوض'}</td>
                          <td className="p-3 text-slate-400">
                            {t.pickup.name} ← {t.dropoff.name}
                          </td>
                          <td className="p-3 font-mono font-bold text-amber-400">
                            {t.agreedPrice || t.clientInitialPrice} ج.م
                          </td>
                          <td className="p-3 font-mono text-emerald-400">{t.platformCommission} ج.م</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : t.status === 'negotiating'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {t.status === 'completed'
                                ? 'مكتملة'
                                : t.status === 'negotiating'
                                ? 'تفاوض جاري'
                                : t.status === 'cancelled'
                                ? 'ملغاة'
                                : 'نشطة'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVERS & DOCUMENT APPROVAL */}
          {activeTab === 'drivers' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">إدارة السائقين وتدقيق المستندات</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    مراجعة بطاقة الرقم القومي ورخص القيادة والفيش الجنائي وفحص ناسيتا قبل التفعيل.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                    <input
                      type="text"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      placeholder="بحث باسم الكابتن أو رقم الهاتف..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Drivers Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers
                  .filter((d) => d.name.includes(driverSearch) || d.phone.includes(driverSearch))
                  .map((drv) => (
                    <div
                      key={drv.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={drv.avatar}
                            alt={drv.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{drv.name}</span>
                              <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.2 rounded font-mono">
                                ★ {drv.rating || 'جديد'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 dir-ltr text-right">
                              {drv.phone}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              انضم: {drv.joinedDate}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            drv.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : drv.status === 'pending_verification'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {drv.status === 'active'
                            ? 'معتمد ونشط'
                            : drv.status === 'pending_verification'
                            ? 'قيد الفحص'
                            : 'معلق'}
                        </span>
                      </div>

                      {/* Vehicle Details */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">السيارة:</span>
                          <span className="font-semibold text-slate-200">
                            {drv.vehicle.nameAr} - {drv.vehicle.model}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">رقم اللوحة:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {drv.vehicle.plateNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">اللون وسنة الصنع:</span>
                          <span className="text-slate-300">
                            {drv.vehicle.color} ({drv.vehicle.year})
                          </span>
                        </div>
                      </div>

                      {/* Driver Wallet Balance & Editable Topup (ويكون التعديل متاح) */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">رصيد محفظة الكابتن:</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {drv.walletBalance.toFixed(2)} ج.م
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newBalStr = prompt(`تعديل رصيد الكابتن ${drv.name} (ج.م):`, drv.walletBalance.toString());
                            if (newBalStr !== null) {
                              const newBal = parseFloat(newBalStr);
                              if (!isNaN(newBal)) {
                                meshwarStore.updateDriverBalance(drv.id, newBal, 'تعديل يدوي من إدارة مشوار');
                                alert(`تم تحديث رصيد الكابتن ${drv.name} إلى ${newBal.toFixed(2)} ج.م بنجاح!`);
                              }
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                          <span>تعديل الرصيد ✏️</span>
                        </button>
                      </div>

                      {/* Document Status Badges */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-300 flex justify-between">
                          <span>المستندات القانونية ({drv.documents.length}):</span>
                          <button
                            onClick={() => setSelectedDriverForDoc(drv)}
                            className="text-emerald-400 hover:underline text-[10px]"
                          >
                            تدقيق وفحص المستندات
                          </button>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {drv.documents.map((doc) => (
                            <span
                              key={doc.id}
                              className={`text-[9px] px-2 py-0.5 rounded ${
                                doc.status === 'approved'
                                  ? 'bg-emerald-950/80 text-emerald-400'
                                  : doc.status === 'pending'
                                  ? 'bg-amber-950/80 text-amber-400 animate-pulse'
                                  : 'bg-rose-950/80 text-rose-400'
                              }`}
                            >
                              {doc.titleAr.slice(0, 15)}.. ({doc.status === 'approved' ? '✓' : '⌛'})
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1 border-t border-slate-800">
                        {drv.status !== 'active' ? (
                          <button
                            onClick={() => {
                              meshwarStore.approveAndActivateDriver(drv.id);
                              alert(`تم قبول جميع مستندات وتفعيل الكابتن ${drv.name} بنجاح! يمكنه الآن استقبال الرحلات.`);
                            }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>قبول المستندات وتفعيل الكابتن ✅</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => meshwarStore.updateDriverStatus(drv.id, 'suspended')}
                            className="flex-1 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>إيقاف مؤقت</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">إدارة العملاء والركاب</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    متابعة حسابات المستخدمين، الأرصدة، وسجل المشاوير، والتقييمات.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="بحث باسم العميل أو الموبايل..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">العميل</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">إجمالي الرحلات</th>
                      <th className="p-3">التقييم</th>
                      <th className="p-3">رصيد المحفظة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {clients
                      .filter((c) => c.name.includes(clientSearch) || c.phone.includes(clientSearch))
                      .map((cli) => (
                        <tr key={cli.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={cli.avatar}
                              alt={cli.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700"
                            />
                            <span className="font-bold text-slate-200">{cli.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-300 dir-ltr text-right">{cli.phone}</td>
                          <td className="p-3 font-mono text-slate-300">{cli.totalTrips}</td>
                          <td className="p-3 font-mono text-amber-400">★ {cli.rating}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{cli.walletBalance} ج.م</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cli.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {cli.status === 'active' ? 'نشط' : 'محظور'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingClient(cli);
                                  setEditClientName(cli.name);
                                  setEditClientAvatar(cli.avatar);
                                  setEditClientPhone(cli.phone);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
                                title="تعيين وتعديل اسم وصورة المستخدم"
                              >
                                <Edit3 className="w-3 h-3 text-cyan-400" />
                                <span>تعديل الملف</span>
                              </button>

                              {cli.status === 'active' ? (
                                <button
                                  onClick={() => meshwarStore.updateClientStatus(cli.id, 'blocked')}
                                  className="text-rose-400 hover:underline text-[11px]"
                                >
                                  حظر
                                </button>
                              ) : (
                                <button
                                  onClick={() => meshwarStore.updateClientStatus(cli.id, 'active')}
                                  className="text-emerald-400 hover:underline text-[11px]"
                                >
                                  فك الحظر
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TRIPS LIVE MANAGEMENT */}
          {activeTab === 'trips' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">إدارة ومراقبة الرحلات</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    متابعة فورية للمسارات، العروض المتبادلة في التفاوض، وتدخل الإدارة عند الحاجة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">#{t.id}</span>
                        <div className="text-xs font-bold text-white mt-1">
                          العميل: {t.clientName} ({t.clientPhone})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          الكابتن:{' '}
                          <span className="text-slate-200">
                            {t.driverName ? `${t.driverName} (${t.driverPhone})` : 'قيد التفاوض واختيار العرض'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                          t.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : t.status === 'negotiating'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            : t.status === 'cancelled'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-teal-950 text-teal-400 border border-teal-800'
                        }`}
                      >
                        {t.status === 'completed'
                          ? 'مكتملة'
                          : t.status === 'negotiating'
                          ? 'قيد التفاوض المباشر'
                          : t.status === 'cancelled'
                          ? 'ملغاة'
                          : 'نشطة حالياً'}
                      </span>
                    </div>

                    {/* Route Details */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[10px]">نقطة الركوب: </span>
                          <span className="text-slate-200">{t.pickup.name}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[10px]">الوجهة: </span>
                          <span className="text-slate-200">{t.dropoff.name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>المسافة: {t.distanceKm} كم</span>
                        <span>الزمن التقديري: {t.estimatedMinutes} دقيقة</span>
                        <span>المركبة: {t.vehicleCategory}</span>
                      </div>
                    </div>

                    {/* Negotiation Audit Log */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-slate-400 text-[10px]">سعر العميل المبدئي: </span>
                        <span className="font-mono text-slate-300 font-bold">{t.clientInitialPrice} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">السعر المتفق عليه: </span>
                        <span className="font-mono text-amber-400 font-bold">
                          {t.agreedPrice || t.clientInitialPrice} ج.م
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">العمولة: </span>
                        <span className="font-mono text-emerald-400 font-bold">{t.platformCommission} ج.م</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {t.status === 'negotiating' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => meshwarStore.advanceTripStatus(t.id, 'cancelled', 'إلغاء إداري لدواعي فنية', 'admin')}
                          className="flex-1 text-xs py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition"
                        >
                          إلغاء الطلب من الإدارة
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NEGOTIATION ENGINE SETTINGS */}
          {activeTab === 'negotiation' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-base font-bold text-white">إعدادات محرك التفاوض والمزايدة العكسية</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  التحكم في قيود الأسعار، حدود الكيلومتر، مدة استقبال العروض، ونسبة العمولة.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center justify-between mb-1.5">
                      <span>سعر الكيلومتر الأساسي (ج.م/كم)</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        محدد حالياً: {settings.standardPricePerKm || 8} ج.م
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.standardPricePerKm || 8.0}
                      onChange={(e) =>
                        setSettings({ ...settings, standardPricePerKm: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      التسعيرة المعتمدة لكل كيلومتر مسافة (مثلاً 8.0 جنيه)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white flex items-center justify-between mb-1.5">
                      <span>الحد الأدنى لطلب المشوار (أقل أجرة)</span>
                      <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                        محدد حالياً: {settings.minTripFare || 20} ج.م
                      </span>
                    </label>
                    <input
                      type="number"
                      value={settings.minTripFare || 20}
                      onChange={(e) =>
                        setSettings({ ...settings, minTripFare: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      لا يمكن لأي عميل أو رحلة أن تقل تكلفتها عن هذا المبلغ (20 ج.م)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      الحد الأدنى لسعر الكيلومتر (ج.م)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.minPricePerKm}
                      onChange={(e) =>
                        setSettings({ ...settings, minPricePerKm: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      يمنع العميل من تقديم أسعار مجحفة تضر بالسائق
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      الحد الأقصى لسعر الكيلومتر (ج.م)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.maxPricePerKm}
                      onChange={(e) =>
                        setSettings({ ...settings, maxPricePerKm: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      يحمي الركاب من المغالاة والتلاعب بالأسعار
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      نسبة عمولة منصة مشوار (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.platformCommissionPercent}
                      onChange={(e) =>
                        setSettings({ ...settings, platformCommissionPercent: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      تخصم تلقائياً من رصيد الكابتن أو مدفوعات الرحلة
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      مهلة استقبال عروض الكباتن (بالثواني)
                    </label>
                    <input
                      type="number"
                      value={settings.biddingWindowSeconds}
                      onChange={(e) =>
                        setSettings({ ...settings, biddingWindowSeconds: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      المدة المتاحة للسائقين قبل إعادة توجيه الطلب
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white flex items-center justify-between mb-1.5">
                      <span>أقصى نسبة تفاوض / زيادة مسموح بها (%)</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        محدد حالياً: {settings.maxNegotiationPercent || 60}%
                      </span>
                    </label>
                    <input
                      type="number"
                      value={settings.maxNegotiationPercent || 60}
                      onChange={(e) =>
                        setSettings({ ...settings, maxNegotiationPercent: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      أقصى نسبة مسموحة لزيادة السعر في التفاوض (مثلاً 60% كحد أقصى)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      أقصى عدد عروض مسموح بها لكل رحلة
                    </label>
                    <input
                      type="number"
                      value={settings.maxBidsAllowedPerTrip}
                      onChange={(e) =>
                        setSettings({ ...settings, maxBidsAllowedPerTrip: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      نطاق البحث الجغرافي للطلب (كم)
                    </label>
                    <input
                      type="number"
                      value={settings.searchRadiusKm}
                      onChange={(e) =>
                        setSettings({ ...settings, searchRadiusKm: +e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={settings.preventBiddingBelowSuggested}
                        onChange={(e) =>
                          setSettings({ ...settings, preventBiddingBelowSuggested: e.target.checked })
                        }
                        className="accent-emerald-500 w-4 h-4"
                      />
                      <span className="font-bold text-emerald-400">
                        ممنوع النزول في السعر المقترح (إلزام العميل والكابتن بالسعر العادل ومزايدة لأعلى فقط)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={settings.isNegotiationEnabled}
                        onChange={(e) =>
                          setSettings({ ...settings, isNegotiationEnabled: e.target.checked })
                        }
                        className="accent-emerald-500 w-4 h-4"
                      />
                      <span>تفعيل ميزة التفاوض والمزايدة العكسية</span>
                    </label>
                  </div>

                  <button
                    onClick={() => {
                      meshwarStore.saveSettings(settings);
                      alert('تم حفظ إعدادات محرك التفاوض بنجاح!');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COMMISSION BALANCE & TOPUPS */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h2 className="text-base font-bold text-white">إدارة شحن وسداد عمولات المنصة</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  جميع المشاوير تُدفع نقداً (كاش) مباشرة في يد الكابتن. يقتصر رصيد الحساب على سداد عمولة المنصة المخصومة تلقائياً، وشحن الرصيد عبر فوري والمحافظ الإلكترونية.
                </p>
              </div>

              {/* Transactions Table */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">رقم المعاملة</th>
                      <th className="p-3">المستخدم</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">الوسيلة / كود التحويل</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono text-slate-400">#{tx.id.slice(-6)}</td>
                        <td className="p-3 font-bold text-slate-200">{tx.userName}</td>
                        <td className="p-3 text-slate-300">
                          {tx.type === 'commission_deduct'
                            ? 'خصم عمولة مشوار'
                            : tx.type === 'topup'
                            ? 'شحن رصيد عمولة'
                            : 'معاملة مالية'}
                        </td>
                        <td
                          className={`p-3 font-mono font-bold ${
                            tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ج.م
                        </td>
                        <td className="p-3 font-mono text-slate-400">{tx.referenceId || tx.method || 'فوري / محفظة'}</td>
                        <td className="p-3 text-slate-400 font-mono">{tx.createdAt.slice(0, 16)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {tx.status === 'completed' ? 'معتمد ومنفذ' : 'قيد المراجعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: EGYPTIAN ZONES & PRICING */}
          {activeTab === 'zones' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">إدارة المدن والمحافظات المصرية والتسعير</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تحديد سعر فتح العداد لكل محافظة (القاهرة، الجيزة، الإسكندرية، الدلتا) ومضاعف الذروة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">{zone.nameAr}</h3>
                        <span className="text-[11px] text-slate-400">{zone.governorateAr} • {zone.nameEn}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          zone.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {zone.isActive ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">فتح عداد (اقتصادي):</span>
                        <span className="font-mono text-slate-200">{zone.baseFareEconomy} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">فتح عداد (سيدان):</span>
                        <span className="font-mono text-slate-200">{zone.baseFareSedan} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">فتح عداد (موتوسيكل):</span>
                        <span className="font-mono text-slate-200">{zone.baseFareMotorcycle} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">سعر الكيلومتر الموصى به:</span>
                        <span className="font-mono font-bold text-emerald-400">{zone.perKmRate} ج.م/كم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">معامل الذروة (Surge):</span>
                        <span className="font-mono text-amber-400">{zone.surgeMultiplier}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: COMPLAINTS, DEPARTMENTS & SUPPORT OFFICERS */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header with Title and Quick Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-emerald-400" />
                    <span>منظومة الشكاوى والدعم الفني وتعيين المسؤولين</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    إدارة وتعيين أقسام الشكاوى، توزيع المسؤولين، ومتابعة تسوية البلاغات لحظياً.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOfficerModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ تعيين مسؤول متابعة جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddDeptModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ إضافة قسم شكاوى</span>
                  </button>
                </div>
              </div>

              {/* Complaints Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400">إجمالي الشكاوى</div>
                  <div className="text-2xl font-black text-white font-mono">{complaints.length}</div>
                  <div className="text-[10px] text-slate-500">من الركاب والسائقين</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40 space-y-1">
                  <div className="text-[11px] text-amber-400">شكاوى مفتوحة (بحاجة لمسؤول)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {complaints.filter((c) => c.status === 'open').length}
                  </div>
                  <div className="text-[10px] text-amber-500/80">تتطلب إسناد فوري</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-900/40 space-y-1">
                  <div className="text-[11px] text-cyan-400">قيد المتابعة مع المسؤولين</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {complaints.filter((c) => c.status === 'in_review').length}
                  </div>
                  <div className="text-[10px] text-slate-400">جارٍ حلها مع الأطراف</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/40 space-y-1">
                  <div className="text-[11px] text-emerald-400">شكاوى تم تسويتها بنجاح</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {complaints.filter((c) => c.status === 'resolved').length}
                  </div>
                  <div className="text-[10px] text-emerald-500/80">مغلقة مع تقرير حل</div>
                </div>
              </div>

              {/* Complaints Sub-navigation Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-xl p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setComplaintsSubTab('list')}
                  className={`flex-1 py-2 text-center rounded-lg transition ${
                    complaintsSubTab === 'list'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 قائمة الشكاوى ومتابعتها ({complaints.length})
                </button>
                <button
                  type="button"
                  onClick={() => setComplaintsSubTab('officers')}
                  className={`flex-1 py-2 text-center rounded-lg transition ${
                    complaintsSubTab === 'officers'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👥 مسؤولو متابعة الشكاوى ({officers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setComplaintsSubTab('departments')}
                  className={`flex-1 py-2 text-center rounded-lg transition ${
                    complaintsSubTab === 'departments'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏢 أقسام الشكاوى المعتمدة ({departments.length})
                </button>
              </div>

              {/* SUB-TAB 1: COMPLAINTS LIST WITH FILTERS & OFFICER ASSIGNMENT */}
              {complaintsSubTab === 'list' && (
                <div className="space-y-4">
                  {/* Filters Bar */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">تصفية حسب القسم:</span>
                      <select
                        value={complaintFilterDept}
                        onChange={(e) => setComplaintFilterDept(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="all">كل الأقسام</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">حالة الشكوى:</span>
                      <select
                        value={complaintFilterStatus}
                        onChange={(e) => setComplaintFilterStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="all">كل الحالات</option>
                        <option value="open">مفتوحة (بحاجة لمسؤول)</option>
                        <option value="in_review">قيد المراجعة والمتابعة</option>
                        <option value="resolved">تم الحل والتسوية</option>
                      </select>
                    </div>
                  </div>

                  {/* Complaints Cards */}
                  <div className="space-y-3">
                    {complaints
                      .filter((cmp) => {
                        if (complaintFilterDept !== 'all' && cmp.departmentId !== complaintFilterDept)
                          return false;
                        if (complaintFilterStatus !== 'all' && cmp.status !== complaintFilterStatus)
                          return false;
                        return true;
                      })
                      .map((cmp) => (
                        <div
                          key={cmp.id}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow"
                        >
                          {/* Card Top Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  cmp.complainantType === 'client'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {cmp.complainantType === 'client' ? 'شكوى راكب' : 'شكوى كابتن'}
                              </span>
                              <span className="text-xs font-bold text-white">{cmp.complainantName}</span>
                              {cmp.tripId && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({cmp.tripId})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {cmp.createdAt}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  cmp.status === 'resolved'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : cmp.status === 'in_review'
                                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                                }`}
                              >
                                {cmp.status === 'resolved'
                                  ? 'تم الحل ✅'
                                  : cmp.status === 'in_review'
                                  ? 'قيد المتابعة 🔄'
                                  : 'مفتوحة لم تعين ⚠️'}
                              </span>
                            </div>
                          </div>

                          {/* Subject & Details */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{cmp.subject}</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                              {cmp.details}
                            </p>
                          </div>

                          {/* Assignment & Department Badges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-slate-400 text-[11px]">القسم المختص:</span>
                              </div>
                              <span className="font-bold text-slate-200 text-xs">
                                {cmp.departmentName || 'لم يُحدد القسم'}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-slate-400 text-[11px]">المسؤول المتابع:</span>
                              </div>
                              <span className="font-bold text-emerald-300 text-xs">
                                {cmp.assignedOfficerName || '⚠️ لم يُعين مسؤول'}
                              </span>
                            </div>
                          </div>

                          {/* Officer Follow-up Logs / History */}
                          {cmp.logs && cmp.logs.length > 0 && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                                <span>سجل متابعة وإجراءات المسؤول:</span>
                              </div>
                              <div className="space-y-1.5">
                                {cmp.logs.map((log) => (
                                  <div
                                    key={log.id}
                                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-0.5"
                                  >
                                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                                      <span className="font-bold text-cyan-300">
                                        {log.officerName} • {log.action}
                                      </span>
                                      <span className="font-mono">{log.timestamp}</span>
                                    </div>
                                    <div className="text-slate-300">{log.note}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resolution Notes (if resolved) */}
                          {cmp.resolutionNotes && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300">
                              <strong className="block text-[11px] text-emerald-400 mb-0.5">
                                القرار النهائي وإجراء الإدارة:
                              </strong>
                              <span>{cmp.resolutionNotes}</span>
                            </div>
                          )}

                          {/* Action Buttons for Complaint */}
                          <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-800/80">
                            {/* Button: Assign / Reassign Officer */}
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningComplaint(cmp);
                                setSelectedOfficerId(cmp.assignedOfficerId || officers[0]?.id || '');
                                setSelectedDeptId(cmp.departmentId || departments[0]?.id || '');
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                              <span>
                                {cmp.assignedOfficerName ? 'تغيير المسؤول 👤' : 'تعيين مسؤول للمتابعة 👤'}
                              </span>
                            </button>

                            {/* Button: Add Follow-up Action / Note */}
                            {cmp.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLoggingComplaint(cmp);
                                  setLogOfficerName(cmp.assignedOfficerName || officers[0]?.name || 'مسؤول الدعم');
                                  setLogAction('تواصل هاتفي مع الشاكي');
                                  setLogNote('');
                                  setLogNewStatus('in_review');
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                <span>إضافة إجراء متابعة 📝</span>
                              </button>
                            )}

                            {/* Button: Resolve Complaint */}
                            {cmp.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const notes = prompt('اكتب ملاحظات حل الشكوى والإجراء المتخذ لإغلاقها:');
                                  if (notes) {
                                    meshwarStore.resolveComplaint(cmp.id, notes);
                                  }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تسوية الشكوى وتأكيد الحل</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: SUPPORT OFFICERS DIRECTORY */}
              {complaintsSubTab === 'officers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      قائمة المسؤولين والمشرفين المعتمدين لمتابعة شكاوى الركاب والسائقين
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddOfficerModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ تعيين مسؤول جديد</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {officers.map((off) => (
                      <div
                        key={off.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={off.avatar}
                              alt={off.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-slate-700"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{off.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    off.isActive
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {off.isActive ? 'نشط للعمل' : 'في إجازة'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">{off.role}</div>
                            </div>
                          </div>

                          <div className="text-left font-mono">
                            <span className="text-[10px] text-slate-500 block">الشكاوى الموكلة</span>
                            <span className="text-sm font-bold text-emerald-400">
                              {off.assignedComplaintsCount || 0} شكاوى
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">القسم المخصص:</span>
                            <span className="font-bold text-cyan-300">{off.departmentName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">الهاتف:</span>
                            <span className="font-mono text-slate-300">{off.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">البريد الإلكتروني:</span>
                            <span className="font-mono text-slate-400">{off.email}</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              meshwarStore.updateSupportOfficer({
                                ...off,
                                isActive: !off.isActive,
                              });
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                          >
                            {off.isActive ? 'تحويل لحالة إجازة' : 'تفعيل للعمل الآن'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: SUPPORT DEPARTMENTS DIRECTORY */}
              {complaintsSubTab === 'departments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      أقسام الشكاوى المتخصصة ومستويات اتفاقية الخدمة (SLA) في منصة مشوار
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddDeptModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ إضافة قسم جديد</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-cyan-400" />
                              <h4 className="text-xs font-bold text-white">{dept.nameAr}</h4>
                            </div>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                              SLA: {dept.slaHours} ساعة
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {dept.descriptionAr}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between items-center">
                          <span className="text-slate-500">المشرف المسؤول:</span>
                          <span className="font-bold text-emerald-400">
                            {dept.headOfficerName || 'إدارة الدعم المركزية'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Document Review Details for Driver */}
      {selectedDriverForDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedDriverForDoc(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <img
                src={selectedDriverForDoc.avatar}
                alt={selectedDriverForDoc.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <h3 className="text-base font-bold text-white">
                  فحص وتدقيق مستندات الكابتن: {selectedDriverForDoc.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDriverForDoc.phone} • {selectedDriverForDoc.vehicle.nameAr} ({selectedDriverForDoc.vehicle.plateNumber})
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {selectedDriverForDoc.documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">{doc.titleAr}</div>
                    <div className="text-[10px] text-slate-400">تاريخ الرفع: {doc.uploadedAt}</div>
                    <div className="mt-1">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        معاينة صورة المستند الأصلية ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        doc.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400'
                          : doc.status === 'pending'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {doc.status === 'approved' ? 'معتمد' : doc.status === 'pending' ? 'قيد التدقيق' : 'مرفوض'}
                    </span>
                    {doc.status !== 'approved' && (
                      <button
                        onClick={() => {
                          meshwarStore.updateDriverDocument(selectedDriverForDoc.id, doc.id, 'approved');
                          // update local selected state
                          setSelectedDriverForDoc((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  documents: prev.documents.map((d) =>
                                    d.id === doc.id ? { ...d, status: 'approved' } : d
                                  ),
                                }
                              : null
                          );
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        اعتماد المستند
                      </button>
                    )}
                    {doc.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          const reason = prompt('اذكر سبب رفض المستند لإبلاغ الكابتن:') || 'الصورة غير واضحة أو منتهية الصلاحية';
                          meshwarStore.updateDriverDocument(selectedDriverForDoc.id, doc.id, 'rejected', reason);
                          setSelectedDriverForDoc((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  documents: prev.documents.map((d) =>
                                    d.id === doc.id ? { ...d, status: 'rejected', rejectionReason: reason } : d
                                  ),
                                }
                              : null
                          );
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        رفض المستند
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Bulk Action: Approve all documents & activate driver immediately */}
            <div className="pt-4 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                الحالة العامة للكابتن:{' '}
                <strong className={selectedDriverForDoc.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedDriverForDoc.status === 'active' ? 'معتمد ومفعل للعمل ✅' : 'في انتظار المراجعة والاعتماد ⏳'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  meshwarStore.approveAndActivateDriver(selectedDriverForDoc.id);
                  setSelectedDriverForDoc((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: 'active',
                          documents: prev.documents.map((d) => ({ ...d, status: 'approved' })),
                        }
                      : null
                  );
                  alert('تم قبول كافة المستندات وتفعيل حساب الكابتن بنجاح!');
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>قبول كافة المستندات وتفعيل الكابتن للعمل فوراً ✅</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Client Profile by Admin (تعيين اسم وصورة المستخدم من قبل الإدارة) */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">تعيين اسم وصورة المستخدم (لوحة الإدارة)</h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-2 py-2">
              <img
                src={editClientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="Preview"
                className="w-20 h-20 rounded-full border-4 border-cyan-500/50 object-cover shadow-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                }}
              />
              <span className="text-[11px] text-slate-400">معاينة الصورة الحالية</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  اسم العميل المعين
                </label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="أدخل اسم العميل..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  رابط الصورة الشخصية (URL)
                </label>
                <input
                  type="url"
                  value={editClientAvatar}
                  onChange={(e) => setEditClientAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Quick Preset Avatars for Admin */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1.5">أو اختر صورة جاهزة من النظام:</span>
                <div className="flex gap-2">
                  {[
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
                    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
                  ].map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditClientAvatar(url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                        editClientAvatar === url ? 'border-cyan-400 scale-105' : 'border-slate-700 opacity-60'
                      }`}
                    >
                      <img src={url} alt={`preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="text"
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!editClientName.trim()) {
                    alert('يرجى إدخال اسم العميل');
                    return;
                  }
                  meshwarStore.updateClientProfile(
                    editingClient.id,
                    editClientName,
                    editClientAvatar,
                    editClientPhone
                  );
                  setClients(meshwarStore.getClients());
                  setEditingClient(null);
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
              >
                حفظ التعيين وتحديث حساب العميل
              </button>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Assign Officer & Department to Complaint (تعيين قسم الشكاوى والمسؤول) */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">إسناد وتعيين مسؤول متابعة الشكوى</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningComplaint(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-500 block text-[10px]">موضوع الشكوى:</span>
              <strong className="text-slate-200 block">{assigningComplaint.subject}</strong>
              <span className="text-slate-400 text-[11px] block">
                مقدم الشكوى: {assigningComplaint.complainantName} ({assigningComplaint.complainantType === 'client' ? 'عميل' : 'كابتن'})
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  تعيين القسم المختص
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr} (SLA: {d.slaHours} ساعة)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  تعيين المسؤول المتابع للشكوى
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} • {o.role} ({o.departmentName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!selectedOfficerId) {
                    alert('يرجى اختيار المسؤول');
                    return;
                  }
                  meshwarStore.assignComplaint(
                    assigningComplaint.id,
                    selectedOfficerId,
                    selectedDeptId
                  );
                  setComplaints(meshwarStore.getComplaints());
                  setOfficers(meshwarStore.getSupportOfficers());
                  setAssigningComplaint(null);
                  alert('تم إسناد الشكوى للمسؤول بنجاح وإشعاره للمتابعة!');
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                تأكيد إسناد الشكوى للمسؤول
              </button>
              <button
                type="button"
                onClick={() => setAssigningComplaint(null)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Support Officer (تعيين مسؤول شكاوى جديد) */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">تعيين مسؤول متابعة شكاوى جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  اسم المسؤول بالكامل
                </label>
                <input
                  type="text"
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="مثال: أ. أحمد رضوان"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  القسم التابع له
                </label>
                <select
                  value={newOfficerDeptId}
                  onChange={(e) => setNewOfficerDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  المسمى الوظيفي
                </label>
                <input
                  type="text"
                  value={newOfficerRole}
                  onChange={(e) => setNewOfficerRole(e.target.value)}
                  placeholder="مثال: مشرف جودة ومنازعات"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={newOfficerPhone}
                    onChange={(e) => setNewOfficerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newOfficerEmail}
                    onChange={(e) => setNewOfficerEmail(e.target.value)}
                    placeholder="officer@meshwar.eg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!newOfficerName.trim()) {
                    alert('يرجى إدخال اسم المسؤول');
                    return;
                  }
                  const dept = departments.find((d) => d.id === newOfficerDeptId);
                  const newOfficer: SupportOfficer = {
                    id: `off_${Date.now()}`,
                    name: newOfficerName.trim(),
                    role: newOfficerRole.trim() || 'مشرف متابعة شكاوى',
                    departmentId: newOfficerDeptId,
                    departmentName: dept?.nameAr || 'قسم الشكاوى والدعم',
                    phone: newOfficerPhone.trim() || '01000000000',
                    email: newOfficerEmail.trim() || 'support@meshwar.eg',
                    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`,
                    assignedComplaintsCount: 0,
                    isActive: true,
                    createdAt: new Date().toISOString().slice(0, 10),
                  };
                  meshwarStore.addSupportOfficer(newOfficer);
                  setOfficers(meshwarStore.getSupportOfficers());
                  setShowAddOfficerModal(false);
                  setNewOfficerName('');
                  alert('تم تعيين المسؤول الجديد بنجاح في المنظومة الإدارية!');
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                اعتماد وتعيين المسؤول
              </button>
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Complaint Follow-Up Action Log */}
      {loggingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">إضافة إجراء / تحديث متابعة</h3>
              </div>
              <button
                type="button"
                onClick={() => setLoggingComplaint(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  اسم المسؤول المنفذ للإجراء
                </label>
                <input
                  type="text"
                  value={logOfficerName}
                  onChange={(e) => setLogOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  نوع الإجراء المتخذ
                </label>
                <select
                  value={logAction}
                  onChange={(e) => setLogAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="تواصل هاتفي مع الشاكي">تواصل هاتفي مع الشاكي</option>
                  <option value="مراجعة مسار الرحلة والـ GPS">مراجعة مسار الرحلة والـ GPS</option>
                  <option value="التحقيق مع الكابتن هاتفياً">التحقيق مع الكابتن هاتفياً</option>
                  <option value="فحص تسعيرة العداد والمزايدة">فحص تسعيرة العداد والمزايدة</option>
                  <option value="إرسال إنذار رسمي وتنبيه">إرسال إنذار رسمي وتنبيه</option>
                  <option value="تأكيد العثور على المفقودات">تأكيد العثور على المفقودات</option>
                  <option value="تسوية ودية بين الطرفين">تسوية ودية بين الطرفين</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  تفاصيل وملاحظات المسؤول
                </label>
                <textarea
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="سجل ما تم في الاتصال أو نتيجة الفحص بدقة..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  تحديث حالة الشكوى
                </label>
                <select
                  value={logNewStatus}
                  onChange={(e) => setLogNewStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="in_review">قيد المراجعة والمتابعة المستمرة</option>
                  <option value="resolved">تم الحل والتسوية النهائية</option>
                  <option value="escalated">تصعيد للإدارة العليا</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!logNote.trim()) {
                    alert('يرجى كتابة تفاصيل الإجراء المتخذ');
                    return;
                  }
                  meshwarStore.addComplaintFollowUp(
                    loggingComplaint.id,
                    logOfficerName,
                    logAction,
                    logNote.trim(),
                    logNewStatus
                  );
                  setComplaints(meshwarStore.getComplaints());
                  setLoggingComplaint(null);
                  alert('تم تسجيل الإجراء في سجل الشكوى بنجاح!');
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                حفظ الإجراء وتحديث الحالة
              </button>
              <button
                type="button"
                onClick={() => setLoggingComplaint(null)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Add Support Department (إضافة قسم شكاوى جديد) */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">إضافة قسم شكاوى معتمد جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  اسم القسم باللغة العربية
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="مثال: قسم شكاوى الرحلات بين المحافظات"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  وصف مهام القسم ونطاق العمل
                </label>
                <textarea
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="اكتب اختصاصات هذا القسم والشكاوى الموجهة إليه..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    المشرف / رئيس القسم
                  </label>
                  <input
                    type="text"
                    value={newDeptHead}
                    onChange={(e) => setNewDeptHead(e.target.value)}
                    placeholder="مثال: أ. ياسر كمال"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    زمن الاستجابة SLA (ساعات)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={newDeptSla}
                    onChange={(e) => setNewDeptSla(+e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!newDeptName.trim()) {
                    alert('يرجى إدخال اسم القسم');
                    return;
                  }
                  const newDept: SupportDepartment = {
                    id: `dept_${Date.now()}`,
                    nameAr: newDeptName.trim(),
                    nameEn: 'Custom Support Department',
                    descriptionAr: newDeptDesc.trim() || 'قسم متخصص للتعامل مع الشكاوى',
                    headOfficerName: newDeptHead.trim() || 'إدارة الدعم',
                    slaHours: newDeptSla || 4,
                    color: 'cyan',
                    isActive: true,
                  };
                  meshwarStore.addDepartment(newDept);
                  setDepartments(meshwarStore.getDepartments());
                  setShowAddDeptModal(false);
                  setNewDeptName('');
                  setNewDeptDesc('');
                  alert('تمت إضافة قسم الشكاوى الجديد بنجاح!');
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                إضافة واعتماد القسم
              </button>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
