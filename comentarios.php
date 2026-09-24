<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    // OBTENER COMENTARIOS DE UN TICKET SPECÍFICO
    $id_ticket = isset($_GET['id_ticket']) ? $_GET['id_ticket'] : null;
    if ($id_ticket) {
        try {
            $sql = "SELECT c.*, u.nombre AS autor, u.rol FROM comentarios c 
                    JOIN usuarios u ON c.id_usuario = u.id 
                    WHERE c.id_ticket = :id_ticket ORDER BY c.fecha_creacion ASC";
            $stmt = $conexion->prepare($sql);
            $stmt->bindValue(':id_ticket', $id_ticket);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
} elseif ($metodo === 'POST') {
    // AGREGAR UN COMENTARIO AL HISTORIAL
    $datos = json_decode(file_get_contents("php://input"), true);
    if (!empty($datos['id_ticket']) && !empty($datos['id_usuario']) && !empty($datos['comentario'])) {
        try {
            $sql = "INSERT INTO comentarios (id_ticket, id_usuario, comentario) VALUES (:id_ticket, :id_usuario, :comentario)";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ':id_ticket' => $datos['id_ticket'],
                ':id_usuario' => $datos['id_usuario'],
                ':comentario' => $datos['comentario']
            ]);

            // Notificar a los demás usuarios involucrados en el ticket (solicitante y técnico asignado)
            $stmtTicket = $conexion->prepare("SELECT titulo, id_solicitante, id_tecnico_asignado FROM tickets WHERE id = :id_ticket");
            $stmtTicket->execute([':id_ticket' => $datos['id_ticket']]);
            $ticket = $stmtTicket->fetch(PDO::FETCH_ASSOC);

            if ($ticket) {
                $involucrados = array_unique(array_filter([$ticket['id_solicitante'], $ticket['id_tecnico_asignado']]));
                $stmtNotif = $conexion->prepare("INSERT INTO notificaciones (id_usuario, mensaje) VALUES (:id_usuario, :mensaje)");
                $mensaje = "Nuevo comentario en el ticket: " . $ticket['titulo'];
                foreach ($involucrados as $idInvolucrado) {
                    // No notificar a quien acaba de escribir el comentario
                    if ($idInvolucrado != $datos['id_usuario']) {
                        $stmtNotif->execute([':id_usuario' => $idInvolucrado, ':mensaje' => $mensaje]);
                    }
                }
            }

            echo json_encode(["success" => "Comentario añadido"]);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>