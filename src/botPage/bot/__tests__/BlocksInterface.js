import { expect } from 'chai'
import CustomApi from 'binary-common-utils/lib/customApi'
import Observer from 'binary-common-utils/lib/observer'
import WebSocket from 'ws'
import JSI from '../JSI'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

const observer = new Observer()
const api = (new CustomApi(observer, null, null, new WebSocket(
  process.env.ENDPOINT ||
    'wss://ws.binaryws.com/websockets/v3?l=en&app_id=0')))
const $scope = { observer, api }

const jsi = new JSI($scope)

describe('Run JSI over simple calculation', () => {
  let value

  beforeAll(done => {
    jsi.run(`
      (function (){
        var count = 2;
        var again = false;
        var result = {};
        while(true) {
          Bot.start('Xkq6oGFEHh6hJH8', {
            amount: 1, basis: 'stake', candleInterval: 60,
            contractTypes: '["CALL","PUT"]',
            currency: 'USD', duration: 2,
            duration_unit: 'h', symbol: 'R_100',
          }, again);
          var context = wait('CONTEXT');
          if (!again) {
            result.askPrice = Bot.getAskPrice('CALL');
            result.payout = Bot.getPayout('CALL');
          }
          Bot.purchase('CALL')
          while ((context = wait('CONTEXT')).scope === 'during') {
            if (!again) {
              result.sellAvailable = Bot.isSellAvailable();
              result.sellPrice = Bot.getSellPrice();
            }
            Bot.sellAtMarket();
          }
          result.isWin = Bot.isResult('win')
          result.detail = Bot.readDetails(1)
          if (--count === 0) {
            break;
          }
          again = true;
        }
        return result;
      })();
    `).then(v => {
      value = v
      done()
    })
  })

  it('return code is correct', () => {
    const expectedTypes =
      ['number', 'number', 'boolean', 'number', 'boolean', 'string']

    const result = Object.keys(value).map(k => typeof value[k])

    expect(result).deep.equal(expectedTypes)
  })
})

