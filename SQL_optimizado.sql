SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
CREATE DATABASE IF NOT EXISTS `rol` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `rol`;
CREATE TABLE `cargo` (
  `id` int NOT NULL,
  `descripcion` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `cargo` (`id`, `descripcion`) VALUES
(1, 'Vista_administrador'),
(2, 'Vista_cliente');
CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `nombre` varchar(250) NOT NULL,
  `usuario` varchar(2250) NOT NULL,
  `contraseña` varchar(250) NOT NULL,
  `id_cargo` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `contraseña`, `id_cargo`) VALUES
(1, 'Carlos Armando Xolalpa Torres', 'Xolalpa', '12345', 1),
(2, 'Jesus Cerecedo Gallegos', 'Cerecedo', '1234', 2),
(3, 'Luis Fernando', 'Luis', '123', 2);
ALTER TABLE `cargo`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cargo` (`id_cargo`);
ALTER TABLE `cargo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_cargo`) REFERENCES `cargo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;