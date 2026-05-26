<?php
session_start();
header("Content-Type: application/json");
include "dbconfig.php";

$username = $_POST["username"] ?? "";
$password = $_POST["password"] ?? "";

if ($username === "" || $password === "") {
    echo json_encode([
        "status" => "error",
        "message" => "Missing username or password"
    ]);
    exit;
}

$sql = "
    SELECT uid, login, name
    FROM datamining.DV_User
    WHERE login = ? AND password = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {

    $_SESSION["uid"] = $row["uid"];
    $_SESSION["login"] = $row["login"];
    $_SESSION["username"] = $row["login"];   // ✅ ADD THIS
    $_SESSION["name"] = $row["name"];
    $_SESSION["logged_in"] = true;

    echo json_encode([
        "status" => "success",
        "username" => $row["login"]           // ✅ ADD THIS
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid username or password"
    ]);
}
