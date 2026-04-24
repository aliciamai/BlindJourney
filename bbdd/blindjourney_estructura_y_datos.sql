-- ============================================================
-- BlindJourney · Estructura completa + datos de prueba
-- ============================================================
-- Codificacion: UTF-8 (sin BOM)
--
-- INSTRUCCIONES:
--   1. Genera el hash bcrypt ejecutando en la carpeta /backend:
--        node -e "require('bcryptjs').hash('Test1234!', 12).then(console.log)"
--   2. Reemplaza las 3 ocurrencias de HASH_PENDIENTE con el hash.
--   3. Importa este archivo en DBeaver o con:
--        mysql -u root -p < seed.sql
--
-- Contrasena de todos los usuarios de prueba: Test1234!
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


-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- ── usuarios ─────────────────────────────────────────────────
INSERT INTO usuarios
  (id, nombre, apellidos, email, password_hash, telefono,
   email_verificado, idioma, fecha_creacion, fecha_actualizacion)
VALUES
  (1, 'Alicia', 'Maillo González',  'alicia@blindjourney.test',
   'HASH_PENDIENTE', '+34 611 223 344', 1, 'es', NOW(), NOW()),

  (2, 'Carlos', 'Ruiz Fernández',   'carlos@blindjourney.test',
   'HASH_PENDIENTE', '+34 622 334 455', 1, 'es', NOW(), NOW()),

  (3, 'María',  'García López',     'maria@blindjourney.test',
   'HASH_PENDIENTE', '+34 633 445 566', 1, 'es', NOW(), NOW());


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
   'Madrid', NOW(), NOW()),

  (2, 2, 'es', 'EUR', 'apartamento',
   '["naturaleza","aventura","senderismo"]',
   'activo', '["gluten"]',
   '{"push":true,"email":false,"sms":false}',
   'Barcelona', NOW(), NOW()),

  (3, 3, 'es', 'EUR', 'resort',
   '["playa","ocio","gastronomia"]',
   'tranquilo', '[]',
   '{"push":true,"email":true,"sms":true}',
   'Valencia', NOW(), NOW());


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
   0, NULL, '2026-06-15 08:00:00', NOW(), NOW()),

  (3, 2, 'Tokio', 'Japon', 2500.00,
   '2026-06-01', '2026-06-11', 10, 'revelado',
   1, '2026-05-01 09:00:00', '2026-05-01 09:00:00', NOW(), NOW()),

  (4, 2, 'Lisboa', 'Portugal', 600.00,
   '2026-08-15', '2026-08-22', 7, 'confirmado',
   0, NULL, '2026-08-13 08:00:00', NOW(), NOW()),

  (5, 3, 'Santa Cruz de Tenerife', 'España', 750.00,
   '2026-03-01', '2026-03-08', 7, 'completado',
   1, '2026-02-15 10:00:00', '2026-02-15 10:00:00', NOW(), NOW()),

  (6, 3, 'Paris', 'Francia', 1100.00,
   '2026-09-10', '2026-09-17', 7, 'pendiente',
   0, NULL, '2026-09-08 10:00:00', NOW(), NOW());


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
   'Templado, 20C en julio', 'Danes',            '3h 20min desde Madrid', 0, NOW()),

  (3, 'Tokio',   'Japon',         'cultura',        2450.00,
   'Metropolis que mezcla tradicion samurai, tecnologia futurista y gastronomia sublime.',
   'Suave, 22C en junio',    'Japones', '13h desde Madrid',        1, NOW()),
  (3, 'Seoul',    'Corea del Sur', 'ocio',           2100.00,
   'K-pop, palacios historicos y street food delicioso.',
   'Calido, 25C en junio',   'Coreano', '11h 30min desde Madrid',  0, NOW()),
  (3, 'Bangkok', 'Tailandia',     'gastronomia',    1800.00,
   'Templos dorados, mercados flotantes y la mejor gastronomia callejera de Asia.',
   'Calido y humedo, 33C en junio', 'Tailandes', '12h desde Madrid', 0, NOW()),

  (4, 'Lisboa', 'Portugal', 'cultura',    580.00,
   'Pasteles de Belem, fado, miradores y el encanto de las siete colinas junto al Tajo.',
   'Calido, 28C en agosto', 'Portugues', '1h 15min desde Madrid', 0, NOW()),
  (4, 'Oporto', 'Portugal', 'gastronomia', 540.00,
   'Ciudad del vino del Duero, livrarias y la arquitectura azulejada mas bonita de Portugal.',
   'Calido, 25C en agosto', 'Portugues', '1h 20min desde Madrid', 0, NOW()),

  (5, 'Santa Cruz de Tenerife',     'España', 'playa', 720.00,
   'Sol garantizado, el Teide y papas arrugadas con mojo.',
   'Calido, 23C en marzo', 'Español', '2h 45min desde Madrid', 1, NOW()),
  (5, 'Las Palmas de Gran Canaria', 'España', 'playa', 690.00,
   'Playa de las Canteras, casco historico de Vegueta y gastronomia atlantica.',
   'Calido, 22C en marzo', 'Español', '2h 30min desde Madrid', 0, NOW()),

  (6, 'Paris', 'Francia', 'cultura', 1050.00,
   'La Ciudad de la Luz: Torre Eiffel, Louvre y gastronomia de leyenda.',
   'Calido, 22C en septiembre', 'Frances', '1h 50min desde Madrid', 0, NOW()),
  (6, 'Niza',  'Francia', 'playa',    980.00,
   'Costa Azul, la Promenade des Anglais y el mercado de flores mas famoso de Francia.',
   'Calido, 27C en septiembre', 'Frances', '2h 10min desde Madrid', 0, NOW());


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
   'confirmada', '2026-04-11 14:30:00', NOW(), NOW()),

  (2, 3,
   'Shinjuku Granbell Hotel',
   'Japan Airlines JL55 MAD-NRT',
   'HTL-2026-003', 'JL-2026-0055',
   'pendiente', '2026-05-02 10:15:00', NOW(), NOW()),

  (3, 5,
   'Hotel Botanico & The Oriental Spa Garden *****',
   'Vueling VY6723 MAD-TFN',
   'HTL-2026-005', 'VY-2026-6723',
   'confirmada', '2026-02-16 09:00:00', NOW(), NOW());


-- ── pagos ────────────────────────────────────────────────────
INSERT INTO pagos
  (reserva_id, stripe_payment_intent_id,
   importe, moneda, estado, fecha_pago,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, 'pi_3PaBcDEFdummy00001Roma',
   850.00, 'eur', 'completado', '2026-04-11 14:35:00', NOW(), NOW()),

  (3, 'pi_3PaBcDEFdummy00003Tfe',
   750.00, 'eur', 'completado', '2026-02-16 09:05:00', NOW(), NOW());


-- ── itinerarios ──────────────────────────────────────────────
INSERT INTO itinerarios
  (id, viaje_id, generado_por_ia, destino_ciudad, destino_pais,
   fecha_creacion, fecha_actualizacion)
VALUES
  (1, 1, 1, 'Roma',                   'Italia',  NOW(), NOW()),
  (2, 3, 1, 'Tokio',                  'Japon',   NOW(), NOW()),
  (3, 5, 1, 'Santa Cruz de Tenerife', 'España',  NOW(), NOW());


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


-- ── actividades – Tokio (10 dias) ─────────────────────────────
INSERT INTO actividades
  (itinerario_id, dia, hora, nombre, descripcion, tipo,
   ubicacion, duracion_minutos, coste_estimado, fecha_creacion)
VALUES
  (2,1,'16:00','Check-in Shinjuku Granbell','Llegada desde Narita en Narita Express y check-in.',
   'alojamiento','Shinjuku, Tokio',120,32.00,NOW()),
  (2,1,'20:00','Ramen en Ichiran Shinjuku','Primer ramen en el famoso restaurante de booths individuales.',
   'gastronomia','Shinjuku, Tokio',60,12.00,NOW()),

  (2,2,'09:00','Santuario Meiji','Paseo matutino por el bosque que rodea el santuario shinto.',
   'cultura','Shibuya, Tokio',90,0.00,NOW()),
  (2,2,'11:00','Shibuya Crossing y Harajuku','El cruce mas famoso del mundo y el barrio mas excentrico de Tokio.',
   'ocio','Shibuya, Tokio',180,20.00,NOW()),
  (2,2,'16:00','Akihabara','Barrio de electronica, anime y cultura otaku.',
   'ocio','Akihabara, Tokio',120,50.00,NOW()),
  (2,2,'20:00','Cena Sushi Kaiten','Sushi en cinta transportadora en Kura Sushi.',
   'gastronomia','Akihabara, Tokio',60,20.00,NOW()),

  (2,3,'10:00','Senso-ji y Asakusa','El templo mas famoso de Tokio y el mercado de Nakamise.',
   'cultura','Asakusa, Tokio',120,0.00,NOW()),
  (2,3,'14:00','Tokyo Skytree','Vistas desde la segunda torre mas alta del mundo.',
   'ocio','Asakusa, Tokio',90,20.00,NOW()),
  (2,3,'19:00','Izakaya en Shinjuku','Cena en izakaya tradicional con yakitori y sake.',
   'gastronomia','Shinjuku, Tokio',120,35.00,NOW()),

  (2,4,'10:00','Shinjuku Gyoen','El jardin nacional mas tranquilo y precioso de Tokio.',
   'naturaleza','Shinjuku, Tokio',120,5.00,NOW()),
  (2,4,'15:00','Museo de Arte Mori','Arte contemporaneo en la planta 53 de la Roppongi Hills Tower.',
   'cultura','Roppongi, Tokio',120,18.00,NOW()),
  (2,4,'20:00','Cena Wagyu en Roppongi','Carne de Wagyu a la brasa en restaurante de lujo.',
   'gastronomia','Roppongi, Tokio',90,80.00,NOW()),

  (2,5,'07:00','Excursion a Nikko','UNESCO: santuarios, cascadas y bosques a 2 horas de Tokio.',
   'naturaleza','Nikko, Prefectura de Tochigi',480,40.00,NOW()),

  (2,6,'07:00','Mercado exterior de Tsukiji','Desayuno de sushi fresco en el mercado mas famoso del mundo.',
   'gastronomia','Tsukiji, Tokio',120,25.00,NOW()),
  (2,6,'14:00','Odaiba y TeamLab Planets','Arte digital inmersivo en la isla artificial de Tokio.',
   'ocio','Odaiba, Tokio',180,30.00,NOW()),

  (2,7,'10:00','Jardin Hamarikyu','Jardin historico junto a la bahia, sereno y elegante.',
   'naturaleza','Chuo, Tokio',90,3.00,NOW()),
  (2,7,'14:00','Crucero por la bahia de Tokio','Vistas de la ciudad desde el agua.',
   'ocio','Muelle Hinode, Tokio',90,15.00,NOW()),
  (2,7,'19:00','Cena Ramen Jiro','El ramen mas contundente y legendario de Tokio.',
   'gastronomia','Minato, Tokio',60,10.00,NOW()),

  (2,8,'10:00','Ginza y compras','El Champs-Elysees tokiota: lujo, tecnologia y diseno.',
   'ocio','Ginza, Tokio',240,0.00,NOW()),
  (2,8,'16:00','Shibuya Sky','Terraza de observacion en la cima del edificio Scramble Square.',
   'ocio','Shibuya, Tokio',60,18.00,NOW()),
  (2,8,'20:00','Despedida en karaoke','Noche de karaoke en un local privado de Shinjuku.',
   'ocio','Shinjuku, Tokio',120,20.00,NOW()),

  (2,9,'10:00','Manana libre en Shinjuku','Paseo, compras de ultimo momento y souvenirs.',
   'ocio','Shinjuku, Tokio',180,30.00,NOW()),
  (2,9,'16:00','Onsen urbano Thermae-Yu','Bano termal japones en pleno Shinjuku.',
   'ocio','Shinjuku, Tokio',120,12.00,NOW()),

  (2,10,'05:30','Check-out y transfer NRT','Madrugada para coger el Narita Express al aeropuerto.',
   'transporte','Shinjuku, Tokio',180,32.00,NOW());


-- ── actividades – Tenerife (7 dias) ──────────────────────────
INSERT INTO actividades
  (itinerario_id, dia, hora, nombre, descripcion, tipo,
   ubicacion, duracion_minutos, coste_estimado, fecha_creacion)
VALUES
  (3,1,'14:00','Check-in Hotel Botanico','Llegada y check-in en el spa resort de Puerto de la Cruz.',
   'alojamiento','Puerto de la Cruz, Tenerife',60,0.00,NOW()),
  (3,1,'17:00','Playa Jardin','Primeras horas de playa volcanica junto al casco historico.',
   'ocio','Puerto de la Cruz, Tenerife',120,0.00,NOW()),
  (3,1,'20:00','Cena en el hotel','Cena canaria de bienvenida en el restaurante del hotel.',
   'gastronomia','Hotel Botanico, Tenerife',90,40.00,NOW()),

  (3,2,'08:30','Excursion al Teide','Ascenso en teleferico al volcan mas alto de España. Reserva anticipada.',
   'naturaleza','Parque Nacional del Teide',300,28.00,NOW()),
  (3,2,'15:00','Masca y Los Gigantes','Ruta panoramica por el mitico pueblo de Masca y los acantilados.',
   'naturaleza','Los Gigantes, Tenerife',180,0.00,NOW()),

  (3,3,'10:00','Loro Parque','El parque zoologico mas espectacular de Europa.',
   'ocio','Puerto de la Cruz, Tenerife',240,45.00,NOW()),
  (3,3,'20:00','Cena canaria en La Orotava','Papas arrugadas, mojo picon, queso asado y vino del Valle.',
   'gastronomia','La Orotava, Tenerife',90,30.00,NOW()),

  (3,4,'09:00','Macizo de Anaga','Laurisilva milenaria, senderos entre la niebla y playas virgenes.',
   'naturaleza','Parque Rural de Anaga, Tenerife',240,0.00,NOW()),
  (3,4,'16:00','Playa de Las Teresitas','La playa con arena dorada del Sahara mas famosa de Tenerife.',
   'ocio','San Andres, Tenerife',120,0.00,NOW()),
  (3,4,'20:00','Tapas en Santa Cruz','Tapeo por el centro de la capital canaria.',
   'gastronomia','Santa Cruz de Tenerife',90,25.00,NOW()),

  (3,5,'10:00','Garachico','El pueblo mas bonito de Tenerife, con piscinas naturales de lava.',
   'naturaleza','Garachico, Tenerife',180,0.00,NOW()),
  (3,5,'15:00','Icod de los Vinos y el Drago Milenario','El arbol mas antiguo del mundo (mas de 1.000 anos).',
   'naturaleza','Icod de los Vinos, Tenerife',90,0.00,NOW()),
  (3,5,'20:00','Noche en Puerto de la Cruz','Bares de tapas y musica en vivo en el casco historico.',
   'ocio','Puerto de la Cruz, Tenerife',120,30.00,NOW()),

  (3,6,'10:00','Spa del hotel','Manana de masajes y aguas termales en el spa de lujo.',
   'ocio','Hotel Botanico, Tenerife',180,60.00,NOW()),
  (3,6,'15:00','Playa y snorkel en Callao Salvaje','Aguas cristalinas y fauna marina en el sur de Tenerife.',
   'naturaleza','Callao Salvaje, Tenerife',150,15.00,NOW()),
  (3,6,'20:00','Cena de gala final','Menu degustacion de cocina canaria de autor.',
   'gastronomia','Puerto de la Cruz, Tenerife',120,65.00,NOW()),

  (3,7,'10:00','Ultima manana de playa','Ultimo bano y compras de recuerdos en el mercadillo local.',
   'ocio','Puerto de la Cruz, Tenerife',120,20.00,NOW()),
  (3,7,'13:00','Check-out y transfer TFN','Salida hacia el Aeropuerto Tenerife Norte.',
   'transporte','Aeropuerto TFN, Tenerife',90,25.00,NOW());


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
   0,'{"viajeId":2}',NOW()),

  (2,'revelacion_destino','Tu destino esta listo!',
   'Increible Carlos! Tu viaje sorpresa te lleva a Tokio. Japon te espera!',
   1,'{"viajeId":3}',NOW()),
  (2,'recordatorio','Completa tu reserva',
   'Tu reserva en el Shinjuku Granbell Hotel esta pendiente de confirmacion de pago.',
   0,'{"reservaId":2,"viajeId":3}',NOW()),
  (2,'sistema','Itinerario de 10 dias generado',
   'Hemos creado tu itinerario personalizado en Tokio segun tus preferencias de aventura.',
   0,'{"viajeId":3,"itinerarioId":2}',NOW()),
  (2,'sistema','Tu viaje a Lisboa se revela en 2 dias',
   'El 13 de agosto desvelaremos tu proximo destino. Preparate para la sorpresa!',
   0,'{"viajeId":4}',NOW()),

  (3,'revelacion_destino','Tu destino esta listo!',
   'Maria, tu escape de invierno te lleva a Tenerife. Sol y playa garantizados!',
   1,'{"viajeId":5}',NOW()),
  (3,'confirmacion','Pago completado',
   'Hemos recibido tu pago de 750 EUR para el viaje a Tenerife. Ya es oficial!',
   1,'{"pagoId":2,"viajeId":5}',NOW()),
  (3,'sistema','Valora tu experiencia!',
   'Esperamos que tu viaje a Tenerife haya sido increible! Cuentanos como estuvo.',
   0,'{"viajeId":5}',NOW()),
  (3,'sistema','Nuevo viaje sorpresa registrado',
   'Tu viaje sorpresa a Paris del 10 de septiembre esta en camino. Sorpresa el 8 de septiembre!',
   0,'{"viajeId":6}',NOW());


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
   'Confirmacion de reserva del hotel en Roma', NULL, 1, NOW(), NOW()),

  (2, NULL, 'pasaporte', 'Pasaporte Carlos', 'pasaporte_carlos.pdf',
   'https://storage.blindjourney.test/docs/pasaporte_carlos.pdf',
   'Pasaporte con visado japones', '2029-07-20', 1, NOW(), NOW()),

  (2, 3, 'seguro', 'Seguro de viaje Japon', 'seguro_tokio_carlos.pdf',
   'https://storage.blindjourney.test/docs/seguro_tokio_carlos.pdf',
   'Seguro medico y de equipaje para el viaje a Japon', '2026-06-11', 1, NOW(), NOW()),

  (3, 5, 'billete_vuelo', 'Vuelo MAD-TFN Vueling VY6723', 'billete_vy6723.pdf',
   'https://storage.blindjourney.test/docs/billete_vy6723.pdf',
   'Vuelo de ida Madrid-Tenerife Norte', NULL, 1, NOW(), NOW());
