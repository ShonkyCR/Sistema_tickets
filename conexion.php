<?php
// Permitir peticiones desde cualquier origen (CORS) para que Javascript no te dé problemas
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Si es una petición OPTIONS (preflight), terminar aquí
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$host = "127.0.0.1";
$port = "3307";
$db_name = "sistema_tickets";
$username = "root"; // Por defecto en XAMPP/Laragon
$password = "";     // Por defecto en XAMPP vacío

try {
    $conexion = new PDO("mysql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    // Configurar PDO para que lance excepciones en caso de error
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $exception) {
    echo json_encode(["error" => "Error de conexión: " . $exception->getMessage()]);
    exit();
}
?>