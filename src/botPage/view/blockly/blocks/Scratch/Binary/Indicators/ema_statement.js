import { translate } from '../../../../../../../common/utils/tools';

Blockly.Blocks.ema_statement = {
    init() {
        this.jsonInit({
            message0: translate('set %1 to Exponentional Moving Average %2'),
            message1: '%1',
            args0   : [
                {
                    type    : 'field_variable',
                    name    : 'VARIABLE',
                    variable: 'ema',
                },
                {
                    type: 'input_dummy',
                },
            ],
            args1: [
                {
                    type : 'input_statement',
                    name : 'STATEMENT',
                    check: null,
                },
            ],
            colour           : Blockly.Colours.Binary.colour,
            colourSecondary  : Blockly.Colours.Binary.colourSecondary,
            colourTertiary   : Blockly.Colours.Binary.colourTertiary,
            tooltip          : translate('Calculates Exponential Moving Average (EMA) from a list with a period'),
            previousStatement: null,
            nextStatement    : null,
        });
    },
    onchange           : Blockly.Blocks.bb_statement.onchange,
    requiredParamBlocks: ['input_list', 'period'],
};

Blockly.JavaScript.ema_statement = block => {
    const varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VARIABLE'),
        Blockly.Variables.NAME_TYPE
    );
    const input = block.childValueToCode('input_list', 'INPUT_LIST') || '[]';
    const period = block.childValueToCode('period', 'PERIOD') || '10';

    const code = `${varName} = Bot.ema(${input}, ${period});\n`;
    return code;
};
