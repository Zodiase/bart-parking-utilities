import Prompts from 'prompts';
import { TicketType } from './TicketType';

export const pickTicketType = async (): Promise<TicketType> => {
    const { value: ticketType } = await Prompts({
        type: 'select',
        name: 'value',
        message: 'Pick a ticket type',
        choices: [
            {
                title: 'Daily',
                value: 'daily',
            },
        ],
        initial: 0,
    });

    if (typeof ticketType === 'undefined') {
        throw new Error('abort');
    }

    return ticketType;
};
