import querystring from 'querystring';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment';
import Prompts from 'prompts';
import tmp from 'tmp';
import open from 'open';
import { delayMs } from './delayMs';

const FILE_DOWNLOAD_TIMEOUT = 10000;
const DELAY_BEFORE_DOWNLOAD = 5000;
const MAX_DOWNLOAD_RETRY = 10;
const reservationPageUrl =
    'https://www.select-a-spot.com/bart/users/reservations/';

export const tryDownload = async (
    CSRF: string,
    sessionId: string,
    permitNumber: string,
    retryCount: number = 0,
): Promise<void> => {
    if (retryCount >= MAX_DOWNLOAD_RETRY) {
        throw new Error(
            `Max retry reached while trying to download the permit. \nPlease download it manually at: \n${reservationPageUrl}`,
        );
    }

    await delayMs(DELAY_BEFORE_DOWNLOAD);

    const fileUrl = `https://www.select-a-spot.com/bart/reservations/permit_pdf/?${querystring.encode(
        {
            id: permitNumber,
        },
        '&',
        '=',
    )}`;

    const fileResponse = await fetch(fileUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
            Cookie: querystring.encode(
                {
                    csrftoken: CSRF,
                    sessionid: sessionId,
                },
                ';',
                '=',
            ),
        },
    });

    if (!fileResponse.ok) {
        console.error('Failed to download the permit.');

        return await tryDownload(CSRF, sessionId, permitNumber, retryCount + 1);
    }

    // When the permit is not ready for download, content type is 'text/html; charset=utf-8'.
    if ('application/pdf' !== fileResponse.headers.get('Content-Type')) {
        console.error('Permit file not ready...');

        return await tryDownload(CSRF, sessionId, permitNumber, retryCount + 1);
    }

    const filePath = await (() =>
        new Promise<string>((resolve, reject) => {
            const tmpDir = tmp.dirSync({
                keep: true,
            });
            const permitFilePath = path.resolve(
                tmpDir.name,
                `./permit_${escape(permitNumber)}.pdf`,
            );

            const writeStream = fs.createWriteStream(permitFilePath);
            let timer: ReturnType<typeof setTimeout>;

            fileResponse.body
                .pipe(writeStream)
                .on('open', () => {
                    timer = setTimeout(() => {
                        writeStream.close();
                        reject({
                            reason: 'Timed out downloading file',
                            meta: { url: fileUrl },
                        });
                    }, FILE_DOWNLOAD_TIMEOUT);
                })
                .on('error', (error) => {
                    clearTimeout(timer);
                    reject({
                        reason: 'Unable to download file',
                        meta: { url: fileUrl, error },
                    });
                })
                .on('finish', () => {
                    clearTimeout(timer);
                    resolve(permitFilePath);
                });
        }))();

    console.log(`\n${filePath}\n`);

    await open(filePath);
};

export const downloadPermit = async (
    CSRF: string,
    sessionId: string,
    reservation: Reservation,
    permitNumber: string,
): Promise<void> => {
    const { value: confirmPrint } = await Prompts({
        type: 'confirm',
        name: 'value',
        message: `Permit #: ${permitNumber}. Print?`,
        initial: true,
    });

    if (typeof confirmPrint === 'undefined' || !confirmPrint) {
        throw new Error('abort');
    }

    console.log('Requesting permit pdf...');

    await delayMs(3000);

    const printUrl = `https://www.select-a-spot.com/bart/reservations/print_permit/?${querystring.encode(
        {
            id: permitNumber,
            date: moment(reservation.date).format('YYYY/MM/DD'),
        },
        '&',
        '=',
    )}`;
    const printResponse = await fetch(printUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
            Cookie: querystring.encode(
                {
                    csrftoken: CSRF,
                    sessionid: sessionId,
                },
                ';',
                '=',
            ),
        },
    });

    if (!printResponse.ok) {
        throw new Error('Failed to print the permit.');
    }

    const printResponseJSON = await printResponse.json();

    if (!('success' in printResponseJSON && printResponseJSON.success)) {
        throw new Error('Failed to print the permit.');
    }

    console.log('Downloading permit pdf...');

    await tryDownload(CSRF, sessionId, permitNumber);
};
