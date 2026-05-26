document.addEventListener("DOMContentLoaded", () => {

    google.charts.load("current", { packages: ["corechart", "table"] });

    let googleReady = false;
    google.charts.setOnLoadCallback(() => googleReady = true);

    let currentUser = window.LOGGED_IN_USER;
    let currentTicker = "All";

    let monthlyData = [];
    let weeklyData = [];

    let monthlyTableDT = null;
    let weeklyTableDT = null;


    // -------------------------------
    // SAVE SETTINGS
    // -------------------------------
    window.saveSettings = function () {
        const low = document.getElementById("sliderLow")?.value;
        const high = document.getElementById("sliderHigh")?.value;

        if (low === undefined || high === undefined) {
            alert("Load data before saving settings.");
            return;
        }

        const fd = new FormData();
        fd.append("low", low);
        fd.append("high", high);

        fetch("save_settings.php", {
            method: "POST",
            body: fd
        })
        .then(res => res.json())
        .then(resp => {
            if (resp.status === "ok") {
                alert("Settings saved!");
            } else {
                alert("Error saving settings.");
            }
        })
        .catch(() => {
            alert("Network error saving settings.");
        });
    };

    // -------------------------------
    // OUTLIER HELPER (IQR)
    // -------------------------------
    function calculateOutliers(values) {
        if (values.length < 4) {
            return { lower: -Infinity, upper: Infinity };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;

        return {
            lower: q1 - 1.5 * iqr,
            upper: q3 + 1.5 * iqr
        };
    }

    // -------------------------------
    // LOAD DATA
    // -------------------------------
    window.loadDBData = function () {
        fetch("get_tickers.php")
            .then(res => res.json())
            .then(tickers => {
                const dd = document.getElementById("tickerDropdown");
                dd.innerHTML = "";
                dd.appendChild(new Option("All", "All"));
                tickers.forEach(t => dd.appendChild(new Option(t, t)));
                dd.disabled = false;
                dd.value = "All";

                loadMonthly("All");
                loadWeekly("All");
            });
    };

    document.getElementById("tickerDropdown").addEventListener("change", e => {
        currentTicker = e.target.value;
        loadMonthly(currentTicker);
        loadWeekly(currentTicker);
    });

    function initSliders() {
    const lowSlider = document.getElementById("sliderLow");
    const highSlider = document.getElementById("sliderHigh");
    const lowVal = document.getElementById("sliderLowVal");
    const highVal = document.getElementById("sliderHighVal");

    if (!monthlyData || monthlyData.length === 0) return;

    const values = monthlyData.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    lowSlider.min = min;
    lowSlider.max = max;
    highSlider.min = min;
    highSlider.max = max;

    // default positions
    lowSlider.value = min;
    highSlider.value = max;

    lowSlider.disabled = false;
    highSlider.disabled = false;

    lowVal.textContent = min.toFixed(2);
    highVal.textContent = max.toFixed(2);

    lowSlider.oninput = () => {
        if (+lowSlider.value > +highSlider.value) {
            lowSlider.value = highSlider.value;
        }
        lowVal.textContent = (+lowSlider.value).toFixed(2);
        drawMonthlyChart();
    };

    highSlider.oninput = () => {
        if (+highSlider.value < +lowSlider.value) {
            highSlider.value = lowSlider.value;
        }
        highVal.textContent = (+highSlider.value).toFixed(2);
        drawMonthlyChart();
    };
}

    // -------------------------------
    // MONTHLY
    // -------------------------------
    function loadMonthly(ticker) {
        fetch(`get_monthly_chart.php?ticker=${encodeURIComponent(ticker)}`)
            .then(res => res.json())
            .then(rows => {
                monthlyData = rows.map(r => ({
                    label: `${r.yr}-${String(r.mn).padStart(2,"0")}`,
                    value: +r.avg_close
                }));
                initSliders();
                drawMonthlyChart();
                buildMonthlyTable();
                redrawActiveTable();
            });
    }

    function drawMonthlyChart() {
    if (!googleReady) return;

    const low = +document.getElementById("sliderLow").value;
    const high = +document.getElementById("sliderHigh").value;

    // FILTER DATA BY SLIDER RANGE
    const filtered = monthlyData.filter(r =>
        r.value >= low && r.value <= high
    );

    const dt = new google.visualization.DataTable();
    dt.addColumn("string", "Month");
    dt.addColumn("number", "Avg Close");

    filtered.forEach(r => {
        dt.addRow([r.label, r.value]);
    });

    const chart = new google.visualization.ColumnChart(
        document.getElementById("monthly_chart")
    );

    chart.draw(dt, {
        title: `Monthly Avg Close (${currentTicker})`,
        legend: "none",

        // LOCK WIDTH — THIS IS CRITICAL
        chartArea: {
            left: 60,
            top: 40,
            width: "85%",
            height: "70%"
        },

        // PREVENT X-AXIS EXPANSION
        hAxis: {
            slantedText: true,
            slantedTextAngle: 45,
            maxTextLines: 2,
            textPosition: "out"
        },

        //  Y-AXIS IS WHAT CHANGES
        vAxis: {
            title: "Avg Close",
            viewWindow: {
                min: low,
                max: high
            }
        }
    });
}

    function buildMonthlyTable() {
    const prices = monthlyData.map(r => r.value);
    const out = calculateOutliers(prices);

    monthlyTableDT = new google.visualization.DataTable();
    monthlyTableDT.addColumn("string", "Month");
    monthlyTableDT.addColumn("number", "Avg Close");
    monthlyTableDT.addColumn({ type: "string", role: "style" }); // MUST be last

    monthlyData.forEach(r => {
        const isOut = r.value < out.lower || r.value > out.upper;
        monthlyTableDT.addRow([
            r.label,
            r.value,
            isOut ? "background-color:#fff3a0;" : null
            ]);
        });
    }


    // -------------------------------
    // WEEKLY
    // -------------------------------
    function loadWeekly(ticker) {
        fetch(`get_corr_chart.php?ticker=${encodeURIComponent(ticker)}`)
            .then(res => res.json())
            .then(resp => {
                weeklyData = resp.weekly || [];

                drawWeeklyChart();
                buildWeeklyTable();
                redrawActiveTable();
            });
    }

    function drawWeeklyChart() {
        if (!googleReady || weeklyData.length === 0) return;

        const dt = new google.visualization.DataTable();
        dt.addColumn("string", "Week");
        dt.addColumn("number", "Close");
        dt.addColumn("number", "Volume");

        weeklyData.forEach(r =>
            dt.addRow([r.date, r.close_price, r.volume])
        );

        new google.visualization.LineChart(
            document.getElementById("corr_chart")
        ).draw(dt, {
            title: `Weekly Close vs Volume (${currentTicker})`,
            chartArea: { width: "85%", height: "70%" },
            series: { 1: { targetAxisIndex: 1 } },
            vAxes: {
                0: { title: "Close" },
                1: { title: "Volume" }
            }
        });
    }

    function buildWeeklyTable() {
    const weeklyVolumes = weeklyData.map(r => r.volume);
    const out = calculateOutliers(weeklyVolumes);

    weeklyTableDT = new google.visualization.DataTable();
    weeklyTableDT.addColumn("string", "Week");
    weeklyTableDT.addColumn("number", "Close");
    weeklyTableDT.addColumn("number", "Volume");
    weeklyTableDT.addColumn({ type: "string", role: "style" }); // MUST be last

    weeklyData.forEach(r => {
        const isOut = r.volume < out.lower || r.volume > out.upper;
        weeklyTableDT.addRow([
            r.date,
            r.close_price,
            r.volume,
            isOut ? "background-color:#fff3a0;" : null
        ]);
    });
    }

    // -------------------------------
    // TABLE TABS
    // -------------------------------
    function redrawActiveTable() {
    if (!googleReady) return;

    const active = document.querySelector(".tab-btn.active").dataset.target;

    if (active === "monthly_table" && monthlyTableDT) {
        new google.visualization.Table(
            document.getElementById("monthly_table")
        ).draw(monthlyTableDT, {
            width: "100%",
            height: "400px",
            allowHtml: true 
        });
    }

    if (active === "weekly_table" && weeklyTableDT) {
        new google.visualization.Table(
            document.getElementById("weekly_table")
        ).draw(weeklyTableDT, {
            width: "100%",
            height: "400px",
            allowHtml: true 
        });
    }
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.getElementById("monthly_table").style.display = "none";
            document.getElementById("weekly_table").style.display = "none";

            document.getElementById(btn.dataset.target).style.display = "block";
            redrawActiveTable();
        });
    });

});

window.Manual = function () {
    window.open(
        "user_manual.pdf",
        "_blank"
    );
};