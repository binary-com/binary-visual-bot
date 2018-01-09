import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { translate } from '../../../common/i18n';
import * as style from '../style';
import Dialog from './Dialog';
import { restrictInputCharacter } from '../shared';

class LimitsContent extends PureComponent {
    constructor() {
        super();
        this.state = {
            error: null,
        };
    }
    submit() {
        const maxLoss = +this.maxLossDiv.value;
        const maxTrades = +this.maxTradesDiv.value;
        if (maxLoss > 0 && maxTrades > 0) {
            if (maxTrades <= 100) {
                this.props.onSave({
                    maxLoss,
                    maxTrades,
                });
            } else {
                this.setState({
                    error: translate('Maximum allowed number of trades for each session is 100.'),
                });
            }
        } else {
            this.setState({
                error: translate('Please enter maximum number of trades and maximum loss amount'),
            });
        }
    }
    componentDidMount() {
        const cleanupLayout = () => {
            $('#limitation-max-trades').val('');
            $('#limitation-max-loss').val('');
            this.setState({ error: undefined });
        };
        $('#limits-dialog-component').dialog({
            close   : cleanupLayout,
            autoOpen: false,
        });
        $('#limitation-max-trades')
            .val('')
            .keypress(restrictInputCharacter({ blacklistedCharacters: '.-e' }));
        $('#limitation-max-loss')
            .val('')
            .keypress(restrictInputCharacter({ blacklistedCharacters: '-e' }));
    }
    render() {
        return (
            <form
                action="javascript:;" // eslint-disable-line no-script-url
                onSubmit={() => this.submit()}
                className="dialog-content"
                style={style.content}
            >
                <div>
                    <div style={style.inputRow}>
                        <label style={style.field} htmlFor="limitation-max-trades">
                            <input
                                style={style.input}
                                ref={el => {
                                    this.maxTradesDiv = el;
                                }}
                                type="number"
                                id="limitation-max-trades"
                                min="1"
                                max="100"
                                step="1"
                            />
                            {translate('Maximum number of trades')}
                        </label>
                    </div>
                    <div style={style.inputRow}>
                        <label style={style.field} htmlFor="limitation-max-loss">
                            <input
                                style={style.input}
                                ref={el => {
                                    this.maxLossDiv = el;
                                }}
                                type="number"
                                id="limitation-max-loss"
                                min="0.01"
                                step="0.01"
                            />
                            {translate('Maximum loss amount')}
                        </label>
                    </div>
                    {this.state.error ? <p style={style.error}>{this.state.error}</p> : null}
                </div>
                <div style={style.submitButton}>
                    <button type="submit">{translate('Start')}</button>
                </div>
            </form>
        );
    }
    static props: {
        onSave: PropTypes.func,
    };
}

export default class Limits extends Dialog {
    constructor() {
        const onSave = limits => {
            this.limitsPromise(limits);
            this.close();
        };
        super('limits-dialog', translate('Trade Limitations'), <LimitsContent onSave={onSave} />, style.dialogLayout);
    }
    getLimits() {
        this.open();
        return new Promise(resolve => {
            this.limitsPromise = resolve;
        });
    }
}
