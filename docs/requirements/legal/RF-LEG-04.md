## RF-LEG-04 – Suspender trader bajo investigación

### Descripción
El sistema debe permitir al área jurídica suspender temporalmente la capacidad operativa de un trader cuando exista una irregularidad detectada.

### Actor(es)
- Usuario Área Jurídica

### Precondiciones
- Usuario autenticado.

### Flujo básico

1. El usuario selecciona un trader.
2. El sistema muestra la información del trader.
3. El usuario marca el estado **BAJO_INVESTIGACION**.
4. El sistema actualiza el estado del usuario.

### Postcondiciones

- El trader no podrá realizar nuevas operaciones de mercado.

### Reglas de negocio

RN-LEG-01: Un trader en estado BAJO_INVESTIGACION no puede ejecutar operaciones de compra o venta.

RN-LEG-02: El trader puede seguir accediendo a la plataforma para consultar su información.
