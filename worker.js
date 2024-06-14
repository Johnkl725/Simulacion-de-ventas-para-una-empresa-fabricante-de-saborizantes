importScripts('https://cdnjs.cloudflare.com/ajax/libs/seedrandom/2.4.4/seedrandom.min.js');

self.onmessage = function(event) {
    const { numDays, seed, startDay, dailyCost, pricePerLiter, climateData, salesData } = event.data;

    function simulateSalesBatch(numDays, seed, startDay) {
        Math.seedrandom(seed);

        const climateCumulative = climateData.reduce((acc, current) => acc.concat(acc.length ? acc[acc.length - 1] + current.probability : current.probability), []);
        const simData = [];

        for (let day = startDay; day < startDay + numDays; day++) {
            const NA = Math.random();
            const climateIndex = climateCumulative.findIndex(prob => NA <= prob);
            const climate = climateData[climateIndex].climate;

            const NA2 = Math.random();
            const salesRows = salesData.filter(d => d.climate === climate);
            const salesCumulative = salesRows.reduce((acc, current) => acc.concat(acc.length ? acc[acc.length - 1] + current.probability : current.probability), []);
            const salesIndex = salesCumulative.findIndex(prob => NA2 <= prob);
            const litersSold = salesRows[salesIndex] ? salesRows[salesIndex].litersSold : NaN;

            const income = litersSold * pricePerLiter;
            const dailyProfit = income - dailyCost;
            simData.push({ day, NA, climate, NA2, litersSold, income, dailyProfit });
        }
        return simData;
    }

    const result = simulateSalesBatch(numDays, seed, startDay);
    self.postMessage(result);
};
