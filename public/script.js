window.onload = function () {
    document.getElementById('input-date').valueAsDate = new Date();
    loadFixedMoney();
    loadHistory();
    calc();
    setupEnterMove()
    drawChart(7);
};

function loadFixedMoney() {
    if (localStorage.getItem('fixed-change')) {
        document.getElementById('fixed-change').value = localStorage.getItem('fixed-change');
    }
    if (localStorage.getItem('fixed-salary')) {
        document.getElementById('fixed-salary').value = localStorage.getItem('fixed-salary');
    }
    if (localStorage.getItem('fixed-other')) {
        document.getElementById('fixed-other').value = localStorage.getItem('fixed-other');
    }
}

function saveFixedMoney() {
    localStorage.setItem('fixed-change', document.getElementById('fixed-change').value);
    localStorage.setItem('fixed-salary', document.getElementById('fixed-salary').value);
    localStorage.setItem('fixed-other', document.getElementById('fixed-other').value);
    calc()
}

function calc() {
    let cashTotal = 0;

    const change = Number(document.getElementById('fixed-change').value);
    const salary = Number(document.getElementById('fixed-salary').value);
    const other = Number(document.getElementById('fixed-other').value);

    cashTotal += (change + salary + other);

    const inputs = document.querySelectorAll('.cash-count');
    inputs.forEach(input => {
        const val = Number(input.getAttribute('data-val'));
        const count = Number(input.value);
        cashTotal += val * count;
    });

    document.getElementById('display-cash-total').innerText = cashTotal.toLocaleString();

    const systemVal = Number(document.getElementById('input-system').value);
    const diff = cashTotal - systemVal;

    const diffArea = document.getElementById('diff-area');
    diffArea.innerText = `差額: ${diff.toLocaleString()} 円`;

    diffArea.className = 'diff-display';
    if (diff > 0) diffArea.classList.add('plus');
    else if (diff < 0) diffArea.classList.add('minus');
    else diffArea.classList.add('zero');

    return { cashTotal, systemVal };
}

async function saveRecord() {
    const date = document.getElementById('input-date').value;
    const { cashTotal, systemVal } = calc();
    const memo = document.getElementById('input-memo').value;

    if (!date) return alert("日付を入れてください");

    await fetch('/api/registers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: date,
            system_amount: systemVal,
            cash_amount: cashTotal,
            memo: memo
        })
    });

    const btn = document.querySelector('button[onclick="saveRecord()"]');
    const originalText = btn.innerText;
    btn.innerText = "✅ 保存完了";
    
    setTimeout(() => {
        btn.innerText = originalText;
    }, 2000);

    resetInputs();

    loadHistory();
}

async function loadHistory() {
    const res = await fetch('/api/registers');
    const data = await res.json();
    data.reverse();
    const tbody = document.getElementById('history-list');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        let colorStyle = 'color: green;';
        if (row.difference > 0) colorStyle = 'color: blue; font-weight:bold;';
        if (row.difference < 0) colorStyle = 'color: red; font-weight:bold;';

        tr.innerHTML = `
                    <td>${row.date}<br><small style="color:#666">${row.memo || ''}</small></td>
                    <td style="${colorStyle}">${row.difference}</td>
                    <td>${row.cash_amount.toLocaleString()}</td>
                    <td><button class="del-btn" onclick="deleteRecord(${row.id})">削除</button></td>
                `;
        tbody.appendChild(tr);
    });
}

async function deleteRecord(id) {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/registers/${id}`, { method: 'DELETE' });
    loadHistory();
}


function setupEnterMove() {
    const inputs = document.querySelectorAll('.input-section input');

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault()

                const nextInput = inputs[index + 1];

                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                } else {
                    document.getElementById('input-memo').focus();
                }
            }
        });
    });
}

let myChartObj = null;

async function drawChart(limitCount, btnElement) {
    if(btnElement) {
        const buttons = document.querySelectorAll('.scale-btn');

        buttons.forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const res = await fetch('/api/graph-data');
    const allData = await res.json();

    let targetData;

    if (limitCount >= allData.length) {
        targetData = allData;
    } else {
        targetData = allData.slice(-limitCount);
    }

    const labels = targetData.map(d => d.date);
    const cashData = targetData.map(d => d.cash_amount);
    const diffData = targetData.map(d => d.difference);

    const barColors = diffData.map(val => val >= 0 ? 'rgba(54, 162, 235, 0.7)' : 'rgba(255, 99, 132, 0.7)');

    if (myChartObj) {
        myChartObj.destroy();
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    myChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: '現金総額',
                    data: cashData,
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    type: 'bar',
                    label: '差額',
                    data: diffData,
                    backgroundColor: barColors,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '現金総額' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '差額' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function scrollToGraph() {
    const element = document.getElementById('graph');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function resetInputs() {
    document.getElementById('input-system').value = '';

    const counts = document.querySelectorAll('.cash-count');
    counts.forEach(input => input.value = '');

    document.getElementById('input-memo').value = '';

    calc();

    document.getElementById('input-date').focus();
}