import { h } from 'preact';
import {
    animationLoop,
    AnimSyncObject,
} from '../../utils/animations';
import { formatUnixtime, notUndefined, range, formatNumberShort } from '../../utils/generic';
import {
    animateChartMaxExtremum,
    calculateFreePosition,
    drawsSvgPath,
    getSvgX,
    getSvgY,
} from '../../utils/svg';
import {
    cropTS,
    ExtremeValues,
    filterTS,
    getTSExtremeValues,
    TimeSeries,
} from '../../utils/timeSeries';;
import PureComponent from '../PureComponent';
import LineChartXAxis from './LineChartXAxis';
import styles from './LineChartViewport.css';
import ToolTip, { TOOLTIP_HEIGHT } from './ToolTip';

interface LineChartProps {
    data: TimeSeries;
    width: number;
    activeCharts: string[],
    selectedRange: [number, number],
    withInitialAnimation: boolean;
}

interface State {
    data: TimeSeries;
    cursorXPos?: number;
    extremeValues: ExtremeValues,
    dotsLimit?: number;
    prevExtremeValues?:  ExtremeValues,
    isAnimating: boolean,
}

const HEIGHT = 420;
const TOP_PADDING = 5;

const INITIAL_ANIMATION_TIME = 700;

export default class LineChartViewport extends PureComponent<LineChartProps, State> {
    private pths!: SVGGElement;
    setPths = (p: SVGAElement) => { this.pths = p;};

    constructor(props: LineChartProps) {
        super(props);

        const croppedData = cropTS(
            this.props.selectedRange[0],
            this.props.selectedRange[1],
        )(this.props.data);
        
        this.state = {
            data: croppedData,
            cursorXPos: undefined,
            extremeValues: getTSExtremeValues(croppedData),
            dotsLimit: this.props.withInitialAnimation ? 0 : undefined,
            isAnimating: false,
        };
    }

    public componentDidMount() {
        const { withInitialAnimation } = this.props;

        if (!withInitialAnimation) {
            return;
        }

        const { data } = this.state;
        const totalDots = data.times.length;

        animationLoop(
            (value) => this.setState((s: State) => ({
                ...s,
                dotsLimit: (s.dotsLimit === undefined || s.dotsLimit + value >= totalDots)
                    ? undefined
                    : s.dotsLimit + value,
            })),
            totalDots,
            INITIAL_ANIMATION_TIME,
        );
    }
    

    public componentWillReceiveProps(nextProps: LineChartProps, nextState: State) {
        if (
            this.props.activeCharts === nextProps.activeCharts 
            && nextProps.selectedRange === this.props.selectedRange
        ) {            
            return;
        }

        const [start, end] = nextProps.selectedRange;
        const croppedData = cropTS(start, end)(nextProps.data);
        const extremeValues = getTSExtremeValues(
            filterTS(nextProps.activeCharts)(croppedData)
        );

        const {
            extremeValues: oldExtremeValues,
        } = this.state;

        animateChartMaxExtremum({
            oldExtremeValues,
            extremeValues,
            state: {
                data: croppedData, 
                dotsLimit: undefined,
                prevExtremeValues: oldExtremeValues,
            },
            animatioReq: this.animatioReq,
            updateState: this.setState.bind(this),
        });
    }

    private animatioReq: AnimSyncObject = {
        requestId: undefined,
    };
    
    private container!: SVGElement;

    private setContainer = (container: SVGElement) => { this.container = container; }

    private handleTouchMove = (e: TouchEvent) => {
        this.setState({ 
            cursorXPos: e.changedTouches.item(e.changedTouches.length - 1)!.pageX 
        });
    }

    private handleMouseMove = (e: MouseEvent) => this.setState({ cursorXPos: e.offsetX });
    
    private handleMouseOrTouchLeave = (e: TouchEvent | MouseEvent) =>{
        if (e.hasOwnProperty('touches')) {
            e.preventDefault();
        }
        this.setState({ cursorXPos: undefined });
    };

    public getSvgX = (x: number) => {
        const { width } = this.props;
        const { extremeValues } = this.state;
        return getSvgX(extremeValues, width)(x);
    };
    
    public getSvgY = (y: number) => {
        return getSvgY(this.state.extremeValues, HEIGHT + TOP_PADDING)(y) + TOP_PADDING;
    };

    public makePath = (name: string) => {
        const { activeCharts } = this.props;
        const { data, dotsLimit } = this.state;
        const color = notUndefined(data.colors[name]);
        const filterer = (v: any, i: number) => !dotsLimit || i < dotsLimit - 1;
        
        return (
            <path
                key={name}
                d={drawsSvgPath(
                    data.times.map(this.getSvgX).filter(filterer), 
                    notUndefined(data.series[name]).map(this.getSvgY).filter(filterer),
                    undefined
                )}
                vector-effect="non-scaling-stroke"
                stroke={color}
                class={`${styles.chartLine} ${activeCharts.includes(name) ? '' : styles.chartLineHidden}`}
            />
        );
    };

    public makePaths() {    
        const { data } = this.props;
        return (
            <g 
                class={styles.pathHolder}
                ref={this.setPths}
            >
                {data.keys.map(this.makePath)}
            </g>
        );
    }

    private makeLinesLabels() {
        const {
            max: [maxX, maxY],
            min: [minX, minY],
         } = this.state.extremeValues;
        const linesCount = 5;
        const offset = maxY / linesCount;

        return (
          <g>
            {range(linesCount).map(index => (
                <g>
                    <text
                        class={styles.chartGridText}
                        x={this.getSvgX(minX) + 5}
                        y={this.getSvgY(offset*index) - 8}
                    >
                        {formatNumberShort(offset * index)}
                    </text>            
                </g>
            ))}            
          </g>
        )
    }
    
    private makeLines() {
        const {
            prevExtremeValues,
            extremeValues,
            isAnimating,
        } = this.state;

        const {
            max: [maxX, maxY],
            min: [minX, minY],
         } = extremeValues;
        const linesCount = 5;
        const offset = maxY / linesCount;

        let prevOffset: number;

        if (prevExtremeValues) {
            prevOffset = prevExtremeValues.max[1] / linesCount;
        }

        return (
          <g>
            {range(linesCount).map(index => (
                <g key={index}>                    
                    <line
                        x1={this.getSvgX(minX)+3}
                        y1={this.getSvgY(offset*index) - TOP_PADDING}
                        x2={this.getSvgX(maxX)+3}
                        y2={this.getSvgY(offset*index) - TOP_PADDING}
                        class={styles.chartGridLine}
                    />
                   {isAnimating && prevOffset && (<line
                        x1={this.getSvgX(minX)+3}
                        y1={this.getSvgY((prevOffset)*index) - TOP_PADDING}
                        x2={this.getSvgX(maxX)+3}
                        y2={this.getSvgY((prevOffset)*index) - TOP_PADDING}
                        class={`${styles.chartGridLine} ${prevOffset ? `${styles.chartGridLineEasyOut}` : ''}`}
                    />)}
                </g>
            ))}
          </g>
        )
    }

    private makeActiveLine() {
        const { activeCharts } = this.props;
        const { cursorXPos, data } = this.state;

        if (!cursorXPos) {
            return;
        }

        const { width } = this.container.getBoundingClientRect();
        const activeDotIndex = Math.min(
            Math.round((data.times.length - 1) * (cursorXPos / width)), 
            data.times.length
        );
        
        const xPos = this.getSvgX(data.times[activeDotIndex]);

        return (
            <g>
                <line
                    x1={xPos}
                    y1={0}
                    x2={xPos}
                    y2={this.getSvgY(0)}
                    class={styles.chartGridLine}
                />
                <g>
                    {activeCharts.map(name => (
                        <circle
                            key={name}
                            r="4.5"                        
                            cx={xPos}
                            class={styles.activeDot}
                            stroke={data.colors[name]}
                            cy={this.getSvgY(data.series[name][activeDotIndex])}
                        />
                    ))}
                </g>
            </g>
        );
    }

    private makeToolTip() {
        const {
            cursorXPos, 
            data 
        } = this.state;

        if (!cursorXPos) {
            return;
        }

        const { activeCharts } = this.props;
        const { width } = this.container.getBoundingClientRect();
        const activeDotIndex = Math.min(
            Math.round((data.times.length - 1) * (cursorXPos / width)), 
            data.times.length
        );
        const time = data.times[activeDotIndex];
        const xPos = this.getSvgX(time);
        const values = activeCharts.map(name => data.series[name][activeDotIndex]);

        return (
            <ToolTip
                activeCharts={activeCharts}
                names={activeCharts.map(name => data.names[name])}
                values={values}
                time={time}
                left={xPos}
                containerWidth={width}
                top={calculateFreePosition(values.map(this.getSvgY), TOOLTIP_HEIGHT)}
                colors={data.colors}
            />
        );
    }



    public render({ width, selectedRange, data: { times } }: LineChartProps) {
        return (
            <div class={styles.chartWrapper}>
                {this.makeToolTip()}
                <svg
                    class={styles.chart}
                    viewBox={`0 0 ${width} ${HEIGHT + TOP_PADDING}`}
                    width="100%"
                    onMouseMove={this.handleMouseMove}
                    onMouseLeave={this.handleMouseOrTouchLeave}
                    onTouchMove={this.handleTouchMove}
                    onTouchEnd={this.handleMouseOrTouchLeave}
                    ref={this.setContainer}
                >
                    {this.makeLines()}
                    {this.makePaths()}
                    {this.makeLinesLabels()}
                    {/* {this.makeTimeLabels()} */}
                    {this.makeActiveLine()}
                </svg>
                <LineChartXAxis
                    width={width}
                    times={times}
                    selectedRange={selectedRange}
                />
            </div>
        );
    }
}