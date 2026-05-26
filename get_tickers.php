<?php
header("Content-Type: application/json");
include "dbconfig.php";
# dropdown values
$sql = "SELECT DISTINCT ticker FROM mart_monthly_avg ORDER BY ticker";
$result = $conn->query($sql);

$tickers = [];
while ($row = $result->fetch_assoc()) {
    $tickers[] = $row["ticker"];
}

echo json_encode($tickers);
?>
