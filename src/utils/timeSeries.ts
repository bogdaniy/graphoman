import { notUndefined, flat, filter, map, omit  } from './generic';

interface SeriesNames {
    [name: string]: string;
}

interface SeriesColors {
    [key: string]: string;
}

type TelegramTimeSeriesColumns = Array<Array<string | number>>;

export interface TelegramTimeSeries {
    columns: TelegramTimeSeriesColumns;
    types: {
        [name: string]: 'line' | 'x',
    };
    colors: SeriesColors;
    names: SeriesNames;
}

interface TimeSeriesMap {
    [name: string]: number[];
}

export interface TimeSeries {
    keys: string[];
    times: number[];
    series: TimeSeriesMap;
    colors: SeriesColors;
    names: SeriesNames;
}

export interface ExtremeValues { 
    min: [number, number];
    max: [number, number];
}
    
export const normalizeTelegramTS = (chart: TelegramTimeSeries): TimeSeries => {
    const [xKey] = notUndefined(
        Object.entries(chart.types).find(([key, value]) => value === 'x')
    );

    const columnsMap = chart.columns.map(
        ([name, ...points]) => [name, points] as [string, number[]]
    ).reduce(
        (obj, [k, v]) => ({ [k]: v, ...obj }),
        {}
    ) as TimeSeriesMap;

    return {
        keys: Object.keys(omit(xKey, chart.types)),
        series: omit(xKey, columnsMap),
        times: columnsMap[xKey],
        colors: chart.colors,
        names: chart.names,
    };
}

export const findMatrixMax = (matrix: number[][]): number => Math.max(...flat(matrix));
export const findMatrixMin = (matrix: number[][]): number => Math.min(...flat(matrix));

export const getTSExtremeValues = (ts: TimeSeries): ExtremeValues => ({
    min: [
        Math.min(...ts.times),
        findMatrixMin(Object.values(ts.series)),
    ],
    max: [
        Math.max(...ts.times),
        findMatrixMax(Object.values(ts.series)),
    ],
});

export const cropTS = (start: number, end: number) => (ts: TimeSeries): TimeSeries => ({
    ...ts,
    times: ts.times.slice(start, end),
    series: map<number[], number[]>(ts.series)(serie => serie.slice(start, end)),
});

export const filterTS = (activeCharts: string[]) => (ts: TimeSeries) => ({
    ...ts,
    keys: ts.keys.filter(i => activeCharts.includes(i)),
    series: filter(ts.series)((v, k) => activeCharts.includes(k!)), 
});