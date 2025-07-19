function waitUntil(conditionFn, checkInterval = 50) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (conditionFn()) {
                clearInterval(interval);
                resolve();
            }
        }, checkInterval);
    });
}

(
    async () => {
        await waitUntil(() => window.vm._isGrom);
        window.vm._isPMPPackaged = true;
        window.GROMVM.onVariable((data) => {
            window.vm._assetPath = data;
        });
    }
)();