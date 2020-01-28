declare interface Station {
    name: string;
    type: string;
    value: string;
}

declare type StationMapById = {
    [key: string]: Station;
};

declare interface User {
    username: string;
    password: string;
    sessionId?: string;
}

declare interface Reservation {
    reservationId: string;
    date: Date;
}

declare interface VehicleOption {
    name: string;
    value: string;
}

declare type VehicleMapById = {
    [key: string]: VehicleOption;
};
