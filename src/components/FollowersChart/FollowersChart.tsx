import { Component, h } from 'preact';
import { flat } from '../../utils/generic';
import { normalizeTelegramTS, TelegramTimeSeries } from '../../utils/timeSeries';
import LineChart from '../LineChart';
import chartData from './chartData.json';
import styles from './FollowersChart.css';

const enum Themes {
    Day,
    Night,
};

const nextLabel = {
    [Themes.Night]: 'Day',
    [Themes.Day]: 'Night',
}

interface State {
    screenWidth: number;
    theme: Themes;
}

export default class FollowersChart extends Component<{}, State> {
    private initialTheme = (): Themes => {
        if (window.localStorage && window.localStorage.hasOwnProperty('theme')) {
            const value = parseInt(window.localStorage.getItem('theme')!);
            return value as Themes;
        }
        return window.matchMedia('(prefers-color-scheme: dark)') ? Themes.Night : Themes.Day;
    };

    public state = {
        screenWidth: window.innerWidth,
        theme: this.initialTheme(),
    };

    private toggleTheme = () => {
        const { theme: oldTheme } = this.state;
        
        const theme = oldTheme === Themes.Night ? Themes.Day : Themes.Night;

        this.setState((p: State) => ({
            ...p,
            theme,
        }));
        
        window.localStorage.setItem('theme', theme.toString());
    };

    public componentDidMount() {
        window.addEventListener('resize', this.syncWidth);
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', this.syncWidth);
    }

    public syncWidth = () => this.setState({ screenWidth: window.innerWidth });

    public render(props: {}, { screenWidth, theme }: State) {
        
        return (
            <div
                id="app"
                class={`${styles.container} ${theme === Themes.Day ? 'theme__day' : 'theme__night'}`}
            >
                {(chartData as TelegramTimeSeries[]).map(normalizeTelegramTS).map((data, i) => ([
                    <LineChart
                        withInitialAnimation={i === 0}
                        key={`chart${i}`}
                        index={i}
                        data={data}
                        width={Math.min(1200, screenWidth)}
                    />
                ]))}
                <button class={styles.themeToggle} onClick={this.toggleTheme}>
                    Switch to {nextLabel[theme]} mode
                </button>
            </div>
        );
    }
}