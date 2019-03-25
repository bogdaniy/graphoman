import { h } from 'preact';
import { notUndefined, throttle } from '../../utils/generic';
import { AnimSyncObject } from '../../utils/animations';
import { animateChartMaxExtremum, drawsSvgPath, getSvgX, getSvgY } from '../../utils/svg';
import { getTSExtremeValues, filterTS, TimeSeries, ExtremeValues } from '../../utils/timeSeries';
import PureComponent from '../PureComponent';
import styles from './PreviewRange.css';

interface PreviewRangeProps {
    data: TimeSeries;
    width: number;
    activeCharts: string[],
    onChangeRange: (start: number, end: number) => void;
}

interface State {
    extremeValues: ExtremeValues;
}

const CONTROL_WIDTH = 7;
const DOUBLETAP_MS_RANGE = 600;
const MIN_CENTER_WIDTH = 15;
const HEIGHT = 55;

export default class PreviewRange extends PureComponent<PreviewRangeProps, State> {
    public state = {
        extremeValues: getTSExtremeValues(this.props.data),
    };

    private animationReq: AnimSyncObject = {
         requestId: undefined,
    };

    private container!: HTMLDivElement;
    private containerBounds!: ClientRect | DOMRect;
    private left!: HTMLDivElement;
    private center!: HTMLDivElement;
    private right!: HTMLDivElement;
    private moveStart: number = 0;
    private latestTap: number = 0;

    private setContainer = (container: HTMLDivElement) => {
         this.container = container;
    };

    private updateContainerBounds = () => {
        this.containerBounds = this.container.getBoundingClientRect();
    };

    private setLeft = (container: HTMLDivElement) => { this.left = container; };
    private setCenter = (container: HTMLDivElement) => { this.center = container; };
    private setRight = (container: HTMLDivElement) => { this.right = container; };

    public componentDidMount() {
        this.left.style.width = '70%';
        this.center.style.width = `calc(30% - ${CONTROL_WIDTH*2}px)`;
        this.right.style.width = '0%';

        window.addEventListener('resize', this.updateContainerBounds);
        this.updateContainerBounds();
    }

    public componentWillReceiveProps(nextProps: PreviewRangeProps) {
        const { activeCharts, data } = this.props;
        if (nextProps.activeCharts === activeCharts) {
            return;
        }
        
        const newExtremeValues = getTSExtremeValues(
            filterTS(nextProps.activeCharts)(data)
        );
        const { extremeValues } = this.state;

        animateChartMaxExtremum({
            oldExtremeValues: extremeValues,
            extremeValues: newExtremeValues,
            animatioReq: this.animationReq,
            updateState: this.setState.bind(this),
        });
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', this.updateContainerBounds);
    }

    private getSvgX = (x: number) => {
        const { width } = this.props;
        const { extremeValues } = this.state;
        return getSvgX(extremeValues, width)(x);
    };

    private getSvgY = (y: number) => {
        const { extremeValues } = this.state;
        return getSvgY(extremeValues, HEIGHT)(y);
    };

    private makePath = (name: string) => {
        const { data, activeCharts } = this.props;
        const color = notUndefined(data.colors[name]);

        return (
            <path
                key={name}
                d={drawsSvgPath(
                    data.times.map(this.getSvgX), 
                    notUndefined(data.series[name]).map(this.getSvgY)
                )}
                stroke={color}
                class={`${styles.chartLine} ${activeCharts.includes(name) ? '' : styles.chartLineHidden}`}
            />
        );
    };

    private makePaths() {
        const { data } = this.props;

        return data.keys.map(this.makePath);
    }

    private handleMouseDownLeft = (e: MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', this.mouseLeft);
        window.addEventListener('mouseup', this.stopResize);
    };

    private handleMouseDownCenter = (e: MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', this.mouseCenter);
        window.addEventListener('mouseup', this.stopResize);
    };

    private handleMouseDownRight = (e: MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', this.mouseRight);
        window.addEventListener('mouseup', this.stopResize);
    };

    private touchLeft = (e: TouchEvent) => {
        e.preventDefault();

        this.resizeLeft(
            e.changedTouches.item(e.changedTouches.length - 1)!.pageX
        );
    }

    public mouseLeft = (e: MouseEvent) => {
        this.resizeLeft(e.pageX);
    }

    private startTouchCenter = (e: TouchEvent) => {
        this.moveStart = e.changedTouches.item(e.changedTouches.length - 1)!.pageX;
    }

    private touchCenter = (e: TouchEvent) => {    
        if (this.moveStart !== 0) {
            this.moveCenter(
                e.changedTouches.item(e.changedTouches.length - 1)!.pageX,
                this.moveStart,
            );
        }
        this.moveStart = e.changedTouches.item(e.changedTouches.length - 1)!.pageX;
    }

    private mouseCenter = (e: MouseEvent) => {
        if (this.moveStart !== 0) {
            this.moveCenter(e.pageX, this.moveStart);
        }

        this.moveStart = e.pageX;
    }

    private touchRight = (e: TouchEvent) => {
        e.preventDefault();

        this.resizeRight(
            e.changedTouches.item(e.changedTouches.length - 1)!.pageX
        );
    }

    private mouseRight = (e: MouseEvent) => {
        this.resizeRight(e.pageX);
    }

    private resizeLeft(pageX: number) {
        const { 
            left: containerLeft,
            width: containerWidth,
        } = this.containerBounds;

        const cursorX = pageX > containerLeft ? pageX : containerLeft;
        
        const cursorOffset = cursorX - containerLeft;
        const { width } = this.right.getBoundingClientRect();

        const centerWidth = containerWidth - cursorOffset - width;
        const centerPercentWidth = centerWidth / containerWidth * 100;
        
        // Deny to small selection zone
        if (centerPercentWidth < MIN_CENTER_WIDTH) {
            return;
        }

        this.center.style.width = `calc(${centerPercentWidth}% - ${CONTROL_WIDTH}px)`;
        this.left.style.width = `${(cursorOffset)  / containerWidth * 100}%`;

        this.onChangeRange(
            cursorOffset / containerWidth,
            (cursorOffset + centerWidth + CONTROL_WIDTH) / containerWidth
        );
    }

    private resizeRight = (pageX: number) => {
        const { 
            left: containerLeft,
            width: containerWidth,
        } = this.containerBounds;
        
        const containerRightSide = containerLeft + containerWidth;
        
        const cursorX = pageX < containerRightSide ? pageX : containerRightSide;
        const cursorOffset = cursorX - containerLeft;

        const { left } = this.center.getBoundingClientRect();
        const centerLeft = left - containerLeft;
        
        const centerWidth = cursorOffset - centerLeft;
        const centerPercentWidth = centerWidth / containerWidth * 100;

        // Deny to small selection zone
        if (centerPercentWidth < MIN_CENTER_WIDTH) {
            return;
        }
        
        const rightWidth = containerWidth - cursorOffset;
        this.center.style.width = `calc(${centerPercentWidth}% - ${CONTROL_WIDTH}px)`;
        this.right.style.width = `${(rightWidth) / containerWidth * 100}%`;
        
        this.onChangeRange(
            centerLeft / containerWidth,
            (centerLeft + centerWidth + CONTROL_WIDTH) / containerWidth
        );
    };

    private moveCenter = (pageX: number, moveStart: number) => {
        const { 
            left: containerLeft,
            width: containerWidth,
        } = this.containerBounds;

        if (pageX === moveStart) {
            return;   
        }

        const cursorDiff = pageX - moveStart;

        pageX = Math.max(pageX, containerLeft);
        pageX = Math.min(pageX, containerLeft + containerWidth);

        moveStart = Math.max(moveStart, containerLeft);
        moveStart = Math.min(moveStart, containerLeft + containerWidth);

        const { width: centerWidth } = this.center.getBoundingClientRect();
        const { width: leftWidth } = this.left.getBoundingClientRect();
        const { width: rightWidth } =this.right.getBoundingClientRect();
        
        const isRightMove = cursorDiff > 0;

        // special logic to stick panel to edges to avoid having problem with very close to end scrolling
        if (rightWidth < cursorDiff && isRightMove || leftWidth < -cursorDiff && !isRightMove) {
            const total = containerWidth - centerWidth - CONTROL_WIDTH * 2;
            
            this.right.style.width = isRightMove ? '0' : `${total/containerWidth*100}%`;
            this.left.style.width = isRightMove ? `${total/containerWidth*100}%` : '0' ;
            
            this.onChangeRange(
                isRightMove ? total/containerWidth : 0,
                isRightMove ? 1 : centerWidth/containerWidth,
            );
            return;
        }
                        
        this.left.style.width = `${(leftWidth + cursorDiff) / containerWidth * 100}%`;
        this.right.style.width = `${(rightWidth - cursorDiff) / containerWidth * 100}%`;
        
        this.onChangeRange(
            leftWidth / containerWidth,
            (leftWidth + this.center.offsetWidth) / containerWidth,
        );
    };

    private expandCenter = () => {
        this.left.style.width = `0%`;
        this.right.style.width = `0%`;
        this.center.style.width = `calc(100% - ${CONTROL_WIDTH*2}px)`;

        this.onChangeRange(0, 1);
    };

    private expandCenterByTap = () => {
        this.moveStart = 0;
        const now = new Date().getTime();
        const timesince = now - this.latestTap;
        if (timesince < DOUBLETAP_MS_RANGE && timesince > 0){
            this.expandCenter();
        }
        
        this.latestTap = new Date().getTime();
    };

    private stopResize = () => {
        window.removeEventListener('mousemove', this.mouseLeft);
        window.removeEventListener('mousemove', this.mouseCenter);
        window.removeEventListener('mousemove', this.mouseRight);
        this.moveStart = 0;
    };

    private onChangeRange = throttle((start: number, end: number) => {
        const { onChangeRange, data: { times } } = this.props;
        
        start = Math.max(0, start);
        end = Math.min(1, end);
        const maxIndex = times.length - 1;

        onChangeRange(
            Math.floor(maxIndex * start),
            Math.ceil(maxIndex * end),
        );
    }, 30);

    public render({ width }: PreviewRangeProps) {
        return (
            <div
                class={styles.previewRange}
                ref={this.setContainer}
            >                
                <svg 
                    viewBox={`0 0 ${width} ${HEIGHT}`}
                    class={styles.previewRangeChart}
                >
                    {this.makePaths()}
                </svg>
                <div class={styles.previewRangeOverlay}>
                    <div
                        id='left'
                        class={styles.previewRangeLeft}
                        ref={this.setLeft}
                    />
                    <div
                        class={styles.previewRangeSelectorLeft}
                        onMouseDown={this.handleMouseDownLeft}
                        onTouchMove={this.touchLeft}
                    />
                    <div 
                        class={styles.previewRangeCenter}
                        ref={this.setCenter}
                        onTouchStart={this.startTouchCenter}
                        onMouseDown={this.handleMouseDownCenter}
                        onTouchMove={this.touchCenter}
                        onDblClick={this.expandCenter}
                        onTouchEnd={this.expandCenterByTap}
                    />
                    <div
                        class={styles.previewRangeSelectorRight}
                        onMouseDown={this.handleMouseDownRight}
                        onTouchMove={this.touchRight}
                    />
                    <div 
                        class={styles.previewRangeRight}
                        ref={this.setRight}
                    />
                </div>
            </div>
        );
    }
}