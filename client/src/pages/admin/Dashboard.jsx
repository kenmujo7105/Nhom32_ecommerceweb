import { formatCurrency } from '../../utils/formatters';
import React, { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, Calendar, CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/stats?month=${selectedMonth}`);
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const columns = [
    { header: 'Order ID', field: 'id', className: 'font-medium text-slate-900' },
    { header: 'Customer', field: 'customer' },
    { header: 'Date', field: 'date' },
    { header: 'Total', render: (row) => <span className="font-medium">{formatCurrency(row.total)}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  const weeklyColumns = [
    { header: 'Week', field: 'week', className: 'font-medium text-slate-900' },
    { header: 'Revenue', render: (row) => <span className="font-medium text-emerald-600">{formatCurrency(row.total)}</span> }
  ];

  const dailyColumns = [
    { header: 'Date', field: 'date', className: 'font-medium text-slate-900' },
    { header: 'Revenue', render: (row) => <span className="font-medium text-emerald-600">{formatCurrency(row.total)}</span> }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-md border border-slate-300">
        <h2 className="text-xl font-bold text-slate-800">Dashboard Overview</h2>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Calendar size={18} className="text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">Select Month:</span>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-indigo-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Revenue (Selected Month)" 
          value={formatCurrency(stats?.revenue?.month || 0)} 
          icon={<TrendingUp size={24} />} 
          trend="Total" 
          trendUp={true} 
        />
        <StatCard 
          title="Average Daily Revenue" 
          value={formatCurrency(stats?.revenue?.averageDaily || 0)} 
          icon={<DollarSign size={24} />} 
          trend="Per Day" 
          trendUp={true} 
        />
        <StatCard 
          title="Total Products" 
          value={stats?.inventory?.totalProducts || 0} 
          icon={<Package size={24} />} 
          trend="" 
          trendUp={true} 
        />
      </div>

      {/* Order Status Cards */}
      <h2 className="text-lg font-semibold text-slate-800 pt-4">Orders by Status</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SmallCard title="Pending" value={stats?.ordersByStatus?.pending || 0} color="amber" />
        <SmallCard title="Processing" value={stats?.ordersByStatus?.processing || 0} color="blue" />
        <SmallCard title="Completed" value={stats?.ordersByStatus?.completed || 0} color="emerald" />
        <SmallCard title="Cancelled" value={stats?.ordersByStatus?.cancelled || 0} color="slate" />
        <SmallCard title="Low Stock" value={stats?.inventory?.lowStock || 0} color="rose" />
      </div>

      {/* New Revenue Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Weekly Revenue Breakdown</h2>
          </div>
          <DataTable 
            columns={weeklyColumns} 
            data={stats?.revenue?.weeklyRevenues || []} 
            keyField="week" 
          />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Daily Revenue Breakdown</h2>
          </div>
          <DataTable 
            columns={dailyColumns} 
            data={stats?.revenue?.dailyRevenues || []} 
            keyField="date" 
          />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
        </div>
        <DataTable 
          columns={columns} 
          data={stats?.recentOrders || []} 
          keyField="id" 
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-300">
      {React.cloneElement(icon, { size: 100 })}
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h3>
      <div className={`p-2 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end gap-3 relative z-10">
      <span className="text-3xl font-bold text-slate-800">{value}</span>
      <span className={`text-sm font-medium mb-1 ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const SmallCard = ({ title, value, color }) => {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-300',
  };
  
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} flex flex-col items-center justify-center text-center`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">{title}</span>
    </div>
  );
}

export default Dashboard;
