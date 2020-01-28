import fetch from 'node-fetch';
import { getCookieItem } from './getCookieItem';

export const getCSRFToken = async () => {
    const res = await fetch('https://www.select-a-spot.com/bart/', {
        method: 'GET',
        redirect: 'follow',
    });

    if (!res.ok) {
        throw new Error('Bart offline.');
    }

    const CSRF = getCookieItem(res.headers.raw()['set-cookie'], 'csrftoken');

    return CSRF;
};
