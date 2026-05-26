<?php
session_start();
require "dbconfig.php";

if (!isset($_SESSION["logged_in"])) {
    echo json_encode(["status" => "error"]);
    exit;
}

$uid  = $_SESSION["uid"];
$login = $_SESSION["login"];
$low  = $_POST["low"];
$high = $_POST["high"];

$sql = "
INSERT INTO User_Setting (uid, login, slider_low_value, slider_high_value)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    slider_low_value = VALUES(slider_low_value),
    slider_high_value = VALUES(slider_high_value),
    updated_at = CURRENT_TIMESTAMP
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("isdd", $uid, $login, $low, $high);
$stmt->execute();

echo json_encode(["status" => "ok"]);
