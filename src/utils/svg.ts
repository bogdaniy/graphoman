import {
    animationLoop,
    AnimSyncObject,
} from './animations';
import { merge, zip } from './generic';
import {
    ExtremeValues,
} from './timeSeries';

export const getSvgX = (extreme: ExtremeValues, width: number) => (x: number): number => {
    const {
        max: [maxX],
        min: [minX],
     } = extreme;
    const length = maxX - minX;
    const position = x - minX;
    return (position / length) * width;
};

export const getSvgY = (extreme: ExtremeValues, height: number) => (y: number): number => {
    const {
        max: [maxX, maxY],
     } = extreme;
    const position = maxY - y;
    return (position / maxY) * height;
};

export const drawsSvgPath = (xs: number[], ys: number[], limit?: number) => {
    const filteringLimit = limit === undefined ? xs.length - 1 : limit;

    const initialPosition = `M ${xs[0]} ${ys[0]} `;
    const lineMoves = zip(xs, ys).filter((v, i) => i <= filteringLimit).map(
        ([x, y]) => `L${x} ${y}`
    );
    return `${initialPosition} ${lineMoves.join(' ')}`;
}

export const calculateFreePosition = (dots: number[], targetHeight: number) => {
    let previousDot;
    const dotsAsc = dots.sort((a, b) => a - b);
    for (const dot of dotsAsc) {
        if (previousDot === undefined && dot > targetHeight) {
            return 0;
        }
        
        if (previousDot !== undefined && dot - previousDot > targetHeight) {
            return dot - ((dot - previousDot) / 2);
        }

        previousDot = dot;
    }
    return dotsAsc[0] - 10 - targetHeight;
};

const CHART_MAX_ANIMATION_TIME = 200;

interface ExtremumState {
    extremeValues: ExtremeValues,
    [key: string]: any,
};

export const animateChartMaxExtremum = ({
    oldExtremeValues,
    extremeValues,
    animatioReq,
    updateState,
    state = {},
}: {
    oldExtremeValues: ExtremeValues,
    extremeValues: ExtremeValues,
    animatioReq: AnimSyncObject,
    updateState: (updater: (s: ExtremumState) => ExtremumState) => void,
    state?: {},
}) => {
    // Cancel previous animation if it wasn't finished yet
    if (animatioReq.requestId) {
        cancelAnimationFrame(animatioReq.requestId);
        animatioReq.requestId = undefined;
    }

    const diff = extremeValues.max[1] - oldExtremeValues.max[1];
    const isAnimated = Math.abs(diff / extremeValues.max[1]) > 0.05;
    const startYMax = isAnimated ? oldExtremeValues.max[1] : extremeValues.max[1];

    updateState(merge<ExtremumState>({
        ...state,
        extremeValues: {
            min: [extremeValues.min[0], extremeValues.min[1]],
            max: [extremeValues.max[0], startYMax],
        },
    }));

    if (!isAnimated) {
        return;
    }

    animationLoop((time) => updateState(s => ({
        ...s,
        isAnimating:  true, //Math.round(s.extremeValues.max[1] + time) <= Math.round(extremeValues.max[1]),
        extremeValues: {
            ...s.extremeValues,
            max: [s.extremeValues.max[0], s.extremeValues.max[1] + time],
        },
    })), diff, CHART_MAX_ANIMATION_TIME, animatioReq);
};