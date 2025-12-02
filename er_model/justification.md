CÓMO SE GARANTIZA LA ESCALABILIDAD A NIVEL DE BASE DE DATOS

(Basado en tu Modelo ER y en AWS)

La escalabilidad se garantiza mediante una estrategia híbrida, donde cada grupo de entidades se asigna al motor de base de datos más adecuado según su patrón de uso. Esto permite manejar altos volúmenes (telemetría), consultas estructuradas (vehículos, conductores, reglas) y eventos críticos (incidentes y notificaciones) sin sacrificar tiempo de respuesta ni disponibilidad.

1.Separación por tipo de datos

    Tu modelo ER revela tres tipos de datos, y cada uno se almacena en un motor distinto:

    A. Datos transaccionales (bajo volumen, alta consistencia)

        Entidades: Owner Vehicle Driver Rule Device Camera Trip Planned_stops
        Se guardan en Amazon RDS Aurora Serverless v2 (MySQL/PostgreSQL)
        Porque requieren:

        Relaciones estrictas, Integridad referencial, Joins eficientes, Transacciones ACID

        Aurora Serverless v2 ofrece: Autoescalado vertical en milisegundos, Capacidad de crecer hasta cientos de miles de conexiones, Multi-AZ automático

    B. Datos masivos (telemetría y eventos en tiempo real)

        Entidades: Telemetry, Incident, AlertHistory
        Se guardan en Amazon DynamoDB
        Porque:

        Llegan hasta cientos o miles de eventos por segundo, No requieren joins complejos, Cada registro es independiente, Las claves principales permiten acceso directo por vehículo y timestamp

        Tu ER permite estas claves:

        PK = vehicle_id
        SK = timestamp

        Esto permite:

        Sharding automático por particiones de DynamoDB, Query eficientes por rango de tiempo, Retención de datos infinita

    C. Datos de notificaciones a autoridades

        Entidades: Notification, EmergencyService

        Ideal también para DynamoDB, porque son listas extensas con acceso por incidente.

2. Estrategia de particionamiento basada en el ERD

   Se permite escalar horizontalmente:

   Entidad Clave que permite particionar Beneficio
   Telemetry vehicle_id + timestamp Evita cuellos por volumen
   Incident vehicle_id Distribuye carga entre particiones
   Notification incident_id Agrupa notificaciones por evento
   Driver vehicle_id Shards naturales por flota

3. Enrutamiento inteligente de datos en tiempo real

   Telemetry → solo se escribe en DynamoDB

   Rule → solo se consulta en Aurora

   Incident → se registra en DynamoDB

   Owner / Vehicle → se leen desde Aurora

   Notification → DynamoDB

   Esto distribuye la carga de lectura/escritura entre diferentes motores.

   Resultado:

   Ningún servicio se sobrecarga
   Creces horizontalmente sin costos inesperados
   Mantenibilidad de esquema intacta

4. Estrategia de cacheo para entidades consultadas frecuentemente

   Entidades que se consultan mucho:

   Rule

   Driver

   Owner

   Vehicle

   Device

   Se almacenan en Amazon ElastiCache (Redis) con TTL
   Esto reduce lecturas a Aurora entre 70% y 90%.

5. Multi-AZ y replicación automática

   Tanto RDS como DynamoDB soportan:

   Multi-AZ

   Failover automático

   Replicación síncrona y asíncrona

   En el documento puedes escribir:

   La arquitectura garantiza disponibilidad y escalabilidad mediante Multi-AZ en Aurora y replicación global en DynamoDB Streams, permitiendo que la base de datos continúe operando aun en caso de falla total de un AZ.

6. Uso de DynamoDB Streams + Lambda para escalar funciones derivadas

   Por ejemplo:

   Cada vez que llega una telemetría → Lambda evalúa reglas

   Cada vez que se genera un incidente → Lambda crea notificaciones

   No se sobrecarga la base de datos.

---

La escalabilidad a nivel de base de datos se garantiza mediante una arquitectura híbrida donde los datos estructurados (Owner, Vehicle, Driver, Rule, Device, Camera, Trip, Planned_stops) residen en Amazon Aurora Serverless v2, el cual permite autoescalado transparente bajo demanda y replicación Multi-AZ.

Los datos de alta frecuencia y crecimiento ilimitado (Telemetry, Incident, Notification) son administrados por Amazon DynamoDB, aprovechando su escalabilidad horizontal automática, particionamiento distribuido, índices globales y acceso por claves optimizadas (vehicle_id, timestamp).

Esta separación reduce la carga sobre el motor relacional, permite manejar hasta miles de eventos por segundo y mantiene tiempos de respuesta menores a dos segundos incluso con crecimiento anual del 20%.

Complementando el diseño, se utiliza ElastiCache para acelerar lecturas frecuentes y DynamoDB Streams para desacoplar procesos secundarios, logrando un sistema altamente escalable, resiliente y preparado para el volumen esperado de dispositivos IoT y eventos en tiempo real.
