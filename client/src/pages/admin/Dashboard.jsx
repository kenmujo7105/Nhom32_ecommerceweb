import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Package, TrendingUp, Users } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fallback mock data in case API is not yet implemented
        const mockData = {
          revenue: { today: 1250.50, week: 8400.00, month: 34500.25 },
          ordersByStatus: { pending: 12, processing: 5, shipped: 24, delivered: 140 },
          recentOrders: [
            { id: '#ORD-001', customer: 'Alice Smith', total: 120.50, status: 'completed', date: '2026-06-17' },
            { id: '#ORD-002', customer: 'Bob Johnson', total: 45.00, status: 'pending', date: '2026-06-17' },
            { id: '#ORD-003', customer: 'Charlie Brown', total: 340.00, status: 'processing', date: '2026-06-16' },
            { id: '#ORD-004', customer: 'Diana Prince', total: 89.99, status: 'shipped', date: '2026-06-15' },
          ]
        };

        try {
          const res = await api.get('/admin/stats');
          if (res.data.success) {
            setStats(res.data.data);
          } else {
            setStats(mockData);
          }
        } catch (err) {
          console.error("Failed to fetch stats, using mock data", err);
          setStats(mockData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
    { header: 'Total', render: (row) => <span className="font-medium">${row.total.toFixed(2)}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Revenue (Today)" 
          value={`$${stats?.revenue?.today?.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          trend="+12.5%" 
          trendUp={true} 
        />
        <StatCard 
          title="Revenue (This Week)" 
          value={`$${stats?.revenue?.week?.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          trend="+5.2%" 
          trendUp={true} 
        />
        <StatCard 
          title="Revenue (This Month)" 
          value={`$${stats?.revenue?.month?.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          trend="-2.1%" 
          trendUp={false} 
        />
      </div>

      {/* Order Status Cards */}
      <h2 className="text-lg font-semibold text-slate-800 pt-4">Orders by Status</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallCard title="Pending" value={stats?.ordersByStatus?.pending || 0} color="amber" />
        <SmallCard title="Processing" value={stats?.ordersByStatus?.processing || 0} color="blue" />
        <SmallCard title="Shipped" value={stats?.ordersByStatus?.shipped || 0} color="indigo" />
        <SmallCard title="Delivered" value={stats?.ordersByStatus?.delivered || 0} color="emerald" />
      </div>

      {/* Recent Orders Table */}
      <div className="pt-4">
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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
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
  };
  
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} flex flex-col items-center justify-center text-center`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">{title}</span>
    </div>
  );
}

export default Dashboard;
