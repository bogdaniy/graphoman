import { Component, h } from 'preact';
import styles from './Chips.css';

interface Props {
    checked: boolean;
    nameKey: string;
    name: string;
    color: string;
    isDisabled: boolean;
    onCheck: (name: string) => void;
}

export default class Chips extends Component<Props> {

    public handleClick = () => {
        const { nameKey, onCheck } = this.props;
        
        onCheck(nameKey);
    };

    public render() {
        const {            
            name,
            color,
            checked,
            isDisabled,
        } = this.props;

        const checkedClass = checked ? styles.chipsChecked : styles.chipsUnChecked;
        
        return (
            <div 
                class={`${styles.chips} ${checkedClass} ${!isDisabled ? styles.chipsAvailable : ''}`}
                onClick={this.handleClick}
            >
                <div 
                    class={styles.chipsCheckbox}
                    style={{ background: color }}
                >                    
                    {checked && (
                        <svg 
                            width="10" 
                            height="10" 
                            viewBox="0 0 24 24"
                            class={styles.chipsCheckMark}
                        >
                            <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                        </svg>
                    )}
                </div>
                <div class={styles.chipsName}>
                    {name}
                </div>
            </div>
        );
    }
}