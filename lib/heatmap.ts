export interface HeatmapDay {
  date: string;
  count: number;
  level: 'empty' | 'low' | 'medium' | 'high' | 'very-high';
}

export function generateHeatmapData(dailyLogs: Record<string, string>): HeatmapDay[] {
  const heatmap: HeatmapDay[] = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const keyExists = dateStr in dailyLogs;
    const logContent = dailyLogs[dateStr] || '';
    const count = logContent.split('\n').filter(line => line.trim()).length;
    
    let level: 'empty' | 'low' | 'medium' | 'high' | 'very-high' = 'empty';
    if (keyExists && count === 0) level = 'low';        // active day, no typed log
    else if (count >= 1 && count <= 2) level = 'low';
    else if (count >= 3 && count <= 4) level = 'medium';
    else if (count >= 5 && count <= 6) level = 'high';
    else if (count >= 7) level = 'very-high';
    
    heatmap.push({ date: dateStr, count: keyExists ? Math.max(count, 1) : 0, level });
  }
  
  return heatmap;
}

export function getHeatmapColor(level: string): string {
  const colors: Record<string, string> = {
    empty: '#1a1a2a',
    low: '#00d4ff33',
    medium: '#00d4ff66',
    high: '#00d4ffaa',
    'very-high': '#00d4ff',
  };
  return colors[level] || colors.empty;
}
