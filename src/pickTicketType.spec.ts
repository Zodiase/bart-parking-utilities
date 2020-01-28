import Prompts from 'prompts';
import { pickTicketType } from './pickTicketType';
import { TicketType } from './TicketType';

describe('pickTicketType', () => {
    it('should accept daily ticket type', async () => {
        Prompts.inject([TicketType.Daily]);

        await expect(pickTicketType()).resolves.toEqual(TicketType.Daily);
    });

    it('should allow the user to cancel', async () => {
        Prompts.inject([new Error()]);

        await expect(pickTicketType()).rejects.toEqual(new Error('abort'));
    });
});
