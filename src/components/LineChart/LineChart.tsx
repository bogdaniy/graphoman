import { Component, h } from 'preact';
import { TimeSeries } from '../../utils/timeSeries';
import Chips from '../Chips';
import LineChartViewport from './LineChartViewport';
import PreviewRange from './PreviewRange';
import styles from './LineChart.css';

interface LineChartProps {
    data: TimeSeries;
    width: number;
    index: number;
    withInitialAnimation: boolean;
}

interface State {
    selectedRange: [number, number];
    activeCharts: string[];
}

export default class LineChart extends Component<LineChartProps, State> {
    public state = {
        selectedRange: [
            Math.ceil(this.props.data.times.length*0.7),
            this.props.data.times.length - 1,
        ] as [number, number],
        activeCharts: this.props.data.keys,
    };

    private setSelectedRange = (start: number, end: number) => this.setState({ selectedRange: [start, end] });
    
    private toggleChart = (name: string) => {
        const { activeCharts: oldActiveCharts } = this.state;

        if (oldActiveCharts.length <= 1 && oldActiveCharts.includes(name)) {
            return;
        }

        const activeCharts = oldActiveCharts.includes(name) 
            ? oldActiveCharts.filter(i => i !== name)
            : [name, ...oldActiveCharts];
            

            this.setState({
            activeCharts,
        });
    };

    public render({ data, width, index, withInitialAnimation }: LineChartProps, { selectedRange, activeCharts }: State) {
        return (
            <div class={styles.batya}>
                <h1 class={styles.title}>Graph #{index}</h1>
                <LineChartViewport
                    data={data}
                    width={width}
                    activeCharts={activeCharts}
                    selectedRange={selectedRange}
                    withInitialAnimation={withInitialAnimation}
                />
                <PreviewRange
                    data={data}
                    width={width - 10}
                    onChangeRange={this.setSelectedRange}
                    activeCharts={activeCharts}
                />
                <div class={styles.filtersContainer}>
                    {data.keys.map(k => (
                        <Chips
                            key={k}
                            nameKey={k}
                            name={data.names[k]}
                            checked={activeCharts.includes(k)}
                            color={data.colors[k]}
                            onCheck={this.toggleChart}
                            isDisabled={activeCharts.length <= 1 && activeCharts.includes(k)}
                        />
                    ))}
                </div>
            </div>
        );
    }
}