import Prompts from 'prompts';
import { promptLogin } from './login';

describe('promptLogin', () => {
    it('should prompt for username and password if no user is given', async () => {
        Prompts.inject(['user', 'pass']);

        await expect(promptLogin(null)).resolves.toEqual({
            username: 'user',
            password: 'pass',
        });
    });

    it('should allow the user to cancel at username input', async () => {
        // Do not inject anything after the error as they get passed down to the next prompt.
        Prompts.inject([new Error()]);

        await expect(promptLogin(null)).rejects.toEqual(new Error('abort'));
    });

    it('should allow the user to cancel at password input', async () => {
        Prompts.inject(['user', new Error()]);

        await expect(promptLogin(null)).rejects.toEqual(new Error('abort'));
    });

    it('should not prompt for username and password if user is given', async () => {
        await expect(
            promptLogin({
                username: 'user',
                password: 'pass',
            }),
        ).resolves.toEqual({
            username: 'user',
            password: 'pass',
        });
    });
});

describe('login', () => {
    //! Tests here require mocking of `request`.
});
