## RF-COM-05 – Crear orden de compra para cliente

### Descripción
El sistema debe permitir al comisionista crear una orden de compra asociada a un trader.

### Actor(es)
- Comisionista

### Precondiciones
- Contrato existente entre comisionista y trader.

### Flujo básico

1. El comisionista selecciona un cliente.
2. El sistema valida el estado del contrato.
3. El sistema solicita:
   - símbolo de la acción
   - cantidad de acciones.
4. El sistema verifica el tipo de contrato.

### Flujos alternos

**4A – Contrato tipo asesoría**

1. El sistema registra la orden como recomendación.
2. El sistema asigna estado `PENDIENTE_APROBACION`.
3. El sistema envía una notificación al trader para aprobación.

**4B – Contrato tipo operación**

1. El sistema ejecuta la orden de compra directamente en el mercado.
2. El sistema actualiza el portafolio del trader.

### Reglas de negocio

RN-COM-02: Solo los contratos con estado ACTIVO permiten operaciones o recomendaciones.

RN-COM-03: Toda operación o recomendación debe registrarse en el sistema de auditoría.
