<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        // LISTAR TICKETS CON FILTROS DINÁMICOS
        $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
        $rol = isset($_GET['rol']) ? $_GET['rol'] : null;
        $estado = isset($_GET['estado']) ? $_GET['estado'] : '';
        $prioridad = isset($_GET['prioridad']) ? $_GET['prioridad'] : '';

        // Consulta base
        $sql = "SELECT t.*, u.nombre AS solicitante, tec.nombre AS tecnico, i.nombre AS activo_nombre 
                FROM tickets t 
                JOIN usuarios u ON t.id_solicitante = u.id 
                LEFT JOIN usuarios tec ON t.id_tecnico_asignado = tec.id 
                LEFT JOIN inventario i ON t.id_activo = i.id
                WHERE 1=1";

        // Filtro por Rol (Seguridad)
        if ($rol === 'Solicitante') {
            $sql .= " AND t.id_solicitante = :id_usuario";
        } elseif ($rol === 'Técnico') {
            $sql .= " AND (t.id_tecnico_asignado = :id_usuario OR t.id_tecnico_asignado IS NULL)";
        }

        // Filtros de la interfaz
        if (!empty($estado))
            $sql .= " AND t.estado = :estado";
        if (!empty($prioridad))
            $sql .= " AND t.prioridad = :prioridad";

        try {
            $stmt = $conexion->prepare($sql);
            if ($rol === 'Solicitante' || $rol === 'Técnico')
                $stmt->bindParam(':id_usuario', $id_usuario);
            if (!empty($estado))
                $stmt->bindParam(':estado', $estado);
            if (!empty($prioridad))
                $stmt->bindParam(':prioridad', $prioridad);

            $stmt->execute();
            $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($tickets);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // CREAR TICKET (SOLICITANTE)
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['titulo']) && !empty($datos['descripcion']) && !empty($datos['id_solicitante'])) {
            try {
                $sql = "INSERT INTO tickets (titulo, descripcion, categoria, prioridad, id_solicitante, id_activo) 
                        VALUES (:titulo, :descripcion, :categoria, :prioridad, :id_solicitante, :id_activo)";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([
                    ':titulo' => $datos['titulo'],
                    ':descripcion' => $datos['descripcion'],
                    ':categoria' => $datos['categoria'],
                    ':prioridad' => $datos['prioridad'],
                    ':id_solicitante' => $datos['id_solicitante'],
                    ':id_activo' => !empty($datos['id_activo']) ? $datos['id_activo'] : null
                ]);

                // Crear notificaciones para Administradores y Técnicos
                $stmtAdmins = $conexion->prepare("SELECT id FROM usuarios WHERE rol IN ('Administrador', 'Técnico')");
                $stmtAdmins->execute();
                $staff = $stmtAdmins->fetchAll(PDO::FETCH_ASSOC);
                foreach ($staff as $s) {
                    $stmtNotif = $conexion->prepare("INSERT INTO notificaciones (id_usuario, mensaje) VALUES (:id_usuario, :mensaje)");
                    $mensaje = "Nuevo ticket: " . $datos['titulo'] . " (" . $datos['prioridad'] . ")";
                    $stmtNotif->execute([':id_usuario' => $s['id'], ':mensaje' => $mensaje]);
                }

                echo json_encode(["success" => "Ticket creado exitosamente"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // ACTUALIZAR TICKET (ESTADO / ASIGNACIÓN)
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['id_ticket'])) {
            try {
                // Obtener datos actuales del ticket antes de actualizar
                $stmtTicket = $conexion->prepare("SELECT id_solicitante, titulo, id_tecnico_asignado, estado FROM tickets WHERE id = :id");
                $stmtTicket->execute([':id' => $datos['id_ticket']]);
                $ticketPrevio = $stmtTicket->fetch(PDO::FETCH_ASSOC);

                if (isset($datos['id_tecnico_asignado']) && !empty($datos['id_tecnico_asignado'])) {
                    // El Admin asigna técnico y cambia estado
                    $sql = "UPDATE tickets SET estado = :estado, id_tecnico_asignado = :id_tecnico WHERE id = :id";
                    $stmt = $conexion->prepare($sql);
                    $stmt->execute([
                        ':estado' => $datos['estado'],
                        ':id_tecnico' => $datos['id_tecnico_asignado'],
                        ':id' => $datos['id_ticket']
                    ]);

                    // Notificar al técnico asignado si cambió
                    if ($ticketPrevio['id_tecnico_asignado'] != $datos['id_tecnico_asignado']) {
                        $stmtNotif = $conexion->prepare("INSERT INTO notificaciones (id_usuario, mensaje) VALUES (:id_usuario, :mensaje)");
                        $mensaje = "Se te ha asignado el ticket: " . $ticketPrevio['titulo'];
                        $stmtNotif->execute([':id_usuario' => $datos['id_tecnico_asignado'], ':mensaje' => $mensaje]);
                    }
                } else {
                    // El Técnico solo cambia el estado
                    $sql = "UPDATE tickets SET estado = :estado WHERE id = :id";
                    $stmt = $conexion->prepare($sql);
                    $stmt->execute([
                        ':estado' => $datos['estado'],
                        ':id' => $datos['id_ticket']
                    ]);
                }

                // Notificar al solicitante sobre el cambio de estado
                if ($ticketPrevio['estado'] != $datos['estado']) {
                    $stmtNotif = $conexion->prepare("INSERT INTO notificaciones (id_usuario, mensaje) VALUES (:id_usuario, :mensaje)");
                    $mensaje = "Tu ticket '" . $ticketPrevio['titulo'] . "' cambió a: " . $datos['estado'];
                    $stmtNotif->execute([':id_usuario' => $ticketPrevio['id_solicitante'], ':mensaje' => $mensaje]);
                }

                echo json_encode(["success" => "Ticket actualizado correctamente"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;
}
?>