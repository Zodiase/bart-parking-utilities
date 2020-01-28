import querystring from 'querystring';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import Prompts from 'prompts';
import { TicketType } from '../TicketType';
import { VehicleFormValues } from './pickCar';

export const confirmPayment = async (
    CSRF: string,
    sessionId: string,
    station: Station,
    reservation: Reservation,
    vehicleSelection: VehicleFormValues,
): Promise<string> => {
    const paymentPageResponse = await fetch(
        'https://www.select-a-spot.com/bart/reservations/reserve/',
        {
            method: 'POST',
            redirect: 'follow',
            headers: {
                Referer: `https://www.select-a-spot.com/bart/reservations/reserve/?${querystring.encode(
                    {
                        type_id: station.value,
                        reservation: reservation.reservationId,
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
                    ...vehicleSelection,
                    csrfmiddlewaretoken: CSRF,
                    type: TicketType.Daily,
                    reservation: reservation.reservationId,
                },
                '&',
                '=',
            ),
        },
    );

    if (!paymentPageResponse.ok) {
        throw new Error('Could not load payment page.');
    }

    const paymentPageHTML = await paymentPageResponse.text();

    {
        const $ = cheerio.load(paymentPageHTML);

        const reservationBox = $('.mainbox > .boxcontent').first();
        const totalCostBoxContent = reservationBox
            .find('span')
            .last()
            .text()
            .trim();
        const costMatch = totalCostBoxContent.match(/Total Cost: (.+)/);

        if (!costMatch) {
            throw new Error('Price not found on payment page.');
        }

        const totalCost = costMatch[1];

        const paymentBox = $('.mainbox > .boxcontent').last();
        const cardNumber = paymentBox
            .find('#billing-summary table tr')
            .first()
            .find('td')
            .last()
            .text()
            .trim();

        const { value: confirmPayment } = await Prompts({
            type: 'confirm',
            name: 'value',
            message: `Pay ${totalCost} with ${cardNumber}?`,
            initial: false,
        });

        if (typeof confirmPayment === 'undefined' || !confirmPayment) {
            throw new Error('abort');
        }
    }

    console.log('\nPurchasing...\n');

    const confirmPageResponse = await fetch(
        'https://www.select-a-spot.com/bart/reservations/reserve/confirm/',
        {
            method: 'POST',
            redirect: 'follow',
            headers: {
                Referer: `https://www.select-a-spot.com/bart/reservations/reserve/confirm/?${querystring.encode(
                    {
                        reservation: reservation.reservationId,
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
                    reservation: reservation.reservationId,
                    type: TicketType.Daily,
                    conditions: 'agree',
                },
                '&',
                '=',
            ),
        },
    );

    const confirmPageHTML = await confirmPageResponse.text();

    if (!confirmPageResponse.ok) {
        console.log(confirmPageHTML);

        throw new Error('Failed to complete the purchase.');
    }

    {
        const $ = cheerio.load(confirmPageHTML);

        const permitNumber = $('.mainbox > .boxcontent > table tr')
            .first()
            .find('td')
            .last()
            .text()
            .trim();

        return permitNumber;
    }
};
