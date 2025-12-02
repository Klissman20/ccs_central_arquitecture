Arquitectura del Sistema — Diagramas de Secuencia

Este documento describe en detalle los flujos de interacción (diagramas de secuencia) de la solución arquitectónica propuesta para el sistema de monitoreo de vehículos, notificación de eventos críticos y análisis de telemetría.
La arquitectura está diseñada sobre AWS y utiliza un enfoque orientado a eventos, altamente escalable y tolerante a fallos, con procesamiento en tiempo real mediante Kinesis y AWS Lambda (Node.js).

Visión General de Flujos Incluidos

Se han diseñado cuatro flujos principales:

1. Botón de pánico (flujo crítico)

2. Telemetría continua (ingestión + análisis + almacenamiento)

3. Detención no planeada + Motor de reglas del propietario

4. Flujo de video (Kinesis Video Streams + S3 + Playback)

Todos los eventos comparten un mismo esquema base de trazabilidad:

{
"id":"<UUID del evento>",
"vehicleId":"<ID del vehículo>",
"type":"panic | telemetry | alert | video_meta",
"ts":"ISO8601 timestamp",
"traceId":"UUID de trazabilidad",
"payload": { ... }
}

---

1. Flujo: Botón de Pánico (evento crítico)
   Objetivo

Detectar un evento de pánico y notificar inmediatamente al propietario y/o autoridades con información enriquecida del vehículo en menos de 2 segundos (p99).

Secuencia paso a paso

El conductor presiona el botón de pánico.

El dispositivo envía un mensaje a AWS IoT Core / API Gateway: Incluye ubicación, hora, ID del vehículo y tipo de botón.

AWS valida autenticación (certificado/JWT).

El mensaje pasa a Producer Lambda (Node.js).

Producer Lambda escribe el evento en Kinesis – panic-stream.

Panic Processor Lambda se activa desde Kinesis: Consulta información del dueño en Redis (ElastiCache)

Si hay cache miss → consulta en RDS (PostgreSQL)

Guarda el incidente en DynamoDB

Activa Notification Lambda

Notification Lambda envía alertas vía Amazon SNS (SMS, email, webhook)

SNS entrega el mensaje a: Autoridad, Propietario

Se registra audit/logs y, opcionalmente, se responde al dispositivo.

Ejemplo de payload
{
"id":"8a7f2d2e",
"vehicleId":"VEH-1001",
"type":"panic",
"ts":"2025-11-26T20:00:00Z",
"traceId":"trace-1",
"payload":{
"location":{"lat":6.2,"lon":-75.6},
"driverId":"DR-55",
"buttonType":"hard"
}
}

Métricas a medir

Métrica Objetivo
Latencia E2E (evento a alerta) p99 < 2s
Kinesis IteratorAge < 500ms
Lambda Duration < 400ms
DynamoDB Put latency < 50ms
SNS publish latency < 300ms

---

2.Flujo: Telemetría continua
Objetivo

Recibir posiciones, velocidad y estado del vehículo continuamente, detectar anomalías y guardar histórico para análisis.

Secuencia paso a paso

El vehículo envía cada X segundos (ej: 5s):

{
"vehicleId":"VEH-1001",
"type":"telemetry",
"payload":{
"lat":6.21,
"lon":-75.59,
"speed": 0,
"temp": 4.5
}
}

AWS IoT / API Gateway valida mensaje.

Producer Lambda envía los datos a Kinesis – telemetry-stream.

Telemetry Processor (Lambda/KDA): Guarda última posición en Redis, Guarda histórico en S3 / ClickHouse

Si detecta anomalía → envía a alerts-stream

La información queda disponible para dashboards y análisis posterior.

---

3. Flujo: Detención no planeada + Motor de reglas
   Objetivo

Detectar una detención anormal y evaluar reglas del propietario (ej: detener más de 5 minutos) y tomar acciones.

Secuencia paso a paso

Telemetry Processor emite evento a alerts-stream:

{
"vehicleId":"VEH-1001",
"type":"unplanned_stop",
"context":{"durationSec":420}
}

Rule Engine Lambda consume el evento.

Obtiene reglas desde:

Redis (cache) → rápido

Si no existe → RDS (Postgres)

Evalúa condiciones en JSON.

Si alguna regla se cumple:

Llama a Notification Lambda

Se registra ejecución de la regla (auditoría).

Modelo de regla ejemplo
{
"name":"No parar mas de 5 minutos",
"condition":{
"field":"durationSec",
"op":">",
"value":300
},
"action":"notify_owner"
}

---

4. Flujo: Video desde cámaras
   Objetivo

Capturar video del interior del vehículo, almacenarlo en la nube y permitir su consulta segura.

Secuencia paso a paso

Cámara → Kinesis Video Streams

KVS fragmenta y guarda en S3

Lambda guarda metadata del video (key, timestamps) en DB

Usuario (dashboard) solicita video

Lambda genera URL firmada (presigned URL)

Usuario puede verlo durante X minutos

Ejemplo metadata
{
"vehicleId":"VEH-1001",
"s3Key":"videos/veh-1001/seg1.mp4",
"start":"2025-11-26T19:59:50Z",
"end":"2025-11-26T20:00:20Z"
}
