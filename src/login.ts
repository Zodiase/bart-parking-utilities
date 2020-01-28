import querystring from 'querystring';
import request from 'request-promise-native';
import Prompts from 'prompts';
import { getCookieItem } from './getCookieItem';

export const promptLogin = async (user: User | null): Promise<User> => {
    if (user) {
        return user;
    }

    const { value: username } = await Prompts({
        type: 'text',
        name: 'value',
        message: 'Username',
    });

    if (typeof username === 'undefined') {
        throw new Error('abort');
    }

    const { value: password } = await Prompts({
        type: 'password',
        name: 'value',
        message: 'Password',
    });

    if (typeof password === 'undefined') {
        throw new Error('abort');
    }

    return {
        username,
        password,
    };
};

export const login = async (CSRF: string, user: User | null): Promise<User> => {
    const {
        username,
        password
    } = await promptLogin(user);

    try {
        // Bart returns 302 after login, so this always throws.
        await request({
            method: 'POST',
            uri: 'https://www.select-a-spot.com/bart/users/login/',
            headers: {
                Referer: 'https://www.select-a-spot.com/bart/',
                'Content-Type':
                    'application/x-www-form-urlencoded; charset=utf-8',
                Cookie: querystring.encode(
                    {
                        csrftoken: CSRF,
                    },
                    ';',
                    '=',
                ),
            },
            body: querystring.encode(
                {
                    csrfmiddlewaretoken: CSRF,
                    username,
                    password,
                },
                '&',
                '=',
            ),
            followRedirect: false,
        });

        throw new Error(`Incorrect username and password.`);
    } catch (error) {
        if (error.statusCode !== 302) {
            throw new Error(`Login failed. (${error.message})`);
        }

        const sessionId = getCookieItem(
            error.response.headers['set-cookie'],
            'sessionid',
        );

        return {
            username,
            password,
            sessionId,
        };
    }
};
