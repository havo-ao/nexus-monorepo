## RF-COM-03 – Consultar portafolio del cliente

### Descripción
El sistema debe permitir al comisionista visualizar el portafolio de un trader con el cual tenga un contrato vigente.

### Actor(es)
- Comisionista

### Precondiciones
- Usuario autenticado.
- Existencia de contrato asociado con el trader.

### Flujo básico

1. El comisionista selecciona un trader del listado de clientes asignados.
2. El sistema valida el estado del contrato.
3. Si el contrato se encuentra ACTIVO, el sistema muestra el portafolio del trader.
4. El sistema muestra para cada acción:
   - símbolo
   - cantidad de acciones
   - precio promedio de compra
   - valor actual
   - rendimiento de la posición.

### Flujos alternos

**2A – Contrato no activo**

- El sistema informa que el contrato no permite operaciones ni visualización del portafolio.
