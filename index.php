<?php
session_start();

if (!isset($_SESSION["logged_in"])) {
    header("Location: login.html");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Stock Market Dashboard</title>

    <link rel="stylesheet" href="styles.css" />

    <!-- Inject logged-in user -->
    <script>
        window.LOGGED_IN_USER = <?= json_encode($_SESSION["login"]) ?>;
    </script>

    <!-- Google Charts -->
    <script src="https://www.gstatic.com/charts/loader.js"></script>

    <!-- App logic -->
    <script src="charts.js" defer></script>
</head>

<body>
<header>
    <h1>Stock Market Dashboard</h1>

    <div id="login-area" style="color:#f0b429; float:right; margin-top:-35px; margin-right:20px;">
        Welcome,
        <strong><?= htmlspecialchars($_SESSION["login"]) ?></strong>
        |
        <a href="logout.php" style="color:#f0b429; text-decoration:none;">
            Logout
        </a>
    </div>
</header>

<div id="container">

    <!-- SIDEBAR -->
    <aside id="sidebar">
        <h2>Select Ticker</h2>
        <select id="tickerDropdown" disabled>
            <option>Loading...</option>
        </select>

        <h2>Filter by Close Price</h2>

        <div class="slider-group">
            <label>Low:</label>
            <span id="sliderLowVal"></span>
            <input type="range" id="sliderLow" disabled />
        </div>

        <div class="slider-group">
            <label>High:</label>
            <span id="sliderHighVal"></span>
            <input type="range" id="sliderHigh" disabled />
        </div>

        <button onclick="loadDBData()">Load Data</button>

        <div style="margin-top: 20px;">
        <button id="btnSaveSettings" onclick="saveSettings()">
            Save Settings
        </button>

        <div style="margin-top: 20px;">
        <button id="btnManual" onclick="Manual()">
            Need Help?
        </button>
    </aside>

    <!-- MAIN -->
    <main id="content">

        <section class="panel">
            <h2>Monthly Average Close Price</h2>
            <div id="monthly_chart" class="chart-box"></div>
        </section>

        <section class="panel">
            <h2>Weekly Close Price vs Volume</h2>
            <div id="corr_chart" class="chart-box"></div>
        </section>

        <section class="panel">
            <h2>Loaded Data</h2>

            <div class="table-tabs">
                <button class="tab-btn active" data-target="monthly_table">Monthly Data</button>
                <button class="tab-btn" data-target="weekly_table">Weekly Data</button>
            </div>

            <div id="monthly_table" class="table-box"></div>
            <div id="weekly_table" class="table-box" style="display:none;"></div>
        </section>

    </main>
</div>
</body>
</html>
