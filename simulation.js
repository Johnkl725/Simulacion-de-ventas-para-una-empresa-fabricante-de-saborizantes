function updateProgress(progress) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    progressBar.textContent = `${progress}%`;

}

function simulateSales(numDays, seed) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('worker.js');
        worker.onmessage = function(event) {
            updateProgress(0);
            resolve(event.data);
            worker.terminate();
        };
        worker.onerror = function(error) {
            reject(error);
        };
        worker.postMessage({
            numDays,
            seed,
            startDay: 1,
            dailyCost: 1000,
            pricePerLiter: 50,
            climateData: [
                { climate: 'caluroso', probability: 0.5 },
                { climate: 'templado', probability: 0.25 },
                { climate: 'frio', probability: 0.15 },
                { climate: 'helado', probability: 0.1 }
            ],
            salesData: [
                { climate: 'caluroso', litersSold: 50, probability: 0.1 },
                { climate: 'caluroso', litersSold: 100, probability: 0.3 },
                { climate: 'caluroso', litersSold: 200, probability: 0.4 },
                { climate: 'caluroso', litersSold: 300, probability: 0.2 },
                { climate: 'templado', litersSold: 40, probability: 0.1 },
                { climate: 'templado', litersSold: 50, probability: 0.1 },
                { climate: 'templado', litersSold: 100, probability: 0.3 },
                { climate: 'templado', litersSold: 200, probability: 0.5 },
                { climate: 'frio', litersSold: 10, probability: 0.05 },
                { climate: 'frio', litersSold: 20, probability: 0.7 },
                { climate: 'frio', litersSold: 50, probability: 0.2 },
                { climate: 'frio', litersSold: 100, probability: 0.05 },
                { climate: 'helado', litersSold: 0, probability: 0.05 },
                { climate: 'helado', litersSold: 5, probability: 0.1 },
                { climate: 'helado', litersSold: 10, probability: 0.7 },
                { climate: 'helado', litersSold: 20, probability: 0.15 }
            ]
        });
    });
}

function runningAverage(data) {
    let sum = 0;
    return data.map((value, index) => {
        sum += value;
        return sum / (index + 1);
    });
}

function calculateStandardDeviation(data) {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
}

function calculateRunLength(alpha, epsilon, s) {
    return (1 / alpha) * Math.pow(s / epsilon, 2);
}

function runSimulation() {
    const numDays = parseInt(document.getElementById('numDays').value);
    if (numDays <= 0) {
        alert("Por favor ingrese un número positivo de días.");
        return;
    }

    const seed = Math.random();
    simulateSales(numDays, seed).then(result => {
        displayTable(result);

        const dailyProfits = result.map(d => d.dailyProfit);
        const movingAverage = runningAverage(dailyProfits);

        plotResults(dailyProfits, movingAverage);

        // Calcular y mostrar la longitud de la réplica
        const standardDeviation = calculateStandardDeviation(movingAverage);
        const alpha = 0.05;
        const epsilon = 2;
        const n = calculateRunLength(alpha, epsilon, standardDeviation);

        document.getElementById('replicaResult').textContent = `La longitud de la réplica es: ${Math.ceil(n)} días`;
    }).catch(error => {
        console.error(error);
    });
}

function displayTable(data) {
    const tableBody = document.querySelector("#resultTable tbody");
    tableBody.innerHTML = ""; // Clear previous results

    const runningAvg = runningAverage(data.map(d => d.dailyProfit));

    data.forEach((record, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.day}</td>
            <td>${record.NA.toFixed(6)}</td>
            <td>${record.climate}</td>
            <td>${record.NA2.toFixed(6)}</td>
            <td>${record.litersSold.toFixed(2)}</td>
            <td>${record.income.toFixed(2)}</td>
            <td>${record.dailyProfit.toFixed(2)}</td>
            <td>${runningAvg[index].toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}
let chart = 0;
function plotResults(dailyData, movingAverageData) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (chart) {
        chart.destroy();  // Destruye el grafico previo si existe
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map((_, i) => i + 1),
            datasets: [{
                label: 'Utilidad Diaria',
                data: dailyData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'Promedio Móvil',
                data: movingAverageData,
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Días'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Utilidad (en $)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function clearData() {
    // Limpiar los datos de la tabla
    const tableBody = document.querySelector("#resultTable tbody");
    tableBody.innerHTML = "";
    document.getElementById('progressBar').value = 0;

    // Limpiar el gráfico si existe
    if (chart) {
        chart.destroy();
        
    }

    // Limpiar el resultado de la longitud de la réplica
    document.getElementById('replicaResult').textContent = '';
}

function runReplicas() {
    const numDays = parseInt(document.getElementById('numDays').value);
    const numReplicas = parseInt(document.getElementById('numReplicas').value);
    if (numDays <= 0 || numReplicas <= 0) {
        alert("Por favor ingrese un número positivo de días y réplicas.");
        return;
    }

    const allReplicas = [];
    let completedReplicas = 0;

    for (let i = 0; i < numReplicas; i++) {
        const seed = Math.random();
        simulateSales(numDays, seed).then(result => {
            const dailyProfits = result.map(d => d.dailyProfit);
            const movingAverage = runningAverage(dailyProfits);
            allReplicas.push(movingAverage);
            completedReplicas++;
            updateProgress((completedReplicas / numReplicas) * 100);

            if (completedReplicas === numReplicas) {
                plotReplicas(allReplicas);
            }
        }).catch(error => {
            console.error(error);
        });
    }
}

function plotReplicas(allReplicas) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (chart) {
        chart.destroy();  // Destruye el grafico previo si existe
    }
    const datasets = allReplicas.map((replica, index) => ({
        label: `Replica ${index + 1}`,
        data: replica,
        borderColor: `rgba(${index % 255}, ${(index * 50) % 255}, ${(index * 100) % 255}, 1)`,
        borderWidth: 1,
        fill: false
    }));
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: allReplicas[0].length }, (_, i) => i + 1),
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Días'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Utilidad (en $)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}
