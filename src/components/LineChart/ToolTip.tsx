import { Component, h } from 'preact';
import { formatNumber, formatUnixtimeLong, zip } from '../../utils/generic';
import styles from './ToolTip.css';

interface Props {
    activeCharts: string[],
    names: string[],
    values: number[],
    colors: {
        [key: string]: string,
    },
    time: number;
    left: number;
    containerWidth: number;
    top: number;
}

interface State {
    width?: number;
}

export const TOOLTIP_HEIGHT = 85;

export default class ToolTip extends Component<Props, State> {
    private container!: HTMLElement;

    private setContainer = (container: HTMLElement) => { this.container = container; };

    public componentDidMount() {
        if (!this.container) {
            return;
        }

        const { width } = this.container.getBoundingClientRect();
        this.setState({ width });
    }

    private getLeft() {
        const { width } = this.state;
        const { left, containerWidth } = this.props;

        if (!width) {
            return 0;
        }
        
        const centeredPosition = left - width / 2;

        if (centeredPosition < 0) {
            return 0;
        }

        if (centeredPosition + width > containerWidth) {
            return containerWidth - width;
        }

        return centeredPosition;
    }

    private getTop() {
        const { top } = this.props;

        return top-TOOLTIP_HEIGHT/2;
    }

    public render({ names, values, time, colors, activeCharts }: Props) {
        return (
            <section
                class={styles.toolTip}
                style={{ transform: `translate(${this.getLeft()}px, ${this.getTop()}px)` }}
                ref={this.setContainer}
            >
                <div class={styles.toolTipDate}>
                    {formatUnixtimeLong(time)}
                </div>            
                <div class={styles.toolTipValues}>
                    {zip(activeCharts, zip(names, values)).map(([key, [name, value]]) => (
                        <div 
                            style={{ color: colors[key] }}
                            class={styles.valuesBlock}
                        >
                            <div class={styles.valuesBlockNumber}>{formatNumber(value)}</div>
                            <div class={styles.valuesBlockName}>{name}</div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
}