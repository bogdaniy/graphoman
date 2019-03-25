import { h } from 'preact';
import PureComponent from '../PureComponent';
import { formatUnixtime } from '../../utils/generic';
import styles from './LineChartXAxis.css';

interface Props {
    width: number;
    times: number[],
    selectedRange: [number, number],
}

const ratioDistibute = (ratio: number, width: number) => {
    const approxWidth = width > 1000 ? 150 : 70;

    // console.log('ratio', ratio, width);
    // if (ratio > .8 || ratio < .3) {
    //     const localRatio =  ratio > .8 ? ratio : (1 - ratio);
    //     return Math.round(localRatio * width / approxWidth);
    // }

    const localRatio = ratio > .7 ? ratio : (1 - ratio);
    return Math.round(localRatio * width / approxWidth);    
};

export default class LineChartXAxis extends PureComponent<Props> {
    private container?: HTMLDivElement;
    private animationObj: { requestId?: number; } = { requestId: undefined };
    

    private getItemsCount() {
        const { selectedRange, width, times } = this.props;

        const length = Math.abs(selectedRange[0] - selectedRange[1]);
        const lengthRatio = length / times.length;
        const visibleCount = ratioDistibute(lengthRatio, width);
        
        const totalCount = Math.round(visibleCount / lengthRatio);

        return [
            Math.min(length, visibleCount),
            Math.min(times.length, totalCount),
        ];
    }

    private setContainer = (container: HTMLDivElement) => { this.container = container; };


    public componentWillReceiveProps(nextProps: Props) {
        const { 
            selectedRange,
            width,
        } = this.props;

        if (selectedRange === nextProps.selectedRange || !this.container) {
            return;
        }
        
        const startDiff = selectedRange[0] - nextProps.selectedRange[0];
        const endDiff = selectedRange[1] - nextProps.selectedRange[1];

        const direction = startDiff !== 0 ? startDiff : endDiff;
     
        const [visibleCount] = this.getItemsCount();
        const { newStart, newEnd }  = this.getNormalizedTime(nextProps.selectedRange);

        const targetScollEl = direction > 0 ? newEnd - visibleCount + 2 : newStart;
        
        if (this.animationObj.requestId) {
            cancelAnimationFrame(this.animationObj.requestId);
        }
            
        this.animationObj.requestId = requestAnimationFrame(() => {
            if (!this.container) {
                return;
            }
            
            const itemWidth = width / visibleCount;
            const startWidth = `${itemWidth * targetScollEl}px`;

            (this.container.childNodes[0] as HTMLDivElement).style.transform = `translate(-${startWidth})`;
            this.animationObj.requestId = undefined;
        });
    }

    public shouldComponentUpdate(prevProps: Props) {
        const { selectedRange } = this.props;
        
        return prevProps.selectedRange !== selectedRange || prevProps.width !== this.props.width;
    }

    private getNormalizedTime([start, end]: [number, number]) {
        const { times } = this.props;

        const [visibleCount, totalCount] = this.getItemsCount();
        const time = Math.round(times.length / totalCount);
        
        const newStart = Math.trunc(start / time);

        const scaledTimes = times.filter((v, i) => i === 0 || i % time === 0);

        const newEnd = Math.trunc(end / time);

        return { times: scaledTimes, newStart, newEnd };
    }

    public render({ selectedRange, width }: Props) {
        const {
            times,
            newStart,
            newEnd,
        } = this.getNormalizedTime(selectedRange);
        
        const [visibleCount] = this.getItemsCount();
        const itemWidth = width / visibleCount;

        return (
            <div
                ref={this.setContainer}
                class={styles.xAxis}
            >
                <div 
                    style={!this.container ? { transform: `translate(-${itemWidth * (newStart + 1)}px)` } : {}}
                    class={styles.xAxisWrapper}
                >
                    {times.map(t => (
                        <div
                            key={t}
                            class={styles.xAxisLabel}
                            style={{ width: `${itemWidth}px` }}
                        >
                            {formatUnixtime(t)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}