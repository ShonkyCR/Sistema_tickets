CREATE DATABASE IF NOT EXISTS sistema_tickets;
USE sistema_tickets;

-- 1. Tabla de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('Solicitante', 'Técnico', 'Administrador') NOT NULL
);

-- 2. Tabla de Inventario (Gestión de activos)
CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    id_usuario_asignado INT DEFAULT NULL,
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Tabla de Tickets
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria ENUM('Hardware', 'Software', 'Red') NOT NULL,
    prioridad ENUM('Baja', 'Media', 'Alta') NOT NULL,
    estado ENUM('Abierto', 'En Proceso', 'Resuelto', 'Cerrado') DEFAULT 'Abierto',
    id_solicitante INT NOT NULL,
    id_tecnico_asignado INT DEFAULT NULL,
    id_activo INT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitante) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tecnico_asignado) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (id_activo) REFERENCES inventario(id) ON DELETE SET NULL
);

-- 4. Tabla de Comentarios (Historial)
CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ticket INT NOT NULL,
    id_usuario INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Tabla de Base de Conocimiento (FAQ)
CREATE TABLE faq (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta VARCHAR(255) NOT NULL,
    respuesta TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Encuestas de Satisfacción
CREATE TABLE encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ticket INT UNIQUE NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 7. Tabla de Notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Datos de prueba para que no empecés desde cero (Contraseña en texto plano para el ejemplo rústico)
INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
('Juan Solicitante', 'juan@mail.com', '123456', 'Solicitante'),
('Pedro Técnico', 'pedro@mail.com', '123456', 'Técnico'),
('Shonky Admin', 'admin@mail.com', '123456', 'Administrador');

-- Datos de prueba para inventario
INSERT INTO inventario (nombre, tipo, numero_serie, id_usuario_asignado) VALUES
('Laptop Dell Latitude 3420', 'Hardware', 'DSG-98421-X', 1),
('Monitor HP ProDisplay P223', 'Hardware', 'MON-77431-A', 1),
('Licencia Office 365 Pro', 'Software', 'LIC-O365-JUAN', 1),
('Servidor Apache Central', 'Hardware', 'SRV-ROOT-99', 3);

-- Datos de prueba para FAQ
INSERT INTO faq (pregunta, respuesta, categoria) VALUES
('¿Cómo puedo cambiar mi contraseña?', 'Para cambiar tu contraseña, comunícate con el Administrador a través del chat o solicita una renovación de credenciales directamente en el área de TI.', 'Seguridad'),
('¿Cómo me conecto a la VPN de la empresa?', 'Instala el cliente FortiClient, ingresa la dirección del servidor vpn.empresa.com y usa tus credenciales de red.', 'Red'),
('Problemas de impresión: impresora no responde', 'Verifica que el cable de red esté conectado o que estés en la misma red Wi-Fi. Reinicia el servicio de cola de impresión (spooler) de Windows si es necesario.', 'Hardware'),
('¿Dónde solicito licencias de nuevo software?', 'Crea un ticket en la categoría "Software" especificando el nombre del programa y la justificación de su uso.', 'Software');