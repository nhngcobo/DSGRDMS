import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useT } from '../hooks/useT';
import { fetchDashboardSummary } from '../services/dashboardApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './Dashboard.css';

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
        <text 
            x={x} 
            y={y} 
            fill="#4b5563" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central" 
            fontSize={12} 
            fontFamily="Open Sans" 
            fontWeight={300}
        >
            {`${name}: ${value}%`}
        </text>
    );
}

export default function Dashboard() {
    const t = useT();
    const td = t.dashboard;
    const { showError } = useNotification();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardSummary()
            .then(data => setSummary(data))
            .catch(err => {
                showError(friendlyError(err));
                setSummary(null);
            })
            .finally(() => setLoading(false));
    }, [showError]);

    const pieData = [
        { name: td.pieLabels.lowRisk,    value: summary?.lowRiskPercent ?? 0, color: '#10b981' },
        { name: td.pieLabels.mediumRisk, value: summary?.mediumRiskPercent ?? 0, color: '#f59e0b' },
        { name: td.pieLabels.highRisk,   value: summary?.highRiskPercent ?? 0, color: '#ef4444' },
    ];

    const pendingTasks = [
        // Pending tasks will be loaded from API in the future
    ];

    const statCards = [
        { title: td.statCards.totalGrowers,        value: loading ? '—' : String(summary?.totalGrowers  ?? 0), change: td.statCards.totalGrowersChange,    positive: true,  icon: Users },
        { title: td.statCards.pendingApplications, value: loading ? '—' : String(summary?.pendingCount  ?? 0), change: td.statCards.pendingAppChange,      positive: null,  icon: Clock },
        { title: td.statCards.approvedGrowers,     value: loading ? '—' : String(summary?.verifiedCount ?? 0), change: td.statCards.approvedGrowersChange, positive: true,  icon: ShieldCheck },
        { title: td.statCards.highRisk,            value: loading ? '—' : String(summary?.highRiskCount ?? 0), change: td.statCards.highRiskChange,        positive: false, icon: AlertTriangle },
    ];

    const barData = summary?.monthlyRegistrations ?? [];
    const recentApplications = summary?.recentApplications ?? [];

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="dashboard">
            <div className="dashboard-topbar">
                <span className="dashboard-date">{today}</span>
            </div>

            <div className="dashboard-header">
                <h1>{td.title}</h1>
                <p>{td.subtitle}</p>
            </div>

            {/* Stat cards */}
            <div className="stat-grid">
                {statCards.map(({ title, value, change, positive, icon: Icon }) => (
                    <div className="stat-card" key={title}>
                        <div className="stat-card-body">
                            <div>
                                <div className="stat-title">{title}</div>
                                <div className="stat-value">{value}</div>
                                <div className={
                                    'stat-change ' +
                                    (positive === true ? 'positive' : positive === false ? 'negative' : 'neutral')
                                }>
                                    {change}
                                </div>
                            </div>
                            <div className="stat-icon">
                                <Icon size={22} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="charts-row">
                <div className="chart-card">
                    <h2 className="chart-title">{td.charts.monthlyRegistrations}</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={barData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Open Sans' }}
                                cursor={{ fill: 'rgba(66, 100, 104, 0.05)' }}
                            />
                            <Bar dataKey="registrations" fill="#426468" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h2 className="chart-title">{td.charts.riskDistribution}</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="value"
                                labelLine={false}
                                label={renderPieLabel}
                            >
                                {pieData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(v) => `${v}%`}
                                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'Open Sans' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom row */}
            <div className="bottom-row">
                <div className="list-card">
                    <div className="list-card-header">
                        <h2 className="chart-title">{td.recentApplications.title}</h2>
                        <a href="/applications" className="view-all">{td.recentApplications.viewAll}</a>
                    </div>
                    <div className="app-list">
                        {recentApplications.map(({ id, name, status }) => (
                            <div className="app-row" key={id}>
                                <div>
                                    <div className="app-name">{name}</div>
                                    <div className="app-id">{td.recentApplications.idPrefix}{id}</div>
                                </div>
                                <span className={`badge badge-${status.replace(' ', '-')}`}>{status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="list-card">
                    <div className="list-card-header">
                        <h2 className="chart-title">{td.pendingTasks.title}</h2>
                        <a href="/field-tasks" className="view-all">{td.pendingTasks.viewAll}</a>
                    </div>
                    <div className="app-list">
                        {pendingTasks.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                                No pending tasks
                            </div>
                        ) : (
                            pendingTasks.map(({ label, due, priority }) => (
                                <div className="app-row" key={label}>
                                    <div>
                                        <div className="app-name">{label}</div>
                                        <div className="app-id">Due: {due}</div>
                                    </div>
                                    <span className={`badge badge-priority-${priority}`}>{priority}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
