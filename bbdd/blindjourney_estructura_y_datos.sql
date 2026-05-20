-- ============================================================
-- BlindJourney · Estructura completa + datos de prueba
-- ============================================================
-- Codificacion: UTF-8 (sin BOM)
--
-- INSTRUCCIONES:
--   Importa este archivo en DBeaver o con:
--     mysql -u root -p < blindjourney_estructura_y_datos.sql
--
-- Contrasena de todos los usuarios de prueba: Test1234!
--   Hash bcrypt (coste 12): $2a$12$ZMXhfouEaSGIoGz1nw/9l.hRI3cdZXQYRqhYRXWAlYrBLDMXIVu1C
-- ============================================================

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- ============================================================
-- BASE DE DATOS
-- ============================================================
-- Si la BD no existe todavia, ejecuta esto primero en DBeaver:
--   CREATE DATABASE blindjourney CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blindjourney;

-- Borrar tablas existentes respetando FK (orden inverso de dependencias)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS comisiones;
DROP TABLE IF EXISTS fotos_viaje;
DROP TABLE IF EXISTS documentos;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS itinerarios;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS candidatos;
DROP TABLE IF EXISTS viajes;
DROP TABLE IF EXISTS perfiles;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- ESTRUCTURA DE TABLAS
-- ============================================================

-- ── usuarios ─────────────────────────────────────────────────
CREATE TABLE usuarios (
  id                  INT          NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  telefono            VARCHAR(20)  DEFAULT NULL,
  email_verificado    BOOL   NOT NULL DEFAULT 0,
  token_verificacion  VARCHAR(128) DEFAULT NULL,
  refresh_token       TEXT         DEFAULT NULL,
  reset_token         VARCHAR(128) DEFAULT NULL,
  reset_expiracion    DATETIME     DEFAULT NULL,
  idioma              VARCHAR(5)   NOT NULL DEFAULT 'es',
  fecha_creacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── perfiles ─────────────────────────────────────────────────
CREATE TABLE perfiles (
  id                         INT          NOT NULL AUTO_INCREMENT,
  usuario_id                 INT          NOT NULL,
  idioma                     VARCHAR(5)   NOT NULL DEFAULT 'es',
  moneda                     VARCHAR(3)   NOT NULL DEFAULT 'EUR',
  tipo_alojamiento           VARCHAR(50)  DEFAULT NULL,
  intereses                  JSON         DEFAULT NULL,
  nivel_actividad            ENUM('tranquilo','moderado','activo','aventurero') NOT NULL DEFAULT 'moderado',
  restricciones_alimentarias JSON         DEFAULT NULL,
  notificaciones             JSON         DEFAULT NULL,
  ciudad_origen              VARCHAR(100) NOT NULL DEFAULT 'Madrid',
  fecha_creacion             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_perfil_usuario (usuario_id),
  CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── viajes ───────────────────────────────────────────────────
CREATE TABLE viajes (
  id                  INT           NOT NULL AUTO_INCREMENT,
  usuario_id          INT           NOT NULL,
  destino_ciudad      VARCHAR(100)  DEFAULT NULL,
  destino_pais        VARCHAR(100)  DEFAULT NULL,
  presupuesto         DECIMAL(10,2) DEFAULT NULL,
  fecha_inicio        DATE          DEFAULT NULL,
  fecha_fin           DATE          DEFAULT NULL,
  duracion            INT           DEFAULT NULL,
  estado              ENUM('pendiente','confirmado','revelado','completado','cancelado') NOT NULL DEFAULT 'pendiente',
  destino_revelado    BOOL    NOT NULL DEFAULT 0,
  fecha_revelacion    DATETIME      DEFAULT NULL,
  revelar_en          DATETIME      DEFAULT NULL,
  fecha_creacion      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_viaje_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── candidatos ───────────────────────────────────────────────
CREATE TABLE candidatos (
  id              INT           NOT NULL AUTO_INCREMENT,
  viaje_id        INT           NOT NULL,
  ciudad          VARCHAR(100)  NOT NULL,
  pais            VARCHAR(100)  NOT NULL,
  tipo_viaje      VARCHAR(50)   DEFAULT NULL,
  precio_estimado DECIMAL(10,2) DEFAULT NULL,
  descripcion     TEXT          DEFAULT NULL,
  clima           VARCHAR(100)  DEFAULT NULL,
  idioma          VARCHAR(50)   DEFAULT NULL,
  duracion_vuelo  VARCHAR(50)   DEFAULT NULL,
  imagen_url      VARCHAR(500)  DEFAULT NULL,
  vetado          BOOL    NOT NULL DEFAULT 0,
  razon_veto      VARCHAR(255)  DEFAULT NULL,
  seleccionado    BOOL    NOT NULL DEFAULT 0,
  fecha_creacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_candidato_viaje FOREIGN KEY (viaje_id) REFERENCES viajes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── reservas ─────────────────────────────────────────────────
CREATE TABLE reservas (
  id                   INT          NOT NULL AUTO_INCREMENT,
  viaje_id             INT          NOT NULL,
  alojamiento          VARCHAR(255) DEFAULT NULL,
  transporte           VARCHAR(255) DEFAULT NULL,
  codigo_reserva_hotel VARCHAR(100) DEFAULT NULL,
  codigo_reserva_vuelo VARCHAR(100) DEFAULT NULL,
  estado               ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  fecha_reserva        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_creacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_reserva_viaje FOREIGN KEY (viaje_id) REFERENCES viajes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── pagos ────────────────────────────────────────────────────
CREATE TABLE pagos (
  id                       INT           NOT NULL AUTO_INCREMENT,
  reserva_id               INT           NOT NULL,
  stripe_payment_intent_id VARCHAR(255)  DEFAULT NULL,
  stripe_charge_id         VARCHAR(255)  DEFAULT NULL,
  importe                  DECIMAL(10,2) NOT NULL,
  moneda                   VARCHAR(3)    NOT NULL DEFAULT 'eur',
  estado                   ENUM('pendiente','completado','fallido','reembolsado') NOT NULL DEFAULT 'pendiente',
  fecha_pago               DATETIME      DEFAULT NULL,
  fecha_creacion           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stripe_intent (stripe_payment_intent_id),
  CONSTRAINT fk_pago_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── itinerarios ──────────────────────────────────────────────
CREATE TABLE itinerarios (
  id                  INT          NOT NULL AUTO_INCREMENT,
  viaje_id            INT          NOT NULL,
  generado_por_ia     BOOL   NOT NULL DEFAULT 1,
  destino_ciudad      VARCHAR(100) DEFAULT NULL,
  destino_pais        VARCHAR(100) DEFAULT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_itinerario_viaje FOREIGN KEY (viaje_id) REFERENCES viajes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── actividades ──────────────────────────────────────────────
CREATE TABLE actividades (
  id               INT           NOT NULL AUTO_INCREMENT,
  itinerario_id    INT           NOT NULL,
  dia              INT           NOT NULL,
  hora             VARCHAR(5)    DEFAULT NULL,
  nombre           VARCHAR(255)  NOT NULL,
  descripcion      TEXT          DEFAULT NULL,
  tipo             ENUM('cultura','gastronomia','ocio','transporte','alojamiento','naturaleza') NOT NULL DEFAULT 'ocio',
  ubicacion        VARCHAR(255)  DEFAULT NULL,
  duracion_minutos INT           DEFAULT NULL,
  coste_estimado   DECIMAL(10,2) DEFAULT NULL,
  importante       BOOL          NOT NULL DEFAULT 0,
  completada       BOOL          NOT NULL DEFAULT 0,
  fecha_creacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_actividad_itinerario FOREIGN KEY (itinerario_id) REFERENCES itinerarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── notificaciones ───────────────────────────────────────────
CREATE TABLE notificaciones (
  id             INT          NOT NULL AUTO_INCREMENT,
  usuario_id     INT          NOT NULL,
  tipo           VARCHAR(50)  NOT NULL DEFAULT 'info',
  titulo         VARCHAR(255) NOT NULL,
  mensaje        TEXT         NOT NULL,
  leida          BOOL   NOT NULL DEFAULT 0,
  datos_extra    JSON         DEFAULT NULL,
  fecha_creacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── documentos ───────────────────────────────────────────────
CREATE TABLE documentos (
  id                  INT          NOT NULL AUTO_INCREMENT,
  usuario_id          INT          NOT NULL,
  viaje_id            INT          DEFAULT NULL,
  tipo                ENUM('pasaporte','visa','billete_vuelo','billete_tren','reserva_hotel','seguro','otro') NOT NULL DEFAULT 'otro',
  nombre              VARCHAR(255) NOT NULL,
  nombre_archivo      VARCHAR(255) DEFAULT NULL,
  url_storage         TEXT         DEFAULT NULL,
  descripcion         TEXT         DEFAULT NULL,
  fecha_expiracion    DATE         DEFAULT NULL,
  activo              BOOL   NOT NULL DEFAULT 1,
  fecha_creacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_doc_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_viaje   FOREIGN KEY (viaje_id)   REFERENCES viajes   (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── fotos_viaje ──────────────────────────────────────────────
CREATE TABLE fotos_viaje (
  id               INT          NOT NULL AUTO_INCREMENT,
  viaje_id         INT          NOT NULL,
  usuario_id       INT          NOT NULL,
  url              LONGTEXT     NOT NULL,
  descripcion      VARCHAR(500) DEFAULT NULL,
  ubicacion_nombre VARCHAR(255) DEFAULT NULL,
  latitud          DECIMAL(10,8) DEFAULT NULL,
  longitud         DECIMAL(11,8) DEFAULT NULL,
  fecha_foto       DATETIME     DEFAULT NULL,
  activo           BOOL         NOT NULL DEFAULT 1,
  fecha_creacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_foto_viaje   FOREIGN KEY (viaje_id)   REFERENCES viajes   (id) ON DELETE CASCADE,
  CONSTRAINT fk_foto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── comisiones ───────────────────────────────────────────────
CREATE TABLE comisiones (
  id              INT          NOT NULL AUTO_INCREMENT,
  usuario_id      INT          NOT NULL,
  viaje_id        INT          DEFAULT NULL,
  tipo            ENUM('vuelo','hotel','experiencia','seguro') NOT NULL,
  proveedor       VARCHAR(100) DEFAULT NULL,
  destino_ciudad  VARCHAR(100) DEFAULT NULL,
  url_destino     TEXT         DEFAULT NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comision_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_comision_viaje   FOREIGN KEY (viaje_id)   REFERENCES viajes   (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- ── usuarios ─────────────────────────────────────────────────
INSERT INTO usuarios
  (id, nombre, apellidos, email, password_hash, telefono,
   email_verificado, idioma, fecha_creacion, fecha_actualizacion)
VALUES
  (1, 'Alicia', 'Maillo González',  'alicia@blindjourney.test',
   '$2a$12$ZMXhfouEaSGIoGz1nw/9l.hRI3cdZXQYRqhYRXWAlYrBLDMXIVu1C', '+34 611 223 344', 1, 'es', NOW(), NOW());


-- ── perfiles ─────────────────────────────────────────────────
INSERT INTO perfiles
  (id, usuario_id, idioma, moneda, tipo_alojamiento,
   intereses, nivel_actividad, restricciones_alimentarias,
   notificaciones, ciudad_origen, fecha_creacion, fecha_actualizacion)
VALUES
  (1, 1, 'es', 'EUR', 'hotel',
   '["cultura","gastronomia","museos"]',
   'moderado', '[]',
   '{"push":true,"email":true,"sms":false}',
   'Madrid', NOW(), NOW());


-- ── viajes ───────────────────────────────────────────────────
INSERT INTO viajes
  (id, usuario_id, destino_ciudad, destino_pais, presupuesto,
   fecha_inicio, fecha_fin, duracion, estado,
   destino_revelado, fecha_revelacion, revelar_en,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, 1, 'Roma',  'Italia', 850.00,
   '2026-05-10', '2026-05-17', 7, 'revelado',
   1, '2026-04-10 10:00:00', '2026-04-10 10:00:00', NOW(), NOW()),

  (2, 1, 'Amsterdam', 'Paises Bajos', 1200.00,
   '2026-07-01', '2026-07-08', 7, 'pendiente',
   0, NULL, '2026-06-15 08:00:00', NOW(), NOW());


-- ── candidatos ───────────────────────────────────────────────
INSERT INTO candidatos
  (viaje_id, ciudad, pais, tipo_viaje, precio_estimado, descripcion,
   clima, idioma, duracion_vuelo, seleccionado, fecha_creacion)
VALUES
  (1, 'Roma',      'Italia',          'cultura',     820.00,
   'La Ciudad Eterna: historia milenaria, arte renacentista y la mejor pasta del mundo.',
   'Templado, 20C en mayo',  'Italiano', '2h 30min desde Madrid', 1, NOW()),
  (1, 'Florencia', 'Italia',          'cultura',     780.00,
   'Cuna del Renacimiento, museos extraordinarios y la Toscana al alcance de la mano.',
   'Suave, 18C en mayo',     'Italiano', '2h 20min desde Madrid', 0, NOW()),
  (1, 'Praga',     'Republica Checa', 'cultura',     650.00,
   'Ciudad de cuento de hadas con casco historico medieval y cerveza artesanal.',
   'Fresco, 15C en mayo',    'Checo',    '2h 45min desde Madrid', 0, NOW()),

  (2, 'Amsterdam',  'Paises Bajos', 'cultura',      1150.00,
   'Canales, museos de clase mundial y vibrante escena gastronomica.',
   'Fresco, 17C en julio',   'Neerlandes',       '2h 45min desde Madrid', 0, NOW()),
  (2, 'Bruselas',   'Belgica',      'gastronomia',   900.00,
   'Capital de Europa, chocolates, cervezas artesanales y la Grand-Place.',
   'Suave, 19C en julio',    'Frances',          '2h 30min desde Madrid', 0, NOW()),
  (2, 'Copenhague', 'Dinamarca',    'ocio',          1300.00,
   'Diseño escandinavo, gastronomia nordica de vanguardia y ciudadanos felices.',
   'Templado, 20C en julio', 'Danes',            '3h 20min desde Madrid', 0, NOW());


-- ── reservas ─────────────────────────────────────────────────
INSERT INTO reservas
  (id, viaje_id, alojamiento, transporte,
   codigo_reserva_hotel, codigo_reserva_vuelo,
   estado, fecha_reserva, fecha_creacion, fecha_actualizacion)
VALUES
  (1, 1,
   'Hotel Colosseum Roma ****',
   'Iberia IB3456 MAD-FCO',
   'HTL-2026-001', 'IB-2026-3456',
   'confirmada', '2026-04-11 14:30:00', NOW(), NOW());


-- ── pagos ────────────────────────────────────────────────────
INSERT INTO pagos
  (reserva_id, stripe_payment_intent_id,
   importe, moneda, estado, fecha_pago,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, 'pi_3PaBcDEFdummy00001Roma',
   850.00, 'eur', 'completado', '2026-04-11 14:35:00', NOW(), NOW());


-- ── itinerarios ──────────────────────────────────────────────
INSERT INTO itinerarios
  (id, viaje_id, generado_por_ia, destino_ciudad, destino_pais,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, 1, 1, 'Roma',                   'Italia',  NOW(), NOW());


-- ── actividades – Roma (7 dias) ───────────────────────────────
INSERT INTO actividades
  (itinerario_id, dia, hora, nombre, descripcion, tipo,
   ubicacion, duracion_minutos, coste_estimado, fecha_creacion)
VALUES
  (1,1,'15:00','Check-in Hotel Colosseum','Llegada al hotel y acomodacion.',
   'alojamiento','Via Labicana 144, Roma',60,0.00,NOW()),
  (1,1,'17:00','Paseo por el Foro Romano','Primera toma de contacto con el centro historico.',
   'cultura','Via Sacra, Roma',90,16.00,NOW()),
  (1,1,'20:00','Cena en Trastevere','Cena en una tratoria autentica del barrio bohemio.',
   'gastronomia','Trastevere, Roma',90,30.00,NOW()),

  (1,2,'09:00','Coliseo y Foro Romano','Visita guiada con entrada anticipada.',
   'cultura','Piazza del Colosseo, Roma',180,22.00,NOW()),
  (1,2,'13:00','Almuerzo en Campo de Fiori','Mercado local y bocadillo en la plaza mas animada.',
   'gastronomia','Campo de Fiori, Roma',60,15.00,NOW()),
  (1,2,'15:00','Palacio Doria Pamphilj','Galeria con Velazquez y Caravaggio.',
   'cultura','Via del Corso 305, Roma',90,14.00,NOW()),
  (1,2,'19:00','Fontana di Trevi','El ritual de lanzar la moneda al atardecer.',
   'ocio','Piazza di Trevi, Roma',30,0.00,NOW()),

  (1,3,'09:00','Museos Vaticanos y Capilla Sixtina','Visita con guia. Entrada anticipada obligatoria.',
   'cultura','Viale Vaticano, Roma',240,27.00,NOW()),
  (1,3,'14:00','Basilica de San Pedro','Subida a la cupula para vistas panoramicas.',
   'cultura','Piazza San Pietro, Roma',120,8.00,NOW()),
  (1,3,'20:00','Aperitivo en Prati','Aperol Spritz y cicchetti en el barrio junto al Vaticano.',
   'gastronomia','Prati, Roma',60,20.00,NOW()),

  (1,4,'10:00','Aventino y el Jardin de los Naranjos','Vistas panoramicas de Roma desde el Aventino.',
   'naturaleza','Aventino, Roma',90,0.00,NOW()),
  (1,4,'12:00','Mercado de Testaccio','Mercado gastronomico local. Degustar el cacio e pepe.',
   'gastronomia','Testaccio, Roma',90,20.00,NOW()),
  (1,4,'16:00','Termas de Caracalla','Espectaculares ruinas de las termas imperiales del s. III.',
   'cultura','Via delle Terme di Caracalla, Roma',90,8.00,NOW()),
  (1,4,'20:00','Cena en Pigneto','Barrio alternativo y autentico, lejos del turismo.',
   'gastronomia','Pigneto, Roma',90,25.00,NOW()),

  (1,5,'10:00','Galeria Borghese','Bernini, Caravaggio y Rafael en un palacio del s. XVII.',
   'cultura','Piazzale Scipione Borghese 5, Roma',120,25.00,NOW()),
  (1,5,'13:00','Picnic en Villa Borghese','Almuerzo en los jardines del parque mas elegante de Roma.',
   'ocio','Villa Borghese, Roma',60,12.00,NOW()),
  (1,5,'16:00','Barrio Coppede','Arquitectura fantastica y eclectica, el secreto mejor guardado de Roma.',
   'cultura','Quartiere Coppede, Roma',60,0.00,NOW()),
  (1,5,'21:00','Cena de gala','Ultima gran cena en restaurante con estrella Michelin.',
   'gastronomia','Parioli, Roma',120,80.00,NOW()),

  (1,6,'10:00','Via Condotti y compras','Shopping en la calle mas lujosa de Roma.',
   'ocio','Via Condotti, Roma',180,0.00,NOW()),
  (1,6,'15:00','Palazzo Altemps','Museo con esculturas clasicas en un palacio renacentista.',
   'cultura','Piazza di Sant Apollinare 44, Roma',90,10.00,NOW()),
  (1,6,'20:00','Cena de despedida en Piazza Navona','Adios a Roma en la plaza barroca mas bella.',
   'gastronomia','Piazza Navona, Roma',90,35.00,NOW()),

  (1,7,'08:00','Desayuno y check-out','Ultimo desayuno romano y salida del hotel.',
   'alojamiento','Hotel Colosseum, Roma',60,0.00,NOW()),
  (1,7,'11:00','Transfer al aeropuerto FCO','Taxi al Aeropuerto Leonardo da Vinci.',
   'transporte','Aeropuerto de Fiumicino, Roma',60,40.00,NOW());


-- ── notificaciones ───────────────────────────────────────────
INSERT INTO notificaciones
  (usuario_id, tipo, titulo, mensaje, leida, datos_extra, fecha_creacion)
VALUES
  (1,'revelacion_destino','Tu destino esta listo!',
   'Enhorabuena Alicia! Ya puedes descubrir a donde viajas el 10 de mayo. Es Roma!',
   1,'{"viajeId":1}',NOW()),
  (1,'confirmacion','Reserva confirmada',
   'Tu reserva en el Hotel Colosseum Roma ha sido confirmada. Codigo: HTL-2026-001',
   1,'{"reservaId":1,"viajeId":1}',NOW()),
  (1,'confirmacion','Pago completado',
   'Hemos recibido tu pago de 850 EUR para el viaje a Roma. Ya es oficial!',
   1,'{"pagoId":1,"viajeId":1}',NOW()),
  (1,'recordatorio','Tu viaje a Roma en 2 semanas',
   'Faltan 14 dias para tu aventura en Roma. Asegurate de tener el pasaporte a mano.',
   0,'{"viajeId":1}',NOW()),
  (1,'sistema','Nuevo viaje sorpresa registrado',
   'Tu viaje sorpresa del 1 de julio ha sido registrado. La sorpresa llega el 15 de junio!',
   0,'{"viajeId":2}',NOW());


-- ── documentos ───────────────────────────────────────────────
INSERT INTO documentos
  (usuario_id, viaje_id, tipo, nombre, nombre_archivo,
   url_storage, descripcion, fecha_expiracion, activo,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, NULL, 'pasaporte', 'Mi pasaporte', 'pasaporte_alicia.pdf',
   'https://storage.blindjourney.test/docs/pasaporte_alicia.pdf',
   'Pasaporte vigente hasta 2031', '2031-03-15', 1, NOW(), NOW()),

  (1, 1, 'billete_vuelo', 'Vuelo MAD-FCO Iberia IB3456', 'billete_ib3456.pdf',
   'https://storage.blindjourney.test/docs/billete_ib3456.pdf',
   'Vuelo de ida Madrid-Roma Fiumicino', NULL, 1, NOW(), NOW()),

  (1, 1, 'reserva_hotel', 'Hotel Colosseum Confirmacion', 'hotel_colosseum_conf.pdf',
   'https://storage.blindjourney.test/docs/hotel_colosseum_conf.pdf',
   'Confirmacion de reserva del hotel en Roma', NULL, 1, NOW(), NOW());
