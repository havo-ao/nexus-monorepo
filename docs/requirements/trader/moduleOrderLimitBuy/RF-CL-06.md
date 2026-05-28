## RF-CL-06 – Ejecutar compra limitada

### Descripción  
El sistema debe ejecutar la orden cuando el precio alcance el valor definido.

### Actor(es)  
- Sistema  

### Flujo básico  
1. El sistema ejecuta compra  
2. Descuenta saldo reservado  
3. Registra acciones en portafolio  
4. Calcula comisión  
5. Distribuye comisión:
   - 40% comisionista (si existe)  
   - 60% Nexus  
   - o 100% Nexus  
6. Notifica al usuario  
