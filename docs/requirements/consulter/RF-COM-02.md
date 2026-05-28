## RF-COM-02 – Consultar clientes asignados

### Descripción
El sistema debe permitir al comisionista visualizar los traders que tienen contratos asociados con él.

### Actor(es
- Comisionista

### Precondiciones
- Usuario autenticado.

### Flujo básico

1. El sistema consulta los contratos asociados al comisionista.
2. El sistema muestra el listado de traders asociados.
3. Para cada trader se muestra:
   - identificador del trader
   - perfil de riesgo
   - tipo de contrato (asesoría u operación)
   - estado del contrato
   - fecha de inicio del contrato
   - fecha de finalización del contrato.

### Reglas de negocio

RN-COM-01: El sistema debe mostrar únicamente contratos que se encuentren en estado ACTIVO o cuya vigencia no haya finalizado.
