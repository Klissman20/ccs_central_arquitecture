1. Script SQL – Compatible con PostgreSQL / Aurora

Puedes usarlos en:

Amazon Aurora PostgreSQL

TABLA: Owner
CREATE TABLE Owner (
owner_id UUID PRIMARY KEY,
name VARCHAR(150) NOT NULL,
email VARCHAR(150) UNIQUE NOT NULL,
document_id VARCHAR(50) UNIQUE NOT NULL
);

TABLA: Vehicle
CREATE TABLE Vehicle (
vehicle_id UUID PRIMARY KEY,
owner_id UUID NOT NULL,
device_id UUID,
plate_number VARCHAR(20) UNIQUE NOT NULL,
brand VARCHAR(100),
model VARCHAR(100),
year INT,
type VARCHAR(50),
status VARCHAR(20),

    CONSTRAINT fk_vehicle_owner
        FOREIGN KEY (owner_id) REFERENCES Owner(owner_id)

);

TABLA: Driver
CREATE TABLE Driver (
driver_id UUID PRIMARY KEY,
vehicle_id UUID NOT NULL,
name VARCHAR(150) NOT NULL,
licence_number VARCHAR(50) UNIQUE,
phone VARCHAR(30),

    CONSTRAINT fk_driver_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)

);

TABLA: Device
CREATE TABLE Device (
device_id UUID PRIMARY KEY,
vehicle_id UUID UNIQUE,
serial_number VARCHAR(100) UNIQUE NOT NULL,
imei VARCHAR(50) UNIQUE,
firmware_version VARCHAR(50),
type VARCHAR(50),

    CONSTRAINT fk_device_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)

);

TABLA: Camera
CREATE TABLE Camera (
camera_id UUID PRIMARY KEY,
vehicle_id UUID UNIQUE NOT NULL,
serial_number VARCHAR(100) UNIQUE,
status VARCHAR(30),

    CONSTRAINT fk_camera_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)

);

TABLA: Trip
CREATE TABLE Trip (
trip_id UUID PRIMARY KEY,
vehicle_id UUID NOT NULL,
driver_id UUID NOT NULL,
route_name VARCHAR(150),
scheduled_start TIMESTAMP,
scheduled_end TIMESTAMP,
status VARCHAR(30),

    CONSTRAINT fk_trip_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),

    CONSTRAINT fk_trip_driver
        FOREIGN KEY (driver_id) REFERENCES Driver(driver_id)

);

TABLA: Planned_stops
CREATE TABLE Planned_stops (
stop_id UUID PRIMARY KEY,
trip_id UUID NOT NULL,
location VARCHAR(255),
start_time TIMESTAMP,
end_time TIMESTAMP,
status VARCHAR(30),

    CONSTRAINT fk_stop_trip
        FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)

);

TABLA: Rule
CREATE TABLE Rule (
rule_id UUID PRIMARY KEY,
owner_id UUID NOT NULL,
vehicle_id UUID NOT NULL,
rule_type VARCHAR(50),
threshold_value DECIMAL(10,2),
comparison_operator VARCHAR(10),
is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_rule_owner
        FOREIGN KEY (owner_id) REFERENCES Owner(owner_id),

    CONSTRAINT fk_rule_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)

);

TABLA: Incident
CREATE TABLE Incident (
incident_id UUID PRIMARY KEY,
vehicle_id UUID NOT NULL,
rule_id UUID,
incident_type VARCHAR(50),
timestamp TIMESTAMP NOT NULL,
latitude DECIMAL(10, 7),
longitude DECIMAL(10, 7),
severity VARCHAR(30),
status VARCHAR(30),

    CONSTRAINT fk_incident_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),

    CONSTRAINT fk_incident_rule
        FOREIGN KEY (rule_id) REFERENCES Rule(rule_id)

);

TABLA: EmergencyService
CREATE TABLE EmergencyService (
service_id UUID PRIMARY KEY,
name VARCHAR(100) NOT NULL,
service_type VARCHAR(50),
contact_number VARCHAR(30),
active BOOLEAN DEFAULT TRUE
);

TABLA: Notification
CREATE TABLE Notification (
notification_id UUID PRIMARY KEY,
incident_id UUID NOT NULL,
service_id UUID,
channel VARCHAR(50),
recipient VARCHAR(150),
message TEXT,
sent_at TIMESTAMP,
delivery_status VARCHAR(50),

    CONSTRAINT fk_notification_incident
        FOREIGN KEY (incident_id) REFERENCES Incident(incident_id),

    CONSTRAINT fk_notification_service
        FOREIGN KEY (service_id) REFERENCES EmergencyService(service_id)

);

2. Índices para ESCALABILIDAD

-- Búsqueda rápida por vehículo
CREATE INDEX idx_vehicle_owner ON Vehicle(owner_id);

-- Telemetría / Incidentes por vehículo
CREATE INDEX idx_incident_vehicle_time
ON Incident(vehicle_id, timestamp DESC);

-- Regla por vehículo
CREATE INDEX idx_rule_vehicle ON Rule(vehicle_id);

-- Notificaciones por incidente
CREATE INDEX idx_notification_incident
ON Notification(incident_id);

-- Viajes por vehículo
CREATE INDEX idx_trip_vehicle
ON Trip(vehicle_id);

-- Paradas por viaje
CREATE INDEX idx_stop_trip
ON Planned_stops(trip_id);

3. Decisión arquitectónica

Owner, Vehicle, Driver, Rule, Device, Camera, Trip, Planned_stops --> Aurora PostgreSQL (relacional)

Telemetry, Incident, Notification ---> DynamoDB (NoSQL)

Las entidades de alta frecuencia y crecimiento ilimitado (Telemetry, Incident, Notification) se almacenan en Amazon DynamoDB utilizando claves de partición basadas en vehicle_id y timestamp, permitiendo una escala horizontal automática. El resto de entidades estructurales se almacenan en Amazon Aurora, garantizando integridad relacional y consistencia transaccional.

---

- Script compatibles con DynamoDB:

TABLA: TELEMETRY
Estructura
{
"TableName": "Telemetry",
"KeySchema": [
{ "AttributeName": "vehicle_id", "KeyType": "HASH" },
{ "AttributeName": "timestamp", "KeyType": "RANGE" }
],
"AttributeDefinitions": [
{ "AttributeName": "vehicle_id", "AttributeType": "S" },
{ "AttributeName": "timestamp", "AttributeType": "S" }
],
"BillingMode": "PAY_PER_REQUEST"
}

TABLA DynamoDB: INCIDENT
Estructura
{
"TableName": "Incident",
"KeySchema": [
{ "AttributeName": "vehicle_id", "KeyType": "HASH" },
{ "AttributeName": "incident_id", "KeyType": "RANGE" }
],
"AttributeDefinitions": [
{ "AttributeName": "vehicle_id", "AttributeType": "S" },
{ "AttributeName": "incident_id", "AttributeType": "S" }
],
"BillingMode": "PAY_PER_REQUEST"
}

- TABLA DynamoDB: NOTIFICATION

{
"TableName": "Notification",
"KeySchema": [
{ "AttributeName": "incident_id", "KeyType": "HASH" },
{ "AttributeName": "notification_id", "KeyType": "RANGE" }
],
"AttributeDefinitions": [
{ "AttributeName": "incident_id", "AttributeType": "S" },
{ "AttributeName": "notification_id", "AttributeType": "S" }
],
"BillingMode": "PAY_PER_REQUEST"
}

Las entidades de alta frecuencia como Telemetry, Incident y Notification se almacenan en Amazon DynamoDB debido a su capacidad de escalado horizontal automático, baja latencia y modelo de cobro por demanda. La tabla Telemetry utiliza una clave de partición basada en vehicle_id y una clave de orden basada en timestamp, permitiendo consultar series temporales de datos por vehículo sin realizar operaciones complejas de JOIN. Adicionalmente, se configuraron índices secundarios globales (GSI) para consultas por tipo de incidente y se utiliza TTL para gestionar el ciclo de vida de los datos históricos, reduciendo el almacenamiento de información que ya no es relevante para la operación.
