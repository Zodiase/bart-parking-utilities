import Preferences from 'preferences';
import { getCSRFToken } from './getCSRFToken';
import { login } from './login';
import { pickTicketType } from './pickTicketType';
import { TicketType } from './TicketType';
import {
    confirmPayment as confirmPaymentForDailyPass,
    pickCar as pickCarForDailyPass,
    pickDate as pickDateForDailyPass,
    pickStation as pickStationForDailyPass,
} from './daily';
import { downloadPermit } from './downloadPermit';

const prefs = new Preferences('@xch/buy-bart-ticket', {
    user: null,
    recentStations: [],
}) as Preferences & {
    user: User | null;
    recentStations: Station['value'][];
};

const updateMostRecentStation = (station: Station) => {
    prefs.recentStations = prefs.recentStations.filter(
        (stationId) => stationId !== stationId,
    );
    prefs.recentStations.unshift(station.value);
    prefs.save();
};

const updateUser = (username: string, password: string) => {
    prefs.user = {
        ...prefs.user,
        username,
        password,
    };
    prefs.save();
};

export const bart = async () => {
    try {
        const CSRF = await getCSRFToken();
        console.log(`CSRF: ${CSRF}`);

        const { username, password, sessionId } = await login(CSRF, prefs.user);

        if (!sessionId) {
            throw new Error('Unable to establish session.');
        }

        console.log(`sessionId: ${sessionId}`);
        updateUser(username, password);

        const ticketType = await pickTicketType();

        if (ticketType === TicketType.Daily) {
            const station = await pickStationForDailyPass(prefs.recentStations);
            updateMostRecentStation(station);

            const reservation = await pickDateForDailyPass(
                CSRF,
                sessionId,
                station,
            );

            const vehicleSelection = await pickCarForDailyPass(
                CSRF,
                sessionId,
                station,
                reservation,
            );

            const permitId = await confirmPaymentForDailyPass(
                CSRF,
                sessionId,
                station,
                reservation,
                vehicleSelection,
            );

            await downloadPermit(CSRF, sessionId, reservation, permitId);
        }
    } catch (error) {
        if (error.message === 'abort') {
            console.error('User aborted the process.');
            return;
        }

        console.error(`Error: ${error.message}`);
    }
};
