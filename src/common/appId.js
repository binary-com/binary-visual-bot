import { LiveApi } from 'binary-live-api';
import {
    addToken,
    removeToken,
    getTokenList,
    removeAllTokens,
    get as getStorage,
    set as setStorage,
} from '../common/utils/storageManager';
import { parseQueryString, isProduction, getExtension } from '../common/utils/tools';
import { getLanguage } from './lang';
import AppIdMap from './appIdResolver';
import Elevio from './elevio';

export const AppConstants = Object.freeze({
    STORAGE_ACTIVE_TOKEN: 'activeToken',
});

const hostName = document.location.hostname;

const queryToObjectArray = queryStr => {
    const tokens = [];
    Object.keys(queryStr).forEach(o => {
        if (!/\d$/.test(o)) return;
        const index = parseInt(o.slice(-1));
        let key = o.slice(0, -1);
        key = key === 'acct' ? 'accountName' : key; // Make it consistent with storageManage naming
        if (index <= tokens.length) {
            tokens[index - 1][key] = queryStr[o];
        } else {
            tokens.push({});
            tokens[index - 1][key] = queryStr[o];
        }
    });
    return tokens;
};

export const oauthLogin = (done = () => 0) => {
    const queryStr = parseQueryString();

    const tokenObjectList = queryToObjectArray(queryStr);

    if (tokenObjectList.length) {
        $('#main').hide();
        addTokenIfValid(tokenObjectList[0].token, tokenObjectList).then(() => {
            const accounts = getTokenList();
            if (accounts.length) {
                setStorage(AppConstants.STORAGE_ACTIVE_TOKEN, accounts[0].token);
            }
            document.location = 'bot.html';
        });
    } else {
        done();
    }
};

export const getCustomEndpoint = () => ({
    url  : getStorage('config.server_url'),
    appId: getStorage('config.app_id'),
});

const isRealAccount = () => {
    const accountList = JSON.parse(getStorage('tokenList') || '{}');
    const activeToken = getStorage(AppConstants.STORAGE_ACTIVE_TOKEN) || [];
    let activeAccount = null;
    let isReal = false;
    try {
        activeAccount = accountList.filter(account => account.token === activeToken);
        isReal = !activeAccount[0].accountName.startsWith('VRT');
    } catch (e) {} // eslint-disable-line no-empty
    return isReal;
};

const getDomainAppId = () => AppIdMap[hostName];

export const getDefaultEndpoint = () => ({
    url  : isRealAccount() ? 'green.binaryws.com' : 'blue.binaryws.com',
    appId: getStorage('config.default_app_id') || getDomainAppId() || 1169,
});

const generateOAuthDomain = () => {
    const endpointUrl = getCustomEndpoint().url;
    if (endpointUrl) {
        return endpointUrl;
    } else if (isProduction()) {
        return `oauth.binary.${getExtension()}`;
    }
    return 'oauth.binary.com';
};

export const getServerAddressFallback = () => getCustomEndpoint().url || getDefaultEndpoint().url;

export const getAppIdFallback = () => getCustomEndpoint().appId || getDefaultEndpoint().appId;

export const getWebSocketURL = () => `wss://${getServerAddressFallback()}/websockets/v3`;

export const generateWebSocketURL = serverUrl => `wss://${serverUrl}/websockets/v3`;

export const getOAuthURL = () =>
    `https://${generateOAuthDomain()}/oauth2/authorize?app_id=${getAppIdFallback()}&l=${getLanguage().toUpperCase()}`;

export async function addTokenIfValid(token, tokenObjectList) {
    try {
        const { authorize } = await binaryApi.api.authorize(token);
        const { landing_company_name: lcName } = authorize;
        const {
            landing_company_details: { has_reality_check: hasRealityCheck },
        } = await binaryApi.api.getLandingCompanyDetails(lcName);
        addToken(token, authorize, !!hasRealityCheck, ['iom', 'malta'].includes(lcName) && authorize.country === 'gb');

        const { account_list: accountList } = authorize;
        if (accountList.length > 1) {
            tokenObjectList.forEach(tokenObject => {
                if (tokenObject.token !== token) {
                    const account = accountList.filter(o => o.loginid === tokenObject.accountName);
                    if (account.length) {
                        addToken(tokenObject.token, account[0], false, false);
                    }
                }
            });
        }
    } catch (e) {
        removeToken(tokenObjectList[0].token);
        Elevio.logoutUser();
        throw e;
    }
}

export const logoutAllTokens = () =>
    new Promise(resolve => {
        const logout = () => {
            removeAllTokens();
            resolve();
        };
        if (tokenList.length === 0) {
            logout();
        } else {
            binaryApi.api.authorize(tokenList[0].token).then(() => {
                binaryApi.api.logOut().then(logout, logout);
            }, logout);
        }
    });

const options = {
    apiUrl   : getWebSocketURL(),
    websocket: typeof WebSocket === 'undefined' ? require('ws') : undefined, // eslint-disable-line global-require
    language : getLanguage().toUpperCase(),
    appId    : getAppIdFallback(),
};

export const generateLiveApiInstance = () => new LiveApi(options);

export const generateTestLiveApiInstance = overrideOptions => new LiveApi(Object.assign({}, options, overrideOptions));

class BinaryApi {
    constructor() {
        this.api = generateLiveApiInstance();
        this.isAuthorised = false;
    }
    authorisePromise() {
        return new Promise(resolve => {
            if (this.isAuthorised) {
                return resolve();
            }
            const tokenList = getTokenList();
            if (tokenList.length) {
                this.api
                    .authorize(tokenList[0].token)
                    .then(() => {
                        this.isAuthorised = true;
                        resolve();
                    })
                    .catch(() => {
                        this.isAuthorised = false;
                        logoutAllTokens();
                        resolve();
                    });
            } else {
                resolve();
            }
        });
    }
}

export const binaryApi = new BinaryApi();
