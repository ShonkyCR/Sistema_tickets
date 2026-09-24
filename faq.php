<?php
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $buscar = isset($_GET['buscar']) ? $_GET['buscar'] : '';
        $sql = "SELECT * FROM faq WHERE 1=1";
        if (!empty($buscar)) {
            $sql .= " AND (pregunta LIKE :buscar OR respuesta LIKE :buscar OR categoria LIKE :buscar)";
        }
        $sql .= " ORDER BY categoria, pregunta ASC";

        try {
            $stmt = $conexion->prepare($sql);
            if (!empty($buscar)) {
                $term = "%" . $buscar . "%";
                $stmt->bindParam(':buscar', $term);
            }
            $stmt->execute();
            $faqs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($faqs);
        } catch (PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!empty($datos['pregunta']) && !empty($datos['respuesta']) && !empty($datos['categoria'])) {
            try {
                $sql = "INSERT INTO faq (pregunta, respuesta, categoria) VALUES (:pregunta, :respuesta, :categoria)";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([
                    ':pregunta' => $datos['pregunta'],
                    ':respuesta' => $datos['respuesta'],
                    ':categoria' => $datos['categoria']
                ]);
                echo json_encode(["success" => "Artículo de FAQ agregado correctamente"]);
            } catch (PDOException $e) {
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            echo json_encode(["error" => "Datos incompletos"]);
        }
        break;
}
?>
