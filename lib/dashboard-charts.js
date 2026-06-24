(function initDashboardCharts(global) {
  const PALETTE = [
    '#ff6a00',
    '#138b53',
    '#0085f2',
    '#dc640a',
    '#833b08',
    '#a07868',
    '#ff9147',
    '#6b5348',
  ];

  const STATUS_COLORS = {
    open: '#0085f2',
    won: '#138b53',
    lost: '#dc640a',
    abandoned: '#a07868',
  };

  function isoWeekKeyToLocalDates(weekKey) {
    const match = String(weekKey).match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;

    const isoYear = Number(match[1]);
    const isoWeek = Number(match[2]);
    const jan4 = new Date(Date.UTC(isoYear, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

    const monday = new Date(mondayWeek1);
    monday.setUTCDate(mondayWeek1.getUTCDate() + (isoWeek - 1) * 7);

    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);

    return {
      monday: new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()),
      thursday: new Date(thursday.getUTCFullYear(), thursday.getUTCMonth(), thursday.getUTCDate()),
    };
  }

  function countMondayOfMonth(date) {
    let mondayCount = 0;
    for (let day = 1; day <= date.getDate(); day += 1) {
      if (new Date(date.getFullYear(), date.getMonth(), day).getDay() === 1) {
        mondayCount += 1;
      }
    }
    return mondayCount;
  }

  function formatWeekLabel(weekKey) {
    const dates = isoWeekKeyToLocalDates(weekKey);
    if (!dates) return String(weekKey).replace('-W', ' W');

    const monday = dates.monday;
    const month = monday.toLocaleDateString('da-DK', { month: 'short' })
      .replace('.', '')
      .replace(/^\w/u, (char) => char.toUpperCase());
    const weekInMonth = countMondayOfMonth(monday);
    return `${month} W${weekInMonth}`;
  }

  function formatMonthLabel(month) {
    const [year, monthNumber] = String(month).split('-');
    const date = new Date(Number(year), Number(monthNumber) - 1, 1);
    return date.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' });
  }

  function truncateLabel(label, max = 18) {
    const text = String(label);
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function getThemeColors(theme) {
    const isDark = theme === 'dark';
    return {
      text: isDark ? '#eef1f7' : '#0f172a',
      muted: isDark ? '#7d8597' : '#64748b',
      grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      border: isDark ? '#232833' : '#e2e8f0',
    };
  }

  function seriesFromRows(rows, labelKey, valueKey, labelFormatter) {
    return {
      labels: rows.map((row) => labelFormatter(row[labelKey])),
      values: rows.map((row) => Number(row[valueKey]) || 0),
    };
  }

  const CHART_DEFINITIONS = {
    weeklyRevenue: {
      title: 'Won Revenue (Weekly)',
      defaultType: 'area',
      format: 'currency',
      extract(data) {
        return seriesFromRows(data.weeklyRevenue || [], 'week', 'revenue', formatWeekLabel);
      },
    },
    monthlyRevenue: {
      title: 'Won Revenue (Monthly)',
      defaultType: 'area',
      format: 'currency',
      extract(data) {
        return seriesFromRows(data.monthlyRevenue || [], 'month', 'revenue', formatMonthLabel);
      },
    },
    weeklyLeads: {
      title: 'New Leads (Weekly)',
      defaultType: 'area',
      format: 'number',
      extract(data) {
        return seriesFromRows(data.weeklyLeads || [], 'week', 'count', formatWeekLabel);
      },
    },
    monthlyLeads: {
      title: 'New Leads (Monthly)',
      defaultType: 'area',
      format: 'number',
      extract(data) {
        return seriesFromRows(data.monthlyLeads || [], 'month', 'count', formatMonthLabel);
      },
    },
    conversionTrend: {
      title: 'Conversion Rate Trend',
      defaultType: 'line',
      format: 'percent',
      extract(data) {
        return seriesFromRows(data.monthlyConversion || [], 'month', 'rate', formatMonthLabel);
      },
    },
    statusBreakdown: {
      title: 'Opportunity Status',
      defaultType: 'doughnut',
      format: 'number',
      extract(data) {
        const breakdown = data.statusBreakdown || {};
        const labels = ['Open', 'Won', 'Lost', 'Abandoned'];
        const keys = ['open', 'won', 'lost', 'abandoned'];
        return {
          labels,
          values: keys.map((key) => Number(breakdown[key]) || 0),
          colors: keys.map((key) => STATUS_COLORS[key]),
        };
      },
    },
  };

  function formatTooltipValue(value, format) {
    const amount = Number(value) || 0;
    if (format === 'currency') {
      return `Dkr ${Math.round(amount).toLocaleString('da-DK')}`;
    }
    if (format === 'percent') {
      return `${amount.toFixed(1)}%`;
    }
    return Math.round(amount).toLocaleString('da-DK');
  }

  function resolveChartJsType(chartType) {
    if (chartType === 'area') return 'line';
    if (chartType === 'horizontalBar') return 'bar';
    return chartType;
  }

  function buildChartConfig(chartId, data, chartType, theme) {
    const definition = CHART_DEFINITIONS[chartId];
    if (!definition) return null;

    const extracted = definition.extract(data);
    if (!extracted.labels.length || extracted.values.every((value) => value === 0)) {
      return null;
    }

    const colors = getThemeColors(theme);
    const isCircular = ['pie', 'doughnut', 'polarArea'].includes(chartType);
    const datasetColors = extracted.colors || extracted.labels.map((_, index) => PALETTE[index % PALETTE.length]);
    const resolvedType = resolveChartJsType(chartType);

    const dataset = {
      label: definition.title,
      data: extracted.values,
      backgroundColor: isCircular
        ? datasetColors.map((color) => `${color}cc`)
        : chartType === 'area'
          ? `${PALETTE[0]}55`
          : `${PALETTE[0]}cc`,
      borderColor: isCircular ? datasetColors : PALETTE[0],
      borderWidth: isCircular ? 1 : 2,
      fill: chartType === 'area',
      tension: 0.35,
      borderRadius: isCircular ? 0 : 6,
      maxBarThickness: 42,
    };

    if (isCircular) {
      dataset.backgroundColor = datasetColors.map((color) => `${color}cc`);
      dataset.borderColor = colors.border;
    }

    return {
      type: resolvedType,
      data: {
        labels: extracted.labels,
        datasets: [dataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
        plugins: {
          legend: {
            display: isCircular,
            labels: { color: colors.text, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const parsed = context.parsed;
                const value = typeof parsed === 'object'
                  ? (parsed.y ?? parsed.x ?? 0)
                  : (parsed ?? 0);
                return `${context.label}: ${formatTooltipValue(value, definition.format)}`;
              },
            },
          },
        },
        scales: isCircular ? {} : {
          x: {
            ticks: { color: colors.muted, maxRotation: 45, minRotation: 0 },
            grid: { color: colors.grid },
          },
          y: {
            ticks: {
              color: colors.muted,
              callback(value) {
                if (definition.format === 'currency') {
                  return value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}M`
                    : value >= 1000
                      ? `${Math.round(value / 1000)}K`
                      : value;
                }
                if (definition.format === 'percent') return `${value}%`;
                return value;
              },
            },
            grid: { color: colors.grid },
            beginAtZero: true,
          },
        },
      },
    };
  }

  global.DashboardCharts = {
    CHART_DEFINITIONS,
    buildChartConfig,
    formatTooltipValue,
  };
})(typeof window !== 'undefined' ? window : globalThis);
