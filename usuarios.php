<?php
require_once 'conexion.php';

// Solo se usa para listar personal de soporte (Técnico / Administrador)
// y así poblar el selector de "Técnico Asignado" en el detalle del ticket.
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    try {
        $sql = "SELECT id, nombre, rol FROM usuarios WHERE rol IN ('Técnico', 'Administrador') ORDER BY nombre ASC";
        $stmt = $conexion->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
