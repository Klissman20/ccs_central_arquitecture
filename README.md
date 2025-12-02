MANUAL DE INSTRUCCIONES
EJECUCIÓN DE LA SOLUCIÓN CCS CENTRAL

OBJETIVO DEL MANUAL
Este documento describe paso a paso el proceso para ejecutar localmente la solución CCS Central, la cual simula un sistema de gestión de emergencias vehiculares basado en arquitectura orientada a eventos utilizando servicios de AWS emulados por LocalStack.
El sistema incluye:
• Procesamiento de botón de pánico
• Procesamiento de telemetría
• Detección de accidentes
• Solicitudes de ayuda mecánica
• Consulta de incidentes por vehículo
• Persistencia de datos en DynamoDB
• Envío de notificaciones con SNS

REQUISITOS PREVIOS
Antes de iniciar, el equipo debe contar con las siguientes herramientas instaladas:

• Node.js versión 18 o superior
• Docker Desktop
• AWS CLI
• Git

Para verificar la instalación, ejecutar en la terminal:

node --version
npm --version
docker --version
aws --version

Si alguno de estos comandos devuelve error, se debe instalar la herramienta correspondiente antes de continuar.

PREPARACIÓN DEL PROYECTO

clonar el repositorio

link: http://github.com/Klissman20/ccs_central_arquitecture

1. Abrir la carpeta del proyecto e ingresar a la carpeta ccs-central:
   cd ccs_central
2. Instalar las dependencias del proyecto:

   npm install

   Esto instalará las librerías necesarias, incluyendo el AWS SDK para Node.js.

3. LEVANTAR LOCALSTACK
   LocalStack es una herramienta que permite simular servicios de AWS en un entorno local mediante Docker.

   Ejecutar el siguiente comando para iniciar LocalStack:

   docker run -d --name localstack -p 4566:4566 -e SERVICES="s3,kinesis,dynamodb,lambda,sns,sqs,apigateway" -e DEBUG=1 localstack/localstack

   Verificar que está corriendo con:

   docker ps

   Si aparece el contenedor localstack en estado RUNNING, significa que está activo.

   Comprobar conexión con AWS CLI:

   aws --endpoint-url=http://localhost:4566 sts get-caller-identity

   El resultado esperado es una respuesta JSON con Account y UserId simulados (000000000000).

   Ahora se necesita configurar localStack con algunos datos de prueba, para esto ejecuta

   aws configure

   ingresa la siguiente configuración

   AWS Access Key ID: test
   AWS Secret Access Key: test
   Default region: us-east-1
   Default output format: json

4. CREACIÓN DE RECURSOS EN LOCALSTACK

   Se deben crear las siguientes estructuras:

   • Tablas en DynamoDB
   • Streams en Kinesis
   • Un topic en SNS

   CREAR TABLAS DYNAMODB:

   aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name Telemetry --attribute-definitions AttributeName=vehicle_id,AttributeType=S AttributeName=timestamp,AttributeType=S --key-schema AttributeName=vehicle_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE --billing-mode PAY_PER_REQUEST

   aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name Incident --attribute-definitions AttributeName=vehicle_id,AttributeType=S AttributeName=incident_id,AttributeType=S --key-schema AttributeName=vehicle_id,KeyType=HASH AttributeName=incident_id,KeyType=RANGE --billing-mode PAY_PER_REQUEST

   aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name Notification --attribute-definitions AttributeName=incident_id,AttributeType=S AttributeName=notification_id,AttributeType=S --key-schema AttributeName=incident_id,KeyType=HASH AttributeName=notification_id,KeyType=RANGE --billing-mode PAY_PER_REQUEST

   CREAR STREAMS EN KINESIS:

   aws --endpoint-url=http://localhost:4566 kinesis create-stream --stream-name telemetry-stream --shard-count 1
   aws --endpoint-url=http://localhost:4566 kinesis create-stream --stream-name panic-stream --shard-count 1

   CREAR TOPIC EN SNS:

   aws --endpoint-url=http://localhost:4566 sns create-topic --name emergency-dispatch

   Para verificar todo:

   aws --endpoint-url=http://localhost:4566 dynamodb list-tables
   aws --endpoint-url=http://localhost:4566 kinesis list-streams
   aws --endpoint-url=http://localhost:4566 sns list-topics

5. SIMULACIÓN DE EVENTOS

   Estos scripts envían eventos directamente a Kinesis, simulando los sensores y la aplicación móvil.

   EVENTO DE PÁNICO:
   node domain/sendPanic.js

   EVENTO DE TELEMETRÍA:
   node domain/sendTelemetry.js

   En la consola se mostrará confirmación de envío al stream.

6. EJECUCIÓN DE LAS FUNCIONES LAMBDA

   Para simular la invocación de las Lambdas, utilizar los siguientes scripts:

   Procesador de pánico:
   node domain/testLambda.js

   Procesador de telemetría:
   node domain/testTelemetryLambda.js

   Detector de accidente:
   node domain/testCrashDetector.js

   Solicitud de ayuda mecánica:
   node domain/testMechanicalHelp.js

   Consulta de incidentes por vehículo:
   node domain/testGetIncidents.js

   Cada comando mostrará una respuesta en consola indicando si el evento fue procesado y almacenado con éxito.

7. VERIFICACIÓN DE DATOS EN DYNAMODB
   Para comprobar que los datos fueron guardados correctamente:

   Ver incidentes:
   aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Incident

   Ver telemetría:
   aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Telemetry

   Ver notificaciones:
   aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Notification

   Si aparecen registros en formato JSON, significa que la arquitectura está funcionando correctamente.

8. EJECUCIÓN DE PRUEBAS AUTOMÁTICAS
   Para ejecutar los tests y validar la cobertura:

   npm run test

   Para generar el reporte de cobertura:

   npm run test:coverage

9. DETENER Y LIMPIAR EL ENTORNO
   Para detener el contenedor de LocalStack:

   docker stop localstack

   Para eliminarlo completamente:

   docker rm localstack

   Esto libera recursos del sistema.

10. CONCLUSIÓN
    Siguiendo este manual paso a paso es posible:
    • Ejecutar la solución completa localmente
    • Simular múltiples casos de uso reales
    • Validar la arquitectura propuesta
    • Generar evidencia para el reto técnico
    • Verificar escalabilidad y desacoplamiento de componentes

    Este entorno reproduce de manera efectiva el comportamiento esperado en un despliegue real sobre AWS.
