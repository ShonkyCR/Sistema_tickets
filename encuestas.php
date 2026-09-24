<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        // Listar encuestas
        $sql = "SELECT e.*, t.titulo AS ticket_titulo, u.nombre AS solicitante_nombre 
                FROM encuestas e 
                JOIN tickets t ON e.id_ticket = t.id 
                JOIN usuarios u ON t.id_solicitante = u.id 
                ORDER BY e.fecha_creacion DESC";
        try {
            $stmt = $conexion->prepare($sql);
            $stmt->execute();
            $encuestas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($encuestas);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['id_ticket']) && !empty($datos['calificacion'])) {
            try {
                // Verificar primero si el ticket ya tiene una encuesta registrada
                $check = $conexion->prepare("SELECT id FROM encuestas WHERE id_ticket = :id_ticket");
                $check->execute([':id_ticket' => $datos['id_ticket']]);
                if ($check->rowCount() > 0) {
                    echo json_encode(["error" => "Este ticket ya ha sido calificado anteriormente."]);
                    break;
                }

                $sql = "INSERT INTO encuestas (id_ticket, calificacion, comentario) 
                        VALUES (:id_ticket, :calificacion, :comentario)";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([
                    ':id_ticket' => $datos['id_ticket'],
                    ':calificacion' => $datos['calificacion'],
                    ':comentario' => isset($datos['comentario']) ? $datos['comentario'] : ''
                ]);
                echo json_encode(["success" => "¡Muchas gracias por su calificación!"]);
            } catch (PDOException $e) {
                // Mostrar el error real de la base de datos para poder diagnosticarlo
                echo json_encode(["error" => "Error al guardar la calificación: " . $e->getMessage()]);
            }
        } else {
            echo json_encode(["error" => "Datos incompletos"]);
        }
        break;
}
?>
