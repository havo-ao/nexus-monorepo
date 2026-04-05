## RF-LEG-02 – Consultar auditoría de operaciones

### Descripción
El sistema debe permitir al área jurídica consultar el registro auditado de operaciones realizadas dentro de la plataforma.

### Actor(es)
- Usuario Área Jurídica

### Precondiciones
- Usuario autenticado.

### Flujo básico

1. El usuario accede al módulo de auditoría.
2. El sistema consulta el registro de operaciones auditadas.
3. El sistema muestra la información de cada operación.

### Información mínima mostrada

- identificador del trader
- identificador del comisionista
- tipo de operación
- acción
- cantidad
- precio de ejecución
- fecha y hora
- origen de la operación (trader o comisionista)
- estado del contrato.
