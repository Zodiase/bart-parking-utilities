import querystring from 'querystring';

export const getCookieItem = (cookies: string[], key: string): string => {
    const value = cookies.reduce<string>((acc, cookieStr) => {
        if (acc) {
            return acc;
        }

        const parse = querystring.decode(cookieStr, ';', '=');

        if (key in parse) {
            return String(parse[key]);
        }

        return acc;
    }, '');

    return value;
};
