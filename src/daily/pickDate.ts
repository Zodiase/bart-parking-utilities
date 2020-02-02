import querystring from 'querystring';
import fetch from 'node-fetch';
import Prompts from 'prompts';
import moment from 'moment';
import { TicketType } from '../TicketType';

export const pickDate = async (
    CSRF: string,
    sessionId: string,
    station: Station,
): Promise<Reservation> => {
    const today = moment()
        .startOf('date')
        .toDate();

    const { value: selectedDate } = (await Prompts({
        type: 'date',
        name: 'value',
        message: 'Pick a date',
        // This value is manipulated by the prompt. It must be its own copy.
        initial: new Date(today),
        mask: 'YYYY-MM-DD dddd',
        validate: (date: Date) => {
            return date < today ? 'Must not be in the past' : true;
        },
    })) as { value: Date };

    if (typeof selectedDate === 'undefined') {
        throw new Error('abort');
    }

    const selectedDateString: string = moment(selectedDate).format(
        'YYYY-MM-DD',
    );

    const datePageResponse = await fetch(
        'https://www.select-a-spot.com/bart/reservations/date/',
        {
            method: 'POST',
            redirect: 'follow',
            headers: {
                Referer: `https://www.select-a-spot.com/bart/reservations/date/?${querystring.encode(
                    {
                        csrfmiddlewaretoken: CSRF,
                        type_id: station.value,
                        type: TicketType.Daily,
                    },
                    '&',
                    '=',
                )}`,
                'Content-Type':
                    'application/x-www-form-urlencoded; charset=utf-8',
                Cookie: querystring.encode(
                    {
                        csrftoken: CSRF,
                        sessionid: sessionId,
                    },
                    ';',
                    '=',
                ),
            },
            body: querystring.encode(
                {
                    csrfmiddlewaretoken: CSRF,
                    type_id: station.value,
                    type: TicketType.Daily,
                    start_date: selectedDateString,
                    end_date: selectedDateString,
                },
                '&',
                '=',
            ),
        },
    );

    if (!datePageResponse.ok) {
        throw new Error('Failed getting a reservation for the date.');
    }

    const { reservation } = querystring.decode(
        datePageResponse.url
            .split('?')
            .splice(1)
            .join('?'),
        '&',
        '=',
    );
    const reservationId = String(reservation);

    return {
        reservationId,
        date: selectedDate,
    };
};
