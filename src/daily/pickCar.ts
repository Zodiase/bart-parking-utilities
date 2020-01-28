import querystring from 'querystring';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import Prompts from 'prompts';
import { TicketType } from '../TicketType';

export interface VehicleFormValues {
    csrfmiddlewaretoken: string;
    vehicle: string;
    new: string;
    user: string;
    'mailing-first_name': string;
    'mailing-last_name': string;
    'mailing-address1': string;
    'mailing-address2': string;
    'mailing-city': string;
    'mailing-state': string;
    'mailing-zip_code': string;
    'mailing-phone': string;
    'mailing-user': string;
    type: TicketType;
    reservation: string;
}

export const isVehicleFormValues = (value: any): value is VehicleFormValues => {
    //! Implement this.
    return true;
};

export const pickCar = async (
    CSRF: string,
    sessionId: string,
    station: Station,
    reservation: Reservation,
): Promise<VehicleFormValues> => {
    const carPageResponse = await fetch(
        `https://www.select-a-spot.com/bart/reservations/reserve/?${querystring.encode(
            {
                type_id: station.value,
                reservation: reservation.reservationId,
            },
            '&',
            '=',
        )}`,
        {
            method: 'GET',
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
                Cookie: querystring.encode(
                    {
                        csrftoken: CSRF,
                        sessionid: sessionId,
                    },
                    ';',
                    '=',
                ),
            },
        },
    );

    if (!carPageResponse.ok) {
        throw new Error('Failed to open the car page.');
    }

    const pageHTML = await carPageResponse.text();
    const $ = cheerio.load(pageHTML);

    const vehicleForm = $('form[action="/bart/reservations/reserve/"]');

    if (vehicleForm.length < 1) {
        throw new Error('Vehicle form not found.');
    }

    const formValues = vehicleForm
        .serializeArray()
        .reduce((acc, { name, value }) => {
            return {
                ...acc,
                [name]: value,
            };
        }, {});

    if (!isVehicleFormValues(formValues)) {
        throw new Error('Unexpected station form values.');
    }

    const vehicleOptions = vehicleForm
        .find('select[name="vehicle"] option')
        .toArray()
        .map<VehicleOption>((opt) => {
            const vehicleName = $(opt)
                .text()
                .trim();
            const vehicleId = $(opt).val();

            return {
                name: vehicleName,
                value: vehicleId,
            };
        });

    const vehicleMap: VehicleMapById = vehicleOptions.reduce<VehicleMapById>(
        (acc, vehicle) => {
            return {
                ...acc,
                [vehicle.value]: vehicle,
            };
        },
        {},
    );

    const { value: selectedVehicleId } = await Prompts({
        type: 'select',
        name: 'value',
        message: 'Pick a car',
        choices: vehicleOptions.map(({ name, value }) => {
            return {
                title: name,
                value,
            };
        }),
        initial: 0,
    });

    if (typeof selectedVehicleId === 'undefined') {
        throw new Error('abort');
    }

    if (!(selectedVehicleId in vehicleMap)) {
        throw new Error('Selected vehicle does not exist.');
    }

    const selectedVehicle: VehicleOption = vehicleMap[selectedVehicleId];

    return {
        ...formValues,
        vehicle: selectedVehicle.value,
    };
};
