## RF-COM-06 – Crear orden de venta para cliente

### Descripción
El sistema debe permitir al comisionista vender acciones pertenecientes al portafolio de un trader.

### Actor(es)
- Comisionista

### Precondiciones
- Contrato activo entre comisionista y trader.

### Flujo básico

1. El comisionista accede al portafolio del cliente.
2. Selecciona la acción que desea vender.
3. Define la cantidad de acciones a vender.
4. El sistema valida el tipo de contrato.

### Flujos alternos

**4A – Contrato tipo asesoría**

1. El sistema registra la operación como recomendación.
2. El estado inicial será `PENDIENTE_APROBACION`.
3. El trader recibe una notificación para aprobar o rechazar la orden.

**4B – Contrato tipo operación**

1. El sistema ejecuta la orden de venta en el mercado.
2. El sistema actualiza el portafolio y saldo del trader.

### Reglas de negocio

RN-COM-04: No se puede vender una cantidad mayor a las acciones disponibles en el portafolio del trader.

RN-COM-05: Toda operación realizada por el comisionista debe quedar registrada en el sistema de auditoría.