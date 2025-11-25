import { ResponsiveContainer, BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, ReferenceLine } from 'recharts'

export default function ProgressChart({ data, perDay = 0, unit = 'units', accent = '#3b82f6', type = 'auto' }) {
  const safeData = Array.isArray(data) ? data : []
  const maxValue = Math.max(perDay || 0, ...(safeData.map((d) => Number(d.value) || 0)))
  const yMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 10
  const isLine = type === 'line' || (type === 'auto' && safeData.length >= 7)
  const maxXTicks = isLine ? 7 : safeData.length
  const step = Math.max(1, Math.ceil((safeData.length || 1) / Math.max(1, maxXTicks)))
  const ticks = safeData
    .map((d) => d.dateLabel)
    .filter((_, idx) => idx % step === 0)

  return (
    <div className="progress-chart" style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        {isLine ? (
          <LineChart data={safeData} margin={{ top: 16, right: 44, bottom: 12, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              ticks={ticks}
              interval={0}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis allowDecimals={false} domain={[0, yMax]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value) => [`${value} ${unit}`.trim(), 'Completed']}
              labelFormatter={(label) => label}
            />
            {perDay > 0 && (
              <ReferenceLine
                y={perDay}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: `Target (${perDay} ${unit})`, position: 'insideTopRight', fontSize: 12, fill: '#ef4444' }}
              />
            )}
            <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          </LineChart>
        ) : (
          <BarChart data={safeData} margin={{ top: 16, right: 44, bottom: 12, left: 12 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              interval={0}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis allowDecimals={false} domain={[0, yMax]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value) => [`${value} ${unit}`.trim(), 'Completed']}
              labelFormatter={(label) => label}
            />
            {perDay > 0 && (
              <ReferenceLine
                y={perDay}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: `Target (${perDay} ${unit})`, position: 'insideTopRight', fontSize: 12, fill: '#ef4444' }}
              />
            )}
            <Bar dataKey="value" fill={accent} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}


