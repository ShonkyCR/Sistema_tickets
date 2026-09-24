<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
        $rol = isset($_GET['rol']) ? $_GET['rol'] : null;

        $sql = "SELECT i.*, u.nombre AS usuario_nombre 
                FROM inventario i 
                LEFT JOIN usuarios u ON i.id_usuario_asignado = u.id";
        
        if ($rol === 'Solicitante' && !empty($id_usuario)) {
            $sql .= " WHERE i.id_usuario_asignado = :id_usuario";
        }

        try {
            $stmt = $conexion->prepare($sql);
            if ($rol === 'Solicitante' && !empty($id_usuario)) {
                $stmt->bindParam(':id_usuario', $id_usuario);
            }
            $stmt->execute();
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($items);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['nombre']) && !empty($datos['tipo']) && !empty($datos['numero_serie'])) {
            try {
                $sql = "INSERT INTO inventario (nombre, tipo, numero_serie, id_usuario_asignado) 
                        VALUES (:nombre, :tipo, :numero_serie, :id_usuario_asignado)";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([
                    ':nombre' => $datos['nombre'],
                    ':tipo' => $datos['tipo'],
                    ':numero_serie' => $datos['numero_serie'],
                    ':id_usuario_asignado' => !empty($datos['id_usuario_asignado']) ? $datos['id_usuario_asignado'] : null
                ]);
                echo json_encode(["success" => "Activo registrado en inventario exitosamente"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            echo json_encode(["error" => "Datos incompletos"]);
        }
        break;
}
?>
