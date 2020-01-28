import fetch from 'node-fetch';
import cheerio from 'cheerio';
import Prompts from 'prompts';
import { TicketType } from '../TicketType';

export interface StationFormValues {
    csrfmiddlewaretoken: string;
    type: TicketType;
}

export const isStationFormValues = (value: any): value is StationFormValues => {
    if (typeof value !== 'object') {
        return false;
    }

    if (
        !(
            'csrfmiddlewaretoken' in value &&
            typeof value.csrfmiddlewaretoken === 'string' &&
            value.csrfmiddlewaretoken.length > 0
        )
    ) {
        return false;
    }

    if (
        !(
            'type' in value &&
            typeof value.type === 'string' &&
            Object.values(TicketType).indexOf(value.type) > -1
        )
    ) {
        return false;
    }

    return true;
};

export const pickStation = async (
    recentStations: Station['value'][],
): Promise<Station> => {
    console.log('fetching stations...\n');

    const stationsPageResponse = await fetch(
        'https://www.select-a-spot.com/bart/reservations/facilities/?type=daily',
        {
            method: 'GET',
            redirect: 'follow',
        },
    );

    if (!stationsPageResponse.ok) {
        throw new Error('Could not load stations page.');
    }

    const stationsPageHTML = await stationsPageResponse.text();
    const $ = cheerio.load(stationsPageHTML);

    const stationForm = $('form[action="/bart/reservations/date/"]');

    if (stationForm.length < 1) {
        throw new Error('Station form not found.');
    }

    const formValues = stationForm
        .serializeArray()
        .reduce((acc, { name, value }) => {
            return {
                ...acc,
                [name]: value,
            };
        }, {});

    if (!isStationFormValues(formValues)) {
        throw new Error('Unexpected station form values.');
    }

    const stationRows = stationForm.find('table.stationlist tr.parkingtype');

    const stations: Station[] = stationRows
        .toArray()
        .map<Station>((element) => {
            const name = $(element)
                .find('td.facilityname')
                .text()
                .trim();
            const type = $(element)
                .find('td.facilitytypes')
                .first()
                .text()
                .trim();
            const value = $(element)
                .find('td.facilityname input[name="type_id"]')
                .val()
                .trim();

            return {
                name,
                type,
                value,
            };
        });

    const stationsMap: StationMapById = stations.reduce<StationMapById>(
        (acc, station) => {
            return {
                ...acc,
                [station.value]: station,
            };
        },
        {},
    );

    let selectedStationId: Station['value'] = '';

    if (recentStations.length > 0) {
        const { value: selectedFromRecentStations } = await Prompts({
            type: 'select',
            name: 'value',
            message: 'Pick a station',
            choices: recentStations
                .filter((stationId) => stationId in stationsMap)
                .map((stationId) => stationsMap[stationId])
                .map(({ name, type, value }) => {
                    return {
                        title: `${name} - ${type}`,
                        value,
                    };
                })
                .concat({
                    title: '> all stations...',
                    value: '',
                }),
            initial: 0,
        });

        if (typeof selectedFromRecentStations === 'undefined') {
            throw new Error('abort');
        }

        selectedStationId = selectedFromRecentStations;
    }

    if (!selectedStationId) {
        const { value: selectedFromAllStations } = await Prompts({
            type: 'select',
            name: 'value',
            message: 'Pick a station',
            choices: stations.map(({ name, type, value }) => {
                return {
                    title: `${name} - ${type}`,
                    value,
                };
            }),
            initial: 0,
        });

        if (typeof selectedFromAllStations === 'undefined') {
            throw new Error('abort');
        }

        selectedStationId = selectedFromAllStations;
    }

    if (!(selectedStationId in stationsMap)) {
        throw new Error('Selected station does not exist.');
    }

    const selectedStation: Station = stationsMap[selectedStationId];

    return selectedStation;
};
