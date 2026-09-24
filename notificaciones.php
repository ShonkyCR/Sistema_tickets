<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
        if (empty($id_usuario)) {
            echo json_encode([]);
            exit();
        }

        $sql = "SELECT * FROM notificaciones 
                WHERE id_usuario = :id_usuario 
                ORDER BY fecha_creacion DESC LIMIT 20";
        try {
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':id_usuario', $id_usuario);
            $stmt->execute();
            $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($notificaciones);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Marcar como leídas
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['id_usuario'])) {
            try {
                $sql = "UPDATE notificaciones SET leido = 1 WHERE id_usuario = :id_usuario";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([':id_usuario' => $datos['id_usuario']]);
                echo json_encode(["success" => "Notificaciones marcadas como leídas"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['id_usuario']) && !empty($datos['mensaje'])) {
            try {
                $sql = "INSERT INTO notificaciones (id_usuario, mensaje) VALUES (:id_usuario, :mensaje)";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([
                    ':id_usuario' => $datos['id_usuario'],
                    ':mensaje' => $datos['mensaje']
                ]);
                echo json_encode(["success" => "Notificación creada"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;
}
?>
