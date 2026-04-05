## RF-ADM-02 – Parametrizar comisiones de la plataforma

### Descripción
El sistema debe permitir al administrador configurar la distribución de comisiones entre la plataforma Nexus y los comisionistas.

### Actor(es)
- Administrador

### Precondiciones
- Usuario autenticado.

### Flujo básico

1. El administrador accede al módulo de configuración de comisiones.
2. El sistema muestra los valores actuales de distribución.
3. El administrador modifica los porcentajes.
4. El sistema valida la configuración.
5. El sistema guarda los nuevos parámetros.

### Reglas de negocio

RN-ADM-01: La suma del porcentaje de comisión para plataforma y comisionista debe ser igual a 100%.

RN-ADM-02: La configuración solo afecta operaciones futuras.

### Postcondiciones

- Los nuevos porcentajes se aplican a futuras transacciones.
