interface KeyValuePair<K, V> extends Array<K | V> {
    0: K
    1: V
}


export const range = (length: number) => Array.from({ length }, (v, k) => k);

export const flat = <T>(nums: T[][]): T[] => nums.reduce((acc, item) => acc.concat(item), []);

export const merge = <T>(changes: Partial<T>) => (target: Partial<T>): T => ({
    ...target,
    ...changes,
} as T);

export const map = <T, R>(obj: { [key: string]: T }) => (fn: (arg: T) => R): { [key: string]: R } => {
    const willReturn:{ [key: string]: R } = {}

    Object.entries(obj).forEach(([k, v]) => {
        willReturn[k] = fn(v);
    });

    return willReturn
};

export const omit = <T>(omitKey: string, obj: { [key: string]: T }) => {
    const newObj =  {...obj};
    delete newObj[omitKey];
    return newObj;
};

export const filter = <T>(obj: { [key: string]: T }) => (fn: (arg: T, arg1?: string) => boolean): { [key: string]: T } => {
    const willReturn:{ [key: string]: T } = {}

    Object.entries(obj).forEach(([k, v]) => {
        if (!fn(v, k)) {
            return;
        }
        willReturn[k] = v;
    });

    return willReturn
};

export const zip = <K, V>(left: K[], right: V[]): Array<KeyValuePair<K, V>> => {
    const result = []
    const length = Math.min(left.length, right.length);

    for (let i = 0; i < length; i++) {
        result[i] = [left[i], right[i]];
    }

    return result as Array<KeyValuePair<K, V>>;
};
  
  
export const notUndefined = <T>(lolka: T | undefined): T => {
    if (lolka === undefined) {
        throw new Error('TypeError: expected value not to be undefined');
    }
    return lolka;
};

export const formatUnixtime = (t: number): string => {
    const date = new Date(t);
    const day = date.getDate();
    const month = date.toLocaleString('en-us', { month: 'short' });
    return `${day <= 9 ? 0 : ''}${day} ${month}`;
};

export const formatUnixtimeLong = (t: number): string => {
    const date = new Date(t);
    const day = date.getDate();
    const month = date.toLocaleString('en-us', { month: 'short' });
    const weekday = date.toLocaleString('en-us', { weekday: 'short' });
    return `${weekday}, ${month} ${day <= 9 ? 0 : ''}${day}`;
};

export const formatNumber = (num: number): string => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

export const formatNumberShort = (num: number): string => {
    if (num > 1000000) {
        return `${Math.round(num / 1000000)}M`;
    } else if (num > 1000) {
        return `${Math.round(num / 1000)}.${((num / 1000) % 1).toFixed(1).replace('0.', '')}K`;
    }
    return Math.trunc(num).toString();
};
  

export const throttle = (fn: Function, wait:number) => {
    let isCalled = false;

    return (...args: any[]) => {
        if (isCalled) {
            return;
        }
        
        fn(...args);
        isCalled = true;
        setTimeout(() => {
            isCalled = false;
        }, wait)
    };
}
