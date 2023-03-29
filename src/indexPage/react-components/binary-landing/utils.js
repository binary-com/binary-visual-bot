import Cookies from 'js-cookie';

// eslint-disable-next-line import/prefer-default-export
export const setBinaryCookieAndRedirect = url => {
    Cookies.set('row-lp-visited', true, { expires: 1 / 24 });
    window.open(url, '_self');
};
