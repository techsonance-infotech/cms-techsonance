'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface PerformanceChartsProps {
  data: {
    attendanceHistory: { date: string, hours: number }[];
    reportHistory: { date: string, submitted: number }[];
    taskDistribution: { todo: number, in_progress: number, review: number, done: number };
  };
}

export function PerformanceCharts({ data }: PerformanceChartsProps) {
  const taskDistribution = data?.taskDistribution || { todo: 0, in_progress: 0, review: 0, done: 0 };
  const taskData = [
    { name: 'To Do', value: taskDistribution.todo, color: '#94a3b8' },
    { name: 'In Progress', value: taskDistribution.in_progress, color: '#3b82f6' },
    { name: 'Review', value: taskDistribution.review, color: '#a855f7' },
    { name: 'Done', value: taskDistribution.done, color: '#10b981' },
  ].filter(d => d.value > 0);

  const reportHistory = data?.reportHistory || [];
  const submittedCount = reportHistory.filter(d => Number(d.submitted) === 1).length;
  const missedCount = reportHistory.length - submittedCount;
  const consistencyRate = reportHistory.length > 0 ? Math.round((submittedCount / reportHistory.length) * 100) : 0;

  // Normalized bar values so every day (submitted or missed) has a visible, beautifully styled pillar
  const reportChartData = reportHistory.map(entry => ({
    ...entry,
    barValue: 1,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Work Consistency Chart */}
      <Card className="lg:col-span-2 overflow-hidden bg-card/50 backdrop-blur-sm border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Work Consistency</CardTitle>
          <CardDescription>Daily productive hours (Last 14 days)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.attendanceHistory}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={1}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorHours)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Distribution Pie Chart */}
      <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Task Status</CardTitle>
          <CardDescription>Productivity breakdown</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center pt-0">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs font-medium">
            {taskData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reporting Regularity Chart */}
      <Card className="lg:col-span-3 overflow-hidden bg-card/50 backdrop-blur-sm border-none shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg">Daily Update Regularity</CardTitle>
            <CardDescription>Check-in consistency (Last 14 days)</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span>Submitted: <strong className="text-foreground">{submittedCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
              <span>Missed: <strong className="text-foreground">{missedCount}</strong></span>
            </div>
            <div className="rounded-full bg-muted/80 border border-border/50 px-2.5 py-0.5 font-semibold text-foreground">
              {consistencyRate}% Regularity
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[200px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
              />
              <YAxis hide domain={[0, 1]} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.08)', radius: 6 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const isSubmitted = Number(item.submitted) === 1;
                    return (
                      <div className="bg-popover text-popover-foreground px-3 py-2 rounded-xl shadow-lg border border-border text-xs min-w-[120px]">
                        <p className="font-semibold text-foreground mb-1">{item.date}</p>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={`h-2 w-2 rounded-full ${isSubmitted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className={isSubmitted ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                            {isSubmitted ? "✓ Submitted" : "✗ Missed"}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="barValue" 
                radius={[6, 6, 0, 0]}
                animationDuration={1200}
                background={{ fill: 'rgba(241, 245, 249, 0.45)', radius: 6 }}
              >
                {reportChartData.map((entry, index) => {
                  const isSubmitted = Number(entry.submitted) === 1;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isSubmitted ? '#10b981' : '#f43f5e'} 
                      fillOpacity={isSubmitted ? 0.85 : 0.45}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface FinancialChartProps {
  data: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
}

export function FinancialRunRateChart({ data }: FinancialChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Financial Run Rate</CardTitle>
        <CardDescription>Revenue vs Expenses (Last 6 Months)</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
              itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
            />
            <Bar 
              dataKey="revenue" 
              name="Revenue" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            <Bar 
              dataKey="expenses" 
              name="Expenses" 
              fill="#f43f5e" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
