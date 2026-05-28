## RF-COM-08 – Consultar estado de órdenes sugeridas

### Descripción
El sistema debe permitir al comisionista consultar el estado de las órdenes sugeridas a los traders cuando el contrato es de tipo asesoría.

### Actor(es)
- Comisionista

### Precondiciones
- Existencia de recomendaciones registradas.

### Flujo básico

1. El comisionista accede a la sección de recomendaciones enviadas.
2. El sistema muestra el listado de recomendaciones.
3. Para cada recomendación se muestra:
   - acción
   - cantidad
   - fecha de creación
   - estado de la recomendación.

### Estados posibles

- PENDIENTE_APROBACION
- APROBADA
- RECHAZADA
- EJECUTADA
- EXPIRADA

### Postcondiciones

- El comisionista puede conocer el resultado de cada recomendación enviada.
