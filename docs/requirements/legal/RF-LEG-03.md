## RF-LEG-03 – Consultar operaciones asociadas a un trader

### Descripción
El sistema debe permitir al área jurídica consultar todas las operaciones asociadas a un trader específico y su comisionista.

### Actor(es
- Usuario Área Jurídica

### Precondiciones
- Usuario autenticado.

### Flujo básico

1. El usuario busca un trader en el sistema.
2. El sistema consulta todas las operaciones relacionadas con el trader.
3. El sistema muestra:
   - operaciones del trader
   - operaciones realizadas por su comisionista
   - estado del contrato.