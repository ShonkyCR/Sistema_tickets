<?php
require_once 'conexion.php';

// Capturar el cuerpo de la petición POST en formato JSON
$datos = json_decode(file_get_contents("php://input"), true);

if (!empty($datos['correo']) && !empty($datos['contrasena'])) {
    try {
        $query = "SELECT id, nombre, correo, rol FROM usuarios WHERE correo = :correo AND contrasena = :contrasena";
        $stmt = $conexion->prepare($query);

        $stmt->bindParam(":correo", $datos['correo']);
        $stmt->bindParam(":contrasena", $datos['contrasena']); // Validación simple en texto plano para el ejemplo
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($usuario);
        } else {
            echo json_encode(["error" => "Credenciales incorrectas"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Datos incompletos"]);
}
?>