export const delayMs = (duration: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
